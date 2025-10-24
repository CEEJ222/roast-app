"""
DeepSeek LLM Integration for Roasting Copilot

This module provides LLM-powered roasting advice using DeepSeek's free API.
Enhanced with phase awareness, conversation state management, and learning capabilities.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from openai import OpenAI
from dotenv import load_dotenv

# Import enhanced modules
from .phase_awareness import PhaseDetector, MachineAwarePhaseDetector, PhaseAwarePromptBuilder, EnhancedSystemPrompt
from .conversation_state import conversation_manager
from .machine_profiles import FreshRoastMachineProfiles
from .dtr_coaching import build_dtr_coaching_context, DTRTargets
from .temperature_calibration import temperature_calibrator

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class OpenRouterLLM:
    """OpenRouter LLM integration using OpenAI SDK"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")
        
        # Initialize OpenAI client pointing to OpenRouter
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
        )
        
        # Your models from .env
        self.primary_model = os.getenv("PRIMARY_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
        self.fallback_model = os.getenv("FALLBACK_MODEL", "google/gemini-flash-1.5:free")
        
        logger.info(f"OpenRouter LLM initialized with primary: {self.primary_model}")
    
    async def get_completion(
        self,
        system_prompt: str,
        user_message: str = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
        use_fallback: bool = False
    ) -> str:
        """Get LLM completion from OpenRouter"""
        
        model = self.fallback_model if use_fallback else self.primary_model
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        if user_message:
            messages.append({"role": "user", "content": user_message})
        
        try:
            logger.info(f"🚀 Calling OpenRouter with model: {model}")
            logger.info(f"🔑 API Key present: {bool(self.api_key)}")
            logger.info(f"📝 System prompt length: {len(system_prompt)} chars")
            logger.info(f"💬 User message: {user_message[:100] if user_message else 'None'}")
            
            # Call OpenRouter via OpenAI SDK
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                extra_headers={
                    "HTTP-Referer": "https://roastbuddy.app",  # Optional: for rankings
                    "X-Title": "FreshRoast CoPilot",  # Optional: for rankings
                }
            )
            
            content = response.choices[0].message.content
            
            logger.info(f"✅ OpenRouter response received ({len(content)} chars)")
            logger.info(f"📄 Response preview: {content[:200]}...")
            return content
            
        except Exception as e:
            logger.error(f"❌ OpenRouter call failed: {str(e)}")
            logger.error(f"🔍 Error type: {type(e).__name__}")
            logger.error(f"🔍 Error details: {str(e)}")
            
            # Try fallback model if primary failed
            if not use_fallback:
                logger.warning(f"🔄 Retrying with fallback model: {self.fallback_model}")
                return await self.get_completion(
                    system_prompt,
                    user_message,
                    temperature,
                    max_tokens,
                    use_fallback=True
                )
            
            # If fallback also failed, return error message
            return f"⚠️ AI coaching temporarily unavailable. Continue roasting and I'll reconnect shortly."
    
    async def get_streaming_completion(
        self,
        system_prompt: str,
        user_message: str = None,
        temperature: float = 0.7,
        max_tokens: int = 500
    ):
        """Get streaming LLM completion (for real-time chat)"""
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        if user_message:
            messages.append({"role": "user", "content": user_message})
        
        try:
            stream = self.client.chat.completions.create(
                model=self.primary_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield "⚠️ AI coaching temporarily unavailable."

class DeepSeekRoastingCopilot:
    def __init__(self):
        """Initialize DeepSeek client with enhanced capabilities"""
        self.client = None
        self.phase_detector = PhaseDetector()
        self.machine_aware_detector = MachineAwarePhaseDetector()
        self.prompt_builder = PhaseAwarePromptBuilder()
        self.conversation_manager = conversation_manager
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
            
            # Try primary model first, then fallback model
            models_to_try = [self.primary_model, self.fallback_model]
            last_error = None
            
            for model_name in models_to_try:
                try:
                    logger.info(f"🔄 Trying model: {model_name}")
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
                        max_tokens=500,
                        timeout=10
                    )
                    
                    # Parse the response
                    llm_response = response.choices[0].message.content
                    logger.info(f"✅ Successfully got response from {model_name}")
                    
                    return self._parse_llm_response(llm_response, roast_level)
                    
                except Exception as model_error:
                    last_error = model_error
                    logger.warning(f"⚠️ Model {model_name} failed: {model_error}")
                    continue  # Try next model
            
            # If all models failed, use fallback advice
            logger.error(f"❌ All models failed. Last error: {last_error}")
            return self._get_fallback_advice(roast_level, machine_info, bean_profile)
            
        except Exception as e:
            logger.error(f"❌ DeepSeek API error: {e}")
            return self._get_fallback_advice(roast_level, machine_info, bean_profile)
    
    def get_during_roast_advice(self, 
                              roast_progress: Dict[str, Any],
                              user_question: str,
                              user_id: Optional[str] = None,
                              roast_id: Optional[str] = None,
                              machine_model: Optional[str] = None,
                              has_extension: Optional[bool] = None,
                              machine_sensor_type: Optional[str] = None) -> str:
        """
        Get real-time roasting advice during the roast with enhanced phase awareness
        """
        if not self.client:
            return "I'm having trouble connecting to my AI brain right now. Please check your roast progress manually."
        
        try:
            context = self._build_during_roast_context(roast_progress)
            
            # Detect current roasting phase with machine awareness
            elapsed_seconds = context.get('elapsed_time', 0) * 60  # Convert minutes to seconds
            current_temp = context.get('current_temp_f')
            
            # Calibrate temperature reading if sensor type is available
            calibrated_temp_info = None
            if current_temp and machine_sensor_type:
                calibrated_temp_info = temperature_calibrator.calibrate_reading(
                    raw_temp_f=current_temp,
                    sensor_type=machine_sensor_type,
                    elapsed_seconds=elapsed_seconds
                )
                logger.info(f"🌡️ Temperature calibration: {calibrated_temp_info.raw_temp_f:.1f}°F → {calibrated_temp_info.calibrated_temp_f:.1f}°F ({machine_sensor_type})")
            
            # Use machine-aware phase detection if machine info available
            if machine_model and has_extension is not None:
                current_phase, machine_profile = self.machine_aware_detector.detect_phase_for_machine(
                    machine_model, has_extension, elapsed_seconds, current_temp
                )
                phase_context = self.machine_aware_detector.get_machine_specific_context(
                    machine_profile, current_phase, elapsed_seconds, current_temp,
                    context.get('current_heat', 6), context.get('current_fan', 7)
                )
            else:
                current_phase = self.phase_detector.detect_phase(elapsed_seconds, current_temp)
                phase_context = self.phase_detector.get_phase_context(
                    current_phase, elapsed_seconds, current_temp
                )
            
            # Try to get improved response from learning system
            improved_response = None
            if user_id and roast_id:
                improved_response = self.conversation_manager.get_improved_response(context)
            
            if improved_response:
                logger.info("Using improved response from learning system")
                return improved_response
            
            # Build enhanced prompt with conversation context
            if user_id and roast_id:
                prompt = self.conversation_manager.get_contextual_prompt(
                    user_id, roast_id, user_question
                )
            else:
                # Add sensor-aware temperature information to prompt
                temp_info = ""
                if calibrated_temp_info:
                    sensor_characteristics = temperature_calibrator.get_sensor_characteristics(machine_sensor_type)
                    temp_info = f"""
            TEMPERATURE SENSOR: {machine_sensor_type.upper()}
            Current Reading: {calibrated_temp_info.raw_temp_f:.0f}°F
            {"Calibrated Bean Temp: " + f"{calibrated_temp_info.calibrated_temp_f:.0f}°F" if machine_sensor_type == 'builtin' else ""}
            
            SENSOR CHARACTERISTICS:
            {sensor_characteristics.get('measures', 'Unknown')} - {sensor_characteristics.get('accuracy', 'Unknown')}
            {calibrated_temp_info.notes}
            """
                
                prompt = f"""
                {phase_context}
                
            Current roast status:
            - Elapsed time: {context.get('elapsed_time', 'Unknown')} minutes
            - Current phase: {current_phase.name}
            - Recent events: {context.get('recent_events', 'None')}
            - Bean type: {context.get('bean_type', 'Unknown')}
            - Target roast level: {context.get('target_roast_level', 'Unknown')}
            {temp_info}
            
            User question: {user_question}
            
            Provide specific FreshRoast SR540/SR800 advice for this situation.
            """
            
            # Try primary model first, then fallback model
            models_to_try = [self.primary_model, self.fallback_model]
            
            for model_name in models_to_try:
                try:
                    logger.info(f"🔄 During-roast: Trying model: {model_name}")
                    response = self.client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {
                                "role": "system",
                                "content": EnhancedSystemPrompt.get_freshroast_system_prompt(
                                    machine_model or "SR800", has_extension or False
                                ) if machine_model and has_extension is not None 
                                else EnhancedSystemPrompt.get_realtime_coaching_prompt()
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        temperature=0.8,
                        max_tokens=300,
                        timeout=8
                    )
                    
                    ai_response = response.choices[0].message.content
                    
                    # Store interaction in conversation history
                    if user_id and roast_id:
                        self.conversation_manager.add_interaction(
                            user_id, roast_id, user_question, ai_response,
                            current_phase.name, "user_question"
                    )
                    
                    logger.info(f"✅ During-roast: Successfully got response from {model_name}")
                    return ai_response
                    
                except Exception as model_error:
                    logger.warning(f"⚠️ During-roast: Model {model_name} failed: {model_error}")
                    continue  # Try next model
            
            # If all models failed
            logger.error(f"❌ During-roast: All models failed")
            return "I'm having trouble providing real-time advice. Please check your roast progress and adjust heat/fan as needed."
            
        except Exception as e:
            logger.error(f"❌ DeepSeek during-roast error: {e}")
            return "I'm having trouble providing real-time advice. Please check your roast progress and adjust heat/fan as needed."
    
    def get_automatic_event_response(self, event_data: Dict[str, Any], roast_progress: Dict[str, Any], 
                                   user_id: Optional[str] = None, roast_id: Optional[str] = None,
                                   machine_model: Optional[str] = None, has_extension: Optional[bool] = None) -> Dict[str, Any]:
        """Get automatic AI response when events are logged with enhanced phase awareness"""
        if not self.client:
            return {
                "advice": "",
                "recommendations": [],
                "has_meaningful_advice": False
            }
        
        try:
            context = self._build_during_roast_context(roast_progress)
            context['last_event'] = event_data
            
            # Detect current roasting phase with machine awareness
            elapsed_seconds = context.get('elapsed_time', 0) * 60  # Convert minutes to seconds
            current_temp = event_data.get('temp_f')
            
            # Use machine-aware phase detection if machine info available
            if machine_model and has_extension is not None:
                current_phase, machine_profile = self.machine_aware_detector.detect_phase_for_machine(
                    machine_model, has_extension, elapsed_seconds, current_temp
                )
            else:
                current_phase = self.phase_detector.detect_phase(elapsed_seconds, current_temp)
            
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
                - Current phase: {current_phase.name}
                - Current temperature: {event_data.get('temp_f', 'Unknown')}°F
                - Current settings: Heat {context.get('current_heat', 'Unknown')}, Fan {context.get('current_fan', 'Unknown')}
                - Bean profile: {context.get('bean_profile', 'Unknown')}
                
                Provide urgent, specific guidance. Be direct and actionable.
                """
                
                # Try models with fallback for urgent spike response
                ai_response = None
                for model in [self.primary_model, self.fallback_model]:
                    try:
                        logger.info(f"🚨 URGENT: Trying {model} for spike response")
                        response = self.client.chat.completions.create(
                            model=model,
                            messages=[
                                {
                                    "role": "system",
                                    "content": EnhancedSystemPrompt.get_urgent_spike_prompt()
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
                        logger.info(f"✅ URGENT: Got spike response from {model}")
                        break
                    except Exception as e:
                        logger.warning(f"⚠️ URGENT: {model} failed: {e}")
                        continue
                
                if not ai_response:
                    ai_response = "⚠️ CRITICAL: Temperature rising dangerously fast! Immediately reduce heat by 2-3 levels to prevent scorching!"
                logger.warning(f"🚨 URGENT TEMPERATURE SPIKE RESPONSE: {ai_response}")
                
                # Store interaction in conversation history
                if user_id and roast_id:
                    self.conversation_manager.add_interaction(
                        user_id, roast_id, f"Temperature spike detected: {temp_analysis['rate_per_sec']:.1f}°F/sec", 
                        ai_response, current_phase.name, "TEMPERATURE_SPIKE"
                    )
                
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
                
                # Add phase-specific context and timing validation (FreshRoast-aware if machine info available)
                if machine_model and has_extension is not None:
                    phase_context = self.machine_aware_detector.get_machine_specific_context(
                        machine_profile, current_phase, elapsed_seconds, current_temp,
                        event_data.get('heat_level', 6), event_data.get('fan_level', 7)
                    )
                else:
                    phase_context = self.phase_detector.get_phase_context(
                        current_phase, elapsed_seconds, current_temp
                    )
                
                prompt = f"""
                {phase_context}
                
                The user just logged their FreshRoast settings:
                - Heat: {event_data.get('heat_level', 'N/A')}
                - Fan: {event_data.get('fan_level', 'N/A')}
                - Temperature: {event_data.get('temp_f', 'N/A')}°F
                - Time: {context.get('elapsed_time', 'Unknown')} minutes
                - Current phase: {current_phase.name}
                - Target roast level: {context.get('target_roast_level', 'City')}
                
                {temp_warning}
                
                Environmental conditions:{env_str}
                
                INSTRUCTIONS:
                {self._get_event_response_instructions(temp_analysis)}
                
                Keep response under 3 sentences and be VERY SPECIFIC about what to adjust.
                Consider the current roasting phase and provide phase-appropriate guidance.
                """
            elif event_data.get('kind') in ['DRY_END', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL']:
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
            
            # Try models with fallback for event response
            ai_response = None
            for model in [self.primary_model, self.fallback_model]:
                try:
                    logger.info(f"🔄 Auto-event: Trying {model}")
                    response = self.client.chat.completions.create(
                        model=model,
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
                        max_tokens=200,
                        timeout=5
                    )
                    ai_response = response.choices[0].message.content
                    logger.info(f"✅ Auto-event: Got response from {model}")
                    break
                except Exception as e:
                    logger.warning(f"⚠️ Auto-event: {model} failed: {e}")
                    continue
            
            if not ai_response:
                logger.error(f"❌ Auto-event: All models failed")
                return {
                    "advice": "",
                    "recommendations": [],
                    "has_meaningful_advice": False
                }
            
            logger.info(f"🤖 LLM Response (first 200 chars): {ai_response[:200]}")
            
            # Validate timing relevance for the advice
            if ai_response and not self.prompt_builder.validate_timing_relevance(
                ai_response, current_phase.name, elapsed_seconds
            ):
                logger.warning(f"⚠️ Advice not relevant for current phase {current_phase.name} at {elapsed_seconds}s")
                return {
                    "advice": "",
                    "recommendations": [],
                    "has_meaningful_advice": False,
                    "event_type": event_data.get('kind', 'Unknown')
                }
            
            # Parse the response for structured data
            parsed_response = self._parse_automatic_response(ai_response, event_data)
            logger.info(f"✅ Parsed response: has_meaningful_advice={parsed_response.get('has_meaningful_advice')}")
            
            # Store interaction in conversation history
            if user_id and roast_id and parsed_response.get('has_meaningful_advice'):
                self.conversation_manager.add_interaction(
                    user_id, roast_id, f"Event logged: {event_data.get('kind', 'Unknown')}", 
                    ai_response, current_phase.name, event_data.get('kind', 'Unknown')
                )
            
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
        - City+: Stops just after first crack ends (6-8 minutes)
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
                "Listen for first crack around 5-7 minutes",
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
                "Listen for first crack around 5-7 minutes",
                "Watch for even bean movement and color development"
            ],
            "llm_advice": "LLM temporarily unavailable - using fallback recommendations"
        }

    def collect_feedback(self, user_rating: int, ai_response: str, context: Dict[str, Any], 
                        user_id: Optional[str] = None, roast_id: Optional[str] = None) -> None:
        """Collect user feedback for learning system improvement"""
        if user_id and roast_id:
            self.conversation_manager.learn_from_feedback(user_rating, ai_response, context)
            logger.info(f"Collected feedback: rating={user_rating} for {user_id}_{roast_id}")
    
    def get_learning_stats(self) -> Dict[str, Any]:
        """Get learning system statistics"""
        return self.conversation_manager.get_learning_stats()
    
    def get_conversation_summary(self, user_id: str, roast_id: str) -> Dict[str, Any]:
        """Get conversation summary for a roast"""
        return self.conversation_manager.get_conversation_summary(user_id, roast_id)

class MachineAwareLLMIntegration:
    """LLM integration with deep FreshRoast machine knowledge"""
    
    def __init__(self):
        self.phase_detector = MachineAwarePhaseDetector()
        self.machine_profiles = FreshRoastMachineProfiles()
        self.llm = None
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize OpenRouter LLM"""
        try:
            self.llm = OpenRouterLLM()
            logger.info("✅ OpenRouter LLM initialized for machine-aware coaching")
        except ValueError as e:
            logger.warning(f"⚠️ OpenRouter LLM not available: {e}")
            logger.info("💡 To enable AI features, set OPENROUTER_API_KEY environment variable")
            self.llm = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenRouter LLM: {e}")
            self.llm = None
    
    async def get_machine_aware_coaching(
        self,
        roast_progress: Dict[str, Any],
        user_message: Optional[str] = None,
        machine_sensor_type: Optional[str] = None,
        supabase = None
    ) -> str:
        """Generate machine-specific coaching"""
        
        # Extract machine info from roast_progress (same pattern as other endpoints)
        machine_info = roast_progress.get('machine_info', {})
        machine_model = machine_info.get('model', 'SR800')
        has_extension = machine_info.get('has_extension', False)
        
        # Get roast events from roast_progress
        events = roast_progress.get('events', [])
        
        # Get current settings from roast_progress (preferred) or latest event
        current_heat = roast_progress.get('current_heat', 0)
        current_fan = roast_progress.get('current_fan', 0)
        current_temp = roast_progress.get('current_temp')
        
        # Calibrate temperature reading if sensor type is available
        calibrated_temp_info = None
        if current_temp and machine_sensor_type:
            elapsed_seconds = roast_progress.get('elapsed_time', 0) * 60  # Convert minutes to seconds
            calibrated_temp_info = temperature_calibrator.calibrate_reading(
                raw_temp_f=current_temp,
                sensor_type=machine_sensor_type,
                elapsed_seconds=elapsed_seconds
            )
            logger.info(f"🌡️ Machine-aware calibration: {calibrated_temp_info.raw_temp_f:.1f}°F → {calibrated_temp_info.calibrated_temp_f:.1f}°F ({machine_sensor_type})")
        
        # Debug logging
        logger.info(f"🔧 DEBUG: roast_progress keys: {list(roast_progress.keys())}")
        logger.info(f"🔧 DEBUG: current_heat from roast_progress: {current_heat}")
        logger.info(f"🔧 DEBUG: current_fan from roast_progress: {current_fan}")
        logger.info(f"🔧 DEBUG: current_temp from roast_progress: {current_temp}")
        
        # Get elapsed time from events or roast_progress
        if events:
            latest_event = max(events, key=lambda e: e['t_offset_sec'])
            elapsed_seconds = latest_event['t_offset_sec']
            # Use event temp if current_temp not provided
            if current_temp is None:
                current_temp = latest_event.get('temp_f')
        else:
            elapsed_seconds = roast_progress.get('elapsed_time', 0)
        
        # Detect phase with machine awareness
        phase, profile = self.phase_detector.detect_phase_for_machine(
            machine_model,
            has_extension,
            elapsed_seconds,
            current_temp
        )
        
        # Build machine-specific context
        machine_context = self.phase_detector.get_machine_specific_context(
            profile,
            phase,
            elapsed_seconds,
            current_temp,
            current_heat,
            current_fan
        )
        
        # Analyze temperature trend
        temp_analysis = self.analyze_temperature_trend(events)
        
        # Get specific recommendations
        if current_temp:
            phase_name = phase.name.lower().replace(' phase', '')
            phase_data = getattr(profile, f"{phase_name}_phase")
            target_temp = sum(phase_data['target_temp_range']) / 2
            
            recommendations = self.machine_profiles.get_heat_recommendation(
                profile,
                phase_name,
                current_temp,
                target_temp,
                temp_analysis.get('ror_per_min', 0)
            )
        else:
            recommendations = None
        
        # Add sensor-aware temperature information
        sensor_info = ""
        if calibrated_temp_info:
            sensor_characteristics = temperature_calibrator.get_sensor_characteristics(machine_sensor_type)
            sensor_info = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌡️ TEMPERATURE SENSOR: {machine_sensor_type.upper()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Reading: {calibrated_temp_info.raw_temp_f:.0f}°F
{"Calibrated Bean Temp: " + f"{calibrated_temp_info.calibrated_temp_f:.0f}°F" if machine_sensor_type == 'builtin' else ""}

SENSOR CHARACTERISTICS:
{sensor_characteristics.get('measures', 'Unknown')} - {sensor_characteristics.get('accuracy', 'Unknown')}
{calibrated_temp_info.notes}

TEMPERATURE TARGETS FOR THIS SENSOR:
- First crack: {temperature_calibrator.get_target_temperature_range(machine_sensor_type, 'first_crack')[0]}-{temperature_calibrator.get_target_temperature_range(machine_sensor_type, 'first_crack')[1]}°F
- Drop (City+): {temperature_calibrator.get_target_temperature_range(machine_sensor_type, 'city_plus_drop')[0]}-{temperature_calibrator.get_target_temperature_range(machine_sensor_type, 'city_plus_drop')[1]}°F
"""

        # Get golden examples for few-shot learning
        few_shot_section = ""
        try:
            if supabase:
                from .roast_chat_learning import get_golden_examples_for_context, build_few_shot_examples_section
                
                # Get current roast context for golden examples
                current_phase = roast_progress.get('current_phase', 'Unknown')
                machine_model = roast_progress.get('machine_model', 'SR800')
                has_extension = roast_progress.get('has_extension', False)
                sensor_type = roast_progress.get('temp_sensor_type', 'builtin')
                
                # Get golden examples for this context
                golden_examples = await get_golden_examples_for_context(
                    machine_model=machine_model,
                    has_extension=has_extension,
                    phase=current_phase,
                    sensor_type=sensor_type,
                    supabase=supabase,
                    limit=3
                )
                
                # Build few-shot section
                few_shot_section = build_few_shot_examples_section(golden_examples)
                
                if golden_examples:
                    logger.info(f"Using {len(golden_examples)} golden examples for {machine_model}/{current_phase}")
            else:
                logger.info("No Supabase client provided, skipping golden examples")
                
        except Exception as e:
            logger.warning(f"Could not load golden examples: {e}")
            few_shot_section = ""

        # Build comprehensive prompt
        system_prompt = f"""You are an EXPERT FreshRoast coffee roaster with DEEP knowledge of the {profile.display_name}.

{machine_context}

{sensor_info}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 CURRENT ROAST STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{temp_analysis.get('summary', 'No temperature data yet')}

{"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" if recommendations else ""}
{"🎯 RECOMMENDED ACTIONS:" if recommendations else ""}
{"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" if recommendations else ""}
{self._format_recommendations(recommendations, current_heat, current_fan) if recommendations else ""}

{few_shot_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 {profile.display_name} PRO TIPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{chr(10).join(f"• {tip}" for tip in profile.pro_tips[:3])}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR COACHING GUIDELINES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BE SPECIFIC to the {profile.display_name} - reference machine characteristics
2. Give EXACT heat/fan numbers (e.g., "Set heat to 6, fan to 8")
3. Explain WHY - reference machine behavior (e.g., "SR800 responds fast, so...")
4. Keep responses under 100 words unless urgent
5. Reference common issues for this specific machine
6. If temperature spike/crash, respond URGENTLY
7. Remember: User has {profile.display_name} {'WITH' if has_extension else 'WITHOUT'} extension tube

{f"USER QUESTION: {user_message}" if user_message else "Provide proactive coaching based on current roast state."}

RESPOND IN A HELPFUL, SPECIFIC, ACTIONABLE WAY FOR THE {profile.display_name}:
"""
        
        # Call LLM
        if self.llm:
            logger.info(f"🤖 Calling LLM with system prompt length: {len(system_prompt)}")
            logger.info(f"🤖 User message: {user_message}")
            response = await self.llm.get_completion(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=0.7,
                max_tokens=500
            )
            logger.info(f"🤖 LLM response length: {len(response)}")
            logger.info(f"🤖 LLM response preview: {response[:200]}...")
        else:
            logger.error("❌ LLM not initialized")
            response = "⚠️ AI coaching temporarily unavailable. Please set OPENROUTER_API_KEY to enable AI features."
        
        return response
    
    async def get_dtr_aware_coaching(
        self,
        roast_progress: Dict[str, Any],
        user_message: Optional[str] = None,
        machine_sensor_type: Optional[str] = None,
        supabase = None
    ) -> str:
        """Generate DTR-aware coaching with machine-specific guidance"""
        
        # Initialize variables to ensure they're in scope
        calibrated_temp_info = None
        # machine_sensor_type is already a parameter, so it's in scope
        
        # Add explicit variable declarations to help linter
        if machine_sensor_type is None:
            machine_sensor_type = 'builtin'  # Default fallback
        
        # Extract roast information
        machine_info = roast_progress.get('machine_info', {})
        machine_model = machine_info.get('model', 'SR800')
        has_extension = machine_info.get('has_extension', False)
        roast_level = roast_progress.get('roast_level') or roast_progress.get('target_roast_level', 'City')
        
        # Get current roast state
        events = roast_progress.get('events', [])
        current_heat = roast_progress.get('current_heat', 0)
        current_fan = roast_progress.get('current_fan', 0)
        current_temp = roast_progress.get('current_temp')
        elapsed_time = roast_progress.get('elapsed_time', 0)
        
        # Calibrate temperature reading if sensor type is available
        if current_temp and machine_sensor_type:
            elapsed_seconds = int(elapsed_time * 60) if elapsed_time else 0
            calibrated_temp_info = temperature_calibrator.calibrate_reading(
                raw_temp_f=current_temp,
                sensor_type=machine_sensor_type,
                elapsed_seconds=elapsed_seconds
            )
            logger.info(f"🌡️ DTR-aware calibration: {calibrated_temp_info.raw_temp_f:.1f}°F → {calibrated_temp_info.calibrated_temp_f:.1f}°F ({machine_sensor_type})")
        
        # Find first crack time
        first_crack_time = None
        for event in events:
            if event.get('event_type') == 'first_crack':
                first_crack_time = event.get('t_offset_sec')
                break
        
        # Get machine profile
        try:
            profile = self.machine_profiles.get_profile(machine_model, has_extension)
        except ValueError:
            profile = self.machine_profiles.get_profile('SR800', False)  # Fallback
        
        # Respect manual phase transitions from frontend, fallback to detection
        frontend_phase = roast_progress.get('current_phase', '').lower()
        if frontend_phase in ['drying', 'maillard', 'development', 'finishing']:
            # Use frontend phase if it's a valid phase
            phase_name_map = {
                'drying': 'Drying Phase',
                'maillard': 'Maillard Reaction Phase', 
                'development': 'Development Phase',
                'finishing': 'Finishing Phase'
            }
            phase_name = phase_name_map[frontend_phase]
            # Find the phase object
            phase = None
            for p in self.phase_detector.phases.values():
                if p.name == phase_name:
                    phase = p
                    break
            if phase is None:
                # Fallback to detection if phase not found
                phase, _ = self.phase_detector.detect_phase_for_machine(
                    machine_model, has_extension, elapsed_time, current_temp
                )
        else:
            # No valid frontend phase, use detection
            phase, _ = self.phase_detector.detect_phase_for_machine(
                machine_model, has_extension, elapsed_time, current_temp
            )
        
        # Get DTR-aware coaching using comprehensive context
        dtr_coaching_context = build_dtr_coaching_context(
            target_roast_level=roast_level,
            current_phase=phase.name.lower().replace(' phase', ''),
            first_crack_time_sec=first_crack_time,
            elapsed_seconds=int(elapsed_time * 60) if elapsed_time else 0,  # Convert minutes to seconds
            current_temp=current_temp or 0
        )
        
        # Get machine-specific DTR advice if in development phase
        machine_dtr_advice = None
        if (phase.name.lower().replace(' phase', '') == 'development' and 
            first_crack_time and current_temp):
            
            current_dtr = DTRTargets.calculate_dtr(int(first_crack_time) if first_crack_time else 0, int(float(elapsed_time) * 60) if elapsed_time else 0)  # Convert minutes to seconds
            machine_dtr_advice = self.machine_profiles.get_dtr_aware_development_advice(
                profile=profile,
                roast_level=roast_level,
                current_dtr=current_dtr,
                current_heat=current_heat,
                current_fan=current_fan,
                current_temp=current_temp,
                ror=roast_progress.get('ror', 0)
            )
        
        # Build DTR-enhanced system prompt with comprehensive context
        system_prompt = await self._build_dtr_aware_system_prompt(
            profile=profile,
            roast_level=roast_level,
            dtr_coaching_context=dtr_coaching_context,
            machine_dtr_advice=machine_dtr_advice,
            current_phase=phase.name.lower().replace(' phase', ''),
            elapsed_time=elapsed_time,
            current_temp=current_temp,
            user_message=user_message,
            has_extension=has_extension,
            current_heat=current_heat,
            current_fan=current_fan,
            supabase=supabase
        )
        
        # Call LLM with DTR-aware prompt
        if self.llm:
            logger.info(f"🤖 Calling DTR-aware LLM with prompt length: {len(system_prompt)}")
            response = await self.llm.get_completion(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=0.7,
                max_tokens=600
            )
            logger.info(f"🤖 DTR-aware LLM response length: {len(response)}")
        else:
            logger.error("❌ LLM not initialized")
            response = "⚠️ AI coaching temporarily unavailable. Please set OPENROUTER_API_KEY to enable AI features."
        
        return response
    
    async def _build_dtr_aware_system_prompt(
        self,
        profile,
        roast_level: str,
        dtr_coaching_context: str,
        machine_dtr_advice: Optional[Dict[str, Any]],
        current_phase: str,
        elapsed_time: float,
        current_temp: Optional[float],
        user_message: Optional[str],
        has_extension: bool = False,
        current_heat: int = 0,
        current_fan: int = 0,
        supabase = None
    ) -> str:
        """Build comprehensive DTR-aware system prompt"""
        
        # Use the comprehensive DTR coaching context
        dtr_status_section = dtr_coaching_context
        
        # Machine-specific DTR advice
        machine_advice_section = ""
        if machine_dtr_advice:
            machine_advice_section = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 {profile.display_name} DTR GUIDANCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{machine_dtr_advice.get('coaching_message', '')}

Heat Recommendation: {machine_dtr_advice.get('heat_recommendation', {}).get('reasoning', 'N/A')}
Fan Recommendation: {machine_dtr_advice.get('fan_recommendation', {}).get('reasoning', 'N/A')}
"""
        
        # Add sensor-aware temperature information
        sensor_info = ""
        try:
            # Access variables from method scope
            temp_info = locals().get('calibrated_temp_info')
            sensor_type = locals().get('machine_sensor_type')
            
            if temp_info and sensor_type:
                logger.info(f"🌡️ Building sensor info: calibrated_temp_info={temp_info}, machine_sensor_type={sensor_type}")
                sensor_characteristics = temperature_calibrator.get_sensor_characteristics(sensor_type)
                sensor_info = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌡️ TEMPERATURE SENSOR: {sensor_type.upper()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Reading: {temp_info.raw_temp_f:.0f}°F
{"Calibrated Bean Temp: " + f"{temp_info.calibrated_temp_f:.0f}°F" if sensor_type == 'builtin' else ""}

SENSOR CHARACTERISTICS:
{sensor_characteristics.get('measures', 'Unknown')} - {sensor_characteristics.get('accuracy', 'Unknown')}
{temp_info.notes}

TEMPERATURE TARGETS FOR THIS SENSOR:
- First crack: {temperature_calibrator.get_target_temperature_range(sensor_type, 'first_crack')[0]}-{temperature_calibrator.get_target_temperature_range(sensor_type, 'first_crack')[1]}°F
- Drop (City+): {temperature_calibrator.get_target_temperature_range(sensor_type, 'city_plus_drop')[0]}-{temperature_calibrator.get_target_temperature_range(sensor_type, 'city_plus_drop')[1]}°F
"""
        except Exception as e:
            logger.error(f"❌ Error building sensor info: {e}")
            logger.error(f"❌ calibrated_temp_info: {temp_info}")
            logger.error(f"❌ machine_sensor_type: {sensor_type}")
            sensor_info = ""

        # Current roast status
        current_status = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CURRENT ROAST STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase: {current_phase.upper()}
Elapsed Time: {elapsed_time:.1f} minutes
Current Temperature: {current_temp:.0f}°F (if available)
Current Settings: Heat {current_heat}, Fan {current_fan}
Roast Level Target: {roast_level}
"""
        
        # Get golden examples for few-shot learning (if supabase is available)
        few_shot_section = ""
        try:
            if supabase:
                from .roast_chat_learning import get_golden_examples_for_context, build_few_shot_examples_section
                
                # Get current roast context for golden examples
                current_phase_name = current_phase
                machine_model = profile.model
                has_extension = has_extension
                sensor_type = 'builtin'  # Default for DTR coaching
                
                # Get golden examples for this context
                golden_examples = await get_golden_examples_for_context(
                    machine_model=machine_model,
                    has_extension=has_extension,
                    phase=current_phase_name,
                    sensor_type=sensor_type,
                    supabase=supabase,
                    limit=3
                )
                
                # Build few-shot section
                few_shot_section = build_few_shot_examples_section(golden_examples)
                
                if golden_examples:
                    logger.info(f"Using {len(golden_examples)} golden examples for DTR coaching {machine_model}/{current_phase_name}")
        except Exception as e:
            logger.warning(f"Could not load golden examples for DTR coaching: {e}")
            few_shot_section = ""

        # Build complete prompt
        system_prompt = f"""You are an EXPERT FreshRoast coffee roaster with DEEP knowledge of the {profile.display_name} and DTR (Development Time Ratio) optimization.

{current_status}

{sensor_info}
{dtr_status_section}

{machine_advice_section}

{few_shot_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR DTR-AWARE COACHING GUIDELINES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PRIORITIZE DTR optimization for {roast_level} roast level
2. BE SPECIFIC to the {profile.display_name} - reference machine characteristics
3. Give EXACT heat/fan numbers (e.g., "Set heat to 6, fan to 8")
4. Explain WHY - reference DTR targets and machine behavior
5. Keep responses under 150 words unless urgent DTR issue
6. Reference DTR status and urgency level
7. If DTR is critical (too high/low), respond URGENTLY
8. Remember: User has {profile.display_name} {'WITH' if has_extension else 'WITHOUT'} extension tube

{f"USER QUESTION: {user_message}" if user_message else "Provide DTR-aware coaching based on current roast state."}

RESPOND IN A HELPFUL, SPECIFIC, ACTIONABLE WAY FOR THE {profile.display_name} WITH DTR OPTIMIZATION:
"""
        
        return system_prompt
    
    def _format_recommendations(
        self,
        recommendations: Dict,
        current_heat: int,
        current_fan: int
    ) -> str:
        """Format recommendations clearly"""
        
        urgency_emoji = {
            "urgent": "🚨",
            "high": "⚠️",
            "normal": "💡"
        }
        
        emoji = urgency_emoji.get(recommendations['urgency'], "💡")
        
        output = f"\n{emoji} URGENCY: {recommendations['urgency'].upper()}\n\n"
        
        if recommendations['heat_action'] != "maintain":
            new_heat = current_heat + recommendations['heat_change']
            output += f"HEAT: {recommendations['heat_action'].upper()} from {current_heat} → {new_heat}\n"
        else:
            output += f"HEAT: Maintain at {current_heat}\n"
        
        if recommendations['fan_action'] != "maintain":
            new_fan = current_fan + recommendations['fan_change']
            output += f"FAN: {recommendations['fan_action'].upper()} from {current_fan} → {new_fan}\n"
        else:
            output += f"FAN: Maintain at {current_fan}\n"
        
        output += f"\nReasoning: {recommendations['reasoning']}\n"
        
        return output
    
    
    def analyze_temperature_trend(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze temperature trend from events"""
        if not events:
            return {"summary": "No temperature data yet"}
        
        # Simple trend analysis
        temps = [e.get('temp_f') for e in events if e.get('temp_f')]
        if len(temps) < 2:
            return {"summary": "Insufficient temperature data"}
        
        latest_temp = temps[-1]
        temp_change = temps[-1] - temps[0] if len(temps) > 1 else 0
        time_span = events[-1]['t_offset_sec'] - events[0]['t_offset_sec']
        ror_per_min = (temp_change / time_span * 60) if time_span > 0 else 0
        
        return {
            "summary": f"Current: {latest_temp:.1f}°F, ROR: {ror_per_min:.1f}°F/min",
            "ror_per_min": ror_per_min,
            "latest_temp": latest_temp
        }
    

# Global instances
llm_copilot = DeepSeekRoastingCopilot()
machine_aware_llm = MachineAwareLLMIntegration()
