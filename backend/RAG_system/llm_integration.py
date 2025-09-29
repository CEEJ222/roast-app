"""
DeepSeek LLM Integration for Roasting Copilot

This module provides LLM-powered roasting advice using DeepSeek's free API.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

class DeepSeekRoastingCopilot:
    def __init__(self):
        """Initialize DeepSeek client"""
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize DeepSeek client with API key"""
        try:
            # DeepSeek uses OpenAI-compatible API
            self.client = OpenAI(
                api_key=os.getenv("DEEPSEEK_API_KEY", "sk-your-deepseek-key-here"),
                base_url="https://api.deepseek.com/v1"
            )
            logger.info("✅ DeepSeek LLM client initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize DeepSeek client: {e}")
            self.client = None
    
    def get_pre_roast_advice(self, 
                           roast_level: str, 
                           bean_profile: Dict[str, Any],
                           environmental_conditions: Optional[Dict[str, Any]] = None,
                           historical_roasts: int = 0) -> Dict[str, Any]:
        """
        Get LLM-powered pre-roast advice for FreshRoast SR540/SR800
        """
        if not self.client:
            return self._get_fallback_advice(roast_level)
        
        try:
            # Build context for the LLM
            context = self._build_roasting_context(
                roast_level, bean_profile, environmental_conditions, historical_roasts
            )
            
            # Create the prompt
            prompt = self._create_pre_roast_prompt(context)
            
            # Call DeepSeek API
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert coffee roasting AI specialized in FreshRoast SR540 and SR800 roasters. Provide specific, actionable advice for heat/fan settings, timing, and techniques."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse the response
            llm_response = response.choices[0].message.content
            
            return self._parse_llm_response(llm_response, roast_level)
            
        except Exception as e:
            logger.error(f"❌ DeepSeek API error: {e}")
            return self._get_fallback_advice(roast_level)
    
    def get_during_roast_advice(self, 
                              roast_progress: Dict[str, Any],
                              user_question: str) -> str:
        """
        Get real-time roasting advice during the roast
        """
        if not self.client:
            return "I'm having trouble connecting to my AI brain right now. Please check your roast progress manually."
        
        try:
            context = self._build_during_roast_context(roast_progress)
            
            prompt = f"""
            Current roast status:
            - Elapsed time: {context.get('elapsed_time', 'Unknown')} minutes
            - Current phase: {context.get('current_phase', 'Unknown')}
            - Recent events: {context.get('recent_events', 'None')}
            - Bean type: {context.get('bean_type', 'Unknown')}
            - Target roast level: {context.get('target_roast_level', 'Unknown')}
            
            User question: {user_question}
            
            Provide specific FreshRoast SR540/SR800 advice for this situation.
            """
            
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a real-time coffee roasting coach for FreshRoast SR540/SR800. Provide immediate, specific advice for heat/fan adjustments and timing."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.8,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"❌ DeepSeek during-roast error: {e}")
            return "I'm having trouble providing real-time advice. Please check your roast progress and adjust heat/fan as needed."
    
    def _build_roasting_context(self, 
                              roast_level: str, 
                              bean_profile: Dict[str, Any],
                              environmental_conditions: Optional[Dict[str, Any]],
                              historical_roasts: int) -> Dict[str, Any]:
        """Build context for LLM"""
        context = {
            "roast_level": roast_level,
            "bean_type": bean_profile.get("name", "Unknown"),
            "bean_origin": bean_profile.get("origin", "Unknown"),
            "bean_process": bean_profile.get("process", "Unknown"),
            "historical_roasts": historical_roasts,
            "environmental_conditions": environmental_conditions or {}
        }
        return context
    
    def _create_pre_roast_prompt(self, context: Dict[str, Any]) -> str:
        """Create prompt for pre-roast planning"""
        return f"""
        I'm about to start a coffee roast with my FreshRoast SR800. Please provide specific advice:

        Bean Details:
        - Type: {context['bean_type']}
        - Origin: {context['bean_origin']}
        - Process: {context['bean_process']}
        - Target roast level: {context['roast_level']}

        My Experience:
        - Historical roasts: {context['historical_roasts']}

        Environmental Conditions:
        - Temperature: {context['environmental_conditions'].get('temperature', 'Unknown')}°C
        - Humidity: {context['environmental_conditions'].get('humidity', 'Unknown')}%

        Please provide:
        1. Initial heat/fan settings (1-8 scale)
        2. Expected timing for first crack
        3. Key things to watch for
        4. Specific FreshRoast SR800 techniques
        5. Environmental adjustments if needed

        Format your response with clear sections and specific recommendations.
        """
    
    def _build_during_roast_context(self, roast_progress: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for during-roast advice"""
        return {
            "elapsed_time": roast_progress.get("elapsed_time", 0),
            "current_phase": roast_progress.get("current_phase", "Unknown"),
            "recent_events": roast_progress.get("recent_events", []),
            "bean_type": roast_progress.get("bean_type", "Unknown"),
            "target_roast_level": roast_progress.get("target_roast_level", "Unknown")
        }
    
    def _parse_llm_response(self, response: str, roast_level: str) -> Dict[str, Any]:
        """Parse LLM response into structured format"""
        # Extract key information from LLM response
        lines = response.split('\n')
        
        # Try to extract heat/fan settings
        heat_setting = "6"  # Default
        fan_setting = "4"   # Default
        estimated_time = 12.0  # Default
        
        for line in lines:
            if "heat" in line.lower() and any(char.isdigit() for char in line):
                # Extract number from heat line
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    heat_setting = numbers[0]
            if "fan" in line.lower() and any(char.isdigit() for char in line):
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    fan_setting = numbers[0]
            if "time" in line.lower() and any(char.isdigit() for char in line):
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    estimated_time = float(numbers[0])
        
        return {
            "roast_level": roast_level,
            "estimated_time": estimated_time,
            "initial_heat": int(heat_setting),
            "initial_fan": int(fan_setting),
            "strategy": f"LLM-powered FreshRoast strategy for {roast_level} roast",
            "recommendations": [
                f"Start with Heat {heat_setting}, Fan {fan_setting}",
                "Monitor bean movement and color changes",
                "Listen for first crack around 8-12 minutes",
                "Adjust heat/fan based on roast progression",
                "Use the glass chamber to watch color development"
            ],
            "llm_advice": response
        }
    
    def _get_fallback_advice(self, roast_level: str) -> Dict[str, Any]:
        """Fallback advice when LLM is not available"""
        fallback_configs = {
            "Light": {"heat": 7, "fan": 3, "time": 10},
            "City": {"heat": 6, "fan": 4, "time": 12},
            "City+": {"heat": 6, "fan": 4, "time": 14},
            "Full City": {"heat": 5, "fan": 5, "time": 16},
            "Dark": {"heat": 5, "fan": 6, "time": 18}
        }
        
        config = fallback_configs.get(roast_level, fallback_configs["City"])
        
        return {
            "roast_level": roast_level,
            "estimated_time": config["time"],
            "initial_heat": config["heat"],
            "initial_fan": config["fan"],
            "strategy": f"Fallback FreshRoast strategy for {roast_level} roast",
            "recommendations": [
                f"Start with Heat {config['heat']}, Fan {config['fan']}",
                "Monitor bean movement and color changes",
                "Listen for first crack around 8-12 minutes",
                "Adjust heat/fan based on roast progression"
            ],
            "llm_advice": "LLM temporarily unavailable - using fallback recommendations"
        }

# Global instance
llm_copilot = DeepSeekRoastingCopilot()
