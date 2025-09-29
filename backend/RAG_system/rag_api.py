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

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for RAG API
class PreRoastPlanningRequest(BaseModel):
    bean_profile_id: str
    roast_goals: List[str]
    roast_challenges: List[str] = []
    environmental_conditions: Optional[Dict[str, Any]] = None

class PreRoastPlanningResponse(BaseModel):
    recommended_profile: Dict[str, Any]
    similar_roasts: List[Dict[str, Any]]
    confidence_score: float
    reasoning: str
    recommendations: List[str]

class DuringRoastGuidanceRequest(BaseModel):
    roast_id: int
    current_time: float
    current_temp: float
    current_heat: int
    current_fan: int
    recent_events: List[Dict[str, Any]]

class DuringRoastGuidanceResponse(BaseModel):
    guidance_type: str  # "adjustment", "warning", "milestone", "info"
    message: str
    recommended_heat: Optional[int] = None
    recommended_fan: Optional[int] = None
    confidence_score: float
    reasoning: str
    similar_roasts: List[Dict[str, Any]]

class PostRoastAnalysisRequest(BaseModel):
    roast_id: int
    actual_outcome: Dict[str, Any]
    tasting_notes: str
    flavor_profile: List[str]
    aroma_profile: List[str]
    ratings: Dict[str, int]
    reflections: str

class PostRoastAnalysisResponse(BaseModel):
    analysis: Dict[str, Any]
    improvements: List[str]
    similar_roasts: List[Dict[str, Any]]
    next_roast_recommendations: List[str]
    confidence_score: float

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
        from main import get_supabase, verify_jwt_token
        from .weaviate.weaviate_integration import get_weaviate_integration
        
        sb = get_supabase()
        
        # Get bean profile
        bean_result = sb.table("bean_profiles").select("*").eq("id", request.bean_profile_id).eq("user_id", user_id).execute()
        if not bean_result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        bean_profile = bean_result.data[0]
        
        # Get similar historical roasts
        weaviate = get_weaviate_integration()
        similar_roasts = weaviate.find_similar_roasts(bean_profile, limit=10)
        
        # Generate AI recommendations
        recommendations = _generate_pre_roast_recommendations(
            bean_profile, 
            similar_roasts, 
            request.roast_goals,
            request.roast_challenges,
            request.environmental_conditions
        )
        
        return PreRoastPlanningResponse(
            recommended_profile=recommendations["profile"],
            similar_roasts=similar_roasts,
            confidence_score=recommendations["confidence"],
            reasoning=recommendations["reasoning"],
            recommendations=recommendations["recommendations"]
        )
        
    except Exception as e:
        logger.error(f"Pre-roast planning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/during-roast-guidance")
async def during_roast_guidance(
    request: DuringRoastGuidanceRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Provide real-time guidance during roasting
    """
    try:
        sb = get_supabase()
        
        # Get roast data
        roast_result = sb.table("roast_entries").select("*").eq("id", request.roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        roast_data = roast_result.data[0]
        
        # Get similar roasts for comparison
        weaviate = get_weaviate_integration()
        similar_roasts = weaviate.find_similar_roasts_by_bean(roast_data.get("bean_profile_id"), limit=5)
        
        # Generate real-time guidance
        guidance = _generate_during_roast_guidance(
            roast_data,
            request.current_time,
            request.current_temp,
            request.current_heat,
            request.current_fan,
            request.recent_events,
            similar_roasts
        )
        
        return DuringRoastGuidanceResponse(
            guidance_type=guidance["type"],
            message=guidance["message"],
            recommended_heat=guidance.get("recommended_heat"),
            recommended_fan=guidance.get("recommended_fan"),
            confidence_score=guidance["confidence"],
            reasoning=guidance["reasoning"],
            similar_roasts=similar_roasts
        )
        
    except Exception as e:
        logger.error(f"During-roast guidance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/post-roast-analysis")
async def post_roast_analysis(
    request: PostRoastAnalysisRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Analyze roast outcome and provide recommendations for next time
    """
    try:
        sb = get_supabase()
        
        # Get roast data
        roast_result = sb.table("roast_entries").select("*").eq("id", request.roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        roast_data = roast_result.data[0]
        
        # Get similar roasts for comparison
        weaviate = get_weaviate_integration()
        similar_roasts = weaviate.find_similar_roasts_by_bean(roast_data.get("bean_profile_id"), limit=10)
        
        # Generate post-roast analysis
        analysis = _generate_post_roast_analysis(
            roast_data,
            request.actual_outcome,
            request.tasting_notes,
            request.flavor_profile,
            request.aroma_profile,
            request.ratings,
            request.reflections,
            similar_roasts
        )
        
        return PostRoastAnalysisResponse(
            analysis=analysis["analysis"],
            improvements=analysis["improvements"],
            similar_roasts=similar_roasts,
            next_roast_recommendations=analysis["recommendations"],
            confidence_score=analysis["confidence"]
        )
        
    except Exception as e:
        logger.error(f"Post-roast analysis error: {e}")
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
        sb = get_supabase()
        
        # Verify roast ownership
        roast_result = sb.table("roast_entries").select("*").eq("id", request.roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        # Create roast outcome
        outcome_data = {
            "roast_id": request.roast_id,
            "user_id": user_id,
            "actual_roast_level": request.actual_roast_level,
            "weight_after_g": request.weight_after_g,
            "roast_duration_minutes": request.roast_duration_minutes,
            "development_time_minutes": request.development_time_minutes,
            "development_ratio": request.development_ratio,
            "charge_temp_f": request.charge_temp_f,
            "first_crack_temp_f": request.first_crack_temp_f,
            "second_crack_temp_f": request.second_crack_temp_f,
            "drop_temp_f": request.drop_temp_f,
            "max_temp_f": request.max_temp_f,
            "avg_ror": request.avg_ror,
            "tasting_notes": request.tasting_notes,
            "flavor_profile": request.flavor_profile,
            "aroma_profile": request.aroma_profile,
            "body_rating": request.body_rating,
            "acidity_rating": request.acidity_rating,
            "sweetness_rating": request.sweetness_rating,
            "overall_rating": request.overall_rating,
            "roast_quality": request.roast_quality,
            "roast_consistency": request.roast_consistency,
            "roast_challenges": request.roast_challenges,
            "roast_successes": request.roast_successes,
            "improvement_notes": request.improvement_notes,
            "roast_reflections": request.roast_reflections
        }
        
        result = sb.table("roast_outcomes").insert(outcome_data).execute()
        outcome_id = result.data[0]["id"]
        
        # Update roast entry with outcome reference
        sb.table("roast_entries").update({"roast_outcome_id": outcome_id}).eq("id", request.roast_id).execute()
        
        # Sync to Weaviate for RAG system
        weaviate = get_weaviate_integration()
        weaviate.sync_roast_outcome(result.data[0])
        
        return {"outcome_id": outcome_id, "message": "Roast outcome created successfully"}
        
    except Exception as e:
        logger.error(f"Create roast outcome error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/roast-outcomes/{roast_id}")
async def get_roast_outcome(
    roast_id: int,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get roast outcome data
    """
    try:
        sb = get_supabase()
        
        result = sb.table("roast_outcomes").select("*").eq("roast_id", roast_id).eq("user_id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Roast outcome not found")
        
        return result.data[0]
        
    except Exception as e:
        logger.error(f"Get roast outcome error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/ai-coaching/{user_id}")
async def get_ai_coaching_history(
    user_id: str = Depends(verify_jwt_token),
    limit: int = 20
):
    """
    Get AI coaching history for user
    """
    try:
        sb = get_supabase()
        
        result = sb.table("ai_coaching").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        return result.data
        
    except Exception as e:
        logger.error(f"Get AI coaching history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions for RAG logic
def _generate_pre_roast_recommendations(
    bean_profile: Dict[str, Any],
    similar_roasts: List[Dict[str, Any]],
    roast_goals: List[str],
    roast_challenges: List[str],
    environmental_conditions: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate pre-roast recommendations based on historical data"""
    
    # Analyze similar roasts
    successful_roasts = [r for r in similar_roasts if r.get("overall_rating", 0) >= 7]
    
    if not successful_roasts:
        return {
            "profile": {
                "recommended_roast_level": bean_profile.get("recommended_roast_levels", ["City+"])[0],
                "estimated_time": 12.0,
                "charge_temp": 400.0,
                "strategy": "Standard approach for this bean type"
            },
            "confidence": 0.3,
            "reasoning": "Limited historical data available",
            "recommendations": [
                "Start with standard roast profile for this bean type",
                "Monitor first crack timing closely",
                "Adjust based on environmental conditions"
            ]
        }
    
    # Calculate average successful parameters
    avg_time = sum(r.get("roast_time", 12) for r in successful_roasts) / len(successful_roasts)
    avg_charge_temp = sum(r.get("charge_temp", 400) for r in successful_roasts) / len(successful_roasts)
    avg_first_crack = sum(r.get("first_crack_time", 8) for r in successful_roasts) / len(successful_roasts)
    
    # Generate recommendations based on goals
    recommendations = []
    if "consistency" in roast_goals:
        recommendations.append("Follow the established profile closely for consistency")
    if "experimentation" in roast_goals:
        recommendations.append("Try a slightly different approach to explore new flavors")
    if "time_efficiency" in roast_goals:
        recommendations.append("Optimize for shorter roast time while maintaining quality")
    
    return {
        "profile": {
            "recommended_roast_level": bean_profile.get("recommended_roast_levels", ["City+"])[0],
            "estimated_time": round(avg_time, 1),
            "charge_temp": round(avg_charge_temp, 0),
            "first_crack_target": round(avg_first_crack, 1),
            "strategy": "Based on your successful historical roasts"
        },
        "confidence": min(0.9, 0.5 + (len(successful_roasts) * 0.1)),
        "reasoning": f"Based on {len(successful_roasts)} similar successful roasts",
        "recommendations": recommendations
    }

def _generate_during_roast_guidance(
    roast_data: Dict[str, Any],
    current_time: float,
    current_temp: float,
    current_heat: int,
    current_fan: int,
    recent_events: List[Dict[str, Any]],
    similar_roasts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate real-time guidance during roasting"""
    
    # Analyze current roast progress
    if current_time < 5.0:
        return {
            "type": "info",
            "message": "Early in roast - maintain steady heat and fan settings",
            "confidence": 0.8,
            "reasoning": "Standard early roast guidance"
        }
    
    # Check for first crack timing
    if current_time > 8.0 and not any(e.get("kind") == "FIRST_CRACK" for e in recent_events):
        return {
            "type": "warning",
            "message": "First crack should have started by now - check for crack sounds",
            "confidence": 0.7,
            "reasoning": "Based on typical first crack timing"
        }
    
    # Temperature guidance
    if current_temp < 350:
        return {
            "type": "adjustment",
            "message": "Temperature is low for this stage - increase heat",
            "recommended_heat": min(9, current_heat + 1),
            "confidence": 0.8,
            "reasoning": "Temperature below expected range"
        }
    elif current_temp > 450:
        return {
            "type": "adjustment",
            "message": "Temperature is high - reduce heat to avoid scorching",
            "recommended_heat": max(1, current_heat - 1),
            "confidence": 0.8,
            "reasoning": "Temperature above safe range"
        }
    
    return {
        "type": "info",
        "message": "Roast progressing well - continue current settings",
        "confidence": 0.6,
        "reasoning": "No adjustments needed at this time"
    }

def _generate_post_roast_analysis(
    roast_data: Dict[str, Any],
    actual_outcome: Dict[str, Any],
    tasting_notes: str,
    flavor_profile: List[str],
    aroma_profile: List[str],
    ratings: Dict[str, int],
    reflections: str,
    similar_roasts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate post-roast analysis and recommendations"""
    
    # Analyze roast quality
    overall_rating = ratings.get("overall", 5)
    quality_assessment = "excellent" if overall_rating >= 8 else "good" if overall_rating >= 6 else "fair"
    
    # Generate improvements
    improvements = []
    if overall_rating < 7:
        improvements.append("Consider adjusting roast time for better development")
        improvements.append("Monitor temperature more closely during first crack")
    
    if "bitter" in flavor_profile:
        improvements.append("Reduce roast time or lower final temperature")
    
    if "sour" in flavor_profile:
        improvements.append("Increase roast time or raise final temperature")
    
    # Generate next roast recommendations
    recommendations = []
    if overall_rating >= 8:
        recommendations.append("Repeat this roast profile - it was successful!")
    else:
        recommendations.append("Try a slightly different approach next time")
        recommendations.append("Focus on the areas identified for improvement")
    
    return {
        "analysis": {
            "quality_assessment": quality_assessment,
            "strengths": [s for s in actual_outcome.get("roast_successes", [])],
            "areas_for_improvement": improvements,
            "roast_consistency": "consistent" if overall_rating >= 7 else "needs_work"
        },
        "improvements": improvements,
        "recommendations": recommendations,
        "confidence": 0.8
    }
