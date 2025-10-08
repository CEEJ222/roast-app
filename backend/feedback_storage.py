"""
Feedback storage system with triple redundancy:
1. Supabase (primary, persistent, production-ready)
2. Weaviate (optional, semantic search)
3. JSON (fallback, local backup)
"""
import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class FeedbackStorage:
    def __init__(self):
        self.storage_file = "feedback_data.json"
        self.feedback_data = self._load_feedback_data()
        self.weaviate_client = None
        self.supabase_client = None
        self._initialize_weaviate()
        self._initialize_supabase()
    
    def _initialize_weaviate(self):
        """Initialize Weaviate connection for semantic search (optional)"""
        try:
            from RAG_system.weaviate.weaviate_config import get_weaviate_client
            self.weaviate_client = get_weaviate_client()
            if self.weaviate_client and self.weaviate_client.is_connected():
                logger.info("✅ Feedback storage: Weaviate connected (semantic search available)")
            else:
                logger.info("ℹ️ Feedback storage: Weaviate not available (semantic search disabled)")
        except Exception as e:
            logger.info(f"ℹ️ Feedback storage: Weaviate unavailable: {e}")
            self.weaviate_client = None
    
    def _initialize_supabase(self):
        """Initialize Supabase connection for persistent storage"""
        try:
            from utils.database import get_supabase
            self.supabase_client = get_supabase()
            logger.info("✅ Feedback storage: Supabase connected (persistent storage)")
        except Exception as e:
            logger.error(f"❌ Feedback storage: Could not initialize Supabase: {e}")
            self.supabase_client = None
    
    def _load_feedback_data(self):
        """Load feedback data from JSON file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading feedback data: {e}")
            return []
    
    def _save_feedback_data(self):
        """Save feedback data to JSON file"""
        try:
            with open(self.storage_file, 'w') as f:
                json.dump(self.feedback_data, f, indent=2)
            logger.info(f"✅ Saved {len(self.feedback_data)} feedback entries to JSON")
        except Exception as e:
            logger.error(f"Error saving feedback data: {e}")
    
    def _sync_to_weaviate(self, feedback_entry: Dict[str, Any]) -> bool:
        """Sync feedback entry to Weaviate for semantic search"""
        if not self.weaviate_client or not self.weaviate_client.is_connected():
            logger.warning("⚠️ Weaviate not available - skipping sync")
            return False
        
        try:
            # Prepare data for Weaviate
            weaviate_data = {
                "feedback_id": feedback_entry.get("id", ""),
                "user_id": feedback_entry.get("user_id", ""),
                "user_email": feedback_entry.get("user_email", ""),
                "feedback_text": feedback_entry.get("feedback_text", ""),
                "feature": feedback_entry.get("feature", "general_app"),
                "feedback_type": feedback_entry.get("feedback_type", "general"),
                "status": feedback_entry.get("status", "new"),
                "sentiment": feedback_entry.get("sentiment", "neutral"),
                "priority": feedback_entry.get("priority", "medium"),
                "created_at": feedback_entry.get("timestamp", datetime.now().isoformat())
            }
            
            # Add to Weaviate
            objects = [{
                "data": weaviate_data,
                "uuid": str(uuid.uuid4())
            }]
            
            success = self.weaviate_client.add_objects("UserFeedback", objects)
            if success:
                logger.info(f"✅ Synced feedback to Weaviate: {feedback_entry.get('id')}")
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to sync feedback to Weaviate: {e}")
            return False
    
    def _store_to_supabase(self, feedback_entry: Dict[str, Any]) -> bool:
        """Store feedback to Supabase (primary persistent storage)"""
        if not self.supabase_client:
            logger.warning("⚠️ Supabase not available - skipping database storage")
            return False
        
        try:
            # Prepare data for Supabase
            supabase_data = {
                "id": feedback_entry.get("id", ""),
                "user_id": feedback_entry.get("user_id", ""),
                "user_email": feedback_entry.get("user_email", ""),
                "feedback_text": feedback_entry.get("feedback_text", ""),
                "feature": feedback_entry.get("feature", "general_app"),
                "feedback_type": feedback_entry.get("feedback_type", "general"),
                "status": feedback_entry.get("status", "new"),
                "sentiment": feedback_entry.get("sentiment", "neutral"),
                "priority": feedback_entry.get("priority", "medium"),
            }
            
            # Insert into Supabase
            result = self.supabase_client.table("feedback").insert(supabase_data).execute()
            
            if result.data:
                logger.info(f"✅ Stored feedback to Supabase: {feedback_entry.get('id')}")
                return True
            else:
                logger.error(f"❌ Failed to store feedback to Supabase: No data returned")
                return False
            
        except Exception as e:
            logger.error(f"❌ Failed to store feedback to Supabase: {e}")
            return False

    def store_feedback(self, user_id: str, user_email: str, feedback_text: str, 
                      feature: str = "ai_copilot", status: str = "development", feedback_type: str = "general") -> str:
        """
        Store feedback with triple redundancy:
        1. Supabase (primary, persistent)
        2. Weaviate (optional, semantic search)
        3. JSON (fallback, local backup)
        """
        try:
            feedback_entry = {
                "id": f"feedback_{user_id}_{int(datetime.now().timestamp())}",
                "user_id": user_id,
                "user_email": user_email,
                "feedback_text": feedback_text,
                "feature": feature,
                "feedback_type": feedback_type,
                "timestamp": datetime.now().isoformat(),
                "status": status,
                "sentiment": "neutral",  # Can be enhanced with sentiment analysis
                "priority": "medium"     # Can be enhanced with priority detection
            }
            
            # 1. Store to Supabase (PRIMARY - must succeed for production)
            supabase_success = self._store_to_supabase(feedback_entry)
            
            # 2. Store to JSON (BACKUP - always try)
            self.feedback_data.append(feedback_entry)
            self._save_feedback_data()
            
            # 3. Sync to Weaviate (OPTIONAL - for semantic search)
            self._sync_to_weaviate(feedback_entry)
            
            if supabase_success:
                logger.info(f"✅ Stored feedback with ID: {feedback_entry['id']} (Supabase + backups)")
            else:
                logger.warning(f"⚠️ Stored feedback with ID: {feedback_entry['id']} (JSON only - Supabase failed)")
            
            return feedback_entry['id']
            
        except Exception as e:
            logger.error(f"❌ Error storing feedback: {e}")
            return f"error_{user_id}_{int(datetime.now().timestamp())}"
    
    def search_feedback(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search feedback with priority:
        1. Weaviate (best - semantic search)
        2. Supabase (good - PostgreSQL full-text search)
        3. JSON (fallback - simple text matching)
        """
        # Try Weaviate semantic search first (best option)
        if self.weaviate_client and self.weaviate_client.is_connected():
            try:
                weaviate_results = self.weaviate_client.search("UserFeedback", query, limit)
                if weaviate_results:
                    logger.info(f"🔍 Found {len(weaviate_results)} feedback entries via Weaviate semantic search")
                    return weaviate_results
            except Exception as e:
                logger.warning(f"⚠️ Weaviate search failed: {e}")
        
        # Try Supabase full-text search (good option)
        if self.supabase_client:
            try:
                # Use PostgreSQL full-text search
                result = self.supabase_client.table("feedback") \
                    .select("*") \
                    .text_search("feedback_text", query) \
                    .order("created_at", desc=True) \
                    .limit(limit) \
                    .execute()
                
                if result.data:
                    logger.info(f"🔍 Found {len(result.data)} feedback entries via Supabase full-text search")
                    return result.data
            except Exception as e:
                logger.warning(f"⚠️ Supabase search failed: {e}")
        
        # Fallback to simple text matching in JSON (basic option)
        try:
            query_lower = query.lower()
            results = []
            
            for item in self.feedback_data:
                # Simple text matching in feedback text
                if (query_lower in item.get("feedback_text", "").lower() or 
                    query_lower in item.get("user_email", "").lower() or
                    query_lower in item.get("feature", "").lower() or
                    query_lower in item.get("feedback_type", "").lower()):
                    results.append(item)
                    
                if len(results) >= limit:
                    break
            
            logger.info(f"🔍 Found {len(results)} feedback entries via JSON text search")
            return results
                
        except Exception as e:
            logger.error(f"❌ Error searching feedback: {e}")
            return []
    
    def get_all_feedback(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all feedback items with priority:
        1. Supabase (primary source)
        2. JSON (fallback)
        """
        # Try Supabase first (primary source)
        if self.supabase_client:
            try:
                result = self.supabase_client.table("feedback") \
                    .select("*") \
                    .order("created_at", desc=True) \
                    .limit(limit) \
                    .execute()
                
                if result.data:
                    logger.info(f"📊 Retrieved {len(result.data)} feedback entries from Supabase")
                    return result.data
            except Exception as e:
                logger.warning(f"⚠️ Supabase query failed, falling back to JSON: {e}")
        
        # Fallback to JSON
        try:
            # Return most recent feedback first
            sorted_feedback = sorted(
                self.feedback_data, 
                key=lambda x: x.get("timestamp", ""), 
                reverse=True
            )
            logger.info(f"📊 Retrieved {len(sorted_feedback[:limit])} feedback entries from JSON")
            return sorted_feedback[:limit]
                
        except Exception as e:
            logger.error(f"❌ Error getting all feedback: {e}")
            return []
    
    def get_feedback_summary(self) -> Dict[str, Any]:
        """Get a summary of all feedback"""
        all_feedback = self.get_all_feedback()
        
        if not all_feedback:
            return {
                "total_feedback": 0,
                "by_type": {},
                "recent_feedback": [],
                "storage_status": {
                    "supabase": "connected" if self.supabase_client else "disconnected",
                    "weaviate": "connected" if (self.weaviate_client and self.weaviate_client.is_connected()) else "disconnected",
                    "json": "available"
                }
            }
        
        # Count by feedback type (combining feature and feedback_type)
        by_type = {}
        
        for item in all_feedback:
            feature = item.get("feature", "unknown")
            feedback_type = item.get("feedback_type", "general")
            
            if feature == "ai_copilot":
                # AI Copilot feedback
                by_type["AI Copilot"] = by_type.get("AI Copilot", 0) + 1
            elif feature == "general_app":
                # General app feedback - use specific feedback type
                type_display = feedback_type.replace("_", " ").title()
                by_type[type_display] = by_type.get(type_display, 0) + 1
            else:
                # Other features
                by_type[feature] = by_type.get(feature, 0) + 1
        
        # Get recent feedback (last 10)
        recent = sorted(all_feedback, 
                       key=lambda x: x.get("timestamp", ""), 
                       reverse=True)[:10]
        
        return {
            "total_feedback": len(all_feedback),
            "by_type": by_type,
            "recent_feedback": recent,
            "storage_status": {
                "supabase": "connected" if self.supabase_client else "disconnected",
                "weaviate": "connected" if (self.weaviate_client and self.weaviate_client.is_connected()) else "disconnected",
                "json": "available"
            }
        }
    
    def migrate_to_supabase(self) -> Dict[str, Any]:
        """Migrate all existing feedback from JSON to Supabase"""
        if not self.supabase_client:
            return {
                "success": False,
                "message": "Supabase not available",
                "migrated": 0
            }
        
        try:
            migrated_count = 0
            failed_count = 0
            
            for feedback_entry in self.feedback_data:
                if self._store_to_supabase(feedback_entry):
                    migrated_count += 1
                else:
                    failed_count += 1
            
            logger.info(f"✅ Supabase migration complete: {migrated_count} success, {failed_count} failed")
            return {
                "success": True,
                "message": f"Migrated {migrated_count} feedback entries to Supabase",
                "migrated": migrated_count,
                "failed": failed_count,
                "total": len(self.feedback_data)
            }
            
        except Exception as e:
            logger.error(f"❌ Supabase migration failed: {e}")
            return {
                "success": False,
                "message": f"Migration error: {str(e)}",
                "migrated": 0
            }
    
    def migrate_to_weaviate(self) -> Dict[str, Any]:
        """Migrate all existing feedback from JSON to Weaviate"""
        if not self.weaviate_client or not self.weaviate_client.is_connected():
            return {
                "success": False,
                "message": "Weaviate not available",
                "migrated": 0
            }
        
        try:
            migrated_count = 0
            failed_count = 0
            
            for feedback_entry in self.feedback_data:
                if self._sync_to_weaviate(feedback_entry):
                    migrated_count += 1
                else:
                    failed_count += 1
            
            logger.info(f"✅ Migration complete: {migrated_count} success, {failed_count} failed")
            return {
                "success": True,
                "message": f"Migrated {migrated_count} feedback entries to Weaviate",
                "migrated": migrated_count,
                "failed": failed_count,
                "total": len(self.feedback_data)
            }
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return {
                "success": False,
                "message": f"Migration error: {str(e)}",
                "migrated": 0
            }

# Global instance
feedback_storage = FeedbackStorage()
