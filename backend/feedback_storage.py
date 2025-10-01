"""
Feedback storage system with fallback to local storage
"""
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

class FeedbackStorage:
    def __init__(self):
        self.storage_file = "feedback_data.json"
        self.feedback_data = self._load_feedback_data()
    
    def _load_feedback_data(self):
        """Load feedback data from JSON file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            print(f"Error loading feedback data: {e}")
            return []
    
    def _save_feedback_data(self):
        """Save feedback data to JSON file"""
        try:
            with open(self.storage_file, 'w') as f:
                json.dump(self.feedback_data, f, indent=2)
        except Exception as e:
            print(f"Error saving feedback data: {e}")
    
    def store_feedback(self, user_id: str, user_email: str, feedback_text: str, 
                      feature: str = "ai_copilot", status: str = "development") -> str:
        """Store feedback locally"""
        try:
            feedback_entry = {
                "id": f"feedback_{user_id}_{int(datetime.now().timestamp())}",
                "user_id": user_id,
                "user_email": user_email,
                "feedback_text": feedback_text,
                "feature": feature,
                "timestamp": datetime.now().isoformat(),
                "status": status
            }
            
            # Add to local storage
            self.feedback_data.append(feedback_entry)
            self._save_feedback_data()
            
            print(f"Stored feedback with ID: {feedback_entry['id']}")
            return feedback_entry['id']
            
        except Exception as e:
            print(f"Error storing feedback: {e}")
            return f"error_{user_id}_{int(datetime.now().timestamp())}"
    
    def search_feedback(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search feedback using simple text matching"""
        try:
            query_lower = query.lower()
            results = []
            
            for item in self.feedback_data:
                # Simple text matching in feedback text
                if (query_lower in item.get("feedback_text", "").lower() or 
                    query_lower in item.get("user_email", "").lower() or
                    query_lower in item.get("feature", "").lower()):
                    results.append(item)
                    
                if len(results) >= limit:
                    break
                    
            return results
                
        except Exception as e:
            print(f"Error searching feedback: {e}")
            return []
    
    def get_all_feedback(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all feedback items"""
        try:
            # Return most recent feedback first
            sorted_feedback = sorted(
                self.feedback_data, 
                key=lambda x: x.get("timestamp", ""), 
                reverse=True
            )
            return sorted_feedback[:limit]
                
        except Exception as e:
            print(f"Error getting all feedback: {e}")
            return []
    
    def get_feedback_summary(self) -> Dict[str, Any]:
        """Get a summary of all feedback"""
        all_feedback = self.get_all_feedback()
        
        if not all_feedback:
            return {
                "total_feedback": 0,
                "by_feature": {},
                "by_status": {},
                "recent_feedback": []
            }
        
        # Count by feature
        by_feature = {}
        by_status = {}
        
        for item in all_feedback:
            feature = item.get("feature", "unknown")
            status = item.get("status", "unknown")
            
            by_feature[feature] = by_feature.get(feature, 0) + 1
            by_status[status] = by_status.get(status, 0) + 1
        
        # Get recent feedback (last 10)
        recent = sorted(all_feedback, 
                       key=lambda x: x.get("timestamp", ""), 
                       reverse=True)[:10]
        
        return {
            "total_feedback": len(all_feedback),
            "by_feature": by_feature,
            "by_status": by_status,
            "recent_feedback": recent
        }

# Global instance
feedback_storage = FeedbackStorage()
