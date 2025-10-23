"""
Phase-Aware Roasting System

This module provides roasting phase detection and phase-specific coaching guidance
to improve AI chatbot performance by understanding roasting phases and their characteristics.
"""

from dataclasses import dataclass
from typing import Dict, Optional, List, Any
import logging

# Handle relative imports gracefully
try:
    from .machine_profiles import FreshRoastMachineProfiles, MachineCharacteristics
except ImportError:
    # For testing or direct execution
    from machine_profiles import FreshRoastMachineProfiles, MachineCharacteristics

logger = logging.getLogger(__name__)

@dataclass
class RoastPhase:
    name: str
    time_range: tuple  # (min_seconds, max_seconds)
    temp_range: tuple  # (min_temp_f, max_temp_f)
    indicators: List[str]
    coaching_focus: str
    dos: List[str]
    donts: List[str]

class PhaseDetector:
    """Detects current roasting phase based on time and temperature with FreshRoast machine awareness"""
    
    def __init__(self):
        self.machine_profiles = FreshRoastMachineProfiles()
        self.phases = {
            "drying": RoastPhase(
                name="Drying Phase",
                time_range=(0, 240),  # 0-4 minutes
                temp_range=(200, 300),
                indicators=[
                    "Beans turning from green to yellow",
                    "Grassy smell becoming sweet",
                    "Moisture evaporating"
                ],
                coaching_focus="Focus on moisture removal and even heat distribution",
                dos=[
                    "Maintain steady heat",
                    "Allow moisture to escape gradually",
                    "Watch for color change to yellow"
                ],
                donts=[
                    "Don't rush this phase",
                    "Don't reduce fan too much (need airflow)",
                    "Don't expect cracking sounds yet"
                ]
            ),
            "maillard": RoastPhase(
                name="Maillard Reaction Phase",
                time_range=(240, 480),  # 4-8 minutes
                temp_range=(300, 380),
                indicators=[
                    "Beans browning (Maillard reactions)",
                    "Sweet, bready aromas developing",
                    "Beans expanding in size"
                ],
                coaching_focus="Monitor browning rate and prepare for first crack",
                dos=[
                    "Watch temperature rise rate (should be 8-12°F/min)",
                    "Adjust heat to control browning speed",
                    "Listen for beginning of first crack"
                ],
                donts=[
                    "Don't let temperature stall",
                    "Don't increase heat too aggressively",
                    "Don't expect full development yet"
                ]
            ),
            "development": RoastPhase(
                name="Development Phase",
                time_range=(480, 720),  # 8-12 minutes
                temp_range=(380, 435),
                indicators=[
                    "First crack active or completed",
                    "Oils beginning to surface",
                    "Flavor compounds developing"
                ],
                coaching_focus="Control development time and roast level",
                dos=[
                    "Time from first crack to drop (development time)",
                    "Adjust heat to control roast level",
                    "Monitor for desired roast color"
                ],
                donts=[
                    "Don't let temperature spike uncontrollably",
                    "Don't drop before first crack finishes (usually)",
                    "Don't ignore second crack if it starts"
                ]
            ),
            "finishing": RoastPhase(
                name="Finishing Phase",
                time_range=(720, 900),  # 12-15 minutes
                temp_range=(420, 450),
                indicators=[
                    "Second crack may be approaching or active",
                    "Heavy oil development",
                    "Smoke increasing"
                ],
                coaching_focus="Decide drop point and cool quickly",
                dos=[
                    "Decide your drop point based on desired roast",
                    "Cool beans immediately after drop",
                    "Be ready to drop quickly if needed"
                ],
                donts=[
                    "Don't go into second crack unless intentional",
                    "Don't delay drop if target reached",
                    "Don't let beans bake"
                ]
            )
        }
    
    def detect_phase(self, elapsed_seconds: int, current_temp_f: Optional[float] = None) -> RoastPhase:
        """Detect current roasting phase"""
        
        # Time-based detection (primary)
        for phase_key, phase in self.phases.items():
            min_time, max_time = phase.time_range
            if min_time <= elapsed_seconds < max_time:
                # If we have temperature, validate it makes sense
                if current_temp_f:
                    min_temp, max_temp = phase.temp_range
                    if not (min_temp <= current_temp_f <= max_temp + 50):  # +50°F tolerance
                        logger.warning(f"Temperature {current_temp_f}°F unusual for {phase.name} at {elapsed_seconds}s")
                
                return phase
        
        # Default to finishing if beyond expected time
        return self.phases["finishing"]
    
    def get_phase_context(self, phase: RoastPhase, elapsed_seconds: int, current_temp_f: Optional[float]) -> str:
        """Generate detailed phase context for AI prompt"""
        
        progress_pct = ((elapsed_seconds - phase.time_range[0]) / 
                       (phase.time_range[1] - phase.time_range[0]) * 100)
        
        context = f"""
CURRENT ROASTING PHASE: {phase.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase Progress: {progress_pct:.0f}% through this phase
Elapsed Time: {int(elapsed_seconds) // 60}:{int(elapsed_seconds) % 60:02d}
{"Current Temperature: " + f"{current_temp_f:.1f}°F" if current_temp_f else "Temperature: Not available"}

WHAT'S HAPPENING NOW:
{chr(10).join(f"• {indicator}" for indicator in phase.indicators)}

COACHING FOCUS: {phase.coaching_focus}

DO THESE THINGS:
{chr(10).join(f"✓ {do}" for do in phase.dos)}

AVOID THESE:
{chr(10).join(f"✗ {dont}" for dont in phase.donts)}
"""
        return context
    
    def get_machine_specific_phase_context(
        self, 
        phase: RoastPhase, 
        elapsed_seconds: int, 
        current_temp_f: Optional[float],
        machine_model: str,
        has_extension: bool,
        current_heat: Optional[int] = None,
        current_fan: Optional[int] = None
    ) -> str:
        """Generate machine-specific phase context for FreshRoast machines"""
        
        try:
            # Get machine profile
            machine_profile = self.machine_profiles.get_profile(machine_model, has_extension)
            
            # Get machine-specific advice
            phase_name = phase.name.lower().replace(" phase", "").replace(" reaction", "")
            machine_advice = ""
            
            if current_heat is not None and current_fan is not None:
                machine_advice = self.machine_profiles.get_phase_specific_advice(
                    machine_profile, phase_name, current_heat, current_fan, elapsed_seconds
                )
            
            # Build enhanced context with machine-specific information
            progress_pct = ((elapsed_seconds - phase.time_range[0]) / 
                           (phase.time_range[1] - phase.time_range[0]) * 100)
            
            context = f"""
CURRENT ROASTING PHASE: {phase.name}
MACHINE: {machine_profile.display_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase Progress: {progress_pct:.0f}% through this phase
Elapsed Time: {int(elapsed_seconds) // 60}:{int(elapsed_seconds) % 60:02d}
{"Current Temperature: " + f"{current_temp_f:.1f}°F" if current_temp_f else "Temperature: Not available"}
{"Current Settings: Heat " + str(current_heat) + ", Fan " + str(current_fan) if current_heat and current_fan else ""}

MACHINE CHARACTERISTICS:
• Power: {machine_profile.power_watts}W
• Heat Response: {machine_profile.heat_response}
• Fan Effect: {machine_profile.fan_effect}
• Optimal Capacity: {machine_profile.capacity_g[0]}-{machine_profile.capacity_g[1]}g

WHAT'S HAPPENING NOW:
{chr(10).join(f"• {indicator}" for indicator in phase.indicators)}

COACHING FOCUS: {phase.coaching_focus}

DO THESE THINGS:
{chr(10).join(f"✓ {do}" for do in phase.dos)}

AVOID THESE:
{chr(10).join(f"✗ {dont}" for dont in phase.donts)}

FRESHROAST-SPECIFIC GUIDANCE:
{machine_advice if machine_advice else "No specific machine guidance available"}

PRO TIPS FOR {machine_profile.display_name.upper()}:
{chr(10).join(f"💡 {tip}" for tip in machine_profile.pro_tips[:3])}
"""
            return context
            
        except Exception as e:
            logger.warning(f"Could not get machine-specific context: {e}")
            # Fall back to generic context
            return self.get_phase_context(phase, elapsed_seconds, current_temp_f)

class MachineAwarePhaseDetector:
    """Phase detection that understands machine-specific timings"""
    
    def __init__(self):
        self.machine_profiles = FreshRoastMachineProfiles()
        # Keep existing RoastPhase definitions from PhaseDetector
        self.phases = {
            "drying": RoastPhase(
                name="Drying Phase",
                time_range=(0, 240),  # 0-4 minutes
                temp_range=(200, 300),
                indicators=[
                    "Beans turning from green to yellow",
                    "Grassy smell becoming sweet",
                    "Moisture evaporating"
                ],
                coaching_focus="Focus on moisture removal and even heat distribution",
                dos=[
                    "Maintain steady heat",
                    "Allow moisture to escape gradually",
                    "Watch for color change to yellow"
                ],
                donts=[
                    "Don't rush this phase",
                    "Don't reduce fan too much (need airflow)",
                    "Don't expect cracking sounds yet"
                ]
            ),
            "maillard": RoastPhase(
                name="Maillard Reaction Phase",
                time_range=(240, 480),  # 4-8 minutes
                temp_range=(300, 380),
                indicators=[
                    "Beans browning (Maillard reactions)",
                    "Sweet, bready aromas developing",
                    "Beans expanding in size"
                ],
                coaching_focus="Monitor browning rate and prepare for first crack",
                dos=[
                    "Watch temperature rise rate (should be 8-12°F/min)",
                    "Adjust heat to control browning speed",
                    "Listen for beginning of first crack"
                ],
                donts=[
                    "Don't let temperature stall",
                    "Don't increase heat too aggressively",
                    "Don't expect full development yet"
                ]
            ),
            "development": RoastPhase(
                name="Development Phase",
                time_range=(480, 720),  # 8-12 minutes
                temp_range=(380, 435),
                indicators=[
                    "First crack active or completed",
                    "Oils beginning to surface",
                    "Flavor compounds developing"
                ],
                coaching_focus="Control development time and roast level",
                dos=[
                    "Time from first crack to drop (development time)",
                    "Adjust heat to control roast level",
                    "Monitor for desired roast color"
                ],
                donts=[
                    "Don't let temperature spike uncontrollably",
                    "Don't drop before first crack finishes (usually)",
                    "Don't ignore second crack if it starts"
                ]
            ),
            "finishing": RoastPhase(
                name="Finishing Phase",
                time_range=(720, 900),  # 12-15 minutes
                temp_range=(420, 450),
                indicators=[
                    "Second crack may be approaching or active",
                    "Heavy oil development",
                    "Smoke increasing"
                ],
                coaching_focus="Decide drop point and cool quickly",
                dos=[
                    "Decide your drop point based on desired roast",
                    "Cool beans immediately after drop",
                    "Be ready to drop quickly if needed"
                ],
                donts=[
                    "Don't go into second crack unless intentional",
                    "Don't delay drop if target reached",
                    "Don't let beans bake"
                ]
            )
        }
    
    def detect_phase_for_machine(
        self,
        machine_model: str,
        has_extension: bool,
        elapsed_seconds: int,
        current_temp: Optional[float] = None
    ) -> tuple[RoastPhase, MachineCharacteristics]:
        """Detect phase with machine-specific expectations"""
        
        # Get machine profile
        profile = self.machine_profiles.get_profile(machine_model, has_extension)
        
        # Adjust phase timing based on machine
        typical_roast_time_minutes = sum(profile.typical_roast_time) / 2
        time_scale = typical_roast_time_minutes / 10  # Scale to typical roast
        
        # If we have temperature, use temperature-based detection as primary
        if current_temp is not None:
            # Temperature-based phase detection (more accurate)
            if current_temp < 300:
                phase = self.phases["drying"]
            elif current_temp <= 380:  # Include 380°F in Maillard phase
                phase = self.phases["maillard"]
            elif current_temp < 420:
                phase = self.phases["development"]
            else:
                phase = self.phases["finishing"]
        else:
            # Fall back to time-based detection
            if elapsed_seconds < 240 * time_scale:
                phase = self.phases["drying"]
            elif elapsed_seconds < 480 * time_scale:
                phase = self.phases["maillard"]
            elif elapsed_seconds < 720 * time_scale:
                phase = self.phases["development"]
            else:
                phase = self.phases["finishing"]
        
        return phase, profile
    
    def get_machine_specific_context(
        self,
        profile: MachineCharacteristics,
        phase: RoastPhase,
        elapsed_seconds: int,
        current_temp: Optional[float],
        current_heat: int,
        current_fan: int
    ) -> str:
        """Build machine-specific coaching context"""
        
        # Map phase names to machine profile attributes
        phase_name_mapping = {
            "Drying Phase": "drying",
            "Maillard Reaction Phase": "maillard", 
            "Development Phase": "development",
            "Finishing Phase": "finishing"
        }
        
        phase_key = phase_name_mapping.get(phase.name, "drying")
        phase_data = getattr(profile, f"{phase_key}_phase")
        
        context = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MACHINE: {profile.display_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT ROASTING PHASE: {phase.name}
Elapsed Time: {int(elapsed_seconds) // 60}:{int(elapsed_seconds) % 60:02d}
{"Current Temperature: " + f"{current_temp:.1f}°F" if current_temp else "Temperature: Not available"}
Current Settings: Heat {current_heat} | Fan {current_fan}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 {profile.display_name} CHARACTERISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Batch Size: {profile.capacity_g[0]}-{profile.capacity_g[1]}g
- Power: {profile.power_watts}W ({profile.heat_response})
- Fan Effect: {profile.fan_effect}
- Typical Roast Time: {profile.typical_roast_time[0]}-{profile.typical_roast_time[1]} minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 {phase.name.upper()} RECOMMENDATIONS FOR {profile.display_name}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Expected Duration: {phase_data['duration_minutes'][0]}-{phase_data['duration_minutes'][1]} minutes
Recommended Heat: {phase_data['recommended_heat'][0]}-{phase_data['recommended_heat'][1]}
Recommended Fan: {phase_data['recommended_fan'][0]}-{phase_data['recommended_fan'][1]}
Target Temperature: {phase_data['target_temp_range'][0]}-{phase_data['target_temp_range'][1]}°F

💡 Machine-Specific Advice:
{phase_data['advice']}

⚠️ Common Mistake with {profile.display_name}:
{phase_data['common_mistake']}
"""

        # Add extension tube notes if applicable
        if profile.extension_effects:
            context += f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 EXTENSION TUBE EFFECTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{chr(10).join(f"• {k.replace('_', ' ').title()}: {v}" for k, v in profile.extension_effects.items())}
"""

        # Get phase-specific advice based on current settings
        settings_advice = self.machine_profiles.get_phase_specific_advice(
            profile, 
            phase.name.lower().replace(' phase', ''),
            current_heat,
            current_fan,
            elapsed_seconds
        )
        
        if settings_advice:
            context += f"\n\n{settings_advice}"
        
        return context

class PhaseAwarePromptBuilder:
    """Builds enhanced prompts with roasting phase knowledge and FreshRoast machine awareness"""
    
    def __init__(self):
        self.phase_detector = PhaseDetector()
        self.machine_profiles = FreshRoastMachineProfiles()
        self.phase_knowledge = {
            "drying": {
                "duration": "0-4 minutes",
                "indicators": "beans turn yellow, moisture removal",
                "strategy": "higher heat, lower fan for moisture removal"
            },
            "maillard": {
                "duration": "4-8 minutes", 
                "indicators": "browning reactions, beans turn brown",
                "strategy": "moderate heat, watch for color changes"
            },
            "development": {
                "duration": "8-12 minutes",
                "indicators": "first crack, flavor development", 
                "strategy": "controlled heat, listen for cracks"
            },
            "finishing": {
                "duration": "12-15 minutes",
                "indicators": "second crack, oil development",
                "strategy": "decide drop point, cool quickly"
            }
        }
    
    def build_phase_aware_prompt(self, current_phase: str, context: Dict[str, Any]) -> str:
        """Build prompt with phase-specific knowledge"""
        phase_info = self.phase_knowledge.get(current_phase, {})
        
        return f"""
        Current roasting phase: {current_phase.upper()}
        Phase characteristics: {phase_info.get('indicators', '')}
        Expected duration: {phase_info.get('duration', '')}
        Phase strategy: {phase_info.get('strategy', '')}
        
        Context: {context}
        """
    
    def validate_timing_relevance(self, advice: str, current_phase: str, elapsed_time: int) -> bool:
        """Check if advice is relevant for current phase and timing"""
        if current_phase == "drying" and "first crack" in advice.lower():
            return False  # Irrelevant advice
        if current_phase == "development" and "moisture removal" in advice.lower():
            return False  # Irrelevant advice
        return True
    
    def build_freshroast_aware_prompt(
        self, 
        current_phase: str, 
        context: Dict[str, Any],
        machine_model: str,
        has_extension: bool,
        current_heat: Optional[int] = None,
        current_fan: Optional[int] = None
    ) -> str:
        """Build prompt with FreshRoast machine-specific knowledge"""
        
        try:
            # Get machine profile
            machine_profile = self.machine_profiles.get_profile(machine_model, has_extension)
            
            # Get phase-specific machine advice
            machine_advice = ""
            if current_heat is not None and current_fan is not None:
                machine_advice = self.machine_profiles.get_phase_specific_advice(
                    machine_profile, current_phase, current_heat, current_fan, 
                    context.get('elapsed_time', 0) * 60
                )
            
            # Build enhanced prompt
            prompt = f"""
            Current roasting phase: {current_phase.upper()}
            Machine: {machine_profile.display_name}
            
            MACHINE CHARACTERISTICS:
            • Power: {machine_profile.power_watts}W
            • Heat Response: {machine_profile.heat_response}
            • Fan Effect: {machine_profile.fan_effect}
            • Optimal Capacity: {machine_profile.capacity_g[0]}-{machine_profile.capacity_g[1]}g
            
            Phase characteristics: {self.phase_knowledge.get(current_phase, {}).get('indicators', '')}
            Expected duration: {self.phase_knowledge.get(current_phase, {}).get('duration', '')}
            Phase strategy: {self.phase_knowledge.get(current_phase, {}).get('strategy', '')}
            
            FRESHROAST-SPECIFIC GUIDANCE:
            {machine_advice if machine_advice else "No specific machine guidance available"}
            
            Context: {context}
            
            Provide specific, actionable advice for this {machine_profile.display_name} in the {current_phase} phase.
            """
            
            return prompt
            
        except Exception as e:
            logger.warning(f"Could not build FreshRoast-aware prompt: {e}")
            # Fall back to generic prompt
            return self.build_phase_aware_prompt(current_phase, context)

class EnhancedSystemPrompt:
    """Enhanced system prompts with roasting phase knowledge"""
    
    @staticmethod
    def get_phase_aware_system_prompt() -> str:
        """Get enhanced system prompt with roasting phase knowledge"""
        return """
        You are an expert coffee roaster with deep knowledge of roasting phases:
        
        ROASTING PHASES:
        1. DRYING (0-4 minutes): Remove moisture, beans turn yellow
        2. MAILLARD (4-8 minutes): Browning reactions, beans turn brown
        3. DEVELOPMENT (8-12 minutes): First crack, flavor development
        4. COOLING (12+ minutes): Stop roasting, cool beans
        
        Each phase requires different heat/fan strategies and has specific indicators.
        Provide phase-specific guidance based on the current roasting phase.
        """
    
    @staticmethod
    def get_urgent_spike_prompt() -> str:
        """Get prompt for urgent temperature spike situations"""
        return """
        You are an expert coffee roaster providing URGENT guidance for dangerous temperature spikes. 
        Be direct, specific, and urgent. Use plain text only.
        """
    
    @staticmethod
    def get_realtime_coaching_prompt() -> str:
        """Get prompt for real-time coaching"""
        return """
        You are a real-time coffee roasting coach for FreshRoast SR540/SR800. 
        Provide immediate, specific advice for heat/fan adjustments and timing. 
        Use plain text only - NO LaTeX, NO math formatting, just regular text.
        """
    
    @staticmethod
    def get_freshroast_system_prompt(machine_model: str, has_extension: bool) -> str:
        """Get FreshRoast-specific system prompt"""
        try:
            from .machine_profiles import FreshRoastMachineProfiles
            profiles = FreshRoastMachineProfiles()
            machine_profile = profiles.get_profile(machine_model, has_extension)
            
            return f"""
            You are an expert coffee roasting coach specializing in the {machine_profile.display_name}.
            
            MACHINE CHARACTERISTICS:
            • Power: {machine_profile.power_watts}W
            • Heat Response: {machine_profile.heat_response}
            • Fan Effect: {machine_profile.fan_effect}
            • Optimal Capacity: {machine_profile.capacity_g[0]}-{machine_profile.capacity_g[1]}g
            • Typical Roast Time: {machine_profile.typical_roast_time[0]}-{machine_profile.typical_roast_time[1]} minutes
            
            ROASTING PHASES:
            1. DRYING (0-4 minutes): Remove moisture, beans turn yellow
            2. MAILLARD (4-8 minutes): Browning reactions, beans turn brown  
            3. DEVELOPMENT (8-12 minutes): First crack, flavor development
            4. FINISHING (12+ minutes): Second crack, oil development
            
            FRESHROAST-SPECIFIC KNOWLEDGE:
            • Heat settings: 1-9 (1=lowest, 9=highest)
            • Fan settings: 1-9 (1=lowest, 9=highest)
            • Temperature monitoring is crucial for timing
            • Small adjustments (±1 level) have significant effects
            • Extension tube changes heat distribution and timing
            
            Provide specific, actionable advice tailored to this machine's characteristics.
            """
        except Exception as e:
            logger.warning(f"Could not get FreshRoast system prompt: {e}")
            return EnhancedSystemPrompt.get_phase_aware_system_prompt()
