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
from .llm_integration import llm_copilot, machine_aware_llm
from .dtr_knowledge import DTRTargets, dtr_coach

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
                "Listen for first crack around 8-10 minutes",
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
                "Listen for first crack around 9-11 minutes",
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

class DuringRoastAdviceRequest(BaseModel):
    roast_progress: Dict[str, Any]
    user_question: str

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
    request: DuringRoastAdviceRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get real-time LLM-powered roasting advice during the roast with enhanced phase awareness
    """
    try:
        # Extract roast_id from roast_progress if available
        roast_id = request.roast_progress.get('roast_id', 'unknown')
        
        # Extract machine information from roast_progress
        machine_model = request.roast_progress.get('machine_model', 'SR800')
        has_extension = request.roast_progress.get('has_extension', False)
        
        # Get machine sensor type from database
        machine_sensor_type = None
        try:
            from utils.database import get_supabase
            sb = get_supabase()
            
            # Get machine ID from roast_progress
            machine_id = request.roast_progress.get('machine_id')
            if machine_id:
                machine_result = sb.table("machines").select("temp_sensor_type").eq("id", machine_id).execute()
                if machine_result.data:
                    machine_sensor_type = machine_result.data[0].get('temp_sensor_type', 'builtin')
                    logger.info(f"🌡️ Machine sensor type: {machine_sensor_type}")
        except Exception as e:
            logger.warning(f"Could not fetch machine sensor type: {e}")
            machine_sensor_type = 'builtin'  # Default fallback
        
        # Use DTR-aware LLM for real-time advice (includes DTR coaching)
        llm_response = await machine_aware_llm.get_dtr_aware_coaching(
            roast_progress=request.roast_progress,
            user_message=request.user_question,
            machine_sensor_type=machine_sensor_type
        )
        
        return {
            "advice": llm_response,
            "timestamp": datetime.now().isoformat(),
            "llm_available": llm_copilot.client is not None,
            "enhanced_features": {
                "phase_awareness": True,
                "conversation_state": True,
                "learning_system": True,
                "dtr_optimization": True
            }
        }
        
    except Exception as e:
        logger.error(f"During-roast advice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/dtr-analysis")
async def dtr_analysis(
    roast_progress: Dict[str, Any],
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get detailed DTR (Development Time Ratio) analysis and recommendations
    """
    try:
        # Extract roast information
        roast_level = roast_progress.get('roast_level') or roast_progress.get('target_roast_level', 'City')
        events = roast_progress.get('events', [])
        elapsed_time = roast_progress.get('elapsed_time', 0)
        current_temp = roast_progress.get('current_temp')
        
        # Find first crack time
        first_crack_time = None
        for event in events:
            if event.get('event_type') == 'first_crack':
                first_crack_time = event.get('t_offset_sec')
                break
        
        # Get DTR analysis
        dtr_analysis = dtr_coach.get_dtr_aware_coaching(
            roast_level=roast_level,
            current_phase=roast_progress.get('current_phase', 'drying'),
            elapsed_time=elapsed_time,
            first_crack_time=first_crack_time,
            current_temp=current_temp,
            ror=roast_progress.get('ror', 0)
        )
        
        # Get roast level profile
        roast_profile = DTRTargets.get_profile(roast_level)
        profile_info = None
        if roast_profile:
            profile_info = {
                "name": roast_profile.name,
                "dtr_target_range": roast_profile.dtr_target_range,
                "drop_temp_range": roast_profile.drop_temp_range,
                "development_time_range": roast_profile.development_time_range,
                "total_time_range": roast_profile.total_time_range,
                "characteristics": roast_profile.characteristics,
                "flavor_profile": roast_profile.flavor_profile,
                "visual_cues": roast_profile.visual_cues,
                "common_mistakes": roast_profile.common_mistakes
            }
        
        return {
            "dtr_analysis": dtr_analysis,
            "roast_profile": profile_info,
            "current_dtr": dtr_analysis.get('current_dtr'),
            "target_dtr_range": dtr_analysis.get('target_dtr_range'),
            "dtr_status": dtr_analysis.get('dtr_status'),
            "urgency": dtr_analysis.get('dtr_urgency'),
            "coaching": dtr_analysis.get('coaching'),
            "recommendations": dtr_analysis.get('recommendations', []),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"DTR analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/automatic-event-response")
async def automatic_event_response(
    event_data: Dict[str, Any],
    roast_progress: Dict[str, Any],
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get automatic AI response when events are logged with enhanced phase awareness
    """
    try:
        # Extract roast_id from roast_progress if available
        roast_id = roast_progress.get('roast_id', 'unknown')
        
        # Extract machine information from roast_progress
        machine_model = roast_progress.get('machine_model', 'SR800')
        has_extension = roast_progress.get('has_extension', False)
        
        # Use DTR-aware LLM for automatic event response (includes DTR coaching)
        response_text = await machine_aware_llm.get_dtr_aware_coaching(
            roast_progress=roast_progress,
            user_message=None
        )
        
        # Format response to match expected structure
        response = {
            "advice": response_text,
            "recommendations": [],
            "event_type": "automatic",
            "has_meaningful_advice": bool(response_text and response_text.strip())
        }
        
        return {
            "advice": response.get("advice", ""),
            "recommendations": response.get("recommendations", []),
            "event_type": response.get("event_type", "Unknown"),
            "has_meaningful_advice": response.get("has_meaningful_advice", True),
            "timestamp": datetime.now().isoformat(),
            "llm_available": llm_copilot.client is not None,
            "enhanced_features": {
                "phase_awareness": True,
                "timing_validation": True,
                "conversation_state": True
            }
        }
        
    except Exception as e:
        logger.error(f"Automatic event response error: {e}")
        # Return empty response on error
        return {
            "advice": "",
            "recommendations": [],
            "has_meaningful_advice": False,
            "timestamp": datetime.now().isoformat(),
            "llm_available": False
        }

@router.post("/rag/collect-feedback")
async def collect_feedback(
    user_rating: int,
    ai_response: str,
    context: Dict[str, Any],
    user_id: str = Depends(verify_jwt_token)
):
    """
    Collect user feedback for AI learning system
    """
    try:
        roast_id = context.get('roast_id', 'unknown')
        
        # Collect feedback for learning system
        llm_copilot.collect_feedback(
            user_rating=user_rating,
            ai_response=ai_response,
            context=context,
            user_id=user_id,
            roast_id=roast_id
        )
        
        return {
            "message": "Feedback collected successfully",
            "timestamp": datetime.now().isoformat(),
            "learning_enabled": True
        }
        
    except Exception as e:
        logger.error(f"Collect feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/conversation-summary/{roast_id}")
async def get_conversation_summary(
    roast_id: str,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get conversation summary for a specific roast
    """
    try:
        summary = llm_copilot.get_conversation_summary(user_id, roast_id)
        
        return {
            "roast_id": roast_id,
            "summary": summary,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get conversation summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/learning-stats")
async def get_learning_stats(
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get learning system statistics
    """
    try:
        stats = llm_copilot.get_learning_stats()
        
        return {
            "learning_stats": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get learning stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/machine-aware-coaching")
async def get_machine_aware_coaching(
    roast_progress: Dict[str, Any],
    user_message: Optional[str] = None,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get machine-aware coaching with deep FreshRoast knowledge
    """
    try:
        # Extract machine information from roast_progress (same pattern as other endpoints)
        machine_info = roast_progress.get('machine_info', {})
        machine_model = machine_info.get('model', 'SR800')
        has_extension = machine_info.get('has_extension', False)
        
        # Extract roast_id from roast_progress
        roast_id = roast_progress.get('roast_id', 1)
        
        # Use machine-aware LLM integration with machine info
        coaching = await machine_aware_llm.get_machine_aware_coaching(
            roast_progress=roast_progress,
            user_message=user_message
        )
        
        return {
            "coaching": coaching,
            "timestamp": datetime.now().isoformat(),
            "machine_aware": True,
            "machine_info": {
                "model": machine_model,
                "has_extension": has_extension
            },
            "enhanced_features": {
                "machine_specific": True,
                "phase_aware": True,
                "temperature_analysis": True,
                "heat_recommendations": True
            }
        }
        
    except Exception as e:
        logger.error(f"Machine-aware coaching error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/health")
async def rag_health():
    """
    Health check for RAG system with enhanced features
    """
    llm_status = "connected" if llm_copilot.client else "disconnected"
    learning_stats = llm_copilot.get_learning_stats()
    
    return {
        "status": "healthy",
        "message": "RAG Copilot API is running with enhanced features",
        "llm_status": llm_status,
        "enhanced_features": {
            "phase_awareness": True,
            "conversation_state": True,
            "learning_system": True,
            "timing_validation": True
        },
        "learning_stats": learning_stats,
        "endpoints": [
            "/rag/pre-roast-planning",
            "/rag/roast-outcome",
            "/rag/during-roast-advice",
            "/rag/automatic-event-response",
            "/rag/collect-feedback",
            "/rag/conversation-summary/{roast_id}",
            "/rag/learning-stats",
            "/rag/machine-aware-coaching",
            "/rag/health"
        ]
    }
