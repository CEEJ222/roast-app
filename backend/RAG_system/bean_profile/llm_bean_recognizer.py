"""
LLM-Powered Bean Recognition System
Extracts roasting-relevant characteristics from any input using LLM intelligence
"""

import logging
from typing import Dict, Any, Optional
from RAG_system.llm_integration import llm_copilot

logger = logging.getLogger(__name__)

class LLMBeanRecognizer:
    """
    Uses LLM to intelligently extract bean characteristics for roasting
    """
    
    def __init__(self):
        self.llm = llm_copilot
    
    def recognize_bean_characteristics(self, input_text: str) -> Dict[str, Any]:
        """
        Use LLM to extract key roasting characteristics from any input
        """
        try:
            prompt = f"""
You are an expert coffee roaster analyzing bean characteristics for roasting guidance.

Input: {input_text}

Extract the key characteristics that affect roasting and return ONLY a JSON object with these fields:
- origin: country/region (e.g., "Kenya", "Ethiopia", "Colombia")
- process: processing method (e.g., "Natural", "Washed", "Honey", "Anaerobic")
- variety: coffee variety (e.g., "Bourbon", "Typica", "Geisha", "Peaberry", "SL28")
- altitude: altitude in meters if mentioned (e.g., 1800, 2000)
- density: bean density if mentioned ("high", "medium", "low")
- cupping_score: if mentioned (e.g., 87.5, 90)
- screen_size: if mentioned (e.g., "16-18", "15+")
- moisture_content: if mentioned (e.g., 11.5, 12.0)
- harvest_year: if mentioned (e.g., 2024, 2023)

If a field is not mentioned or unclear, use null.
Return ONLY valid JSON, no other text.
"""

            # Use configured models with fallback
            model_name = self.llm.primary_model
            response = self.llm.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are an expert coffee roaster analyzing bean characteristics."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500,
                timeout=30  # Add timeout to prevent hanging
            )
            response = response.choices[0].message.content
            
            # Parse JSON response
            import json
            try:
                # Clean the response - remove any markdown formatting and special characters
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]
                
                # Remove all $$ characters and special formatting
                cleaned_response = cleaned_response.replace('$$', '')
                # Remove specific patterns like $$\{$$ and $$\}$$
                cleaned_response = cleaned_response.replace('\\{$$', '{')
                cleaned_response = cleaned_response.replace('\\}$$', '}')
                # Remove any remaining special characters
                cleaned_response = cleaned_response.replace('\\{', '{')
                cleaned_response = cleaned_response.replace('\\}', '}')
                
                # Find the first { and last } to extract just the JSON
                start_idx = cleaned_response.find('{')
                end_idx = cleaned_response.rfind('}')
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    cleaned_response = cleaned_response[start_idx:end_idx+1]
                
                cleaned_response = cleaned_response.strip()
                
                logger.info(f"Raw LLM response: {response}")
                logger.info(f"Cleaned response: {cleaned_response}")
                
                characteristics = json.loads(cleaned_response)
                logger.info(f"LLM extracted characteristics: {characteristics}")
                return {
                    "success": True,
                    "characteristics": characteristics,
                    "raw_input": input_text
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                logger.error(f"Raw response: {response}")
                return {
                    "success": False,
                    "error": f"Failed to parse LLM response: {e}",
                    "raw_input": input_text
                }
                
        except Exception as e:
            logger.error(f"Error in LLM bean recognition: {e}")
            return {
                "success": False,
                "error": str(e),
                "raw_input": input_text
            }

# Global instance
_llm_bean_recognizer_instance: Optional[LLMBeanRecognizer] = None

def get_llm_bean_recognizer() -> LLMBeanRecognizer:
    """Get or create the global LLM bean recognizer instance"""
    global _llm_bean_recognizer_instance
    if _llm_bean_recognizer_instance is None:
        _llm_bean_recognizer_instance = LLMBeanRecognizer()
    return _llm_bean_recognizer_instance
