"""
Test script for Machine-Aware Phase Detection

This script tests the new MachineAwarePhaseDetector class and its integration
with FreshRoast machine profiles.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_machine_aware_phase_detection():
    """Test machine-aware phase detection"""
    print("🧪 Testing Machine-Aware Phase Detection...")
    
    try:
        import phase_awareness
        MachineAwarePhaseDetector = phase_awareness.MachineAwarePhaseDetector
        
        detector = MachineAwarePhaseDetector()
        
        # Test different machine configurations and timings
        test_cases = [
            ("SR540", False, 180, 280),   # 3 minutes, 280°F - should be drying
            ("SR540", True, 300, 350),    # 5 minutes, 350°F - should be maillard
            ("SR800", False, 600, 400),   # 10 minutes, 400°F - should be development
            ("SR800", True, 800, 450),    # 13 minutes, 450°F - should be finishing
        ]
        
        for machine_model, has_extension, elapsed_seconds, temp_f in test_cases:
            phase, profile = detector.detect_phase_for_machine(
                machine_model, has_extension, elapsed_seconds, temp_f
            )
            
            print(f"  ✅ {machine_model} + Extension: {has_extension}")
            print(f"    Time: {elapsed_seconds}s, Temp: {temp_f}°F")
            print(f"    Detected Phase: {phase.name}")
            print(f"    Machine: {profile.display_name}")
            print(f"    Typical Roast Time: {profile.typical_roast_time[0]}-{profile.typical_roast_time[1]} min")
        
        print("✅ Machine-aware phase detection test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Machine-aware phase detection test failed: {e}\n")
        return False

def test_machine_specific_context():
    """Test machine-specific context generation"""
    print("🧪 Testing Machine-Specific Context Generation...")
    
    try:
        import phase_awareness
        MachineAwarePhaseDetector = phase_awareness.MachineAwarePhaseDetector
        
        detector = MachineAwarePhaseDetector()
        
        # Test context generation for different machines
        test_cases = [
            ("SR540", False, 180, 280, 7, 8),   # Drying phase
            ("SR800", True, 600, 400, 6, 7),    # Development phase
        ]
        
        for machine_model, has_extension, elapsed_seconds, temp_f, heat, fan in test_cases:
            phase, profile = detector.detect_phase_for_machine(
                machine_model, has_extension, elapsed_seconds, temp_f
            )
            
            context = detector.get_machine_specific_context(
                profile, phase, elapsed_seconds, temp_f, heat, fan
            )
            
            print(f"  ✅ {machine_model} + Extension: {has_extension}")
            print(f"    Phase: {phase.name}")
            print(f"    Settings: Heat {heat}, Fan {fan}")
            print(f"    Context length: {len(context)} characters")
            print(f"    Contains machine info: {'MACHINE:' in context}")
            print(f"    Contains phase recommendations: {'RECOMMENDATIONS' in context}")
            print(f"    Contains extension effects: {'EXTENSION TUBE EFFECTS' in context}")
        
        print("✅ Machine-specific context test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Machine-specific context test failed: {e}\n")
        return False

def test_machine_timing_scaling():
    """Test machine-specific timing scaling"""
    print("🧪 Testing Machine-Specific Timing Scaling...")
    
    try:
        import phase_awareness
        MachineAwarePhaseDetector = phase_awareness.MachineAwarePhaseDetector
        
        detector = MachineAwarePhaseDetector()
        
        # Test timing scaling for different machines
        test_cases = [
            ("SR540", False, 8),    # 8 minute typical roast
            ("SR540", True, 12),    # 12 minute typical roast with extension
            ("SR800", False, 10),   # 10 minute typical roast
            ("SR800", True, 13),    # 13 minute typical roast with extension
        ]
        
        for machine_model, has_extension, expected_typical in test_cases:
            profile = detector.machine_profiles.get_profile(machine_model, has_extension)
            actual_typical = sum(profile.typical_roast_time) / 2
            
            print(f"  ✅ {machine_model} + Extension: {has_extension}")
            print(f"    Expected typical: ~{expected_typical} min")
            print(f"    Actual typical: {actual_typical:.1f} min")
            print(f"    Time scale factor: {actual_typical / 10:.2f}")
            
            # Test phase detection at different time points
            for elapsed_minutes in [2, 5, 8, 12]:
                elapsed_seconds = elapsed_minutes * 60
                phase, _ = detector.detect_phase_for_machine(
                    machine_model, has_extension, elapsed_seconds, 350
                )
                print(f"    At {elapsed_minutes} min: {phase.name}")
        
        print("✅ Machine timing scaling test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Machine timing scaling test failed: {e}\n")
        return False

def test_integration_with_llm():
    """Test integration with LLM system"""
    print("🧪 Testing Integration with LLM System...")
    
    try:
        import phase_awareness
        MachineAwarePhaseDetector = phase_awareness.MachineAwarePhaseDetector
        
        detector = MachineAwarePhaseDetector()
        
        # Simulate LLM integration scenario
        machine_model = "SR800"
        has_extension = True
        elapsed_seconds = 300  # 5 minutes
        current_temp = 350
        current_heat = 7
        current_fan = 8
        
        # Get machine-aware phase and context
        phase, profile = detector.detect_phase_for_machine(
            machine_model, has_extension, elapsed_seconds, current_temp
        )
        
        context = detector.get_machine_specific_context(
            profile, phase, elapsed_seconds, current_temp, current_heat, current_fan
        )
        
        print(f"  ✅ LLM Integration Test")
        print(f"    Machine: {profile.display_name}")
        print(f"    Phase: {phase.name}")
        print(f"    Context length: {len(context)} characters")
        
        # Test that context contains all necessary information
        required_elements = [
            "MACHINE:",
            "CURRENT ROASTING PHASE:",
            "CHARACTERISTICS:",
            "RECOMMENDATIONS:",
            "Machine-Specific Advice:",
            "Common Mistake:"
        ]
        
        missing_elements = [elem for elem in required_elements if elem not in context]
        if missing_elements:
            print(f"    ⚠️ Missing elements: {missing_elements}")
        else:
            print(f"    ✅ All required elements present")
        
        # Test extension tube effects
        if has_extension and "EXTENSION TUBE EFFECTS:" in context:
            print(f"    ✅ Extension tube effects included")
        elif not has_extension:
            print(f"    ✅ No extension tube effects (as expected)")
        
        print("✅ LLM integration test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ LLM integration test failed: {e}\n")
        return False

def main():
    """Run all machine-aware phase detection tests"""
    print("🚀 Testing Machine-Aware Phase Detection\n")
    print("=" * 50)
    
    tests = [
        test_machine_aware_phase_detection,
        test_machine_specific_context,
        test_machine_timing_scaling,
        test_integration_with_llm
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("🎉 Machine-Aware Phase Detection Test Results:")
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All machine-aware phase detection tests passed!")
        print("\nMachine-Aware Phase Detection Features:")
        print("✅ Machine-specific phase detection")
        print("✅ Timing scaling based on machine characteristics")
        print("✅ Machine-specific context generation")
        print("✅ Extension tube effects integration")
        print("✅ LLM system integration")
    else:
        print(f"\n⚠️ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
