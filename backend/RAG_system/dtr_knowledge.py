"""
DTR (Development Time Ratio) Knowledge System for AI Roast Coaching

This module provides comprehensive DTR knowledge for the AI roasting copilot,
including roast level profiles, DTR targets, assessment methods, and coaching guidance.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import logging

logger = logging.getLogger(__name__)

@dataclass
class RoastLevelProfile:
    """Comprehensive profile for each roast level including DTR targets"""
    name: str
    dtr_target_range: Tuple[float, float]  # (min, max) percentage
    drop_temp_range: Tuple[int, int]  # (min, max) Fahrenheit
    development_time_range: Tuple[float, float]  # (min, max) minutes
    total_time_range: Tuple[float, float]  # (min, max) minutes
    characteristics: str
    flavor_profile: str
    common_mistakes: List[str]
    visual_cues: List[str]
    development_guidance: str

class DTRTargets:
    """Development Time Ratio targets and assessment for each roast level"""
    
    ROAST_LEVELS = {
        "City": RoastLevelProfile(
            name="City",
            dtr_target_range=(15, 18),
            drop_temp_range=(400, 410),
            development_time_range=(1.5, 2.5),
            total_time_range=(8, 11),
            characteristics="Light brown, no oil, ended at or shortly after first crack",
            flavor_profile="Bright acidity, origin characteristics pronounced, tea-like body",
            common_mistakes=[
                "Dropping too early (underdeveloped, grassy)",
                "DTR below 15% (baked, not enough development)",
                "Not letting first crack complete",
                "Rushing to temperature without proper development"
            ],
            visual_cues=[
                "Light brown color (cinnamon to light brown)",
                "No oil on surface",
                "First crack just starting or ending",
                "Beans still expanding"
            ],
            development_guidance="Allow first crack to complete fully. Development should be gentle and controlled. Watch for color change from yellow to light brown."
        ),
        
        "City+": RoastLevelProfile(
            name="City Plus",
            dtr_target_range=(17, 20),
            drop_temp_range=(405, 415),
            development_time_range=(2.0, 3.0),
            total_time_range=(9, 12),
            characteristics="Medium brown, no oil, first crack complete",
            flavor_profile="Balanced acidity and body, sweet, approachable",
            common_mistakes=[
                "Rushing development (DTR below 17%)",
                "Not reducing heat after first crack",
                "Confusing with Full City",
                "Stopping too early after first crack"
            ],
            visual_cues=[
                "Medium brown color",
                "No oil visible",
                "First crack completely finished",
                "Slight expansion of beans"
            ],
            development_guidance="Let first crack complete fully, then develop for 2-3 minutes. Reduce heat after first crack to control development."
        ),
        
        "Full City": RoastLevelProfile(
            name="Full City",
            dtr_target_range=(20, 25),
            drop_temp_range=(415, 425),
            development_time_range=(2.5, 3.5),
            total_time_range=(10, 13),
            characteristics="Medium-dark brown, slight oil patches, between cracks",
            flavor_profile="Caramelized sweetness, lower acidity, fuller body",
            common_mistakes=[
                "Insufficient development time (DTR under 20%)",
                "Going into second crack accidentally",
                "Too fast development (rushing to temp)",
                "Not watching for oil development"
            ],
            visual_cues=[
                "Medium-dark brown color",
                "Slight oil patches beginning to appear",
                "Between first and second crack",
                "Beans fully expanded"
            ],
            development_guidance="Develop well after first crack. Watch for oil patches and color darkening. Stop before second crack begins."
        ),
        
        "Full City+": RoastLevelProfile(
            name="Full City Plus",
            dtr_target_range=(22, 28),
            drop_temp_range=(420, 430),
            development_time_range=(3.0, 4.0),
            total_time_range=(11, 14),
            characteristics="Dark brown, oily surface, second crack may begin",
            flavor_profile="Bold, chocolate/spice notes, low acidity, heavy body",
            common_mistakes=[
                "Not enough development (DTR under 22%)",
                "Going too far into second crack",
                "Scorching from excessive development time",
                "Not monitoring oil development"
            ],
            visual_cues=[
                "Dark brown color",
                "Oily surface clearly visible",
                "Second crack may just begin",
                "Beans fully developed"
            ],
            development_guidance="Allow significant development after first crack. Watch for oil development and color darkening. Can go slightly into second crack."
        )
    }
    
    @classmethod
    def get_profile(cls, roast_level: str) -> Optional[RoastLevelProfile]:
        """Get roast level profile by name with flexible matching"""
        # Handle variations in naming
        level_map = {
            "city": "City",
            "city plus": "City+",
            "city+": "City+",
            "full city": "Full City",
            "full city plus": "Full City+",
            "full city+": "Full City+"
        }
        
        normalized = level_map.get(roast_level.lower(), roast_level)
        return cls.ROAST_LEVELS.get(normalized)
    
    @classmethod
    def calculate_dtr(cls, first_crack_time_sec: int, drop_time_sec: int) -> float:
        """Calculate DTR percentage from first crack to drop"""
        if drop_time_sec <= 0 or first_crack_time_sec >= drop_time_sec:
            return 0.0
        
        development_time = drop_time_sec - first_crack_time_sec
        total_time = drop_time_sec
        
        dtr = (development_time / total_time) * 100
        return round(dtr, 1)
    
    @classmethod
    def assess_dtr(cls, current_dtr: float, target_range: Tuple[float, float], roast_level: str) -> Dict[str, Any]:
        """Comprehensive DTR assessment with coaching guidance"""
        min_dtr, max_dtr = target_range
        
        if current_dtr < min_dtr:
            status = "too_low"
            urgency = "high" if current_dtr < (min_dtr - 3) else "medium"
            message = f"DTR {current_dtr:.1f}% is BELOW target ({min_dtr}-{max_dtr}%). Roast is underdeveloped."
            coaching = cls._get_underdeveloped_coaching(roast_level, current_dtr, min_dtr)
        elif current_dtr > max_dtr:
            status = "too_high"
            urgency = "high" if current_dtr > (max_dtr + 3) else "medium"
            message = f"DTR {current_dtr:.1f}% is ABOVE target ({min_dtr}-{max_dtr}%). Risk of over-development."
            coaching = cls._get_overdeveloped_coaching(roast_level, current_dtr, max_dtr)
        else:
            status = "on_target"
            urgency = "low"
            message = f"DTR {current_dtr:.1f}% is ON TARGET ({min_dtr}-{max_dtr}%). ✓"
            coaching = cls._get_optimal_coaching(roast_level, current_dtr)
        
        return {
            "status": status,
            "urgency": urgency,
            "message": message,
            "current_dtr": current_dtr,
            "target_range": target_range,
            "coaching": coaching
        }
    
    @classmethod
    def _get_underdeveloped_coaching(cls, roast_level: str, current_dtr: float, target_min: float) -> str:
        """Get coaching for underdeveloped roasts"""
        profile = cls.get_profile(roast_level)
        if not profile:
            return "Continue development - roast needs more time after first crack."
        
        deficit = target_min - current_dtr
        if deficit > 5:
            return f"🚨 CRITICAL: DTR {current_dtr:.1f}% is {deficit:.1f}% below target. Roast is severely underdeveloped. Continue development for at least 2-3 more minutes. Watch for {profile.visual_cues[0]}."
        elif deficit > 2:
            return f"⚠️ DTR {current_dtr:.1f}% is {deficit:.1f}% below target. Need more development time. Continue for 1-2 minutes, watching for {profile.visual_cues[0]}."
        else:
            return f"✓ Almost there! DTR {current_dtr:.1f}% is close to target. Continue development for 30-60 seconds, watching for {profile.visual_cues[0]}."
    
    @classmethod
    def _get_overdeveloped_coaching(cls, roast_level: str, current_dtr: float, target_max: float) -> str:
        """Get coaching for overdeveloped roasts"""
        profile = cls.get_profile(roast_level)
        if not profile:
            return "Development is getting long - consider dropping soon."
        
        excess = current_dtr - target_max
        if excess > 5:
            return f"🚨 CRITICAL: DTR {current_dtr:.1f}% is {excess:.1f}% above target. Roast is overdeveloped. Drop immediately to prevent over-roasting."
        elif excess > 2:
            return f"⚠️ DTR {current_dtr:.1f}% is {excess:.1f}% above target. Development is getting long. Consider dropping soon to avoid over-roasting."
        else:
            return f"✓ DTR {current_dtr:.1f}% is slightly above target but acceptable. Monitor closely - drop if you see {profile.visual_cues[-1]}."
    
    @classmethod
    def _get_optimal_coaching(cls, roast_level: str, current_dtr: float) -> str:
        """Get coaching for optimal DTR"""
        profile = cls.get_profile(roast_level)
        if not profile:
            return "DTR is on target - continue monitoring development."
        
        return f"🎯 Perfect! DTR {current_dtr:.1f}% is on target. Continue development while watching for {profile.visual_cues[0]}. {profile.development_guidance}"
    
    @classmethod
    def get_development_guidance(cls, roast_level: str, current_phase: str, elapsed_time: float, first_crack_time: Optional[float] = None) -> str:
        """Get phase-specific development guidance"""
        profile = cls.get_profile(roast_level)
        if not profile:
            return "Continue monitoring roast development."
        
        if current_phase == "development" and first_crack_time:
            current_dtr = cls.calculate_dtr(int(first_crack_time), int(elapsed_time))
            assessment = cls.assess_dtr(current_dtr, profile.dtr_target_range, roast_level)
            return assessment["coaching"]
        
        # Pre-development guidance
        if current_phase == "maillard":
            return f"🎯 Preparing for {roast_level} development: Target DTR {profile.dtr_target_range[0]}-{profile.dtr_target_range[1]}%. Watch for first crack, then develop for {profile.development_time_range[0]}-{profile.development_time_range[1]} minutes."
        
        return f"🎯 {roast_level} target: DTR {profile.dtr_target_range[0]}-{profile.dtr_target_range[1]}%, drop temp {profile.drop_temp_range[0]}-{profile.drop_temp_range[1]}°F"

class DTRCoach:
    """AI coaching system that integrates DTR knowledge with roast progression"""
    
    def __init__(self):
        self.dtr_targets = DTRTargets()
    
    def get_dtr_aware_coaching(
        self,
        roast_level: str,
        current_phase: str,
        elapsed_time: float,
        first_crack_time: Optional[float] = None,
        current_temp: Optional[float] = None,
        ror: Optional[float] = None
    ) -> Dict[str, Any]:
        """Get comprehensive DTR-aware coaching"""
        
        profile = self.dtr_targets.get_profile(roast_level)
        if not profile:
            return {
                "dtr_status": "unknown",
                "coaching": f"Unknown roast level: {roast_level}",
                "recommendations": []
            }
        
        coaching_data = {
            "roast_level": roast_level,
            "target_dtr_range": profile.dtr_target_range,
            "target_drop_temp": profile.drop_temp_range,
            "current_phase": current_phase,
            "elapsed_time": elapsed_time
        }
        
        # Calculate current DTR if in development phase
        if current_phase == "development" and first_crack_time:
            current_dtr = self.dtr_targets.calculate_dtr(int(first_crack_time), int(elapsed_time))
            assessment = self.dtr_targets.assess_dtr(current_dtr, profile.dtr_target_range, roast_level)
            
            coaching_data.update({
                "current_dtr": current_dtr,
                "dtr_status": assessment["status"],
                "dtr_urgency": assessment["urgency"],
                "dtr_message": assessment["message"],
                "coaching": assessment["coaching"]
            })
            
            # Add temperature and ROR guidance
            if current_temp:
                temp_guidance = self._get_temperature_guidance(current_temp, profile.drop_temp_range, current_dtr, profile.dtr_target_range)
                coaching_data["temperature_guidance"] = temp_guidance
            
            if ror:
                ror_guidance = self._get_ror_guidance(ror, current_phase, assessment["status"])
                coaching_data["ror_guidance"] = ror_guidance
        else:
            # Pre-development guidance
            coaching_data.update({
                "dtr_status": "pre_development",
                "coaching": self.dtr_targets.get_development_guidance(roast_level, current_phase, elapsed_time, first_crack_time)
            })
        
        # Add roast level specific recommendations
        coaching_data["recommendations"] = self._get_roast_level_recommendations(roast_level, current_phase)
        
        return coaching_data
    
    def _get_temperature_guidance(self, current_temp: float, target_range: Tuple[int, int], current_dtr: float, dtr_range: Tuple[float, float]) -> str:
        """Get temperature-based guidance considering DTR"""
        min_temp, max_temp = target_range
        min_dtr, max_dtr = dtr_range
        
        if current_temp < min_temp - 10:
            return f"🌡️ Temperature {current_temp:.0f}°F is low. Increase heat to reach {min_temp}-{max_temp}°F range for proper development."
        elif current_temp > max_temp + 10:
            return f"🌡️ Temperature {current_temp:.0f}°F is high. Reduce heat to stay in {min_temp}-{max_temp}°F range to avoid over-roasting."
        else:
            if current_dtr < min_dtr:
                return f"🌡️ Temperature {current_temp:.0f}°F is good, but DTR is low. Maintain heat and extend development time."
            elif current_dtr > max_dtr:
                return f"🌡️ Temperature {current_temp:.0f}°F is good, but DTR is high. Consider reducing heat to slow development."
            else:
                return f"🌡️ Temperature {current_temp:.0f}°F is perfect for development. Continue monitoring DTR."
    
    def _get_ror_guidance(self, ror: float, current_phase: str, dtr_status: str) -> str:
        """Get Rate of Rise guidance considering DTR status"""
        if current_phase == "development":
            if ror > 15:
                if dtr_status == "too_high":
                    return f"📈 ROR {ror:.1f}°F/min is too fast! Reduce heat immediately to slow development and prevent over-roasting."
                else:
                    return f"📈 ROR {ror:.1f}°F/min is high. Consider reducing heat to control development pace."
            elif ror < 5:
                if dtr_status == "too_low":
                    return f"📈 ROR {ror:.1f}°F/min is too slow. Increase heat to accelerate development and improve DTR."
                else:
                    return f"📈 ROR {ror:.1f}°F/min is low but acceptable. Monitor DTR closely."
            else:
                return f"📈 ROR {ror:.1f}°F/min is good for development phase."
        
        return f"📈 ROR {ror:.1f}°F/min in {current_phase} phase."
    
    def _get_roast_level_recommendations(self, roast_level: str, current_phase: str) -> List[str]:
        """Get roast level specific recommendations"""
        profile = self.dtr_targets.get_profile(roast_level)
        if not profile:
            return []
        
        recommendations = []
        
        if current_phase == "development":
            recommendations.extend([
                f"🎯 Target DTR: {profile.dtr_target_range[0]}-{profile.dtr_target_range[1]}%",
                f"🌡️ Drop temperature: {profile.drop_temp_range[0]}-{profile.drop_temp_range[1]}°F",
                f"👀 Watch for: {', '.join(profile.visual_cues[:2])}"
            ])
        
        if current_phase == "maillard":
            recommendations.append(f"🎯 Preparing for {roast_level}: {profile.development_guidance}")
        
        # Add common mistakes to avoid
        if len(profile.common_mistakes) > 0:
            recommendations.append(f"⚠️ Avoid: {profile.common_mistakes[0]}")
        
        return recommendations

# Global instance for easy access
dtr_coach = DTRCoach()
