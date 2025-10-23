"""
Conversation State Management System

This module provides conversation state management for the AI chatbot,
including context persistence, conversation history, and memory management.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
import json

logger = logging.getLogger(__name__)

class ConversationStateManager:
    """Manages conversation state and context persistence"""
    
    def __init__(self, context_window: int = 10):
        self.conversation_history: Dict[str, List[Dict[str, Any]]] = {}
        self.context_window = context_window
        self.active_conversations: Dict[str, Dict[str, Any]] = {}
    
    def get_conversation_context(self, user_id: str, roast_id: str) -> List[Dict[str, Any]]:
        """Get relevant conversation history for context"""
        key = f"{user_id}_{roast_id}"
        history = self.conversation_history.get(key, [])
        return history[-self.context_window:]  # Last N messages
    
    def add_interaction(self, user_id: str, roast_id: str, user_input: str, ai_response: str, 
                       roast_phase: Optional[str] = None, event_type: Optional[str] = None) -> None:
        """Store conversation interaction"""
        key = f"{user_id}_{roast_id}"
        if key not in self.conversation_history:
            self.conversation_history[key] = []
        
        interaction = {
            "user_input": user_input,
            "ai_response": ai_response,
            "timestamp": datetime.now().isoformat(),
            "roast_phase": roast_phase,
            "event_type": event_type
        }
        
        self.conversation_history[key].append(interaction)
        
        # Keep only the last context_window interactions
        if len(self.conversation_history[key]) > self.context_window:
            self.conversation_history[key] = self.conversation_history[key][-self.context_window:]
        
        logger.info(f"Added interaction for {key}: {len(self.conversation_history[key])} total interactions")
    
    def get_contextual_prompt(self, user_id: str, roast_id: str, current_input: str) -> str:
        """Build prompt with conversation context"""
        history = self.get_conversation_context(user_id, roast_id)
        context = self.build_context_from_history(history)
        
        return f"""
        Conversation history: {context}
        Current user input: {current_input}
        Provide response considering the full conversation context.
        """
    
    def build_context_from_history(self, history: List[Dict[str, Any]]) -> str:
        """Build context string from conversation history"""
        if not history:
            return "No previous conversation"
        
        context_parts = []
        for interaction in history:
            timestamp = interaction.get('timestamp', 'Unknown time')
            user_input = interaction.get('user_input', '')
            ai_response = interaction.get('ai_response', '')
            roast_phase = interaction.get('roast_phase', 'Unknown phase')
            
            context_parts.append(f"[{timestamp}] User: {user_input}")
            context_parts.append(f"[{timestamp}] AI: {ai_response}")
            if roast_phase != 'Unknown phase':
                context_parts.append(f"[{timestamp}] Phase: {roast_phase}")
        
        return "\n".join(context_parts)
    
    def get_current_phase(self, roast_id: str) -> Optional[str]:
        """Get current roasting phase for a roast"""
        # This would integrate with your existing phase detection
        # For now, return None as placeholder
        return None
    
    def clear_conversation(self, user_id: str, roast_id: str) -> None:
        """Clear conversation history for a specific roast"""
        key = f"{user_id}_{roast_id}"
        if key in self.conversation_history:
            del self.conversation_history[key]
            logger.info(f"Cleared conversation history for {key}")
    
    def get_conversation_summary(self, user_id: str, roast_id: str) -> Dict[str, Any]:
        """Get summary of conversation for a roast"""
        key = f"{user_id}_{roast_id}"
        history = self.conversation_history.get(key, [])
        
        if not history:
            return {"total_interactions": 0, "last_interaction": None}
        
        return {
            "total_interactions": len(history),
            "last_interaction": history[-1].get('timestamp'),
            "phases_discussed": list(set(interaction.get('roast_phase') for interaction in history if interaction.get('roast_phase'))),
            "event_types": list(set(interaction.get('event_type') for interaction in history if interaction.get('event_type')))
        }

class AICoachingLearner:
    """Learning system to improve AI responses based on feedback"""
    
    def __init__(self):
        self.successful_patterns: List[Dict[str, Any]] = []
        self.feedback_scores: List[Dict[str, Any]] = []
        self.learning_threshold = 4  # Minimum rating for learning
    
    def collect_feedback(self, user_rating: int, ai_response: str, context: Dict[str, Any]) -> None:
        """Store user feedback for model improvement"""
        feedback_entry = {
            "rating": user_rating,
            "response": ai_response,
            "context": context,
            "timestamp": datetime.now().isoformat()
        }
        
        self.feedback_scores.append(feedback_entry)
        
        # If rating is good, add to successful patterns
        if user_rating >= self.learning_threshold:
            self.successful_patterns.append(feedback_entry)
            logger.info(f"Added successful pattern with rating {user_rating}")
    
    def get_improved_response(self, context: Dict[str, Any]) -> Optional[str]:
        """Use learned patterns to improve responses"""
        similar_successes = self.find_similar_contexts(context)
        if similar_successes:
            return self.adapt_successful_response(similar_successes[0], context)
        return None
    
    def find_similar_contexts(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find similar successful contexts"""
        # Simple similarity based on roast phase and elapsed time
        current_phase = context.get('current_phase', 'Unknown')
        elapsed_time = context.get('elapsed_time', 0)
        
        similar = []
        for pattern in self.successful_patterns:
            pattern_context = pattern.get('context', {})
            pattern_phase = pattern_context.get('current_phase', 'Unknown')
            pattern_time = pattern_context.get('elapsed_time', 0)
            
            # Check if phases match and times are within 2 minutes
            if (pattern_phase == current_phase and 
                abs(pattern_time - elapsed_time) <= 120):
                similar.append(pattern)
        
        return similar
    
    def adapt_successful_response(self, successful_pattern: Dict[str, Any], current_context: Dict[str, Any]) -> str:
        """Adapt a successful response to current context"""
        base_response = successful_pattern.get('response', '')
        
        # Simple adaptation - could be enhanced with more sophisticated NLP
        adapted_response = base_response
        
        # Replace context-specific information
        if 'roast_phase' in current_context:
            adapted_response = adapted_response.replace(
                successful_pattern.get('context', {}).get('current_phase', ''),
                current_context.get('current_phase', '')
            )
        
        return adapted_response
    
    def get_learning_stats(self) -> Dict[str, Any]:
        """Get learning system statistics"""
        total_feedback = len(self.feedback_scores)
        successful_patterns = len(self.successful_patterns)
        
        if total_feedback == 0:
            return {"total_feedback": 0, "success_rate": 0, "learning_patterns": 0}
        
        success_rate = (successful_patterns / total_feedback) * 100
        
        return {
            "total_feedback": total_feedback,
            "success_rate": success_rate,
            "learning_patterns": successful_patterns
        }

class ConversationManager:
    """Main conversation management class"""
    
    def __init__(self):
        self.state_manager = ConversationStateManager()
        self.learner = AICoachingLearner()
    
    def get_contextual_prompt(self, user_id: str, roast_id: str, current_input: str) -> str:
        """Get prompt with full conversation context"""
        return self.state_manager.get_contextual_prompt(user_id, roast_id, current_input)
    
    def add_interaction(self, user_id: str, roast_id: str, user_input: str, ai_response: str,
                       roast_phase: Optional[str] = None, event_type: Optional[str] = None) -> None:
        """Add interaction to conversation history"""
        self.state_manager.add_interaction(user_id, roast_id, user_input, ai_response, roast_phase, event_type)
    
    def learn_from_feedback(self, user_rating: int, ai_response: str, context: Dict[str, Any]) -> None:
        """Learn from user feedback"""
        self.learner.collect_feedback(user_rating, ai_response, context)
    
    def get_improved_response(self, context: Dict[str, Any]) -> Optional[str]:
        """Get improved response using learning system"""
        return self.learner.get_improved_response(context)
    
    def get_conversation_summary(self, user_id: str, roast_id: str) -> Dict[str, Any]:
        """Get conversation summary"""
        return self.state_manager.get_conversation_summary(user_id, roast_id)
    
    def get_learning_stats(self) -> Dict[str, Any]:
        """Get learning system statistics"""
        return self.learner.get_learning_stats()

# Global conversation manager instance
conversation_manager = ConversationManager()
