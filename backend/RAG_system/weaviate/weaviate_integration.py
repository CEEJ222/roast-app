"""
Weaviate Integration with Existing Bean Profile System
Handles synchronization between Supabase and Weaviate for semantic search
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from .weaviate_config import get_weaviate_client
from .weaviate_schemas import get_all_schemas, get_schema_by_class
from .weaviate_embeddings import get_bean_embedder, get_roast_embedder

logger = logging.getLogger(__name__)

class WeaviateIntegration:
    """Integration layer between Supabase and Weaviate"""
    
    def __init__(self):
        self.client = get_weaviate_client()
        self.bean_embedder = get_bean_embedder()
        self.roast_embedder = get_roast_embedder()
    
    def initialize_schemas(self) -> bool:
        """Initialize all Weaviate schemas"""
        if not self.client or not self.client.is_connected():
            logger.warning("⚠️ Weaviate not available - skipping schema initialization")
            return False
        
        try:
            schemas = get_all_schemas()
            for schema in schemas:
                if not self.client.create_schema(schema):
                    logger.error(f"❌ Failed to create schema: {schema['class']}")
                    return False
            logger.info("✅ All schemas initialized successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Schema initialization failed: {e}")
            return False
    
    def sync_bean_profile(self, bean_profile: Dict[str, Any]) -> bool:
        """Sync bean profile to Weaviate"""
        if not self.client or not self.client.is_connected():
            logger.warning("⚠️ Weaviate not available - skipping bean sync")
            return False
        
        try:
            # Prepare data for Weaviate
            weaviate_data = self._prepare_bean_data(bean_profile)
            
            # Add to Weaviate
            objects = [{
                "data": weaviate_data,
                "uuid": str(uuid.uuid4())
            }]
            
            success = self.client.add_objects("BeanProfile", objects)
            if success:
                logger.info(f"✅ Synced bean profile: {bean_profile.get('name', 'Unknown')}")
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to sync bean profile: {e}")
            return False
    
    def sync_roast_profile(self, roast_profile: Dict[str, Any]) -> bool:
        """Sync roast profile to Weaviate"""
        if not self.client or not self.client.is_connected():
            logger.warning("⚠️ Weaviate not available - skipping roast sync")
            return False
        
        try:
            # Prepare data for Weaviate
            weaviate_data = self._prepare_roast_data(roast_profile)
            
            # Add to Weaviate
            objects = [{
                "data": weaviate_data,
                "uuid": str(uuid.uuid4())
            }]
            
            success = self.client.add_objects("RoastProfile", objects)
            if success:
                logger.info(f"✅ Synced roast profile: {roast_profile.get('name', 'Unknown')}")
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to sync roast profile: {e}")
            return False
    
    def _prepare_bean_data(self, bean_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare bean profile data for Weaviate"""
        # Convert Supabase data to Weaviate format
        weaviate_data = {
            "name": bean_profile.get("name", ""),
            "supplier": bean_profile.get("supplier", ""),
            "origin": bean_profile.get("origin", ""),
            "variety": bean_profile.get("variety", ""),
            "processing": bean_profile.get("processing", ""),
            "elevation": bean_profile.get("elevation"),
            "flavor_notes": bean_profile.get("flavor_notes", []),
            "aroma_notes": bean_profile.get("aroma_notes", []),
            "body": bean_profile.get("body", ""),
            "acidity": bean_profile.get("acidity", ""),
            "sweetness": bean_profile.get("sweetness", ""),
            "cupping_score": bean_profile.get("cupping_score"),
            "roast_level": bean_profile.get("roast_level", ""),
            "description": bean_profile.get("description", ""),
            "supplier_url": bean_profile.get("supplier_url", ""),
            "price_per_pound": bean_profile.get("price_per_pound"),
            "availability": bean_profile.get("availability", ""),
            "harvest_year": bean_profile.get("harvest_year", ""),
            "certifications": bean_profile.get("certifications", []),
            "user_id": bean_profile.get("user_id", ""),
            "created_at": bean_profile.get("created_at", datetime.now().isoformat()),
            "updated_at": bean_profile.get("updated_at", datetime.now().isoformat())
        }
        
        # Remove None values
        return {k: v for k, v in weaviate_data.items() if v is not None}
    
    def _prepare_roast_data(self, roast_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare roast profile data for Weaviate"""
        weaviate_data = {
            "name": roast_profile.get("name", ""),
            "bean_profile_id": roast_profile.get("bean_profile_id", ""),
            "roast_level": roast_profile.get("roast_level", ""),
            "roast_time": roast_profile.get("roast_time"),
            "charge_temp": roast_profile.get("charge_temp"),
            "first_crack_time": roast_profile.get("first_crack_time"),
            "first_crack_temp": roast_profile.get("first_crack_temp"),
            "second_crack_time": roast_profile.get("second_crack_time"),
            "second_crack_temp": roast_profile.get("second_crack_temp"),
            "drop_temp": roast_profile.get("drop_temp"),
            "roast_notes": roast_profile.get("roast_notes", ""),
            "flavor_notes": roast_profile.get("flavor_notes", []),
            "aroma_notes": roast_profile.get("aroma_notes", []),
            "body_rating": roast_profile.get("body_rating"),
            "acidity_rating": roast_profile.get("acidity_rating"),
            "sweetness_rating": roast_profile.get("sweetness_rating"),
            "overall_rating": roast_profile.get("overall_rating"),
            "roaster_model": roast_profile.get("roaster_model", ""),
            "batch_size": roast_profile.get("batch_size"),
            "ambient_temp": roast_profile.get("ambient_temp"),
            "humidity": roast_profile.get("humidity"),
            "user_id": roast_profile.get("user_id", ""),
            "created_at": roast_profile.get("created_at", datetime.now().isoformat()),
            "updated_at": roast_profile.get("updated_at", datetime.now().isoformat())
        }
        
        # Remove None values
        return {k: v for k, v in weaviate_data.items() if v is not None}
    
    def search_beans_semantic(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search beans using semantic similarity"""
        if not self.client or not self.client.is_connected():
            logger.warning("⚠️ Weaviate not available - returning empty results")
            return []
        
        try:
            results = self.client.search("BeanProfile", query, limit)
            logger.info(f"🔍 Found {len(results)} beans for query: {query}")
            return results
        except Exception as e:
            logger.error(f"❌ Semantic search failed: {e}")
            return []
    
    def search_roasts_semantic(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search roast profiles using semantic similarity"""
        if not self.client or not self.client.is_connected():
            logger.warning("⚠️ Weaviate not available - returning empty results")
            return []
        
        try:
            results = self.client.search("RoastProfile", query, limit)
            logger.info(f"🔍 Found {len(results)} roasts for query: {query}")
            return results
        except Exception as e:
            logger.error(f"❌ Semantic search failed: {e}")
            return []
    
    def find_similar_beans(self, bean_profile: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        """Find similar beans based on profile characteristics"""
        if not self.client or not self.client.is_connected():
            return []
        
        try:
            # Create search query from bean profile
            search_terms = []
            if bean_profile.get("flavor_notes"):
                search_terms.extend(bean_profile["flavor_notes"])
            if bean_profile.get("aroma_notes"):
                search_terms.extend(bean_profile["aroma_notes"])
            if bean_profile.get("origin"):
                search_terms.append(bean_profile["origin"])
            if bean_profile.get("variety"):
                search_terms.append(bean_profile["variety"])
            
            query = " ".join(search_terms)
            return self.search_beans_semantic(query, limit)
        except Exception as e:
            logger.error(f"❌ Similar beans search failed: {e}")
            return []
    
    def recommend_roast_profile(self, bean_profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Recommend roast profile for a bean"""
        if not self.client or not self.client.is_connected():
            return None
        
        try:
            # Search for similar beans and their roast profiles
            similar_beans = self.find_similar_beans(bean_profile, limit=3)
            
            if not similar_beans:
                return None
            
            # Find roast profiles for similar beans
            bean_ids = [bean.get("bean_profile_id") for bean in similar_beans if bean.get("bean_profile_id")]
            
            if not bean_ids:
                return None
            
            # Search for roast profiles
            query = f"roast profile for beans: {', '.join(bean_ids)}"
            roast_profiles = self.search_roasts_semantic(query, limit=1)
            
            return roast_profiles[0] if roast_profiles else None
            
        except Exception as e:
            logger.error(f"❌ Roast recommendation failed: {e}")
            return None

# Global integration instance
weaviate_integration = WeaviateIntegration()

def get_weaviate_integration() -> WeaviateIntegration:
    """Get global Weaviate integration instance"""
    return weaviate_integration

def sync_bean_to_weaviate(bean_profile: Dict[str, Any]) -> bool:
    """Sync a bean profile to Weaviate"""
    integration = get_weaviate_integration()
    return integration.sync_bean_profile(bean_profile)

def sync_roast_to_weaviate(roast_profile: Dict[str, Any]) -> bool:
    """Sync a roast profile to Weaviate"""
    integration = get_weaviate_integration()
    return integration.sync_roast_profile(roast_profile)

def search_beans_semantic(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search beans using semantic similarity"""
    integration = get_weaviate_integration()
    return integration.search_beans_semantic(query, limit)

def search_roasts_semantic(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search roast profiles using semantic similarity"""
    integration = get_weaviate_integration()
    return integration.search_roasts_semantic(query, limit)
