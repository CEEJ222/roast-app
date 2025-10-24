"""
Roast Chat Feedback Router - handles feedback on AI chat messages
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from utils.database import get_supabase
from utils.auth import verify_jwt_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/roast-chat", tags=["Roast Chat Feedback"])

class RoastChatFeedbackInput(BaseModel):
    roast_id: int
    chat_message_id: str
    feedback_type: str  # thumbs_up, thumbs_down, too_late, wrong_advice, confusing, not_relevant
    feedback_comment: Optional[str] = None
    ai_message_text: str
    roast_context: Dict[str, Any]

@router.post("/feedback")
async def submit_feedback(
    feedback: RoastChatFeedbackInput,
    user_id: str = Depends(verify_jwt_token),
    supabase = Depends(get_supabase)
):
    """
    Submit feedback on an AI chat message
    """
    try:
        # Check if user has already given feedback for this message
        existing_feedback = supabase.table('roast_chat_feedback').select('*').eq(
            'chat_message_id', feedback.chat_message_id
        ).eq('user_id', user_id).execute()
        
        if existing_feedback.data:
            raise HTTPException(
                status_code=400, 
                detail="Feedback already submitted for this message"
            )
        
        # Insert feedback into database
        feedback_data = {
            'user_id': user_id,
            'roast_id': feedback.roast_id,
            'chat_message_id': feedback.chat_message_id,
            'feedback_type': feedback.feedback_type,
            'feedback_comment': feedback.feedback_comment,
            'ai_message_text': feedback.ai_message_text,
            'roast_context': feedback.roast_context
        }
        
        result = supabase.table('roast_chat_feedback').insert(feedback_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to store feedback")
        
        feedback_id = result.data[0]['id']
        
        # Log feedback submission
        logger.info(f"✅ Feedback '{feedback.feedback_type}' recorded for message {feedback.chat_message_id}")
        
        # If positive feedback, consider for golden examples
        if feedback.feedback_type == 'thumbs_up':
            try:
                from RAG_system.roast_chat_learning import consider_for_golden_examples
                await consider_for_golden_examples(feedback_id, feedback, user_id, supabase)
            except Exception as e:
                logger.error(f"Failed to process golden examples: {e}")
                # Don't fail the request if golden examples processing fails
        
        # If negative feedback, log for review
        if feedback.feedback_type in ['wrong_advice', 'too_late', 'confusing', 'not_relevant']:
            try:
                from RAG_system.roast_chat_learning import log_for_review
                log_for_review(feedback, user_id)
            except Exception as e:
                logger.error(f"Failed to log negative feedback: {e}")
                # Don't fail the request if logging fails
        
        return {
            "success": True,
            "feedback_id": feedback_id,
            "message": "Feedback submitted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/analytics")
async def get_feedback_analytics(
    user_id: str = Depends(verify_jwt_token),
    supabase = Depends(get_supabase)
):
    """
    Get feedback analytics (admin/developer use)
    """
    try:
        # Query the analytics view
        analytics_result = supabase.table('roast_chat_feedback_analytics').select('*').execute()
        
        # Query feedback by phase
        phase_result = supabase.table('roast_chat_feedback_by_phase').select('*').execute()
        
        # Get recent negative feedback for review
        negative_feedback = supabase.table('roast_chat_feedback').select('*').in_(
            'feedback_type', ['wrong_advice', 'too_late', 'confusing', 'not_relevant']
        ).order('created_at', desc=True).limit(10).execute()
        
        return {
            "analytics": analytics_result.data[0] if analytics_result.data else {},
            "by_phase": phase_result.data,
            "recent_negative": negative_feedback.data,
            "golden_examples_count": len(supabase.table('roast_chat_golden_examples').select('id').execute().data or [])
        }
        
    except Exception as e:
        logger.error(f"Error getting feedback analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
