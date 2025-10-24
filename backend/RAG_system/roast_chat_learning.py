"""
Roast Chat Learning System - handles golden examples and feedback learning
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

async def consider_for_golden_examples(feedback_id: str, feedback, user_id: str, supabase):
    """
    Consider adding positive feedback to golden examples for few-shot learning
    """
    try:
        # Extract context from feedback
        roast_context = feedback.roast_context
        machine_model = roast_context.get('machine_model', 'SR800')
        has_extension = roast_context.get('has_extension', False)
        roast_phase = roast_context.get('phase', 'Unknown')
        temp_sensor_type = roast_context.get('temp_sensor_type', 'builtin')
        
        # Check if we already have enough golden examples for this exact context
        existing_examples = supabase.table('roast_chat_golden_examples').select('*').eq(
            'machine_model', machine_model
        ).eq('has_extension', has_extension).eq('roast_phase', roast_phase).eq(
            'temp_sensor_type', temp_sensor_type
        ).execute()
        
        # Limit to 10 examples per context to avoid overfitting
        if len(existing_examples.data or []) >= 10:
            logger.info(f"Already have 10+ golden examples for {machine_model}/{roast_phase}, skipping")
            return
        
        # Create situation summary
        elapsed_seconds = roast_context.get('elapsed_seconds', 0)
        current_temp = roast_context.get('current_temp')
        current_heat = roast_context.get('current_heat', 0)
        current_fan = roast_context.get('current_fan', 0)
        current_dtr = roast_context.get('current_dtr')
        
        # Format time as minutes:seconds
        minutes = int(elapsed_seconds // 60)
        seconds = int(elapsed_seconds % 60)
        time_str = f"{minutes}:{seconds:02d}"
        
        # Build situation summary
        situation_parts = [
            f"{machine_model}{'+ ET' if has_extension else ''}",
            f"{roast_phase} phase",
            f"{time_str}",
        ]
        
        if current_temp:
            situation_parts.append(f"{current_temp}°F")
        
        if current_heat > 0:
            situation_parts.append(f"heat {current_heat}")
        
        if current_fan > 0:
            situation_parts.append(f"fan {current_fan}")
        
        if current_dtr:
            situation_parts.append(f"DTR {current_dtr}%")
        
        situation_parts.append(f"{temp_sensor_type} sensor")
        
        situation_summary = ", ".join(situation_parts)
        
        # Get user question if available
        user_question = roast_context.get('user_question')
        
        # Insert into golden examples
        golden_example = {
            'source_feedback_id': feedback_id,
            'machine_model': machine_model,
            'has_extension': has_extension,
            'roast_phase': roast_phase,
            'temp_sensor_type': temp_sensor_type,
            'situation_summary': situation_summary,
            'user_question': user_question,
            'excellent_response': feedback.ai_message_text,
            'why_its_good': 'User marked as helpful with thumbs up',
            'effectiveness_score': 1.0
        }
        
        result = supabase.table('roast_chat_golden_examples').insert(golden_example).execute()
        
        if result.data:
            logger.info(f"✨ Added golden example from feedback {feedback_id}")
            logger.info(f"   Context: {situation_summary}")
            logger.info(f"   Response: {feedback.ai_message_text[:100]}...")
        else:
            logger.error(f"Failed to insert golden example for feedback {feedback_id}")
            
    except Exception as e:
        logger.error(f"Error processing golden examples for feedback {feedback_id}: {e}")

def log_for_review(feedback, user_id: str):
    """
    Log negative feedback for developer review
    """
    try:
        roast_context = feedback.roast_context
        
        logger.warning("⚠️ NEGATIVE FEEDBACK RECEIVED:")
        logger.warning(f"   Type: {feedback.feedback_type}")
        logger.warning(f"   User: {user_id}")
        logger.warning(f"   Message: {feedback.ai_message_text[:200]}...")
        logger.warning(f"   Comment: {feedback.feedback_comment or 'None'}")
        logger.warning(f"   Context: {roast_context.get('phase', 'Unknown')} phase")
        logger.warning(f"   Machine: {roast_context.get('machine_model', 'Unknown')}")
        logger.warning(f"   Extension: {roast_context.get('has_extension', False)}")
        logger.warning(f"   Time: {roast_context.get('elapsed_seconds', 0)}s")
        logger.warning(f"   Temp: {roast_context.get('current_temp', 'N/A')}°F")
        logger.warning(f"   Heat/Fan: {roast_context.get('current_heat', 0)}/{roast_context.get('current_fan', 0)}")
        logger.warning("   " + "="*50)
        
    except Exception as e:
        logger.error(f"Error logging negative feedback: {e}")

async def get_golden_examples_for_context(
    machine_model: str,
    has_extension: bool,
    phase: str,
    sensor_type: str,
    supabase,
    limit: int = 3
) -> List[Dict[str, Any]]:
    """
    Retrieve golden examples for the given context for few-shot learning
    """
    try:
        # Query golden examples matching the context
        result = supabase.table('roast_chat_golden_examples').select('*').eq(
            'machine_model', machine_model
        ).eq('has_extension', has_extension).eq('roast_phase', phase).eq(
            'temp_sensor_type', sensor_type
        ).order('effectiveness_score', desc=True).limit(limit).execute()
        
        examples = result.data or []
        logger.info(f"Retrieved {len(examples)} golden examples for {machine_model}/{phase}")
        
        return examples
        
    except Exception as e:
        logger.error(f"Error retrieving golden examples: {e}")
        return []

def build_few_shot_examples_section(examples: List[Dict[str, Any]]) -> str:
    """
    Build a formatted few-shot examples section for the system prompt
    """
    if not examples:
        return ""
    
    section = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    section += "🎯 EXCELLENT EXAMPLES FROM USER FEEDBACK:\n"
    section += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    
    for i, example in enumerate(examples, 1):
        section += f"**Example {i}:**\n"
        section += f"Situation: {example.get('situation_summary', 'N/A')}\n"
        
        if example.get('user_question'):
            section += f"User Question: {example['user_question']}\n"
        
        section += f"Excellent Response: {example.get('excellent_response', 'N/A')}\n"
        section += f"Why it's good: {example.get('why_its_good', 'N/A')}\n\n"
    
    section += "Provide coaching of similar quality and specificity to these examples.\n"
    
    return section
