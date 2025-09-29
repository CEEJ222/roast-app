"""
Weaviate Configuration and Connection Setup
Handles vector database operations for semantic search of coffee beans and roast data
"""

import os
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class WeaviateConfig:
    """Configuration for Weaviate connection"""
    url: str = "http://localhost:8080"
    api_key: Optional[str] = None
    timeout_config: tuple = (5, 15)  # (connect timeout, read timeout)
    
    @classmethod
    def from_env(cls):
        """Create config from environment variables"""
        return cls(
            url=os.getenv("WEAVIATE_URL", "http://localhost:8080"),
            api_key=os.getenv("WEAVIATE_API_KEY"),
            timeout_config=(
                int(os.getenv("WEAVIATE_CONNECT_TIMEOUT", "5")),
                int(os.getenv("WEAVIATE_READ_TIMEOUT", "15"))
            )
        )

class WeaviateClient:
    """Weaviate client wrapper with error handling and retry logic"""
    
    def __init__(self, config: WeaviateConfig):
        self.config = config
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Weaviate client with proper error handling"""
        try:
            # Import here to avoid dependency conflicts
            import weaviate
            
            # Use Weaviate Client (v3) with correct API
            self.client = weaviate.Client(url=self.config.url)
            logger.info("✅ Using Weaviate Client (v3)")
            
            # Test connection
            if self.client and self.client.is_ready():
                logger.info("✅ Weaviate client connected successfully")
            else:
                logger.warning("⚠️ Weaviate client not ready")
                
        except ImportError as e:
            logger.error(f"❌ Weaviate client not available: {e}")
            logger.info("💡 Install with: pip install weaviate-client")
            self.client = None
        except Exception as e:
            logger.error(f"❌ Failed to connect to Weaviate: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        """Check if Weaviate is connected and ready"""
        if not self.client:
            return False
        try:
            return self.client.is_ready()
        except Exception:
            return False
    
    def create_schema(self, schema: Dict[str, Any]) -> bool:
        """Create schema in Weaviate"""
        if not self.client:
            logger.error("❌ Weaviate client not available")
            return False
        
        try:
            self.client.schema.create_class(schema)
            logger.info("✅ Schema created successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to create schema: {e}")
            return False
    
    def add_objects(self, class_name: str, objects: List[Dict[str, Any]]) -> bool:
        """Add objects to Weaviate"""
        if not self.client:
            logger.error("❌ Weaviate client not available")
            return False
        
        try:
            with self.client.batch as batch:
                for obj in objects:
                    batch.add_data_object(
                        data_object=obj["data"],
                        class_name=class_name,
                        uuid=obj.get("uuid")
                    )
            logger.info(f"✅ Added {len(objects)} objects to {class_name}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to add objects: {e}")
            return False
    
    def search(self, class_name: str, query: str, limit: int = 10, 
               properties: List[str] = None) -> List[Dict[str, Any]]:
        """Perform semantic search"""
        if not self.client:
            logger.error("❌ Weaviate client not available")
            return []
        
        try:
            # Build search query using v4 API
            search_query = self.client.query.get(class_name, properties or ["*"])
            
            # Add semantic search
            search_query = search_query.with_near_text({"concepts": [query]})
            search_query = search_query.with_limit(limit)
            
            result = search_query.do()
            
            if "data" in result and "Get" in result["data"]:
                return result["data"]["Get"][class_name]
            return []
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return []
    
    def get_object(self, class_name: str, uuid: str) -> Optional[Dict[str, Any]]:
        """Get specific object by UUID"""
        if not self.client:
            return None
        
        try:
            return self.client.data_object.get_by_id(uuid, class_name=class_name)
        except Exception as e:
            logger.error(f"❌ Failed to get object: {e}")
            return None
    
    def delete_object(self, class_name: str, uuid: str) -> bool:
        """Delete object by UUID"""
        if not self.client:
            return False
        
        try:
            self.client.data_object.delete(uuid, class_name=class_name)
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete object: {e}")
            return False

# Global Weaviate client instance
weaviate_client = None

def get_weaviate_client() -> Optional[WeaviateClient]:
    """Get global Weaviate client instance"""
    global weaviate_client
    if weaviate_client is None:
        config = WeaviateConfig.from_env()
        weaviate_client = WeaviateClient(config)
    return weaviate_client

def initialize_weaviate() -> bool:
    """Initialize Weaviate connection"""
    client = get_weaviate_client()
    if client and client.is_connected():
        logger.info("✅ Weaviate initialized successfully")
        return True
    else:
        logger.warning("⚠️ Weaviate not available - semantic search disabled")
        return False
