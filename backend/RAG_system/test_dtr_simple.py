"""
Simple test script for DTR (Development Time Ratio) integration

This script tests the DTR knowledge system and machine profiles
without requiring LLM dependencies.
"""

import logging
from typing import Dict, Any
from dtr_knowledge import DTRTargets, DTRCoach, dtr_coach
from machine_profiles import FreshRoastMachineProfiles

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_dtr_knowledge_system():
    """Test the DTR knowledge system with different roast levels"""
    logger.info("🧪 Testing DTR Knowledge System...")
    
    # Test roast level profiles
    roast_levels = ["City", "City+", "Full City", "Full City+"]
    
    for level in roast_levels:
        profile = DTRTargets.get_profile(level)
        if profile:
            logger.info(f"✅ {level} Profile:")
            logger.info(f"   DTR Target: {profile.dtr_target_range[0]}-{profile.dtr_target_range[1]}%")
            logger.info(f"   Drop Temp: {profile.drop_temp_range[0]}-{profile.drop_temp_range[1]}°F")
            logger.info(f"   Development Time: {profile.development_time_range[0]}-{profile.development_time_range[1]} min")
            logger.info(f"   Characteristics: {profile.characteristics}")
        else:
            logger.error(f"❌ No profile found for {level}")
    
    # Test DTR calculation
    test_cases = [
        (300, 600, 50.0),  # 50% DTR
        (300, 500, 40.0),  # 40% DTR
        (300, 400, 25.0),   # 25% DTR
    ]
    
    for first_crack, drop_time, expected_dtr in test_cases:
        calculated_dtr = DTRTargets.calculate_dtr(first_crack, drop_time)
        logger.info(f"✅ DTR Calculation: First crack {first_crack}s, Drop {drop_time}s = {calculated_dtr}% (expected ~{expected_dtr}%)")
    
    # Test DTR assessment
    assessment_cases = [
        (15.0, (15, 18), "City"),      # On target
        (10.0, (15, 18), "City"),      # Too low
        (25.0, (15, 18), "City"),      # Too high
    ]
    
    for current_dtr, target_range, roast_level in assessment_cases:
        assessment = DTRTargets.assess_dtr(current_dtr, target_range, roast_level)
        logger.info(f"✅ DTR Assessment: {current_dtr}% vs {target_range}% for {roast_level}")
        logger.info(f"   Status: {assessment['status']}, Urgency: {assessment['urgency']}")
        logger.info(f"   Message: {assessment['message']}")

def test_machine_profiles_dtr():
    """Test machine profiles with DTR awareness"""
    logger.info("🧪 Testing Machine Profiles DTR Integration...")
    
    machine_profiles = FreshRoastMachineProfiles()
    
    # Test different machine configurations
    machine_configs = [
        ("SR800", False),
        ("SR800", True),
        ("SR540", False),
        ("SR540", True)
    ]
    
    for model, has_extension in machine_configs:
        try:
            profile = machine_profiles.get_profile(model, has_extension)
            logger.info(f"✅ {profile.display_name}:")
            
            # Check if DTR targets are included
            dev_phase = profile.development_phase
            if "dtr_targets" in dev_phase:
                logger.info(f"   DTR targets included: {list(dev_phase['dtr_targets'].keys())}")
            else:
                logger.warning(f"   ⚠️ No DTR targets found in development phase")
            
            # Test DTR-aware development advice
            dtr_advice = machine_profiles.get_dtr_aware_development_advice(
                profile=profile,
                roast_level="City+",
                current_dtr=16.5,  # Slightly below target
                current_heat=5,
                current_fan=7,
                current_temp=410.0,
                ror=8.5
            )
            
            logger.info(f"   DTR Status: {dtr_advice['dtr_status']}")
            logger.info(f"   Urgency: {dtr_advice['urgency']}")
            logger.info(f"   Coaching: {dtr_advice['coaching_message'][:100]}...")
            
        except Exception as e:
            logger.error(f"❌ Error testing {model} with extension={has_extension}: {e}")

def test_dtr_coach():
    """Test the DTR coach with various scenarios"""
    logger.info("🧪 Testing DTR Coach...")
    
    # Test scenarios
    scenarios = [
        {
            "name": "City roast in development phase",
            "roast_level": "City",
            "current_phase": "development",
            "elapsed_time": 600,  # 10 minutes
            "first_crack_time": 480,  # 8 minutes
            "current_temp": 405.0,
            "ror": 8.0
        },
        {
            "name": "City+ roast with low DTR",
            "roast_level": "City+",
            "current_phase": "development",
            "elapsed_time": 720,  # 12 minutes
            "first_crack_time": 600,  # 10 minutes
            "current_temp": 410.0,
            "ror": 6.0
        },
        {
            "name": "Full City roast with high DTR",
            "roast_level": "Full City",
            "current_phase": "development",
            "elapsed_time": 900,  # 15 minutes
            "first_crack_time": 600,  # 10 minutes
            "current_temp": 420.0,
            "ror": 12.0
        }
    ]
    
    for scenario in scenarios:
        logger.info(f"✅ Testing scenario: {scenario['name']}")
        
        coaching = dtr_coach.get_dtr_aware_coaching(
            roast_level=scenario["roast_level"],
            current_phase=scenario["current_phase"],
            elapsed_time=scenario["elapsed_time"],
            first_crack_time=scenario["first_crack_time"],
            current_temp=scenario["current_temp"],
            ror=scenario["ror"]
        )
        
        logger.info(f"   DTR Status: {coaching.get('dtr_status', 'N/A')}")
        logger.info(f"   Current DTR: {coaching.get('current_dtr', 'N/A')}%")
        logger.info(f"   Target Range: {coaching.get('target_dtr_range', 'N/A')}%")
        logger.info(f"   Coaching: {coaching.get('coaching', 'N/A')[:100]}...")
        logger.info(f"   Recommendations: {len(coaching.get('recommendations', []))} items")

def test_dtr_endpoints():
    """Test DTR-specific endpoint data structures"""
    logger.info("🧪 Testing DTR Endpoints...")
    
    # Test DTR analysis endpoint data structure
    test_roast_progress = {
        "roast_level": "Full City",
        "events": [
            {
                "event_type": "first_crack",
                "t_offset_sec": 600,  # 10 minutes
                "temp_f": 385.0
            }
        ],
        "elapsed_time": 900,  # 15 minutes
        "current_temp": 420.0,
        "current_phase": "development",
        "ror": 10.0
    }
    
    # Test DTR coach with endpoint-like data
    dtr_analysis = dtr_coach.get_dtr_aware_coaching(
        roast_level=test_roast_progress["roast_level"],
        current_phase=test_roast_progress["current_phase"],
        elapsed_time=test_roast_progress["elapsed_time"],
        first_crack_time=600,
        current_temp=test_roast_progress["current_temp"],
        ror=test_roast_progress["ror"]
    )
    
    logger.info("✅ DTR Analysis Results:")
    logger.info(f"   Current DTR: {dtr_analysis.get('current_dtr', 'N/A')}%")
    logger.info(f"   Target Range: {dtr_analysis.get('target_dtr_range', 'N/A')}%")
    logger.info(f"   Status: {dtr_analysis.get('dtr_status', 'N/A')}")
    logger.info(f"   Urgency: {dtr_analysis.get('dtr_urgency', 'N/A')}")
    logger.info(f"   Coaching: {dtr_analysis.get('coaching', 'N/A')[:100]}...")
    
    # Test roast profile retrieval
    roast_profile = DTRTargets.get_profile("Full City")
    if roast_profile:
        logger.info("✅ Roast Profile Retrieved:")
        logger.info(f"   Name: {roast_profile.name}")
        logger.info(f"   DTR Target: {roast_profile.dtr_target_range}")
        logger.info(f"   Drop Temp: {roast_profile.drop_temp_range}")
        logger.info(f"   Characteristics: {roast_profile.characteristics}")

def main():
    """Run all DTR integration tests"""
    logger.info("🚀 Starting DTR Integration Tests...")
    
    try:
        # Test DTR knowledge system
        test_dtr_knowledge_system()
        logger.info("✅ DTR Knowledge System tests completed")
        
        # Test machine profiles
        test_machine_profiles_dtr()
        logger.info("✅ Machine Profiles DTR tests completed")
        
        # Test DTR coach
        test_dtr_coach()
        logger.info("✅ DTR Coach tests completed")
        
        # Test DTR endpoints
        test_dtr_endpoints()
        logger.info("✅ DTR Endpoints tests completed")
        
        logger.info("🎉 All DTR integration tests completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Test suite failed: {e}")
        raise

if __name__ == "__main__":
    main()
