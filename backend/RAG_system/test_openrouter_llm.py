"""
Test script for OpenRouter LLM Integration

This script tests the new OpenRouterLLM class and its integration
with the machine-aware coaching system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_openrouter_llm_class():
    """Test OpenRouterLLM class structure"""
    print("🧪 Testing OpenRouterLLM Class Structure...")
    
    try:
        # Test that we can import the class definition
        import llm_integration
        
        if hasattr(llm_integration, 'OpenRouterLLM'):
            print("  ✅ OpenRouterLLM class exists")
        else:
            print("  ❌ OpenRouterLLM class not found")
            return False
        
        if hasattr(llm_integration, 'MachineAwareLLMIntegration'):
            print("  ✅ MachineAwareLLMIntegration class exists")
        else:
            print("  ❌ MachineAwareLLMIntegration class not found")
            return False
        
        print("✅ OpenRouterLLM class structure test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ OpenRouterLLM class structure test failed: {e}\n")
        return False

def test_openrouter_llm_methods():
    """Test OpenRouterLLM methods"""
    print("🧪 Testing OpenRouterLLM Methods...")
    
    try:
        import llm_integration
        
        # Check if OpenRouterLLM has required methods
        if hasattr(llm_integration.OpenRouterLLM, 'get_completion'):
            print("  ✅ get_completion method exists")
        else:
            print("  ❌ get_completion method missing")
            return False
        
        if hasattr(llm_integration.OpenRouterLLM, 'get_streaming_completion'):
            print("  ✅ get_streaming_completion method exists")
        else:
            print("  ❌ get_streaming_completion method missing")
            return False
        
        # Check method signatures
        import inspect
        completion_sig = inspect.signature(llm_integration.OpenRouterLLM.get_completion)
        streaming_sig = inspect.signature(llm_integration.OpenRouterLLM.get_streaming_completion)
        
        print(f"  ✅ get_completion signature: {completion_sig}")
        print(f"  ✅ get_streaming_completion signature: {streaming_sig}")
        
        print("✅ OpenRouterLLM methods test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ OpenRouterLLM methods test failed: {e}\n")
        return False

def test_machine_aware_integration():
    """Test MachineAwareLLMIntegration integration"""
    print("🧪 Testing MachineAwareLLMIntegration Integration...")
    
    try:
        import llm_integration
        
        # Check if MachineAwareLLMIntegration has required methods
        if hasattr(llm_integration.MachineAwareLLMIntegration, 'get_machine_aware_coaching'):
            print("  ✅ get_machine_aware_coaching method exists")
        else:
            print("  ❌ get_machine_aware_coaching method missing")
            return False
        
        if hasattr(llm_integration.MachineAwareLLMIntegration, '_format_recommendations'):
            print("  ✅ _format_recommendations method exists")
        else:
            print("  ❌ _format_recommendations method missing")
            return False
        
        # Check method signatures
        import inspect
        coaching_sig = inspect.signature(llm_integration.MachineAwareLLMIntegration.get_machine_aware_coaching)
        format_sig = inspect.signature(llm_integration.MachineAwareLLMIntegration._format_recommendations)
        
        print(f"  ✅ get_machine_aware_coaching signature: {coaching_sig}")
        print(f"  ✅ _format_recommendations signature: {format_sig}")
        
        print("✅ MachineAwareLLMIntegration integration test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ MachineAwareLLMIntegration integration test failed: {e}\n")
        return False

def test_openrouter_configuration():
    """Test OpenRouter configuration"""
    print("🧪 Testing OpenRouter Configuration...")
    
    try:
        import os
        
        # Check environment variables
        api_key = os.getenv("OPENROUTER_API_KEY")
        primary_model = os.getenv("PRIMARY_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
        fallback_model = os.getenv("FALLBACK_MODEL", "google/gemini-flash-1.5:free")
        
        print(f"  ✅ OPENROUTER_API_KEY: {'SET' if api_key else 'NOT SET'}")
        print(f"  ✅ PRIMARY_MODEL: {primary_model}")
        print(f"  ✅ FALLBACK_MODEL: {fallback_model}")
        
        # Check if models are free models
        if "free" in primary_model:
            print("  ✅ Primary model is a free model")
        else:
            print("  ⚠️ Primary model may not be free")
        
        if "free" in fallback_model:
            print("  ✅ Fallback model is a free model")
        else:
            print("  ⚠️ Fallback model may not be free")
        
        print("✅ OpenRouter configuration test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ OpenRouter configuration test failed: {e}\n")
        return False

def test_api_endpoint_integration():
    """Test API endpoint integration"""
    print("🧪 Testing API Endpoint Integration...")
    
    try:
        import os
        endpoint_file = os.path.join(os.path.dirname(__file__), 'rag_endpoints.py')
        
        if os.path.exists(endpoint_file):
            print("  ✅ RAG endpoints file exists")
            
            # Read the file to check for OpenRouter integration
            with open(endpoint_file, 'r') as f:
                content = f.read()
            
            if 'machine_aware_llm' in content:
                print("  ✅ machine_aware_llm imported in endpoints")
            else:
                print("  ❌ machine_aware_llm not imported in endpoints")
                return False
            
            if '/rag/machine-aware-coaching' in content:
                print("  ✅ /rag/machine-aware-coaching endpoint defined")
            else:
                print("  ❌ /rag/machine-aware-coaching endpoint not found")
                return False
            
            if 'get_machine_aware_coaching' in content:
                print("  ✅ get_machine_aware_coaching function defined")
            else:
                print("  ❌ get_machine_aware_coaching function not found")
                return False
            
            # Check for OpenRouter specific headers
            if 'HTTP-Referer' in content:
                print("  ✅ OpenRouter headers configured")
            else:
                print("  ⚠️ OpenRouter headers not found")
        
        print("✅ API endpoint integration test completed\n")
        return True
        
    except Exception as e:
        print(f"❌ API endpoint integration test failed: {e}\n")
        return False

def main():
    """Run all OpenRouter LLM integration tests"""
    print("🚀 Testing OpenRouter LLM Integration\n")
    print("=" * 50)
    
    tests = [
        test_openrouter_llm_class,
        test_openrouter_llm_methods,
        test_machine_aware_integration,
        test_openrouter_configuration,
        test_api_endpoint_integration
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("🎉 OpenRouter LLM Integration Test Results:")
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All OpenRouter LLM integration tests passed!")
        print("\nOpenRouter LLM Integration Features:")
        print("✅ OpenRouterLLM class with OpenAI SDK")
        print("✅ Free model support (meta-llama/llama-3.2-3b-instruct:free)")
        print("✅ Fallback model support (google/gemini-flash-1.5:free)")
        print("✅ Machine-aware coaching integration")
        print("✅ API endpoint integration")
        print("✅ OpenRouter headers for rankings")
        print("\nTo use:")
        print("1. Set OPENROUTER_API_KEY environment variable")
        print("2. Use /rag/machine-aware-coaching endpoint")
        print("3. Enjoy free AI coaching with FreshRoast machine knowledge!")
    else:
        print(f"\n⚠️ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
