"""
DeepSeek LLM Integration for Roasting Copilot

This module provides LLM-powered roasting advice using DeepSeek's free API.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class DeepSeekRoastingCopilot:
    def __init__(self):
        """Initialize DeepSeek client"""
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize client with free models via OpenRouter"""
        try:
            # Check for API key
            api_key = os.getenv("OPENROUTER_API_KEY", os.getenv("DEEPSEEK_API_KEY"))
            if not api_key or api_key == "sk-your-openrouter-key-here":
                logger.warning("⚠️ No valid API key found for OpenRouter. LLM features will be disabled.")
                logger.info("💡 To enable AI features, set OPENROUTER_API_KEY environment variable")
                self.client = None
                return
            
            # Use OpenRouter with free models
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1"
            )
            self.primary_model = os.getenv("PRIMARY_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
            self.fallback_model = os.getenv("FALLBACK_MODEL", "google/gemini-flash-1.5:free")
            logger.info(f"✅ OpenRouter LLM client initialized with primary model: {self.primary_model}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenRouter client: {e}")
            self.client = None
    
    def get_pre_roast_advice(self, 
                           roast_level: str, 
                           bean_profile: Dict[str, Any],
                           environmental_conditions: Optional[Dict[str, Any]] = None,
                           historical_roasts: int = 0,
                           machine_info: Optional[Dict[str, Any]] = None,
                           user_units: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get LLM-powered pre-roast advice for FreshRoast SR540/SR800
        """
        if not self.client:
            return self._get_fallback_advice(roast_level, machine_info, bean_profile)
        
        try:
            # Build context for the LLM
            context = self._build_roasting_context(
                roast_level, bean_profile, environmental_conditions, historical_roasts, machine_info, user_units
            )
            
            # Create the prompt
            prompt = self._create_pre_roast_prompt(context)
            
            # Use configured models with fallback
            model_name = self.primary_model
            response = self.client.chat.completions.create(
                model=model_name,
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
                max_tokens=500,  # Reduced for faster response
                timeout=10  # Reduced timeout for faster initial response
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
            
            # Use configured models with fallback
            model_name = self.primary_model
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a real-time coffee roasting coach for FreshRoast SR540/SR800. Provide immediate, specific advice for heat/fan adjustments and timing. Use plain text only - NO LaTeX, NO math formatting, just regular text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.8,
                max_tokens=300,  # Reduced for faster response
                timeout=8  # Reduced timeout for during-roast advice
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"❌ DeepSeek during-roast error: {e}")
            return "I'm having trouble providing real-time advice. Please check your roast progress and adjust heat/fan as needed."
    
    def get_automatic_event_response(self, event_data: Dict[str, Any], roast_progress: Dict[str, Any]) -> Dict[str, Any]:
        """Get automatic AI response when events are logged"""
        if not self.client:
            return {
                "advice": "",
                "recommendations": [],
                "has_meaningful_advice": False
            }
        
        try:
            context = self._build_during_roast_context(roast_progress)
            context['last_event'] = event_data
            
            # Calculate temperature rate of rise and detect dangerous changes
            temp_analysis = self._analyze_temperature_change(event_data, context.get('recent_events', []))
            
            # Check for dangerous temperature spikes first - this applies to ALL events
            if temp_analysis['has_spike'] or temp_analysis['is_fast']:
                logger.warning(f"🚨 TEMPERATURE SPIKE DETECTED: {temp_analysis['rate_per_sec']:.1f}°F/sec!")
                # Generate urgent response for temperature spike
                spike_instructions = self._get_event_response_instructions(temp_analysis)
                
                prompt = f"""
                {spike_instructions}
                
                Current roast context:
                - Time: {context.get('elapsed_time', 'Unknown')} minutes
                - Current temperature: {event_data.get('temp_f', 'Unknown')}°F
                - Current settings: Heat {context.get('current_heat', 'Unknown')}, Fan {context.get('current_fan', 'Unknown')}
                - Bean profile: {context.get('bean_profile', 'Unknown')}
                
                Provide urgent, specific guidance. Be direct and actionable.
                """
                
                response = self.client.chat.completions.create(
                    model=self.primary_model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert coffee roaster providing URGENT guidance for dangerous temperature spikes. Be direct, specific, and urgent. Use plain text only."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.3,
                    max_tokens=150,
                    timeout=3
                )
                
                ai_response = response.choices[0].message.content
                logger.warning(f"🚨 URGENT TEMPERATURE SPIKE RESPONSE: {ai_response}")
                
                return {
                    "advice": ai_response,
                    "recommendations": [],
                    "has_meaningful_advice": True,
                    "event_type": "TEMPERATURE_SPIKE"
                }
            
            # Create specific prompt based on event type
            if event_data.get('kind') == 'SET':
                # Build environmental conditions string
                env_conditions = context.get('environmental_conditions', {})
                env_str = f"""
                - Ambient temperature: {env_conditions.get('temperature_f', 'Unknown')}°F
                - Humidity: {env_conditions.get('humidity_pct', 'Unknown')}%
                - Altitude: {env_conditions.get('elevation_ft', 'Unknown')}ft
                """ if env_conditions else ""
                
                # Add temperature analysis to prompt
                temp_warning = ""
                if temp_analysis['has_spike']:
                    temp_warning = f"""
                ⚠️ CRITICAL TEMPERATURE ALERT:
                - Rate of rise: {temp_analysis['rate_per_min']:.1f}°F/min ({temp_analysis['rate_per_sec']:.1f}°F/sec)
                - Previous temp: {temp_analysis['prev_temp']:.1f}°F at {temp_analysis['time_diff']:.0f} seconds ago
                - Current temp: {event_data.get('temp_f', 'N/A')}°F
                - Temperature jumped {temp_analysis['temp_change']:.1f}°F in {temp_analysis['time_diff']:.0f} seconds!
                
                THIS IS DANGEROUSLY FAST! Provide IMMEDIATE corrective action.
                """
                elif temp_analysis['is_fast']:
                    temp_warning = f"""
                ⚠️ Temperature rising quickly:
                - Rate of rise: {temp_analysis['rate_per_min']:.1f}°F/min ({temp_analysis['rate_per_sec']:.1f}°F/sec)
                - Previous temp: {temp_analysis['prev_temp']:.1f}°F
                - Current temp: {event_data.get('temp_f', 'N/A')}°F
                
                This may be too fast. Consider adjusting heat/fan.
                """
                elif temp_analysis['has_data']:
                    temp_warning = f"""
                Temperature change:
                - Rate of rise: {temp_analysis['rate_per_min']:.1f}°F/min
                - Previous temp: {temp_analysis['prev_temp']:.1f}°F
                - Current temp: {event_data.get('temp_f', 'N/A')}°F
                """
                
                prompt = f"""
                The user just logged their FreshRoast settings:
                - Heat: {event_data.get('heat_level', 'N/A')}
                - Fan: {event_data.get('fan_level', 'N/A')}
                - Temperature: {event_data.get('temp_f', 'N/A')}°F
                - Time: {context.get('elapsed_time', 'Unknown')} minutes
                - Current phase: {context.get('current_phase', 'Unknown')}
                - Target roast level: {context.get('target_roast_level', 'City')}
                
                {temp_warning}
                
                Environmental conditions:{env_str}
                
                INSTRUCTIONS:
                {self._get_event_response_instructions(temp_analysis)}
                
                Keep response under 3 sentences and be VERY SPECIFIC about what to adjust.
                """
            elif event_data.get('kind') in ['FIRST_CRACK', 'SECOND_CRACK', 'COOL']:
                milestone = event_data.get('kind').replace('_', ' ').lower()
                temp_display = self._format_event_temperature(event_data, roast_progress)
                prompt = f"""
                The user just marked {milestone}:
                - Time: {context.get('elapsed_time', 'Unknown')} minutes
                - Temperature: {temp_display}
                - Current phase: {context.get('current_phase', 'Unknown')}
                
                Provide brief congratulations and next steps for this milestone.
                """
            else:
                prompt = f"""
                The user just logged an event: {event_data.get('kind', 'Unknown')}
                - Time: {context.get('elapsed_time', 'Unknown')} minutes
                - Current phase: {context.get('current_phase', 'Unknown')}
                
                Provide brief guidance for this situation.
                """
            
            response = self.client.chat.completions.create(
                model=self.primary_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a real-time coffee roasting coach. Provide brief, encouraging feedback on roast events. Use plain text only - NO LaTeX, NO math formatting like $$, NO \\text{}, just regular text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.6,
                max_tokens=200,  # Reduced for faster response
                timeout=5  # Reduced timeout for automatic responses
            )
            
            ai_response = response.choices[0].message.content
            
            logger.info(f"🤖 LLM Response (first 200 chars): {ai_response[:200]}")
            
            # Parse the response for structured data
            parsed_response = self._parse_automatic_response(ai_response, event_data)
            logger.info(f"✅ Parsed response: has_meaningful_advice={parsed_response.get('has_meaningful_advice')}")
            return parsed_response
            
        except Exception as e:
            logger.error(f"Automatic event response error: {e}")
            # Return empty response - no need to acknowledge every event
            return {
                "advice": "",
                "recommendations": [],
                "has_meaningful_advice": False
            }
    
    def _analyze_temperature_change(self, current_event: Dict[str, Any], recent_events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze temperature rate of change to detect dangerous spikes"""
        current_temp = current_event.get('temp_f')
        current_time = current_event.get('t_offset_sec', 0)
        
        logger.info(f"🔍 Analyzing temperature change: current={current_temp}°F at t={current_time}s")
        logger.info(f"📊 Recent events count: {len(recent_events) if recent_events else 0}")
        
        # Default analysis result
        analysis = {
            'has_data': False,
            'has_spike': False,
            'is_fast': False,
            'rate_per_min': 0.0,
            'rate_per_sec': 0.0,
            'temp_change': 0.0,
            'time_diff': 0.0,
            'prev_temp': None
        }
        
        if not current_temp or not recent_events:
            logger.warning(f"⚠️ Cannot analyze: current_temp={current_temp}, recent_events={len(recent_events) if recent_events else 0}")
            return analysis
        
        # Find the most recent event with temperature data
        prev_event = None
        for event in reversed(recent_events):
            if event.get('temp_f') and event.get('t_offset_sec') != current_time:
                prev_event = event
                break
        
        if not prev_event:
            logger.warning(f"⚠️ No previous event with temperature found")
            return analysis
        
        prev_temp = prev_event.get('temp_f')
        prev_time = prev_event.get('t_offset_sec', 0)
        
        logger.info(f"📈 Previous event: {prev_temp}°F at t={prev_time}s")
        
        # Calculate rate of change
        time_diff = current_time - prev_time
        if time_diff <= 0:
            logger.warning(f"⚠️ Invalid time difference: {time_diff}s")
            return analysis
        
        temp_change = current_temp - prev_temp
        rate_per_sec = temp_change / time_diff
        rate_per_min = rate_per_sec * 60
        
        logger.info(f"📊 Rate of rise: {rate_per_min:.1f}°F/min ({rate_per_sec:.1f}°F/sec)")
        logger.info(f"🌡️ Change: {temp_change:.1f}°F over {time_diff:.0f}s")
        
        analysis.update({
            'has_data': True,
            'temp_change': temp_change,
            'time_diff': time_diff,
            'rate_per_sec': rate_per_sec,
            'rate_per_min': rate_per_min,
            'prev_temp': prev_temp,
            'current_temp': current_temp
        })
        
        # Detect dangerous spikes (>2°F/sec or >120°F/min)
        if abs(rate_per_sec) > 2.0:
            analysis['has_spike'] = True
            logger.warning(f"🚨 DANGEROUS SPIKE DETECTED: {rate_per_sec:.1f}°F/sec!")
        # Detect fast rise (>20°F/min)
        elif rate_per_min > 20.0:
            analysis['is_fast'] = True
            logger.warning(f"⚡ FAST RISE DETECTED: {rate_per_min:.1f}°F/min")
        else:
            logger.info(f"✅ Normal rate of rise")
        
        return analysis
    
    def _get_event_response_instructions(self, temp_analysis: Dict[str, Any]) -> str:
        """Get specific instructions based on temperature analysis"""
        if temp_analysis['has_spike']:
            return """
            CRITICAL: Temperature is rising DANGEROUSLY fast!
            - Tell user to IMMEDIATELY reduce heat by 2-3 levels OR increase fan by 2-3 levels
            - Explain this will cause scorching and tipping if not corrected NOW
            - Be urgent but calm - they need to act fast
            """
        elif temp_analysis['is_fast']:
            return """
            Temperature is rising too fast! This could cause scorching.
            - IMMEDIATELY reduce heat by 2 levels OR increase fan by 2 levels
            - Explain this rapid rise will cause uneven roasting and burnt flavors
            - Be urgent and specific about the risk
            """
        else:
            return """
            Only provide feedback if:
            1. Their current settings seem problematic for the roast phase
            2. Their temperature is unusually high/low for the time
            3. You have specific, actionable advice
            
            If everything looks normal, return ONLY "🔥 Settings logged" (no other text).
            This tells the frontend to NOT display a message.
            """
    
    def _parse_automatic_response(self, response: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse automatic response into structured format"""
        response_lower = response.strip().lower()
        
        # Check for generic/meaningless responses that should be silent
        generic_responses = [
            "🔥 settings logged",
            "settings logged",
            "event logged",
            "logged successfully",
            "continue monitoring",
            "good adjustment",
            "monitoring your roast"
        ]
        
        # If response is just a generic acknowledgment, stay silent
        if any(generic in response_lower for generic in generic_responses):
            # Check if there's actual advice beyond the generic phrase
            response_cleaned = response_lower
            for generic in generic_responses:
                response_cleaned = response_cleaned.replace(generic, "")
            
            # If less than 20 chars remain after removing generic phrases, it's meaningless
            if len(response_cleaned.strip().replace(".", "").replace("!", "")) < 20:
                logger.info(f"🔇 Generic response detected, staying silent: {response[:50]}")
                return {
                    "advice": "",
                    "recommendations": [],
                    "has_meaningful_advice": False,
                    "event_type": event_data.get('kind', 'Unknown')
                }
        
        lines = response.split('\n')
        recommendations = []
        
        # Look for bullet points or numbered lists
        for line in lines:
            line = line.strip()
            if line and line.startswith(('•', '-', '*', '1.', '2.', '3.')):
                import re
                clean_line = re.sub(r'^[•\-*]\s*|\d+\.\s*', '', line)
                if clean_line and len(clean_line) > 5:
                    recommendations.append(clean_line)
        
        # Check if recommendations are also generic
        generic_recs = ["continue monitoring bean movement", "watch for color changes", "continue monitoring your roast"]
        meaningful_recs = [rec for rec in recommendations if rec.lower() not in generic_recs]
        
        # If only generic recommendations, filter them out
        if meaningful_recs:
            recommendations = meaningful_recs
        elif not meaningful_recs and recommendations:
            # All recommendations are generic, so stay silent
            logger.info(f"🔇 Only generic recommendations, staying silent")
            return {
                "advice": "",
                "recommendations": [],
                "has_meaningful_advice": False,
                "event_type": event_data.get('kind', 'Unknown')
            }
        
        logger.info(f"✅ Meaningful advice detected with {len(recommendations)} specific recommendations")
        return {
            "advice": response,
            "recommendations": recommendations,
            "has_meaningful_advice": True,
            "event_type": event_data.get('kind', 'Unknown')
        }
    
    def _build_roasting_context(self, 
                              roast_level: str, 
                              bean_profile: Dict[str, Any],
                              environmental_conditions: Optional[Dict[str, Any]],
                              historical_roasts: int,
                              machine_info: Optional[Dict[str, Any]] = None,
                              user_units: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Build context for LLM"""
        logger.info(f"Building context with bean_profile: {bean_profile}")
        context = {
            "roast_level": roast_level,
            "bean_type": bean_profile.get("name", "Unknown"),
            "bean_origin": bean_profile.get("origin", "Unknown"),
            "bean_process": bean_profile.get("process_method", "Unknown"),
            "historical_roasts": historical_roasts,
            "environmental_conditions": environmental_conditions or {},
            "machine_info": machine_info or {},
            "user_units": user_units or {},
            
            # Bean Profile Characteristics
            "bean_variety": bean_profile.get("variety", "Unknown"),
            "bean_altitude": bean_profile.get("altitude_m", "Unknown"),
            "bean_screen_size": bean_profile.get("screen_size", "Unknown"),
            "bean_density": bean_profile.get("density_g_ml", "Unknown"),
            "bean_moisture": bean_profile.get("moisture_content_pct", "Unknown"),
            "bean_harvest_year": bean_profile.get("harvest_year", "Unknown"),
            "bean_cupping_score": bean_profile.get("cupping_score", "Unknown"),
            "bean_recommended_levels": bean_profile.get("recommended_roast_levels", []),
            "bean_flavor_notes": bean_profile.get("flavor_notes", "Unknown"),
            
            # Flavor Profile Intensities
            "bean_body_intensity": bean_profile.get("body_intensity", "Unknown"),
            "bean_acidity_intensity": bean_profile.get("acidity_intensity", "Unknown"),
            "bean_floral_intensity": bean_profile.get("floral_intensity", "Unknown"),
            "bean_fruits_intensity": bean_profile.get("fruits_intensity", "Unknown"),
            "bean_citrus_intensity": bean_profile.get("citrus_intensity", "Unknown"),
            "bean_berry_intensity": bean_profile.get("berry_intensity", "Unknown"),
            "bean_cocoa_intensity": bean_profile.get("cocoa_intensity", "Unknown"),
            "bean_caramel_intensity": bean_profile.get("caramel_intensity", "Unknown"),
            "bean_honey_intensity": bean_profile.get("honey_intensity", "Unknown"),
            "bean_sugars_intensity": bean_profile.get("sugars_intensity", "Unknown"),
            "bean_nuts_intensity": bean_profile.get("nuts_intensity", "Unknown"),
            "bean_spice_intensity": bean_profile.get("spice_intensity", "Unknown"),
            "bean_rustic_intensity": bean_profile.get("rustic_intensity", "Unknown")
        }
        return context
    
    def _create_pre_roast_prompt(self, context: Dict[str, Any]) -> str:
        """Create prompt for pre-roast planning"""
        machine_info = context.get('machine_info', {})
        machine_name = machine_info.get('name', 'FreshRoast SR800')
        has_extension = machine_info.get('has_extension', False)
        
        # Adjust recommendations based on machine setup
        if has_extension:
            extension_note = "I have an extension tube installed, which improves bean movement for more uniform roasting and allows for lower heat/fan settings due to increased chamber motion."
        else:
            extension_note = "I'm using the standard chamber without extension tube."
        
        return f"""
        I'm about to start a coffee roast with my {machine_name}. {extension_note} Please provide specific advice:

        Bean Details:
        - Name: {context['bean_type']}
        - Origin: {context['bean_origin']}
        - Process: {context['bean_process']}
        - Target roast level: {context['roast_level']} (stops BEFORE second crack)

        ROAST LEVEL DEFINITIONS:
        - Light/Cinnamon: Stops before first crack
        - City: Stops during first crack (8-10 minutes)
        - City+: Stops just after first crack ends (10-12 minutes)
        - Full City: Stops between first and second crack (12-14 minutes)
        - Dark: Can go into second crack (14+ minutes)
        
        Bean Profile Characteristics:
        - Variety: {context.get('bean_variety', 'Unknown')}
        - Altitude: {context.get('bean_altitude', 'Unknown')}
        - Screen Size: {context.get('bean_screen_size', 'Unknown')}
        - Density: {context.get('bean_density', 'Unknown')}
        - Moisture Content: {context.get('bean_moisture', 'Unknown')}%
        - Harvest Year: {context.get('bean_harvest_year', 'Unknown')}
        - Cupping Score: {context.get('bean_cupping_score', 'Unknown')}
        
        Flavor Profile:
        - Body Intensity: {context.get('bean_body_intensity', 'Unknown')}
        - Acidity Intensity: {context.get('bean_acidity_intensity', 'Unknown')}
        - Floral Notes: {context.get('bean_floral_intensity', 'Unknown')}
        - Fruity Notes: {context.get('bean_fruits_intensity', 'Unknown')}
        - Citrus Notes: {context.get('bean_citrus_intensity', 'Unknown')}
        - Berry Notes: {context.get('bean_berry_intensity', 'Unknown')}
        - Cocoa Notes: {context.get('bean_cocoa_intensity', 'Unknown')}
        - Caramel Notes: {context.get('bean_caramel_intensity', 'Unknown')}
        - Honey Notes: {context.get('bean_honey_intensity', 'Unknown')}
        - Sugar Notes: {context.get('bean_sugars_intensity', 'Unknown')}
        - Nuts Notes: {context.get('bean_nuts_intensity', 'Unknown')}
        - Spice Notes: {context.get('bean_spice_intensity', 'Unknown')}
        - Rustic Notes: {context.get('bean_rustic_intensity', 'Unknown')}
        
        Recommended Roast Levels: {context.get('bean_recommended_levels', 'Unknown')}
        Flavor Notes: {context.get('bean_flavor_notes', 'Unknown')}

        My Experience:
        - Historical roasts: {context['historical_roasts']}

        Environmental Conditions (Real Weather Data):
        - Temperature: {self._format_temperature_for_prompt(context)}
        - Humidity: {context['environmental_conditions'].get('humidity_pct', 'Unknown')}%
        - Pressure: {self._format_pressure_for_prompt(context)}
        - Altitude: {self._format_elevation_for_prompt(context)}
        - Location: {context['environmental_conditions'].get('resolved_address', 'Unknown')}

        CRITICAL: You MUST start with exactly: "For this {context['bean_type']} from {context['bean_origin']} with {context['bean_process']} processing"

        Give ONLY 2-3 concise points about THIS bean's roasting characteristics. NO SETTINGS. NO NUMBERS.

        ONLY discuss:
        - How this bean's altitude/process/variety affects roasting
        - What to watch for with this specific bean
        - Expected timing differences
        - How the extension tube (if present) affects this specific bean's roasting

        FORBIDDEN - DO NOT USE THESE WORDS/PHRASES:
        - "monitor closely", "adjust as needed", "carefully", "conservatively"
        - "medium heat", "medium-low", "410-420°F", temperature ranges
        - "color development", "flavor profile", "unbalanced"
        - "roast time management", "manage the roast time"
        - Second crack for {context['roast_level']} roast
        - ANY specific heat/fan numbers until we have roast data
        - Temperature values like 420, 410, etc.
        
        Keep it SHORT and SPECIFIC. Reference the actual bean data above.
        """
    
    def _format_temperature_for_prompt(self, context: Dict[str, Any]) -> str:
        """Format temperature based on user's preferred units"""
        user_units = context.get('user_units', {})
        env_conditions = context.get('environmental_conditions', {})
        
        temp_c = env_conditions.get('temperature_c')
        temp_f = env_conditions.get('temperature_f')
        
        if not temp_c and not temp_f:
            return 'Unknown'
        
        # Use user's preferred unit, default to Fahrenheit
        if user_units.get('temperature') == 'celsius':
            if temp_c:
                return f"{temp_c:.1f}°C"
            elif temp_f:
                # Convert F to C
                celsius = (temp_f - 32) * 5/9
                return f"{celsius:.1f}°C"
        else:
            if temp_f:
                return f"{temp_f:.1f}°F"
            elif temp_c:
                # Convert C to F
                fahrenheit = (temp_c * 9/5) + 32
                return f"{fahrenheit:.1f}°F"
        
        return 'Unknown'
    
    def _format_pressure_for_prompt(self, context: Dict[str, Any]) -> str:
        """Format pressure based on user's preferred units"""
        user_units = context.get('user_units', {})
        env_conditions = context.get('environmental_conditions', {})
        
        pressure_hpa = env_conditions.get('pressure_hpa')
        if not pressure_hpa:
            return 'Unknown'
        
        # Use user's preferred unit, default to hPa
        if user_units.get('temperature') == 'fahrenheit':  # US users prefer inHg
            inHg = pressure_hpa * 0.02953
            return f"{inHg:.2f} inHg"
        else:
            return f"{pressure_hpa:.0f} hPa"
    
    def _format_elevation_for_prompt(self, context: Dict[str, Any]) -> str:
        """Format elevation based on user's preferred units"""
        user_units = context.get('user_units', {})
        env_conditions = context.get('environmental_conditions', {})
        
        elevation_m = env_conditions.get('elevation_m')
        elevation_ft = env_conditions.get('elevation_ft')
        
        if not elevation_m and not elevation_ft:
            return 'Unknown'
        
        # Convert to float to handle string inputs
        try:
            elevation_m = float(elevation_m) if elevation_m else None
            elevation_ft = float(elevation_ft) if elevation_ft else None
        except (ValueError, TypeError):
            return 'Unknown'
        
        # Use user's preferred unit, default to feet
        if user_units.get('elevation') == 'meters':
            if elevation_m:
                return f"{elevation_m:.0f}m"
            elif elevation_ft:
                # Convert ft to m
                meters = elevation_ft * 0.3048
                return f"{meters:.0f}m"
        else:
            if elevation_ft:
                return f"{elevation_ft:.0f}ft"
            elif elevation_m:
                # Convert m to ft (1 meter = 3.28084 feet)
                feet = elevation_m * 3.28084
                return f"{feet:.0f}ft"
        
        return 'Unknown'
    
    def _format_event_temperature(self, event_data: Dict[str, Any], roast_progress: Dict[str, Any]) -> str:
        """Format temperature from event data based on user's preferred units"""
        user_units = roast_progress.get('user_units', {})
        temp_f = event_data.get('temp_f')
        
        if not temp_f:
            return 'Not recorded'
        
        # Use user's preferred unit, default to Fahrenheit
        if user_units.get('temperature') == 'celsius':
            celsius = (temp_f - 32) * 5/9
            return f"{celsius:.1f}°C"
        else:
            return f"{temp_f:.1f}°F"
    
    def _build_during_roast_context(self, roast_progress: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for during-roast advice"""
        return {
            "elapsed_time": roast_progress.get("elapsed_time", 0),
            "current_phase": roast_progress.get("current_phase", "Unknown"),
            "recent_events": roast_progress.get("recent_events", []),
            "bean_type": roast_progress.get("bean_type", "Unknown"),
            "target_roast_level": roast_progress.get("target_roast_level", "Unknown"),
            "environmental_conditions": roast_progress.get("environmental_conditions", {})
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
                    raw_heat = int(numbers[0])
                    # Validate heat setting (1-8 for FreshRoast)
                    if 1 <= raw_heat <= 8:
                        heat_setting = raw_heat
                    elif raw_heat > 100:  # Obviously wrong values like 205, 420
                        heat_setting = 4  # Default to middle setting
                    else:
                        heat_setting = max(1, min(8, raw_heat))  # Clamp to valid range
            if "fan" in line.lower() and any(char.isdigit() for char in line):
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    raw_fan = int(numbers[0])
                    # Validate fan setting (1-8 for FreshRoast)
                    if 1 <= raw_fan <= 8:
                        fan_setting = raw_fan
                    elif raw_fan > 100:  # Obviously wrong values like 205, 420
                        fan_setting = 4  # Default to middle setting
                    else:
                        fan_setting = max(1, min(8, raw_fan))  # Clamp to valid range
            if "time" in line.lower() and any(char.isdigit() for char in line):
                import re
                # Look for time patterns like "12 minutes", "10-15 minutes", etc.
                time_match = re.search(r'(\d+)(?:[-–]\d+)?\s*(?:minutes?|mins?|min)', line.lower())
                if time_match:
                    extracted_time = float(time_match.group(1))
                    # Only use reasonable roast times (8-25 minutes)
                    if 8 <= extracted_time <= 25:
                        estimated_time = extracted_time
                    else:
                        logger.warning(f"LLM suggested unreasonable roast time: {extracted_time} minutes, ignoring")
                else:
                    # Fallback: look for reasonable numbers (8-25 range for roast times)
                    numbers = re.findall(r'\d+', line)
                    reasonable_times = [int(n) for n in numbers if 8 <= int(n) <= 25]
                    if reasonable_times:
                        estimated_time = float(reasonable_times[0])
        
        # Parse recommendations from LLM response
        recommendations = []
        
        # Look for bullet points or numbered lists in the response
        for line in lines:
            line = line.strip()
            # Skip empty lines and headers
            if not line or line.startswith('**') or line.startswith('#'):
                continue
            # Look for bullet points or numbered items
            import re
            if line.startswith(('•', '-', '*', '1.', '2.', '3.', '4.', '5.')):
                # Clean up the line
                clean_line = re.sub(r'^[•\-*]\s*|\d+\.\s*', '', line)
                if clean_line and len(clean_line) > 10:  # Only include substantial recommendations
                    # Filter out recommendations with unreasonable roast times (30+ minutes)
                    import re
                    time_matches = re.findall(r'\d+', clean_line)
                    has_unreasonable_time = any(int(match) >= 30 for match in time_matches if match.isdigit())
                    if not has_unreasonable_time:
                        recommendations.append(clean_line)
                    else:
                        logger.warning(f"Filtered out recommendation with unreasonable time: {clean_line}")
        
        # If no recommendations found in LLM response, use minimal fallback
        if not recommendations:
            recommendations = [
                f"Start with Heat {heat_setting}, Fan {fan_setting}",
                "Monitor roast progression and adjust as needed",
                "Listen for first crack around 8-12 minutes",
                "Watch for even bean movement and color development"
            ]
        
        return {
            "roast_level": roast_level,
            "estimated_time": estimated_time,
            "initial_heat": int(heat_setting),
            "initial_fan": int(fan_setting),
            "strategy": f"LLM-powered FreshRoast strategy for {roast_level} roast",
            "recommendations": recommendations,
            "llm_advice": response
        }
    
    def _get_fallback_advice(self, roast_level: str, machine_info: Optional[Dict[str, Any]] = None, bean_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback advice when LLM is not available"""
        fallback_configs = {
            "Light": {"heat": 7, "fan": 3, "time": 10},
            "City": {"heat": 6, "fan": 4, "time": 12},
            "City+": {"heat": 6, "fan": 4, "time": 14},
            "Full City": {"heat": 5, "fan": 5, "time": 16},
            "Dark": {"heat": 5, "fan": 6, "time": 18}
        }
        
        config = fallback_configs.get(roast_level, fallback_configs["City"])
        
        # Get machine info
        machine_name = "Unknown Machine"
        if machine_info:
            machine_name = machine_info.get("name", machine_info.get("model", "Unknown Machine"))
        
        # Get bean info
        bean_name = "Unknown Bean"
        bean_origin = "Unknown"
        bean_altitude = "Unknown"
        if bean_profile:
            bean_name = bean_profile.get("name", "Unknown Bean")
            bean_origin = bean_profile.get("origin", "Unknown")
            bean_altitude = bean_profile.get("altitude_m", "Unknown")
        
        return {
            "roast_level": roast_level,
            "estimated_time": config["time"],
            "initial_heat": config["heat"],
            "initial_fan": config["fan"],
            "strategy": f"Fallback FreshRoast strategy for {roast_level} roast",
            "machine_info": machine_name,
            "bean_info": f"{bean_name} from {bean_origin}",
            "bean_altitude": bean_altitude,
            "recommendations": [
                f"Start with Heat {config['heat']}, Fan {config['fan']}",
                "AI guidance temporarily unavailable - using fallback recommendations",
                "Monitor roast progression and adjust as needed",
                "Listen for first crack around 8-12 minutes",
                "Watch for even bean movement and color development"
            ],
            "llm_advice": "LLM temporarily unavailable - using fallback recommendations"
        }

# Global instance
llm_copilot = DeepSeekRoastingCopilot()
