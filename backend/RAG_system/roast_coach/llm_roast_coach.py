"""
LLM-Powered Roast Coach
Provides intelligent roasting guidance based on bean characteristics
"""

import logging
from typing import Dict, Any, Optional, List
from RAG_system.llm_integration import llm_copilot

logger = logging.getLogger(__name__)

class LLMRoastCoach:
    """
    Uses LLM to provide intelligent roasting guidance based on bean characteristics
    """
    
    def __init__(self):
        self.llm = llm_copilot
    
    def get_roast_guidance(self, bean_characteristics: Dict[str, Any], machine_type: str = "SR800") -> Dict[str, Any]:
        """
        Get comprehensive roasting guidance based on bean characteristics and FreshRoast machine type
        """
        try:
            # Format characteristics for the prompt
            char_desc = self._format_characteristics(bean_characteristics)
            
            prompt = f"""
You are an expert coffee roaster with 20+ years of experience, specializing in FreshRoast SR540 and SR800 machines.
Provide specific roasting guidance for the following coffee bean, considering the specified FreshRoast machine.

FreshRoast Machine Type: {machine_type} (Options: SR800, SR540, SR800 + extension tube, SR540 + extension tube)
Machine Characteristics:
- SR800: Larger capacity, requires more heat/fan for same roast time
- SR540: Smaller capacity, more sensitive to heat changes
- Extension tubes: Increase chamber size, require higher heat/fan settings
- Heat and Fan settings: 0-9 scale (0=off, 9=maximum)

CRITICAL: Fan speed affects temperature OPPOSITELY:
- HIGHER fan speed = MORE cooling = LOWER temperature
- LOWER fan speed = LESS cooling = HIGHER temperature
- If temperature is too high, INCREASE fan speed or DECREASE heat
- If temperature is too low, DECREASE fan speed or INCREASE heat

Bean Characteristics:
{char_desc}

Provide comprehensive roasting guidance in this JSON format.
For 'initial_heat' and 'fan_speed', use ONLY numerical values from 0-9.
{{
    "roast_profile": {{
        "recommended_levels": ["City", "City+", "Full City"],
        "total_time": "10-12 minutes",
        "development_ratio": "0.20-0.25"
    }},
    "heat_settings": {{
        "initial_heat": "4", 
        "fan_speed": "4",
        "notes": "FreshRoast-specific guidance for {machine_type}. Start conservatively and increase heat gradually if needed. Watch for even bean movement."
    }},
    "roasting_timeline": {{
        "drying_phase": "0-4 minutes: Watch for yellowing",
        "maillard_phase": "4-8 minutes: Expect browning",
        "first_crack": "8-10 minutes: Listen carefully",
        "development": "10-12 minutes: Control development"
    }},
    "key_watch_points": [
        "Monitor bean movement during drying",
        "Listen for first crack around 8-10 minutes",
        "Watch for even color development",
        "Adjust heat/fan based on bean behavior"
    ],
    "expected_flavors": [
        "Bright acidity",
        "Floral notes"
    ],
    "troubleshooting": {{
        "stalling_roast": "Increase heat by 1-2 levels",
        "too_fast": "Decrease heat by 1-2 levels or increase fan",
        "scorching": "Reduce heat, increase fan",
        "uneven_roast": "Check bean agitation, adjust fan speed"
    }}
}}
Return ONLY valid JSON, no other text.
"""

            # Use the existing LLM client to generate response
            model_name = self.llm.primary_model
            response = self.llm.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are an expert coffee roaster with 20+ years of experience."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            response = response.choices[0].message.content
            
            # Parse JSON response
            import json
            try:
                guidance = json.loads(response.strip())
                logger.info("LLM generated roast guidance successfully")
                return {
                    "success": True,
                    "guidance": guidance,
                    "bean_characteristics": bean_characteristics
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM guidance response: {e}")
                return {
                    "success": False,
                    "error": "Failed to parse LLM guidance response",
                    "bean_characteristics": bean_characteristics
                }
                
        except Exception as e:
            logger.error(f"Error in LLM roast coaching: {e}")
            return {
                "success": False,
                "error": str(e),
                "bean_characteristics": bean_characteristics
            }
    
    def get_realtime_coaching(self, current_roast_data: Dict[str, Any], bean_characteristics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get real-time coaching advice during roasting
        """
        try:
            # Format current roast data
            roast_status = self._format_roast_status(current_roast_data)
            char_desc = self._format_characteristics(bean_characteristics)
            
            prompt = f"""
You are an expert coffee roaster providing real-time coaching during a roast.

IMPORTANT: Coffee roasts typically take 8-20 minutes total. Never recommend roast times longer than 25 minutes.

CRITICAL: Fan speed affects temperature OPPOSITELY:
- HIGHER fan speed = MORE cooling = LOWER temperature
- LOWER fan speed = LESS cooling = HIGHER temperature
- If temperature is too high, INCREASE fan speed or DECREASE heat
- If temperature is too low, DECREASE fan speed or INCREASE heat

Current Roast Status:
{roast_status}

Bean Characteristics:
{char_desc}

Provide real-time coaching in this JSON format:
{{
    "current_advice": "What the roaster should do right now",
    "heat_adjustment": "Increase/decrease heat and why",
    "fan_adjustment": "Increase/decrease fan and why (remember: higher fan = more cooling)",
    "next_milestone": "What to watch for next",
    "time_estimate": "How much time until next phase (keep under 25 minutes total)",
    "warning_signs": ["Signs of problems to watch for"],
    "success_indicators": ["Signs that roast is going well"]
}}

Be specific and actionable. Consider the current roast phase and bean characteristics. Remember: typical coffee roast times are 8-20 minutes.

IMPORTANT: Keep responses concise and direct. Avoid unnecessary fluff or verbose explanations. Focus on what the roaster needs to do right now.
"""

            # Use the existing LLM client to generate response
            model_name = self.llm.primary_model
            response = self.llm.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are an expert coffee roaster with 20+ years of experience."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            response = response.choices[0].message.content
            
            # Parse JSON response
            import json
            try:
                coaching = json.loads(response.strip())
                
                # Validate fan advice for correctness
                coaching = self._validate_fan_advice(coaching)
                
                logger.info("LLM generated real-time coaching successfully")
                return {
                    "success": True,
                    "coaching": coaching,
                    "roast_data": current_roast_data,
                    "bean_characteristics": bean_characteristics
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM coaching response: {e}")
                return {
                    "success": False,
                    "error": "Failed to parse LLM coaching response",
                    "roast_data": current_roast_data,
                    "bean_characteristics": bean_characteristics
                }
                
        except Exception as e:
            logger.error(f"Error in real-time coaching: {e}")
            return {
                "success": False,
                "error": str(e),
                "roast_data": current_roast_data,
                "bean_characteristics": bean_characteristics
            }
    
    def _format_characteristics(self, characteristics: Dict[str, Any]) -> str:
        """Format bean characteristics for the prompt"""
        formatted = []
        for key, value in characteristics.items():
            if value is not None and value != "":
                formatted.append(f"- {key}: {value}")
        return "\n".join(formatted) if formatted else "No characteristics available"
    
    def _format_roast_status(self, roast_data: Dict[str, Any]) -> str:
        """Format current roast data for the prompt"""
        status = []
        for key, value in roast_data.items():
            if value is not None:
                status.append(f"- {key}: {value}")
        return "\n".join(status) if status else "No roast data available"
    
    def _validate_fan_advice(self, coaching: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and correct fan advice to ensure it's physically correct"""
        fan_advice = coaching.get("fan_adjustment", "")
        
        # Check for common incorrect patterns
        incorrect_patterns = [
            ("reduce fan", "increase fan", "to lower temperature"),
            ("decrease fan", "increase fan", "to cool down"),
            ("lower fan", "increase fan", "for cooling")
        ]
        
        for incorrect, correct, reason in incorrect_patterns:
            if incorrect in fan_advice.lower() and "temperature" in fan_advice.lower():
                logger.warning(f"Corrected incorrect fan advice: {fan_advice}")
                coaching["fan_adjustment"] = fan_advice.replace(incorrect, correct)
                break
        
        return coaching

# Global instance
_llm_roast_coach_instance: Optional[LLMRoastCoach] = None

def get_llm_roast_coach() -> LLMRoastCoach:
    """Get or create the global LLM roast coach instance"""
    global _llm_roast_coach_instance
    if _llm_roast_coach_instance is None:
        _llm_roast_coach_instance = LLMRoastCoach()
    return _llm_roast_coach_instance
