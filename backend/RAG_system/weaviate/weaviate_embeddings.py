"""
Vector Embedding Functions for Semantic Search
Handles text embedding generation and semantic search operations
"""

import os
import json
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    """Generate embeddings for semantic search using FastEmbed"""
    
    def __init__(self):
        self.fastembed_model = None
        self._initialize_fastembed()
    
    def _initialize_fastembed(self):
        """Initialize FastEmbed model"""
        try:
            from fastembed import TextEmbedding
            # Use a lightweight, free embedding model
            self.fastembed_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
            logger.info("✅ FastEmbed initialized successfully")
        except ImportError:
            logger.warning("⚠️ FastEmbed not installed - install with: pip install fastembed")
            self.fastembed_model = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize FastEmbed: {e}")
            self.fastembed_model = None
    
    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for a single text using FastEmbed"""
        if not self.fastembed_model:
            logger.warning("⚠️ FastEmbed not available - embeddings disabled")
            return None
        
        try:
            # Generate embedding using FastEmbed
            embeddings = list(self.fastembed_model.embed([text]))
            if embeddings:
                return embeddings[0].tolist()
            return None
        except Exception as e:
            logger.error(f"❌ Failed to generate FastEmbed embedding: {e}")
            return None
    
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        """Generate embeddings for multiple texts using FastEmbed"""
        if not self.fastembed_model:
            logger.warning("⚠️ FastEmbed not available - embeddings disabled")
            return [None] * len(texts)
        
        try:
            # Generate embeddings in batch for efficiency
            embeddings = list(self.fastembed_model.embed(texts))
            return [embedding.tolist() for embedding in embeddings]
        except Exception as e:
            logger.error(f"❌ Failed to generate batch embeddings: {e}")
            return [None] * len(texts)

class BeanProfileEmbedder:
    """Generate embeddings for bean profiles"""
    
    def __init__(self):
        self.embedder = EmbeddingGenerator()
    
    def create_searchable_text(self, bean_profile: Dict[str, Any]) -> str:
        """Create searchable text from bean profile"""
        parts = []
        
        # Basic info
        if bean_profile.get("name"):
            parts.append(f"Bean: {bean_profile['name']}")
        
        if bean_profile.get("supplier"):
            parts.append(f"Supplier: {bean_profile['supplier']}")
        
        if bean_profile.get("origin"):
            parts.append(f"Origin: {bean_profile['origin']}")
        
        if bean_profile.get("variety"):
            parts.append(f"Variety: {bean_profile['variety']}")
        
        if bean_profile.get("processing"):
            parts.append(f"Processing: {bean_profile['processing']}")
        
        # Flavor and aroma
        if bean_profile.get("flavor_notes"):
            parts.append(f"Flavors: {', '.join(bean_profile['flavor_notes'])}")
        
        if bean_profile.get("aroma_notes"):
            parts.append(f"Aromas: {', '.join(bean_profile['aroma_notes'])}")
        
        # Characteristics
        if bean_profile.get("body"):
            parts.append(f"Body: {bean_profile['body']}")
        
        if bean_profile.get("acidity"):
            parts.append(f"Acidity: {bean_profile['acidity']}")
        
        if bean_profile.get("sweetness"):
            parts.append(f"Sweetness: {bean_profile['sweetness']}")
        
        # Description
        if bean_profile.get("description"):
            parts.append(f"Description: {bean_profile['description']}")
        
        # Certifications
        if bean_profile.get("certifications"):
            parts.append(f"Certifications: {', '.join(bean_profile['certifications'])}")
        
        return " | ".join(parts)
    
    def embed_bean_profile(self, bean_profile: Dict[str, Any]) -> Optional[List[float]]:
        """Generate embedding for bean profile"""
        searchable_text = self.create_searchable_text(bean_profile)
        return self.embedder.generate_embedding(searchable_text)

class RoastProfileEmbedder:
    """Generate embeddings for roast profiles"""
    
    def __init__(self):
        self.embedder = EmbeddingGenerator()
    
    def create_searchable_text(self, roast_profile: Dict[str, Any]) -> str:
        """Create searchable text from roast profile"""
        parts = []
        
        # Basic info
        if roast_profile.get("name"):
            parts.append(f"Roast: {roast_profile['name']}")
        
        if roast_profile.get("roast_level"):
            parts.append(f"Level: {roast_profile['roast_level']}")
        
        # Roast parameters
        if roast_profile.get("roast_time"):
            parts.append(f"Time: {roast_profile['roast_time']} minutes")
        
        if roast_profile.get("charge_temp"):
            parts.append(f"Charge: {roast_profile['charge_temp']}°F")
        
        if roast_profile.get("drop_temp"):
            parts.append(f"Drop: {roast_profile['drop_temp']}°F")
        
        # Crack times
        if roast_profile.get("first_crack_time"):
            parts.append(f"First crack: {roast_profile['first_crack_time']} min")
        
        if roast_profile.get("second_crack_time"):
            parts.append(f"Second crack: {roast_profile['second_crack_time']} min")
        
        # Notes and characteristics
        if roast_profile.get("roast_notes"):
            parts.append(f"Notes: {roast_profile['roast_notes']}")
        
        if roast_profile.get("flavor_notes"):
            parts.append(f"Flavors: {', '.join(roast_profile['flavor_notes'])}")
        
        if roast_profile.get("aroma_notes"):
            parts.append(f"Aromas: {', '.join(roast_profile['aroma_notes'])}")
        
        # Ratings
        ratings = []
        if roast_profile.get("body_rating"):
            ratings.append(f"Body: {roast_profile['body_rating']}/10")
        if roast_profile.get("acidity_rating"):
            ratings.append(f"Acidity: {roast_profile['acidity_rating']}/10")
        if roast_profile.get("sweetness_rating"):
            ratings.append(f"Sweetness: {roast_profile['sweetness_rating']}/10")
        if roast_profile.get("overall_rating"):
            ratings.append(f"Overall: {roast_profile['overall_rating']}/10")
        
        if ratings:
            parts.append(f"Ratings: {', '.join(ratings)}")
        
        # Equipment
        if roast_profile.get("roaster_model"):
            parts.append(f"Roaster: {roast_profile['roaster_model']}")
        
        return " | ".join(parts)
    
    def embed_roast_profile(self, roast_profile: Dict[str, Any]) -> Optional[List[float]]:
        """Generate embedding for roast profile"""
        searchable_text = self.create_searchable_text(roast_profile)
        return self.embedder.generate_embedding(searchable_text)

class SemanticSearchEngine:
    """Semantic search engine for coffee data"""
    
    def __init__(self):
        self.bean_embedder = BeanProfileEmbedder()
        self.roast_embedder = RoastProfileEmbedder()
    
    def search_beans(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for beans using semantic similarity"""
        # This would integrate with Weaviate client
        # For now, return empty list as placeholder
        logger.info(f"🔍 Searching beans for: {query}")
        return []
    
    def search_roasts(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for roast profiles using semantic similarity"""
        logger.info(f"🔍 Searching roasts for: {query}")
        return []
    
    def find_similar_beans(self, bean_profile: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        """Find similar beans based on profile"""
        logger.info(f"🔍 Finding similar beans to: {bean_profile.get('name', 'Unknown')}")
        return []
    
    def find_similar_roasts(self, roast_profile: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        """Find similar roast profiles"""
        logger.info(f"🔍 Finding similar roasts to: {roast_profile.get('name', 'Unknown')}")
        return []
    
    def recommend_roast_profile(self, bean_profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Recommend roast profile for a bean"""
        logger.info(f"🔍 Recommending roast for: {bean_profile.get('name', 'Unknown')}")
        return None

# Global instances
bean_embedder = BeanProfileEmbedder()
roast_embedder = RoastProfileEmbedder()
search_engine = SemanticSearchEngine()

def get_bean_embedder() -> BeanProfileEmbedder:
    """Get global bean embedder instance"""
    return bean_embedder

def get_roast_embedder() -> RoastProfileEmbedder:
    """Get global roast embedder instance"""
    return roast_embedder

def get_search_engine() -> SemanticSearchEngine:
    """Get global search engine instance"""
    return search_engine
