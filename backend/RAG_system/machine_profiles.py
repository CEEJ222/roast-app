from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class RoastModel(Enum):
    SR540 = "SR540"
    SR540_ET = "SR540_ET"  # With Extension Tube
    SR800 = "SR800"
    SR800_ET = "SR800_ET"  # With Extension Tube

@dataclass
class MachineCharacteristics:
    """Detailed machine-specific characteristics"""
    model: RoastModel
    display_name: str
    capacity_g: tuple  # (min, max) in grams
    heat_levels: int  # Number of heat settings
    fan_levels: int  # Number of fan settings
    typical_roast_time: tuple  # (min, max) in minutes
    power_watts: int
    chamber_volume_ml: int
    
    # Machine-specific behavior
    heat_response: str  # How quickly heat changes affect temperature
    fan_effect: str  # How fan affects temperature and airflow
    
    # Phase-specific recommendations
    drying_phase: Dict[str, any]
    maillard_phase: Dict[str, any]
    development_phase: Dict[str, any]
    
    # Common issues and solutions
    common_issues: List[str]
    pro_tips: List[str]
    
    # Extension tube effects (if applicable)
    extension_effects: Optional[Dict[str, str]] = None

class FreshRoastMachineProfiles:
    """Comprehensive FreshRoast machine profiles based on real-world usage"""
    
    def __init__(self):
        self.profiles = {
            RoastModel.SR540: MachineCharacteristics(
                model=RoastModel.SR540,
                display_name="FreshRoast SR540",
                capacity_g=(85, 120),  # Optimal range
                heat_levels=9,
                fan_levels=9,
                typical_roast_time=(8, 12),
                power_watts=1400,
                chamber_volume_ml=450,
                
                heat_response="FAST - Heat changes affect temperature within 15-20 seconds",
                fan_effect="SIGNIFICANT - Higher fan (7-9) can reduce temperature by 20-30°F",
                
                drying_phase={
                    "duration_minutes": (2.5, 4),
                    "recommended_heat": (7, 9),
                    "recommended_fan": (7, 9),
                    "target_temp_range": (250, 300),
                    "target_temp_range_builtin": (280, 330),  # Built-in sensor reads higher
                    "target_temp_range_probe": (250, 300),    # Probe measures actual bean temp
                    "advice": "SR540 runs hot - start with heat 7-8, fan 8-9. Watch for yellowing by 3 minutes.",
                    "common_mistake": "Using too much heat (9) from start causes scorching"
                },
                
                maillard_phase={
                    "duration_minutes": (3, 5),
                    "recommended_heat": (6, 8),
                    "recommended_fan": (7, 8),
                    "target_temp_range": (300, 385),
                    "target_temp_range_builtin": (325, 410),  # Built-in sensor reads higher
                    "target_temp_range_probe": (300, 385),   # Probe measures actual bean temp
                    "advice": "Reduce heat to 6-7 as beans brown. Maintain fan at 8 for even roasting.",
                    "common_mistake": "Not reducing heat early enough - leads to tipping"
                },
                
                development_phase={
                    "duration_minutes": (2, 4),
                    "recommended_heat": (4, 6),
                    "recommended_fan": (6, 7),
                    "target_temp_range": (385, 425),
                    "target_temp_range_builtin": (420, 460),  # Built-in sensor reads higher
                    "target_temp_range_probe": (385, 425),   # Probe measures actual bean temp
                    "development_time_pct": (15, 25),  # 15-25% of total roast
                    "dtr_targets": {
                        "City": (15, 18),
                        "City+": (17, 20),
                        "Full City": (20, 25),
                        "Full City+": (22, 28)
                    },
                    "advice": "For City+, drop at 405-410°F. Reduce heat to 5-6 after first crack starts. Monitor DTR closely - SR540 responds fast to heat changes.",
                    "common_mistake": "Letting temperature spike after first crack - watch DTR to prevent over-development"
                },
                
                common_issues=[
                    "Scorching on bottom of beans - Reduce heat by 1-2 levels",
                    "Uneven roast - Increase fan to improve circulation",
                    "Stalling before first crack - Increase heat by 1 level",
                    "Beans flying out - Reduce fan, batch may be too small",
                    "Chaff buildup - Clean chaff collector between roasts"
                ],
                
                pro_tips=[
                    "Preheat for 30 seconds on heat 9, fan 9 before adding beans",
                    "For darker roasts, use lower batch size (90-100g)",
                    "Watch for 'second crack' around 420-430°F",
                    "Cool beans immediately - use colander with fan",
                    "SR540 responds quickly - make small adjustments"
                ]
            ),
            
            RoastModel.SR540_ET: MachineCharacteristics(
                model=RoastModel.SR540_ET,
                display_name="FreshRoast SR540 + Extension Tube",
                capacity_g=(120, 150),  # Larger with extension
                heat_levels=9,
                fan_levels=9,
                typical_roast_time=(10, 14),  # Longer with more beans
                power_watts=1400,
                chamber_volume_ml=650,  # Increased volume
                
                heat_response="MODERATE - Extension tube buffers heat changes, 25-30 seconds response time",
                fan_effect="REDUCED - Extension tube reduces fan effectiveness, need higher fan settings",
                
                drying_phase={
                    "duration_minutes": (3, 5),
                    "recommended_heat": (8, 9),
                    "recommended_fan": (9, 9),  # Max fan needed
                    "target_temp_range": (250, 300),
                    "target_temp_range_builtin": (280, 330),  # Built-in sensor reads higher
                    "target_temp_range_probe": (250, 300),    # Probe measures actual bean temp
                    "advice": "Extension tube requires MORE heat and fan. Start heat 8-9, fan 9. Expect slower start.",
                    "common_mistake": "Not using enough heat/fan - beans stay green too long"
                },
                
                maillard_phase={
                    "duration_minutes": (4, 6),
                    "recommended_heat": (7, 9),
                    "recommended_fan": (8, 9),
                    "target_temp_range": (300, 385),
                    "target_temp_range_builtin": (325, 410),  # Built-in sensor reads higher
                    "target_temp_range_probe": (300, 385),   # Probe measures actual bean temp
                    "advice": "Keep heat at 7-8. Extension tube provides more even heat distribution.",
                    "common_mistake": "Reducing heat too early - extension tube needs sustained heat"
                },
                
                development_phase={
                    "duration_minutes": (2.5, 4.5),
                    "recommended_heat": (5, 7),
                    "recommended_fan": (7, 8),
                    "target_temp_range": (385, 425),
                    "target_temp_range_builtin": (420, 460),  # Built-in sensor reads higher
                    "target_temp_range_probe": (385, 425),   # Probe measures actual bean temp
                    "development_time_pct": (15, 25),
                    "dtr_targets": {
                        "City": (15, 18),
                        "City+": (17, 20),
                        "Full City": (20, 25),
                        "Full City+": (22, 28)
                    },
                    "advice": "Extension tube gives more control. Can maintain heat at 6-7 through development. Monitor DTR - extension tube provides stable development environment.",
                    "common_mistake": "Over-controlling - extension tube is forgiving, trust the process but watch DTR for proper development"
                },
                
                common_issues=[
                    "Slow roast (>14 min) - Use higher heat throughout",
                    "Uneven roast - Extension tube actually helps, but ensure beans circulating",
                    "Can't reach temperature - Increase heat earlier in roast",
                    "Baking (flat taste) - Roast is too slow, use more heat",
                    "Extension tube too hot to touch - Normal, use heat-resistant gloves"
                ],
                
                pro_tips=[
                    "Extension tube adds 2-3 minutes to roast time",
                    "Can handle 130-140g batches reliably",
                    "More forgiving than without extension - less scorching risk",
                    "Preheat with extension tube for 45 seconds",
                    "Extension tube retains heat - cool beans quickly after drop"
                ],
                
                extension_effects={
                    "capacity": "Increase by 25-35g (120-150g total)",
                    "roast_time": "Add 2-3 minutes to expected time",
                    "heat_distribution": "More even, less scorching risk",
                    "fan_requirement": "Need fan at 8-9 for adequate circulation",
                    "temperature_response": "Slower, more gradual changes"
                }
            ),
            
            RoastModel.SR800: MachineCharacteristics(
                model=RoastModel.SR800,
                display_name="FreshRoast SR800",
                capacity_g=(110, 150),
                heat_levels=9,
                fan_levels=9,
                typical_roast_time=(8, 13),
                power_watts=1500,
                chamber_volume_ml=550,
                
                heat_response="VERY FAST - Heat changes affect temperature in 10-15 seconds",
                fan_effect="POWERFUL - Fan has strong effect, use carefully",
                
                drying_phase={
                    "duration_minutes": (2.5, 4),
                    "recommended_heat": (6, 8),
                    "recommended_fan": (8, 9),
                    "target_temp_range": (250, 300),
                    "target_temp_range_builtin": (280, 330),  # Built-in sensor reads higher
                    "target_temp_range_probe": (250, 300),    # Probe measures actual bean temp
                    "advice": "SR800 is VERY powerful. Start heat 6-7, fan 8-9. Higher power than SR540!",
                    "common_mistake": "Using SR540 settings - SR800 needs LESS heat initially"
                },
                
                maillard_phase={
                    "duration_minutes": (3, 5),
                    "recommended_heat": (5, 7),
                    "recommended_fan": (7, 8),
                    "target_temp_range": (300, 385),
                    "target_temp_range_builtin": (325, 410),  # Built-in sensor reads higher
                    "target_temp_range_probe": (300, 385),   # Probe measures actual bean temp
                    "advice": "SR800 heats aggressively. Heat 5-6 often sufficient. Monitor ROR closely.",
                    "common_mistake": "Too much heat - SR800 overshoots easily"
                },
                
                development_phase={
                    "duration_minutes": (2, 4),
                    "recommended_heat": (4, 6),
                    "recommended_fan": (6, 8),
                    "target_temp_range": (385, 430),
                    "target_temp_range_builtin": (420, 465),  # Built-in sensor reads higher
                    "target_temp_range_probe": (385, 430),   # Probe measures actual bean temp
                    "development_time_pct": (15, 25),
                    "dtr_targets": {
                        "City": (15, 18),
                        "City+": (17, 20),
                        "Full City": (20, 25),
                        "Full City+": (22, 28)
                    },
                    "advice": "Heat 4-5 often enough after first crack. SR800 maintains momentum well. CRITICAL: Monitor DTR closely - SR800's power can cause rapid development.",
                    "common_mistake": "Not reducing heat enough - temperature spikes and DTR can get too high quickly with SR800's power"
                },
                
                common_issues=[
                    "Temperature spiking - SR800 is powerful, reduce heat by 2 levels if spiking",
                    "First crack too early (<7 min) - Started with too much heat",
                    "Scorching - Reduce heat and/or increase fan",
                    "Beans flying everywhere - Reduce fan to 7-8",
                    "Inconsistent batches - SR800 is sensitive, be consistent with settings"
                ],
                
                pro_tips=[
                    "SR800 is MORE powerful than SR540 - use lower heat settings",
                    "Can handle 130-140g batches well",
                    "Preheat 30 seconds at heat 8, fan 9",
                    "Quick response time - make small adjustments (±1 level)",
                    "SR800 excels at lighter roasts - great control in development"
                ]
            ),
            
            RoastModel.SR800_ET: MachineCharacteristics(
                model=RoastModel.SR800_ET,
                display_name="FreshRoast SR800 + Extension Tube",
                capacity_g=(140, 180),
                heat_levels=9,
                fan_levels=9,
                typical_roast_time=(10, 15),
                power_watts=1500,
                chamber_volume_ml=750,
                
                heat_response="MODERATE - Extension buffers SR800's power, 20-25 seconds response",
                fan_effect="STRONG BUT BUFFERED - Extension tube moderates fan effect",
                
                drying_phase={
                    "duration_minutes": (3, 5),
                    "recommended_heat": (7, 9),
                    "recommended_fan": (9, 9),
                    "target_temp_range": (250, 300),
                    "target_temp_range_builtin": (280, 330),  # Built-in sensor reads higher
                    "target_temp_range_probe": (250, 300),    # Probe measures actual bean temp
                    "advice": "SR800+ET is the BEST combination - powerful heat with extension control. Heat 7-8, fan 9.",
                    "common_mistake": "Being too conservative - SR800+ET can handle higher heat than SR540+ET"
                },
                
                maillard_phase={
                    "duration_minutes": (4, 6),
                    "recommended_heat": (6, 8),
                    "recommended_fan": (8, 9),
                    "target_temp_range": (300, 385),
                    "target_temp_range_builtin": (325, 410),  # Built-in sensor reads higher
                    "target_temp_range_probe": (300, 385),   # Probe measures actual bean temp
                    "advice": "Sweet spot for SR800+ET. Heat 6-7 gives excellent control and even roasting.",
                    "common_mistake": "Forgetting you have SR800 power - can use lower heat than you think"
                },
                
                development_phase={
                    "duration_minutes": (2.5, 5),
                    "recommended_heat": (5, 7),
                    "recommended_fan": (7, 8),
                    "target_temp_range": (385, 430),
                    "target_temp_range_builtin": (420, 465),  # Built-in sensor reads higher
                    "target_temp_range_probe": (385, 430),   # Probe measures actual bean temp
                    "development_time_pct": (15, 25),
                    "dtr_targets": {
                        "City": (15, 18),
                        "City+": (17, 20),
                        "Full City": (20, 25),
                        "Full City+": (22, 28)
                    },
                    "advice": "SR800+ET gives best development control. Heat 5-6 is often perfect. Monitor DTR - this combination provides excellent development control.",
                    "common_mistake": "Over-adjusting - let the machine work, it's very stable, but still monitor DTR for optimal development"
                },
                
                common_issues=[
                    "Roast too fast (under 10 min) - Reduce heat by 1-2 levels throughout",
                    "Roast too slow (over 15 min) - Increase heat, especially in drying",
                    "Uneven roast - Rare with SR800+ET, check batch size (may be too small)",
                    "Can't cool fast enough - SR800+ET holds heat, use vigorous cooling method",
                    "Extension tube very hot - Normal with SR800, always use protection"
                ],
                
                pro_tips=[
                    "SR800+ET is the ULTIMATE home roaster setup - most control",
                    "Can handle 150-170g batches reliably",
                    "Best for darker roasts (Full City+, Vienna)",
                    "Most forgiving combination - great for beginners",
                    "Preheat 45-60 seconds for larger batches",
                    "Extension tube + SR800 power = most consistent results"
                ],
                
                extension_effects={
                    "capacity": "Increase by 30-40g (140-180g total)",
                    "roast_time": "Add 2-3 minutes, but SR800 power compensates somewhat",
                    "heat_distribution": "Excellent - best evenness of all configurations",
                    "fan_requirement": "Fan 9 recommended, but very effective due to SR800 power",
                    "temperature_response": "Balanced - not too fast, not too slow"
                }
            )
        }
    
    def get_profile(self, model: str, has_extension: bool) -> MachineCharacteristics:
        """Get machine profile based on model and extension tube presence"""
        
        # Map from your database enum to RoastModel
        model_map = {
            ("SR540", False): RoastModel.SR540,
            ("SR540", True): RoastModel.SR540_ET,
            ("SR800", False): RoastModel.SR800,
            ("SR800", True): RoastModel.SR800_ET,
        }
        
        roast_model = model_map.get((model, has_extension))
        if not roast_model:
            raise ValueError(f"Unknown machine configuration: {model} with extension={has_extension}")
        
        return self.profiles[roast_model]
    
    def get_sensor_specific_temp_range(
        self,
        profile: MachineCharacteristics,
        phase: str,
        sensor_type: str
    ) -> Tuple[float, float]:
        """Get temperature range for specific sensor type and phase"""
        phase_data = getattr(profile, f"{phase}_phase", None)
        if not phase_data:
            return (0, 0)
        
        # Return sensor-specific range if available
        if sensor_type == 'builtin' and 'target_temp_range_builtin' in phase_data:
            return phase_data['target_temp_range_builtin']
        elif sensor_type == 'probe' and 'target_temp_range_probe' in phase_data:
            return phase_data['target_temp_range_probe']
        else:
            # Fallback to default range
            return phase_data.get('target_temp_range', (0, 0))
    
    def get_phase_specific_advice(
        self, 
        profile: MachineCharacteristics, 
        phase: str,
        current_heat: int,
        current_fan: int,
        elapsed_seconds: int
    ) -> str:
        """Get machine-specific advice for current phase"""
        
        phase_data = getattr(profile, f"{phase}_phase", None)
        if not phase_data:
            return ""
        
        advice_parts = []
        
        # Current settings assessment
        rec_heat = phase_data["recommended_heat"]
        rec_fan = phase_data["recommended_fan"]
        
        # Heat advice
        if current_heat < rec_heat[0]:
            advice_parts.append(
                f"⚠️ Heat at {current_heat} is LOW for {profile.display_name} in {phase} phase. "
                f"Consider increasing to {rec_heat[0]}-{rec_heat[1]}."
            )
        elif current_heat > rec_heat[1]:
            advice_parts.append(
                f"🔥 Heat at {current_heat} is HIGH for {profile.display_name}. "
                f"Recommended range: {rec_heat[0]}-{rec_heat[1]}. Watch for scorching!"
            )
        else:
            advice_parts.append(
                f"✓ Heat at {current_heat} is good for {phase} phase."
            )
        
        # Fan advice
        if current_fan < rec_fan[0]:
            advice_parts.append(
                f"⚠️ Fan at {current_fan} may be too LOW. "
                f"Recommended: {rec_fan[0]}-{rec_fan[1]} for proper circulation."
            )
        elif current_fan > rec_fan[1]:
            advice_parts.append(
                f"💨 Fan at {current_fan} is very HIGH. May cool beans too much."
            )
        
        # Phase-specific advice
        advice_parts.append(f"\n📋 {phase.upper()} PHASE GUIDANCE:")
        advice_parts.append(phase_data["advice"])
        
        # Common mistake warning
        advice_parts.append(f"\n⚠️ Common mistake: {phase_data['common_mistake']}")
        
        return "\n".join(advice_parts)
    
    def get_heat_recommendation(
        self,
        profile: MachineCharacteristics,
        phase: str,
        current_temp: float,
        target_temp: float,
        ror: float
    ) -> Dict[str, any]:
        """Get specific heat/fan recommendation based on machine and conditions"""
        
        phase_data = getattr(profile, f"{phase}_phase", None)
        if not phase_data:
            return {"action": "maintain", "reasoning": "Unknown phase"}
        
        rec_heat_range = phase_data["recommended_heat"]
        target_range = phase_data["target_temp_range"]
        
        recommendations = {
            "heat_action": "maintain",
            "fan_action": "maintain",
            "heat_change": 0,
            "fan_change": 0,
            "reasoning": "",
            "urgency": "normal"
        }
        
        # Analyze temperature vs target
        if current_temp < target_range[0] - 20:
            # Too cold
            recommendations["heat_action"] = "increase"
            recommendations["heat_change"] = 2 if "SR800" in profile.model.value else 1
            recommendations["reasoning"] = f"Temperature {current_temp:.0f}°F is below target range {target_range[0]}-{target_range[1]}°F"
            recommendations["urgency"] = "high"
            
        elif current_temp > target_range[1] + 20:
            # Too hot
            recommendations["heat_action"] = "decrease"
            recommendations["heat_change"] = -2
            recommendations["fan_action"] = "increase"
            recommendations["fan_change"] = 1
            recommendations["reasoning"] = f"Temperature {current_temp:.0f}°F is above target range"
            recommendations["urgency"] = "urgent"
        
        # Analyze ROR
        if ror > 15:
            recommendations["heat_action"] = "decrease"
            recommendations["heat_change"] = -1
            recommendations["reasoning"] += f" | ROR {ror:.1f}°F/min is too fast"
            recommendations["urgency"] = "high"
            
        elif ror < 5 and phase != "drying":
            recommendations["heat_action"] = "increase"
            recommendations["heat_change"] = 1
            recommendations["reasoning"] += f" | ROR {ror:.1f}°F/min is too slow"
        
        # Machine-specific adjustments
        if "SR800" in profile.model.value:
            # SR800 is more powerful - be more conservative
            recommendations["heat_change"] = max(-1, min(1, recommendations["heat_change"]))
            recommendations["reasoning"] += f" | {profile.display_name} responds quickly, small adjustment recommended"
        
        return recommendations
    
    def get_dtr_aware_development_advice(
        self,
        profile: MachineCharacteristics,
        roast_level: str,
        current_dtr: float,
        current_heat: int,
        current_fan: int,
        current_temp: float,
        ror: float
    ) -> Dict[str, Any]:
        """Get DTR-aware development advice for specific machine and roast level"""
        
        # Get DTR targets for this roast level
        phase_data = profile.development_phase
        dtr_targets = phase_data.get("dtr_targets", {})
        target_dtr_range = dtr_targets.get(roast_level, (20, 25))  # Default fallback
        
        # Assess current DTR status
        min_dtr, max_dtr = target_dtr_range
        if current_dtr < min_dtr:
            dtr_status = "underdeveloped"
            urgency = "high" if current_dtr < (min_dtr - 3) else "medium"
        elif current_dtr > max_dtr:
            dtr_status = "overdeveloped"
            urgency = "high" if current_dtr > (max_dtr + 3) else "medium"
        else:
            dtr_status = "on_target"
            urgency = "low"
        
        # Get machine-specific recommendations
        recommendations = {
            "dtr_status": dtr_status,
            "urgency": urgency,
            "current_dtr": current_dtr,
            "target_dtr_range": target_dtr_range,
            "heat_recommendation": self._get_dtr_heat_recommendation(profile, dtr_status, current_heat, current_temp, ror),
            "fan_recommendation": self._get_dtr_fan_recommendation(profile, dtr_status, current_fan, current_temp, ror),
            "coaching_message": self._get_dtr_coaching_message(profile, roast_level, dtr_status, current_dtr, target_dtr_range)
        }
        
        return recommendations
    
    def _get_dtr_heat_recommendation(
        self,
        profile: MachineCharacteristics,
        dtr_status: str,
        current_heat: int,
        current_temp: float,
        ror: float
    ) -> Dict[str, Any]:
        """Get heat recommendation based on DTR status and machine characteristics"""
        
        phase_data = profile.development_phase
        rec_heat_range = phase_data["recommended_heat"]
        target_temp_range = phase_data["target_temp_range"]
        
        recommendation = {
            "action": "maintain",
            "change": 0,
            "reasoning": "",
            "urgency": "normal"
        }
        
        if dtr_status == "underdeveloped":
            # Need more development - increase heat if temp is low
            if current_temp < target_temp_range[0]:
                recommendation["action"] = "increase"
                recommendation["change"] = 1 if "SR800" in profile.model.value else 2
                recommendation["reasoning"] = f"DTR too low and temperature low ({current_temp:.0f}°F) - increase heat for more development"
                recommendation["urgency"] = "high"
            else:
                recommendation["reasoning"] = f"DTR too low but temperature good - maintain heat and extend development time"
                
        elif dtr_status == "overdeveloped":
            # Development going too fast - reduce heat
            recommendation["action"] = "decrease"
            recommendation["change"] = -2 if "SR800" in profile.model.value else -1
            recommendation["reasoning"] = f"DTR too high - reduce heat to slow development"
            recommendation["urgency"] = "high"
            
        else:  # on_target
            # Maintain current settings but watch for changes
            if ror > 15:
                recommendation["action"] = "decrease"
                recommendation["change"] = -1
                recommendation["reasoning"] = f"DTR on target but ROR high ({ror:.1f}°F/min) - reduce heat slightly"
            elif ror < 5:
                recommendation["action"] = "increase"
                recommendation["change"] = 1
                recommendation["reasoning"] = f"DTR on target but ROR low ({ror:.1f}°F/min) - increase heat slightly"
            else:
                recommendation["reasoning"] = f"DTR on target - maintain current heat settings"
        
        return recommendation
    
    def _get_dtr_fan_recommendation(
        self,
        profile: MachineCharacteristics,
        dtr_status: str,
        current_fan: int,
        current_temp: float,
        ror: float
    ) -> Dict[str, Any]:
        """Get fan recommendation based on DTR status and machine characteristics"""
        
        phase_data = profile.development_phase
        rec_fan_range = phase_data["recommended_fan"]
        
        recommendation = {
            "action": "maintain",
            "change": 0,
            "reasoning": "",
            "urgency": "normal"
        }
        
        if dtr_status == "overdeveloped" and ror > 15:
            # High ROR and overdeveloped - increase fan to cool
            recommendation["action"] = "increase"
            recommendation["change"] = 1
            recommendation["reasoning"] = f"DTR too high and ROR high ({ror:.1f}°F/min) - increase fan to cool and slow development"
            recommendation["urgency"] = "high"
        elif current_fan < rec_fan_range[0]:
            recommendation["action"] = "increase"
            recommendation["change"] = 1
            recommendation["reasoning"] = f"Fan at {current_fan} is below recommended range {rec_fan_range[0]}-{rec_fan_range[1]}"
        elif current_fan > rec_fan_range[1]:
            recommendation["action"] = "decrease"
            recommendation["change"] = -1
            recommendation["reasoning"] = f"Fan at {current_fan} is above recommended range {rec_fan_range[0]}-{rec_fan_range[1]}"
        else:
            recommendation["reasoning"] = f"Fan at {current_fan} is good for development phase"
        
        return recommendation
    
    def _get_dtr_coaching_message(
        self,
        profile: MachineCharacteristics,
        roast_level: str,
        dtr_status: str,
        current_dtr: float,
        target_dtr_range: Tuple[float, float]
    ) -> str:
        """Get coaching message based on DTR status and machine characteristics"""
        
        min_dtr, max_dtr = target_dtr_range
        machine_name = profile.display_name
        
        if dtr_status == "underdeveloped":
            deficit = min_dtr - current_dtr
            if deficit > 5:
                return f"🚨 CRITICAL: DTR {current_dtr:.1f}% is {deficit:.1f}% below target for {roast_level}. {machine_name} needs more development time. Increase heat if temperature is low, or extend development time."
            elif deficit > 2:
                return f"⚠️ DTR {current_dtr:.1f}% is {deficit:.1f}% below target. {machine_name} needs more development. Continue for 1-2 minutes, watching for color change."
            else:
                return f"✓ DTR {current_dtr:.1f}% is close to target. Continue development for 30-60 seconds with {machine_name}."
                
        elif dtr_status == "overdeveloped":
            excess = current_dtr - max_dtr
            if excess > 5:
                return f"🚨 CRITICAL: DTR {current_dtr:.1f}% is {excess:.1f}% above target. {machine_name} roast is overdeveloped. Drop immediately to prevent over-roasting."
            elif excess > 2:
                return f"⚠️ DTR {current_dtr:.1f}% is {excess:.1f}% above target. {machine_name} development is getting long. Consider dropping soon."
            else:
                return f"✓ DTR {current_dtr:.1f}% is slightly above target but acceptable for {roast_level}. Monitor closely with {machine_name}."
        else:
            return f"🎯 Perfect! DTR {current_dtr:.1f}% is on target for {roast_level}. {machine_name} is performing well. Continue monitoring development."
