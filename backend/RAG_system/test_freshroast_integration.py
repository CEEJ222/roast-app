"""
Test script for FreshRoast Machine Integration

This script tests the FreshRoast machine profile integration with the enhanced AI chatbot system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_machine_profiles():
    """Test FreshRoast machine profiles"""
    print("🧪 Testing FreshRoast Machine Profiles...")
    
    try:
        from machine_profiles import FreshRoastMachineProfiles, RoastModel
        
        profiles = FreshRoastMachineProfiles()
        
        # Test all machine configurations
        test_configs = [
            ("SR540", False, "SR540"),
            ("SR540", True, "SR540_ET"),
            ("SR800", False, "SR800"),
            ("SR800", True, "SR800_ET")
        ]
        
        for model, has_extension, expected in test_configs:
            profile = profiles.get_profile(model, has_extension)
            print(f"  ✅ {model} + Extension: {has_extension} -> {profile.display_name}")
            
            # Test phase-specific advice
            advice = profiles.get_phase_specific_advice(
                profile, "drying", 7, 8, 180  # 3 minutes
            )
            print(f"    Drying phase advice length: {len(advice)} characters")
            
            # Test heat recommendations
            rec = profiles.get_heat_recommendation(
                profile, "drying", 250, 300, 8.5
            )
            print(f"    Heat recommendation: {rec['heat_action']} ({rec['reasoning'][:50]}...)")
        
        print("✅ Machine profiles test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Machine profiles test failed: {e}\n")
        return False

def test_phase_awareness_integration():
    """Test phase awareness with FreshRoast integration"""
    print("🧪 Testing Phase Awareness with FreshRoast Integration...")
    
    try:
        # Import without relative imports for testing
        import phase_awareness
        PhaseDetector = phase_awareness.PhaseDetector
        PhaseAwarePromptBuilder = phase_awareness.PhaseAwarePromptBuilder
        
        detector = PhaseDetector()
        builder = PhaseAwarePromptBuilder()
        
        # Test machine-specific phase context
        test_cases = [
            ("SR540", False, 180, 280),  # 3 minutes, 280°F
            ("SR800", True, 300, 350),   # 5 minutes, 350°F
        ]
        
        for machine_model, has_extension, elapsed_seconds, temp_f in test_cases:
            phase = detector.detect_phase(elapsed_seconds, temp_f)
            
            # Test machine-specific context
            context = detector.get_machine_specific_phase_context(
                phase, elapsed_seconds, temp_f, machine_model, has_extension, 7, 8
            )
            print(f"  ✅ {machine_model} + Extension: {has_extension}")
            print(f"    Phase: {phase.name}")
            print(f"    Context length: {len(context)} characters")
            
            # Test FreshRoast-aware prompt building
            prompt = builder.build_freshroast_aware_prompt(
                "drying", {"elapsed_time": 3, "current_temp": 280}, 
                machine_model, has_extension, 7, 8
            )
            print(f"    Prompt length: {len(prompt)} characters")
        
        print("✅ Phase awareness integration test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Phase awareness integration test failed: {e}\n")
        return False

def test_enhanced_system_prompts():
    """Test FreshRoast-specific system prompts"""
    print("🧪 Testing FreshRoast-Specific System Prompts...")
    
    try:
        import phase_awareness
        EnhancedSystemPrompt = phase_awareness.EnhancedSystemPrompt
        
        # Test different machine configurations
        test_configs = [
            ("SR540", False),
            ("SR800", True),
        ]
        
        for machine_model, has_extension in test_configs:
            prompt = EnhancedSystemPrompt.get_freshroast_system_prompt(
                machine_model, has_extension
            )
            print(f"  ✅ {machine_model} + Extension: {has_extension}")
            print(f"    System prompt length: {len(prompt)} characters")
            print(f"    Contains machine info: {'Power:' in prompt}")
            print(f"    Contains phase info: {'DRYING' in prompt}")
        
        print("✅ Enhanced system prompts test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Enhanced system prompts test failed: {e}\n")
        return False

def test_machine_specific_advice():
    """Test machine-specific advice generation"""
    print("🧪 Testing Machine-Specific Advice Generation...")
    
    try:
        from machine_profiles import FreshRoastMachineProfiles
        
        profiles = FreshRoastMachineProfiles()
        
        # Test different scenarios
        test_scenarios = [
            ("SR540", False, "drying", 6, 7, 180),  # Low heat for SR540
            ("SR800", False, "drying", 8, 8, 180),  # High heat for SR800
            ("SR540", True, "maillard", 7, 8, 300), # Extension tube scenario
        ]
        
        for machine_model, has_extension, phase, heat, fan, elapsed_seconds in test_scenarios:
            profile = profiles.get_profile(machine_model, has_extension)
            
            # Get phase-specific advice
            advice = profiles.get_phase_specific_advice(
                profile, phase, heat, fan, elapsed_seconds
            )
            
            print(f"  ✅ {machine_model} + Extension: {has_extension} in {phase}")
            print(f"    Settings: Heat {heat}, Fan {fan}")
            print(f"    Advice length: {len(advice)} characters")
            print(f"    Contains warnings: {'⚠️' in advice or '🔥' in advice}")
            
            # Test heat recommendations
            rec = profiles.get_heat_recommendation(
                profile, phase, 280, 300, 8.5
            )
            print(f"    Heat recommendation: {rec['heat_action']} (urgency: {rec['urgency']})")
        
        print("✅ Machine-specific advice test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Machine-specific advice test failed: {e}\n")
        return False

def test_integration_compatibility():
    """Test integration with existing LLM system"""
    print("🧪 Testing Integration Compatibility...")
    
    try:
        # Test that all modules can be imported together
        import phase_awareness
        import machine_profiles
        import conversation_state
        
        PhaseDetector = phase_awareness.PhaseDetector
        PhaseAwarePromptBuilder = phase_awareness.PhaseAwarePromptBuilder
        EnhancedSystemPrompt = phase_awareness.EnhancedSystemPrompt
        FreshRoastMachineProfiles = machine_profiles.FreshRoastMachineProfiles
        ConversationManager = conversation_state.ConversationManager
        
        print("  ✅ All modules imported successfully")
        
        # Test that enhanced features work together
        detector = PhaseDetector()
        builder = PhaseAwarePromptBuilder()
        profiles = FreshRoastMachineProfiles()
        manager = ConversationManager()
        
        print("  ✅ All components initialized successfully")
        
        # Test that machine profiles integrate with phase detection
        profile = profiles.get_profile("SR800", True)
        phase = detector.detect_phase(300, 350)  # 5 minutes, 350°F
        
        context = detector.get_machine_specific_phase_context(
            phase, 300, 350, "SR800", True, 7, 8
        )
        
        print(f"  ✅ Machine-specific context generated: {len(context)} characters")
        
        # Test FreshRoast-aware prompt building
        prompt = builder.build_freshroast_aware_prompt(
            "maillard", {"elapsed_time": 5, "current_temp": 350},
            "SR800", True, 7, 8
        )
        
        print(f"  ✅ FreshRoast-aware prompt generated: {len(prompt)} characters")
        
        print("✅ Integration compatibility test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Integration compatibility test failed: {e}\n")
        return False

def main():
    """Run all FreshRoast integration tests"""
    print("🚀 Testing FreshRoast Machine Integration\n")
    print("=" * 50)
    
    tests = [
        test_machine_profiles,
        test_phase_awareness_integration,
        test_enhanced_system_prompts,
        test_machine_specific_advice,
        test_integration_compatibility
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("🎉 FreshRoast Integration Test Results:")
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All FreshRoast integration tests passed!")
        print("\nFreshRoast Machine Integration Features:")
        print("✅ Machine-specific profiles (SR540, SR800, with/without extension)")
        print("✅ Phase-aware prompting with machine characteristics")
        print("✅ Machine-specific advice generation")
        print("✅ FreshRoast-specific system prompts")
        print("✅ Heat/fan recommendations based on machine type")
        print("✅ Integration with existing enhanced features")
    else:
        print(f"\n⚠️ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
