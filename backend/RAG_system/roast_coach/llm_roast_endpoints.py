"""
API Endpoints for LLM-Powered Roast Coaching System
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from main import verify_jwt_token
from RAG_system.bean_profile.llm_bean_recognizer import get_llm_bean_recognizer
from RAG_system.roast_coach.llm_roast_coach import get_llm_roast_coach

router = APIRouter()

# Request/Response Models
class BeanRecognitionRequest(BaseModel):
    input_text: str

class BeanRecognitionResponse(BaseModel):
    success: bool
    characteristics: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    raw_input: str

class RoastGuidanceRequest(BaseModel):
    bean_characteristics: Dict[str, Any]

class RoastGuidanceResponse(BaseModel):
    success: bool
    guidance: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    bean_characteristics: Dict[str, Any]

class RealtimeCoachingRequest(BaseModel):
    current_roast_data: Dict[str, Any]
    bean_characteristics: Dict[str, Any]

class RealtimeCoachingResponse(BaseModel):
    success: bool
    coaching: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    roast_data: Dict[str, Any]
    bean_characteristics: Dict[str, Any]

# API Endpoints

@router.post("/llm/recognize-bean", response_model=BeanRecognitionResponse)
async def recognize_bean_characteristics(
    request: BeanRecognitionRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Use LLM to extract bean characteristics from any input
    """
    try:
        recognizer = get_llm_bean_recognizer()
        result = recognizer.recognize_bean_characteristics(request.input_text)
        
        if result["success"]:
            return BeanRecognitionResponse(
                success=True,
                characteristics=result["characteristics"],
                raw_input=result["raw_input"]
            )
        else:
            return BeanRecognitionResponse(
                success=False,
                error=result["error"],
                raw_input=result["raw_input"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/llm/roast-guidance", response_model=RoastGuidanceResponse)
async def get_roast_guidance(
    request: RoastGuidanceRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get comprehensive roasting guidance based on bean characteristics
    """
    try:
        coach = get_llm_roast_coach()
        result = coach.get_roast_guidance(request.bean_characteristics)
        
        if result["success"]:
            return RoastGuidanceResponse(
                success=True,
                guidance=result["guidance"],
                bean_characteristics=result["bean_characteristics"]
            )
        else:
            return RoastGuidanceResponse(
                success=False,
                error=result["error"],
                bean_characteristics=result["bean_characteristics"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/llm/realtime-coaching", response_model=RealtimeCoachingResponse)
async def get_realtime_coaching(
    request: RealtimeCoachingRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get real-time coaching advice during roasting
    """
    try:
        coach = get_llm_roast_coach()
        result = coach.get_realtime_coaching(
            request.current_roast_data,
            request.bean_characteristics
        )
        
        if result["success"]:
            return RealtimeCoachingResponse(
                success=True,
                coaching=result["coaching"],
                roast_data=result["roast_data"],
                bean_characteristics=result["bean_characteristics"]
            )
        else:
            return RealtimeCoachingResponse(
                success=False,
                error=result["error"],
                roast_data=result["roast_data"],
                bean_characteristics=result["bean_characteristics"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/llm/complete-analysis", response_model=Dict[str, Any])
async def complete_bean_analysis(
    request: BeanRecognitionRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Complete analysis: recognize bean characteristics + get roast guidance
    """
    try:
        # Step 1: Recognize bean characteristics
        recognizer = get_llm_bean_recognizer()
        recognition_result = recognizer.recognize_bean_characteristics(request.input_text)
        
        if not recognition_result["success"]:
            return {
                "success": False,
                "error": f"Bean recognition failed: {recognition_result['error']}",
                "raw_input": request.input_text
            }
        
        # Step 2: Get roast guidance
        coach = get_llm_roast_coach()
        guidance_result = coach.get_roast_guidance(recognition_result["characteristics"])
        
        if not guidance_result["success"]:
            return {
                "success": False,
                "error": f"Roast guidance failed: {guidance_result['error']}",
                "bean_characteristics": recognition_result["characteristics"],
                "raw_input": request.input_text
            }
        
        # Return complete analysis
        return {
            "success": True,
            "bean_characteristics": recognition_result["characteristics"],
            "roast_guidance": guidance_result["guidance"],
            "raw_input": request.input_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
