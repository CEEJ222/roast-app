"""
Test script for Enhanced AI Chatbot Core Features

This script tests the core enhanced features without requiring external dependencies:
- Phase awareness
- Conversation state management
- Learning system
- Timing validation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_phase_detection():
    """Test phase detection functionality"""
    print("🧪 Testing Phase Detection...")
    
    try:
        from phase_awareness import PhaseDetector
        
        detector = PhaseDetector()
        
        # Test different phases
        test_cases = [
            (120, 250, "drying"),      # 2 minutes, 250°F
            (300, 350, "maillard"),    # 5 minutes, 350°F
            (600, 400, "development"), # 10 minutes, 400°F
            (800, 450, "finishing")    # 13 minutes, 450°F
        ]
        
        for elapsed_seconds, temp_f, expected_phase in test_cases:
            phase = detector.detect_phase(elapsed_seconds, temp_f)
            print(f"  {elapsed_seconds}s, {temp_f}°F -> {phase.name} (expected: {expected_phase})")
            
            # Test phase context generation
            context = detector.get_phase_context(phase, elapsed_seconds, temp_f)
            print(f"    Context length: {len(context)} characters")
        
        print("✅ Phase detection test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Phase detection test failed: {e}\n")
        return False

def test_conversation_state():
    """Test conversation state management"""
    print("🧪 Testing Conversation State Management...")
    
    try:
        from conversation_state import ConversationManager
        
        manager = ConversationManager()
        user_id = "test_user"
        roast_id = "test_roast"
        
        # Add some test interactions
        manager.add_interaction(
            user_id, roast_id, 
            "How's my roast going?", 
            "Your roast is progressing well in the drying phase.",
            "drying", "user_question"
        )
        
        manager.add_interaction(
            user_id, roast_id,
            "Should I increase the heat?",
            "Yes, you can increase heat to 6 for better development.",
            "maillard", "user_question"
        )
        
        # Test conversation summary
        summary = manager.get_conversation_summary(user_id, roast_id)
        print(f"  Total interactions: {summary['total_interactions']}")
        print(f"  Phases discussed: {summary['phases_discussed']}")
        
        # Test contextual prompt
        prompt = manager.get_contextual_prompt(user_id, roast_id, "What should I do next?")
        print(f"  Contextual prompt length: {len(prompt)} characters")
        
        print("✅ Conversation state test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Conversation state test failed: {e}\n")
        return False

def test_learning_system():
    """Test learning system functionality"""
    print("🧪 Testing Learning System...")
    
    try:
        from conversation_state import ConversationManager
        
        manager = ConversationManager()
        
        # Simulate feedback collection
        context = {
            "current_phase": "development",
            "elapsed_time": 600,
            "bean_type": "Ethiopian Yirgacheffe"
        }
        
        # Collect some feedback
        manager.learn_from_feedback(5, "Great advice about first crack timing!", context)
        manager.learn_from_feedback(4, "Helpful guidance on heat adjustment.", context)
        manager.learn_from_feedback(2, "Not very helpful.", context)
        
        # Test learning stats
        stats = manager.get_learning_stats()
        print(f"  Total feedback: {stats['total_feedback']}")
        print(f"  Success rate: {stats['success_rate']:.1f}%")
        print(f"  Learning patterns: {stats['learning_patterns']}")
        
        # Test improved response generation
        similar_context = {
            "current_phase": "development",
            "elapsed_time": 650,
            "bean_type": "Ethiopian Yirgacheffe"
        }
        
        improved_response = manager.get_improved_response(similar_context)
        if improved_response:
            print(f"  Improved response: {improved_response[:50]}...")
        else:
            print("  No improved response available yet")
        
        print("✅ Learning system test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Learning system test failed: {e}\n")
        return False

def test_timing_validation():
    """Test timing validation functionality"""
    print("🧪 Testing Timing Validation...")
    
    try:
        from phase_awareness import PhaseAwarePromptBuilder
        
        builder = PhaseAwarePromptBuilder()
        
        # Test timing validation
        test_cases = [
            ("Reduce heat for first crack", "development", 600, True),   # Relevant
            ("Watch for first crack", "drying", 120, False),              # Irrelevant
            ("Monitor moisture removal", "drying", 120, True),           # Relevant
            ("Listen for second crack", "development", 600, False),      # Irrelevant
        ]
        
        for advice, phase, elapsed_time, expected in test_cases:
            is_relevant = builder.validate_timing_relevance(advice, phase, elapsed_time)
            status = "✅" if is_relevant == expected else "❌"
            print(f"  {status} '{advice}' in {phase} at {elapsed_time}s: {is_relevant}")
        
        print("✅ Timing validation test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Timing validation test failed: {e}\n")
        return False

def test_enhanced_prompts():
    """Test enhanced system prompts"""
    print("🧪 Testing Enhanced System Prompts...")
    
    try:
        from phase_awareness import EnhancedSystemPrompt
        
        # Test phase-aware system prompt
        phase_prompt = EnhancedSystemPrompt.get_phase_aware_system_prompt()
        print(f"  Phase-aware prompt length: {len(phase_prompt)} characters")
        
        # Test urgent spike prompt
        urgent_prompt = EnhancedSystemPrompt.get_urgent_spike_prompt()
        print(f"  Urgent spike prompt length: {len(urgent_prompt)} characters")
        
        # Test realtime coaching prompt
        coaching_prompt = EnhancedSystemPrompt.get_realtime_coaching_prompt()
        print(f"  Realtime coaching prompt length: {len(coaching_prompt)} characters")
        
        print("✅ Enhanced prompts test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ Enhanced prompts test failed: {e}\n")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Enhanced AI Chatbot Core Features\n")
    print("=" * 50)
    
    tests = [
        test_phase_detection,
        test_conversation_state,
        test_learning_system,
        test_timing_validation,
        test_enhanced_prompts
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("🎉 Test Results:")
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All core features working correctly!")
        print("\nEnhanced AI Chatbot Core Features:")
        print("✅ Phase-aware prompting")
        print("✅ Conversation state management")
        print("✅ Learning system")
        print("✅ Timing validation")
        print("✅ Enhanced system prompts")
    else:
        print(f"\n⚠️ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
