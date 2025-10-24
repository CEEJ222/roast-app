"""
DTR (Development Time Ratio) Coaching System
Provides sophisticated roast development tracking and guidance
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from enum import Enum

class RoastLevel(Enum):
    CINNAMON = "Cinnamon"
    LIGHT_CITY = "Light City"
    CITY = "City"
    CITY_PLUS = "City+"
    FULL_CITY = "Full City"
    FULL_CITY_PLUS = "Full City+"
    VIENNA = "Vienna"
    FRENCH = "French"

@dataclass
class DTRProfile:
    """DTR profile for a specific roast level"""
    name: str
    dtr_target_range: tuple  # (min, max) percentage
    drop_temp_range: tuple   # (min, max) temperature in °F
    development_time_range: tuple  # (min, max) development time in minutes
    total_time_range: tuple  # (min, max) total roast time in minutes
    characteristics: str
    flavor_profile: str
    common_mistakes: List[str]

class DTRTargets:
    """DTR coaching targets and calculations"""
    
    PROFILES = {
        RoastLevel.CINNAMON: DTRProfile(
            name="Cinnamon",
            dtr_target_range=(12, 15),
            drop_temp_range=(385, 395),
            development_time_range=(1.0, 1.5),
            total_time_range=(7, 9),
            characteristics="Very light roast, high acidity, grassy notes",
            flavor_profile="Bright, acidic, tea-like, grassy",
            common_mistakes=[
                "Dropping too early before first crack completes",
                "Not allowing enough development time",
                "Using too much heat causing scorching"
            ]
        ),
        
        RoastLevel.LIGHT_CITY: DTRProfile(
            name="Light City",
            dtr_target_range=(14, 17),
            drop_temp_range=(395, 405),
            development_time_range=(1.2, 1.8),
            total_time_range=(8, 10),
            characteristics="Light roast with some development, balanced acidity",
            flavor_profile="Bright acidity, some sweetness, origin characteristics prominent",
            common_mistakes=[
                "Under-developing for fear of over-roasting",
                "Dropping before first crack fully completes",
                "Not monitoring DTR closely enough"
            ]
        ),
        
        RoastLevel.CITY: DTRProfile(
            name="City",
            dtr_target_range=(15, 18),
            drop_temp_range=(400, 410),
            development_time_range=(1.5, 2.5),
            total_time_range=(8, 11),
            characteristics="Balanced roast with good development",
            flavor_profile="Balanced acidity and sweetness, origin characteristics clear",
            common_mistakes=[
                "Rushing development phase",
                "Dropping too early for fear of over-roasting",
                "Not allowing enough time for flavor development"
            ]
        ),
        
        RoastLevel.CITY_PLUS: DTRProfile(
            name="City+",
            dtr_target_range=(17, 20),
            drop_temp_range=(405, 415),
            development_time_range=(2.0, 3.0),
            total_time_range=(9, 12),
            characteristics="Medium-light roast with good development",
            flavor_profile="Rich sweetness, balanced acidity, complex flavors",
            common_mistakes=[
                "Over-developing and losing acidity",
                "Not monitoring temperature closely enough",
                "Allowing too much development time"
            ]
        ),
        
        RoastLevel.FULL_CITY: DTRProfile(
            name="Full City",
            dtr_target_range=(20, 25),
            drop_temp_range=(410, 425),
            development_time_range=(2.5, 3.5),
            total_time_range=(10, 13),
            characteristics="Medium roast with significant development",
            flavor_profile="Rich body, reduced acidity, chocolate notes emerging",
            common_mistakes=[
                "Under-developing and keeping too much acidity",
                "Not allowing enough time for body development",
                "Dropping too early before flavors develop"
            ]
        ),
        
        RoastLevel.FULL_CITY_PLUS: DTRProfile(
            name="Full City+",
            dtr_target_range=(22, 28),
            drop_temp_range=(415, 430),
            development_time_range=(3.0, 4.0),
            total_time_range=(11, 14),
            characteristics="Medium-dark roast with extended development",
            flavor_profile="Full body, low acidity, chocolate and caramel notes",
            common_mistakes=[
                "Over-developing and losing origin characteristics",
                "Allowing too much development time",
                "Not monitoring for scorching"
            ]
        ),
        
        RoastLevel.VIENNA: DTRProfile(
            name="Vienna",
            dtr_target_range=(25, 30),
            drop_temp_range=(425, 440),
            development_time_range=(3.5, 4.5),
            total_time_range=(12, 15),
            characteristics="Dark roast with significant development",
            flavor_profile="Full body, low acidity, chocolate and caramel dominant",
            common_mistakes=[
                "Over-developing and creating flat flavors",
                "Not monitoring temperature closely enough",
                "Allowing too much development time"
            ]
        ),
        
        RoastLevel.FRENCH: DTRProfile(
            name="French",
            dtr_target_range=(28, 35),
            drop_temp_range=(435, 450),
            development_time_range=(4.0, 5.0),
            total_time_range=(13, 16),
            characteristics="Very dark roast with maximum development",
            flavor_profile="Very full body, minimal acidity, roasted flavors dominant",
            common_mistakes=[
                "Over-developing and creating burnt flavors",
                "Not monitoring for scorching carefully",
                "Allowing too much development time"
            ]
        )
    }
    
    @classmethod
    def get_profile(cls, roast_level: str) -> Optional[DTRProfile]:
        """Get DTR profile for a roast level"""
        # Map common roast level names to enum values
        level_mapping = {
            "Cinnamon": RoastLevel.CINNAMON,
            "Light City": RoastLevel.LIGHT_CITY,
            "City": RoastLevel.CITY,
            "City+": RoastLevel.CITY_PLUS,
            "Full City": RoastLevel.FULL_CITY,
            "Full City+": RoastLevel.FULL_CITY_PLUS,
            "Vienna": RoastLevel.VIENNA,
            "French": RoastLevel.FRENCH
        }
        
        roast_enum = level_mapping.get(roast_level)
        if roast_enum:
            return cls.PROFILES.get(roast_enum)
        return None
    
    @classmethod
    def calculate_dtr(cls, first_crack_time_sec: int, current_time_sec: int) -> float:
        """Calculate current DTR percentage"""
        if first_crack_time_sec <= 0 or current_time_sec <= first_crack_time_sec:
            return 0.0
        
        development_time = current_time_sec - first_crack_time_sec
        total_time = current_time_sec
        
        return (development_time / total_time) * 100
    
    @classmethod
    def assess_dtr(cls, current_dtr: float, target_range: tuple) -> Dict[str, Any]:
        """Assess current DTR against target range"""
        min_target, max_target = target_range
        
        if current_dtr < min_target - 2:
            return {
                'status': 'too_low',
                'urgency': 'high',
                'message': f'DTR too low ({current_dtr:.1f}%) - roast under-developing'
            }
        elif current_dtr < min_target:
            return {
                'status': 'low',
                'urgency': 'medium',
                'message': f'DTR slightly low ({current_dtr:.1f}%) - monitor closely'
            }
        elif current_dtr <= max_target:
            return {
                'status': 'optimal',
                'urgency': 'low',
                'message': f'DTR on target ({current_dtr:.1f}%) - good development'
            }
        elif current_dtr <= max_target + 3:
            return {
                'status': 'high',
                'urgency': 'medium',
                'message': f'DTR getting high ({current_dtr:.1f}%) - consider dropping soon'
            }
        else:
            return {
                'status': 'too_high',
                'urgency': 'high',
                'message': f'DTR too high ({current_dtr:.1f}%) - roast over-developing'
            }

def build_dtr_coaching_context(
    target_roast_level: str,
    current_phase: str,
    first_crack_time_sec: Optional[int],
    elapsed_seconds: int,
    current_temp: float
) -> str:
    """Build DTR-focused coaching context"""
    
    roast_profile = DTRTargets.get_profile(target_roast_level)
    
    if not roast_profile:
        return "⚠️ Unknown roast level - using default DTR guidance"
    
    # Calculate current DTR if in development phase
    current_dtr = None
    dtr_assessment = None
    
    if first_crack_time_sec and elapsed_seconds > first_crack_time_sec:
        current_dtr = DTRTargets.calculate_dtr(first_crack_time_sec, elapsed_seconds)
        dtr_assessment = DTRTargets.assess_dtr(current_dtr, roast_profile.dtr_target_range)
    
    context = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DTR (DEVELOPMENT TIME RATIO) GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TARGET ROAST LEVEL: {roast_profile.name}

DTR TARGET RANGE: {roast_profile.dtr_target_range[0]}-{roast_profile.dtr_target_range[1]}%
Drop Temperature: {roast_profile.drop_temp_range[0]}-{roast_profile.drop_temp_range[1]}°F
Expected Development Time: {roast_profile.development_time_range[0]}-{roast_profile.development_time_range[1]} minutes
Expected Total Roast Time: {roast_profile.total_time_range[0]}-{roast_profile.total_time_range[1]} minutes

CHARACTERISTICS: {roast_profile.characteristics}
FLAVOR PROFILE: {roast_profile.flavor_profile}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CURRENT DTR STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    if current_dtr and dtr_assessment:
        urgency_emoji = {"low": "✓", "medium": "⚠️", "high": "🚨"}
        emoji = urgency_emoji.get(dtr_assessment['urgency'], "")
        
        context += f"""
{emoji} Current DTR: {current_dtr:.1f}%
Status: {dtr_assessment['message']}

First Crack Time: {int(first_crack_time_sec) // 60}:{int(first_crack_time_sec) % 60:02d}
Current Elapsed: {int(elapsed_seconds) // 60}:{int(elapsed_seconds) % 60:02d}
Development Time So Far: {int(elapsed_seconds - first_crack_time_sec) // 60}:{int(elapsed_seconds - first_crack_time_sec) % 60:02d}

"""
        
        # Add guidance based on DTR status
        if dtr_assessment['status'] == 'too_low':
            context += f"""
⚠️ DTR CONCERN: Roast is developing too quickly for {roast_profile.name}

RECOMMENDED ACTIONS:
1. Reduce heat by 1-2 levels to slow development
2. Allow more time before dropping
3. Target DTR: {roast_profile.dtr_target_range[0]}-{roast_profile.dtr_target_range[1]}%

If you drop now, the roast will be UNDERDEVELOPED (baked, grassy, unbalanced).
"""
        
        elif dtr_assessment['status'] == 'too_high':
            context += f"""
⚠️ DTR CONCERN: Development time is getting long for {roast_profile.name}

RECOMMENDED ACTIONS:
1. Prepare to drop soon
2. Monitor temperature closely (target: {roast_profile.drop_temp_range[0]}-{roast_profile.drop_temp_range[1]}°F)
3. Watch for over-development (scorching, flatness)

If DTR exceeds {roast_profile.dtr_target_range[1] + 3}%, roast may become over-developed.
"""
        
        else:
            context += f"""
✓ DTR ON TARGET: Development is progressing well for {roast_profile.name}

CONTINUE:
- Monitor temperature (target: {roast_profile.drop_temp_range[0]}-{roast_profile.drop_temp_range[1]}°F)
- Drop when temperature and color match target
- Current pace is good for desired flavor profile
"""
    
    elif first_crack_time_sec:
        # Pre-first crack guidance
        context += f"""
⏳ WAITING FOR FIRST CRACK

Expected first crack: 6-7 minutes (end of Maillard phase, FreshRoast timing)
Once first crack occurs, development phase begins.

TARGET DEVELOPMENT TIME: {roast_profile.development_time_range[0]}-{roast_profile.development_time_range[1]} minutes
This will give you DTR of {roast_profile.dtr_target_range[0]}-{roast_profile.dtr_target_range[1]}%

AFTER FIRST CRACK STARTS:
- Reduce heat to control development rate
- Target drop temp: {roast_profile.drop_temp_range[0]}-{roast_profile.drop_temp_range[1]}°F
- Allow {roast_profile.development_time_range[0]}-{roast_profile.development_time_range[1]} min development
"""
    
    context += f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ COMMON MISTAKES FOR {roast_profile.name}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{chr(10).join(f"• {mistake}" for mistake in roast_profile.common_mistakes)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DTR COACHING PRINCIPLES (YOU MUST FOLLOW):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DTR is MORE IMPORTANT than temperature alone
   - Good temperature + wrong DTR = poor roast
   - Monitor BOTH temp and DTR

2. Each roast level has specific DTR targets
   - Lighter roasts (City): 15-18% DTR
   - Medium roasts (City+): 17-20% DTR
   - Darker roasts (Full City): 20-25% DTR
   - Very dark (Full City+): 22-28% DTR

3. DTR too low = Underdeveloped (baked, grassy)
   - Beans haven't developed enough complexity
   - Even if temperature is correct

4. DTR too high = Over-developed (flat, burnt)
   - Extended development can cause scorching
   - Loss of origin characteristics

5. Development time is measured from FIRST CRACK to DROP
   - Not total roast time
   - Not from second crack

6. On FreshRoast, total roast is 8-13 minutes
   - City: 8-11 min total (1.5-2.5 min development)
   - City+: 9-12 min total (2-3 min development)
   - Full City: 10-13 min total (2.5-3.5 min development)
   - Full City+: 11-14 min total (3-4 min development)

CRITICAL: Always reference current DTR in your coaching.
If DTR is off-target, this is your PRIMARY concern.
"""
    
    return context
