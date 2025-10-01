"""
RAG-Powered Roasting Copilot API Endpoints

This module provides API endpoints for the RAG-powered roasting copilot system,
including pre-roast planning, real-time guidance, and post-roast analysis.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

# Import functions inside endpoints to avoid circular imports
from main import get_supabase, verify_jwt_token
from .llm_integration import llm_copilot

def get_freshroast_recommendations(roast_level: str, environmental_conditions: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generate FreshRoast-specific recommendations based on roast level and conditions
    """
    # FreshRoast SR540/SR800 specific settings
    roast_configs = {
        "Light": {
            "estimated_time": 10.0,
            "initial_heat": 7,
            "initial_fan": 3,
            "strategy": "Start high heat, low fan for quick color development",
            "recommendations": [
                "Start with Heat 7, Fan 3 for 2 minutes",
                "Increase fan to 4-5 when beans start moving",
                "Listen for first crack around 6-8 minutes",
                "Drop when you hear first crack + 30 seconds"
            ]
        },
        "Cinnamon": {
            "estimated_time": 8.0,
            "initial_heat": 8,
            "initial_fan": 3,
            "strategy": "High heat, low fan for very light roast",
            "recommendations": [
                "Start with Heat 8, Fan 3",
                "Watch for light brown color change",
                "Drop at first sign of first crack",
                "Very short development time needed"
            ]
        },
        "City": {
            "estimated_time": 12.0,
            "initial_heat": 6,
            "initial_fan": 4,
            "strategy": "Balanced heat and fan for even development",
            "recommendations": [
                "Start with Heat 6, Fan 4",
                "Increase fan to 5 after 4 minutes",
                "Listen for first crack around 8-10 minutes",
                "Develop for 1-2 minutes after first crack"
            ]
        },
        "City+": {
            "estimated_time": 14.0,
            "initial_heat": 6,
            "initial_fan": 4,
            "strategy": "Moderate heat with good fan for full development",
            "recommendations": [
                "Start with Heat 6, Fan 4",
                "Maintain fan at 5-6 throughout",
                "First crack around 9-11 minutes",
                "Develop for 2-3 minutes after first crack"
            ]
        },
        "Full City": {
            "estimated_time": 16.0,
            "initial_heat": 5,
            "initial_fan": 5,
            "strategy": "Lower heat, higher fan for longer development",
            "recommendations": [
                "Start with Heat 5, Fan 5",
                "Increase fan to 6 after 6 minutes",
                "First crack around 10-12 minutes",
                "Develop for 3-4 minutes after first crack"
            ]
        },
        "Dark": {
            "estimated_time": 18.0,
            "initial_heat": 5,
            "initial_fan": 6,
            "strategy": "Low heat, high fan for long development",
            "recommendations": [
                "Start with Heat 5, Fan 6",
                "Maintain high fan throughout",
                "First crack around 12-14 minutes",
                "Develop for 4-5 minutes, watch for second crack"
            ]
        },
        "French": {
            "estimated_time": 20.0,
            "initial_heat": 4,
            "initial_fan": 7,
            "strategy": "Very low heat, maximum fan for extended development",
            "recommendations": [
                "Start with Heat 4, Fan 7",
                "Keep fan at maximum",
                "First crack around 14-16 minutes",
                "Develop for 5-6 minutes, expect second crack"
            ]
        }
    }
    
    # Get base configuration
    config = roast_configs.get(roast_level, roast_configs["City"])
    
    # Adjust for environmental conditions
    if environmental_conditions:
        temp = environmental_conditions.get("temperature", 20)
        humidity = environmental_conditions.get("humidity", 50)
        
        # Adjust for temperature
        if temp < 15:  # Cold environment
            config["initial_heat"] += 1
            config["estimated_time"] += 2
        elif temp > 25:  # Hot environment
            config["initial_heat"] -= 1
            config["estimated_time"] -= 1
            
        # Adjust for humidity
        if humidity > 70:  # High humidity
            config["initial_heat"] += 1
            config["estimated_time"] += 2
        elif humidity < 30:  # Low humidity
            config["initial_heat"] -= 1
            config["estimated_time"] -= 1
    
    return config

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for RAG API
class PreRoastPlanningRequest(BaseModel):
    bean_profile_id: str
    bean_profile: Optional[Dict[str, Any]] = None
    roast_goals: List[str]
    roast_challenges: List[str] = []
    environmental_conditions: Optional[Dict[str, Any]] = None
    machine_info: Optional[Dict[str, Any]] = None
    user_units: Optional[Dict[str, Any]] = None

class PreRoastPlanningResponse(BaseModel):
    recommended_profile: Dict[str, Any]
    similar_roasts: List[Dict[str, Any]]
    confidence_score: float
    reasoning: str
    recommendations: List[str]

class RoastOutcomeRequest(BaseModel):
    roast_id: int
    actual_roast_level: str
    weight_after_g: float
    roast_duration_minutes: float
    development_time_minutes: float
    development_ratio: float
    charge_temp_f: float
    first_crack_temp_f: float
    second_crack_temp_f: Optional[float] = None
    drop_temp_f: float
    max_temp_f: float
    avg_ror: float
    tasting_notes: str
    flavor_profile: List[str]
    aroma_profile: List[str]
    body_rating: int
    acidity_rating: int
    sweetness_rating: int
    overall_rating: int
    roast_quality: str
    roast_consistency: str
    roast_challenges: List[str]
    roast_successes: List[str]
    improvement_notes: str
    roast_reflections: str

# RAG Copilot Endpoints
@router.post("/rag/pre-roast-planning")
async def pre_roast_planning(
    request: PreRoastPlanningRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Generate pre-roast planning recommendations based on historical data
    """
    try:
        sb = get_supabase()
        
        # Get actual number of historical roasts for this user
        historical_roasts_result = sb.table("roast_entries").select("id").eq("user_id", user_id).execute()
        num_historical_roasts = len(historical_roasts_result.data)
        
        # Get bean profile for LLM context
        bean_profile = {}
        logger.info(f"Received bean_profile_id: {request.bean_profile_id}")
        logger.info(f"Received bean_profile: {request.bean_profile}")
        
        if request.bean_profile:  # Use the passed bean profile object if available
            bean_profile = request.bean_profile
            logger.info(f"Using passed bean profile: {bean_profile.get('name', 'Unknown')} - Origin: {bean_profile.get('origin', 'Unknown')}")
        elif request.bean_profile_id and request.bean_profile_id != "default":
            # Fallback to database fetch if no bean profile object was passed
            try:
                bean_result = sb.table("bean_profiles").select("*").eq("id", request.bean_profile_id).eq("user_id", user_id).execute()
                if bean_result.data:
                    bean_profile = bean_result.data[0]
                    logger.info(f"Fetched bean profile from DB: {bean_profile.get('name', 'Unknown')}")
            except Exception as e:
                logger.warning(f"Could not fetch bean profile: {e}")
        else:
            logger.warning("No bean profile provided")
        
        # Use LLM for intelligent recommendations
        roast_level = request.roast_goals[0] if request.roast_goals else "City"
        llm_advice = llm_copilot.get_pre_roast_advice(
            roast_level=roast_level,
            bean_profile=bean_profile,
            environmental_conditions=request.environmental_conditions,
            historical_roasts=num_historical_roasts,
            machine_info=request.machine_info,
            user_units=request.user_units
        )
        
        # Adjust confidence based on LLM availability and historical data
        if llm_copilot.client:
            confidence_score = 0.90  # High confidence with LLM
            reasoning = f"AI-powered recommendations based on DeepSeek LLM and your {num_historical_roasts} historical roast{'s' if num_historical_roasts != 1 else ''}"
        else:
            confidence_score = 0.75  # Lower confidence with fallback
            reasoning = f"Fallback recommendations based on FreshRoast patterns and your {num_historical_roasts} historical roast{'s' if num_historical_roasts != 1 else ''}"
        
        return PreRoastPlanningResponse(
            recommended_profile={
                "roast_level": roast_level,
                "estimated_time": llm_advice["estimated_time"],
                "initial_heat": llm_advice["initial_heat"],
                "initial_fan": llm_advice["initial_fan"],
                "strategy": llm_advice["strategy"]
            },
            similar_roasts=[],
            confidence_score=confidence_score,
            reasoning=reasoning,
            recommendations=llm_advice["recommendations"]
        )
        
    except Exception as e:
        logger.error(f"Pre-roast planning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/roast-outcome")
async def create_roast_outcome(
    request: RoastOutcomeRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Create a roast outcome record for RAG system
    """
    try:
        # For now, return a mock response
        return {
            "outcome_id": "mock_outcome_id",
            "message": "Roast outcome created successfully (mock response)"
        }
        
    except Exception as e:
        logger.error(f"Create roast outcome error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/during-roast-advice")
async def during_roast_advice(
    roast_progress: Dict[str, Any],
    user_question: str,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get real-time LLM-powered roasting advice during the roast
    """
    try:
        # Use LLM for real-time advice
        llm_response = llm_copilot.get_during_roast_advice(
            roast_progress=roast_progress,
            user_question=user_question
        )
        
        return {
            "advice": llm_response,
            "timestamp": datetime.now().isoformat(),
            "llm_available": llm_copilot.client is not None
        }
        
    except Exception as e:
        logger.error(f"During-roast advice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/automatic-event-response")
async def automatic_event_response(
    event_data: Dict[str, Any],
    roast_progress: Dict[str, Any],
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get automatic AI response when events are logged
    """
    try:
        # Use LLM for automatic event response
        response = llm_copilot.get_automatic_event_response(
            event_data=event_data,
            roast_progress=roast_progress
        )
        
        return {
            "advice": response.get("advice", "Event logged successfully"),
            "recommendations": response.get("recommendations", []),
            "event_type": response.get("event_type", "Unknown"),
            "timestamp": datetime.now().isoformat(),
            "llm_available": llm_copilot.client is not None
        }
        
    except Exception as e:
        logger.error(f"Automatic event response error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/health")
async def rag_health():
    """
    Health check for RAG system
    """
    llm_status = "connected" if llm_copilot.client else "disconnected"
    
    return {
        "status": "healthy",
        "message": "RAG Copilot API is running",
        "llm_status": llm_status,
        "endpoints": [
            "/rag/pre-roast-planning",
            "/rag/roast-outcome",
            "/rag/during-roast-advice",
            "/rag/automatic-event-response",
            "/rag/health"
        ]
    }
