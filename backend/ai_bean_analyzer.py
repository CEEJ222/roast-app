"""
AI-Powered Bean Profile Analyzer
Uses vector embeddings and AI analysis to create comprehensive bean profiles
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from RAG_system.weaviate.weaviate_integration import get_weaviate_integration
from RAG_system.weaviate.weaviate_embeddings import get_bean_embedder

logger = logging.getLogger(__name__)

class AIBeanAnalyzer:
    """AI-powered bean profile analyzer using vector embeddings"""
    
    def __init__(self):
        self.weaviate = get_weaviate_integration()
        self.embedder = get_bean_embedder()
    
    def analyze_bean_description(self, description: str, user_id: str) -> Dict[str, Any]:
        """
        Analyze a bean description using AI and vector similarity
        """
        try:
            # Generate embedding for the description
            # Create a temporary bean profile for embedding
            temp_profile = {"notes": description, "name": "temp"}
            embedding = self.embedder.embed_bean_profile(temp_profile)
            
            # Search for similar beans in the vector database
            similar_beans = self.weaviate.search_beans_semantic(description, limit=5)
            
            # Extract characteristics using AI analysis
            characteristics = self._extract_characteristics(description, similar_beans)
            
            # Generate recommendations based on similar beans
            recommendations = self._generate_recommendations(similar_beans)
            
            return {
                "success": True,
                "bean_profile": {
                    "name": characteristics.get("name", "Unknown Coffee"),
                    "origin": characteristics.get("origin"),
                    "variety": characteristics.get("variety"),
                    "process_method": characteristics.get("process_method"),
                    "bean_type": characteristics.get("bean_type", "Regular"),
                    "recommended_roast_levels": characteristics.get("recommended_roast_levels", ["City+"]),
                    "cupping_score": characteristics.get("cupping_score"),
                    "flavor_notes": characteristics.get("flavor_notes", []),
                    "body_intensity": characteristics.get("body_intensity", 0),
                    "acidity_intensity": characteristics.get("acidity_intensity", 0),
                    "floral_intensity": characteristics.get("floral_intensity", 0),
                    "honey_intensity": characteristics.get("honey_intensity", 0),
                    "sugars_intensity": characteristics.get("sugars_intensity", 0),
                    "caramel_intensity": characteristics.get("caramel_intensity", 0),
                    "fruits_intensity": characteristics.get("fruits_intensity", 0),
                    "citrus_intensity": characteristics.get("citrus_intensity", 0),
                    "berry_intensity": characteristics.get("berry_intensity", 0),
                    "cocoa_intensity": characteristics.get("cocoa_intensity", 0),
                    "nuts_intensity": characteristics.get("nuts_intensity", 0),
                    "rustic_intensity": characteristics.get("rustic_intensity", 0),
                    "spice_intensity": characteristics.get("spice_intensity", 0),
                    "notes": description,
                    "supplier_name": "AI Analysis",
                    "supplier_url": "",
                    "user_id": user_id,
                    "profile_completeness": "enhanced",
                    "ai_generated": True,
                    "similar_beans": similar_beans,
                    "recommendations": recommendations
                }
            }
            
        except Exception as e:
            logger.error(f"AI bean analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "bean_profile": {
                    "name": "Analysis Failed",
                    "notes": f"AI analysis failed: {str(e)}",
                    "user_id": user_id,
                    "ai_generated": True
                }
            }
    
    def _extract_characteristics(self, description: str, similar_beans: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract bean characteristics using AI analysis"""
        
        # Initialize characteristics with defaults
        characteristics = {
            "name": "AI Analyzed Coffee",
            "origin": None,
            "variety": None,
            "process_method": None,
            "bean_type": "Regular",
            "recommended_roast_levels": ["City+"],
            "cupping_score": None,
            "flavor_notes": [],
            "body_intensity": 0,
            "acidity_intensity": 0,
            "floral_intensity": 0,
            "honey_intensity": 0,
            "sugars_intensity": 0,
            "caramel_intensity": 0,
            "fruits_intensity": 0,
            "citrus_intensity": 0,
            "berry_intensity": 0,
            "cocoa_intensity": 0,
            "nuts_intensity": 0,
            "rustic_intensity": 0,
            "spice_intensity": 0
        }
        
        # Extract origin from description
        origins = ["Ethiopia", "Colombia", "Guatemala", "Costa Rica", "Kenya", "Brazil", "Peru", "Honduras", "Nicaragua", "El Salvador", "Panama", "Mexico", "Rwanda", "Burundi", "Tanzania", "Uganda", "Yemen", "Indonesia", "Sumatra", "Java", "Sulawesi", "Timor", "India", "Laos", "Vietnam", "Thailand", "Myanmar", "Papua New Guinea"]
        for origin in origins:
            if origin.lower() in description.lower():
                characteristics["origin"] = origin
                break
        
        # Extract variety from description
        varieties = ["Bourbon", "Typica", "Caturra", "Catuai", "Pacamara", "Maragogype", "Geisha", "Gesha", "SL28", "SL34", "Heirloom", "Ateng", "Jember", "Tim Tim", "Modern Hybrids", "Pacamara", "Villa Sarchi", "Villa Lobos"]
        for variety in varieties:
            if variety.lower() in description.lower():
                characteristics["variety"] = variety
                break
        
        # Extract process method
        if "natural" in description.lower() or "dry process" in description.lower():
            characteristics["process_method"] = "Natural"
        elif "washed" in description.lower() or "wet process" in description.lower():
            characteristics["process_method"] = "Washed"
        elif "honey" in description.lower():
            characteristics["process_method"] = "Honey"
        elif "semi-washed" in description.lower():
            characteristics["process_method"] = "Semi-Washed"
        elif "anaerobic" in description.lower():
            characteristics["process_method"] = "Anaerobic"
        elif "carbonic maceration" in description.lower():
            characteristics["process_method"] = "Carbonic Maceration"
        
        # Extract bean type
        if "peaberry" in description.lower():
            characteristics["bean_type"] = "Peaberry"
        elif "maragogype" in description.lower():
            characteristics["bean_type"] = "Maragogype"
        elif "mixed" in description.lower():
            characteristics["bean_type"] = "Mixed"
        
        # Extract roast level recommendations
        roast_levels = []
        if "city" in description.lower() and "full city" in description.lower():
            roast_levels = ["City", "City+", "Full City", "Full City+"]
        elif "city+" in description.lower():
            roast_levels = ["City+", "Full City"]
        elif "full city" in description.lower():
            roast_levels = ["Full City", "Full City+"]
        else:
            roast_levels = ["City+"]
        characteristics["recommended_roast_levels"] = roast_levels
        
        # Extract flavor characteristics using keyword analysis
        flavor_keywords = {
            "floral": ["floral", "flower", "jasmine", "lavender", "rose"],
            "honey": ["honey", "sweet", "syrupy"],
            "sugars": ["sugar", "sweet", "caramel", "molasses"],
            "caramel": ["caramel", "toffee", "butterscotch"],
            "fruits": ["fruit", "berry", "cherry", "apple", "peach", "plum"],
            "citrus": ["citrus", "lemon", "orange", "lime", "grapefruit"],
            "berry": ["berry", "blueberry", "strawberry", "blackberry"],
            "cocoa": ["cocoa", "chocolate", "cacao"],
            "nuts": ["nut", "almond", "hazelnut", "walnut"],
            "rustic": ["rustic", "earthy", "woody", "tobacco"],
            "spice": ["spice", "cinnamon", "clove", "cardamom", "nutmeg"]
        }
        
        for flavor, keywords in flavor_keywords.items():
            intensity = 0
            for keyword in keywords:
                if keyword in description.lower():
                    intensity += 1
            characteristics[f"{flavor}_intensity"] = min(5, intensity)
        
        # Extract body and acidity
        if "full body" in description.lower() or "heavy body" in description.lower():
            characteristics["body_intensity"] = 4
        elif "light body" in description.lower():
            characteristics["body_intensity"] = 2
        else:
            characteristics["body_intensity"] = 3
        
        if "bright" in description.lower() or "acidic" in description.lower():
            characteristics["acidity_intensity"] = 4
        elif "low acid" in description.lower():
            characteristics["acidity_intensity"] = 2
        else:
            characteristics["acidity_intensity"] = 3
        
        # Extract cupping score if mentioned
        import re
        score_match = re.search(r'(\d+\.?\d*)\s*(?:score|points?)', description.lower())
        if score_match:
            characteristics["cupping_score"] = float(score_match.group(1))
        
        # Use similar beans to enhance characteristics
        if similar_beans:
            # Average characteristics from similar beans
            avg_body = sum(bean.get("body_intensity", 3) for bean in similar_beans) / len(similar_beans)
            avg_acidity = sum(bean.get("acidity_intensity", 3) for bean in similar_beans) / len(similar_beans)
            
            characteristics["body_intensity"] = round(avg_body, 1)
            characteristics["acidity_intensity"] = round(avg_acidity, 1)
        
        return characteristics
    
    def _generate_recommendations(self, similar_beans: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on similar beans"""
        recommendations = []
        
        if not similar_beans:
            recommendations.append("This is a new bean type - start with standard roast profile")
            recommendations.append("Monitor first crack timing closely")
            return recommendations
        
        # Analyze similar beans for recommendations
        successful_roasts = [bean for bean in similar_beans if bean.get("overall_rating", 0) >= 7]
        
        if successful_roasts:
            avg_roast_time = sum(bean.get("roast_time", 12) for bean in successful_roasts) / len(successful_roasts)
            recommendations.append(f"Similar beans roast well in {avg_roast_time:.1f} minutes")
            
            if any("floral" in str(bean.get("flavor_notes", [])).lower() for bean in successful_roasts):
                recommendations.append("Light roast recommended to preserve floral notes")
            
            if any("chocolate" in str(bean.get("flavor_notes", [])).lower() for bean in successful_roasts):
                recommendations.append("Medium roast recommended for chocolate development")
        else:
            recommendations.append("Start with City+ roast level")
            recommendations.append("Monitor temperature closely during first crack")
        
        return recommendations

# Global analyzer instance
ai_analyzer = AIBeanAnalyzer()

def get_ai_analyzer() -> AIBeanAnalyzer:
    """Get global AI analyzer instance"""
    return ai_analyzer
