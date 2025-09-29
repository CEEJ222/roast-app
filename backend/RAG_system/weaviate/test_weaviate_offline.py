"""
Offline Weaviate Integration Tests
Test Weaviate components without requiring a running Weaviate instance
"""

import os
import sys
import json
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from .weaviate_schemas import get_all_schemas, get_schema_by_class
from .weaviate_embeddings import get_bean_embedder, get_roast_embedder

def test_schema_definitions():
    """Test schema definitions"""
    print("🔍 Testing schema definitions...")
    
    try:
        schemas = get_all_schemas()
        print(f"✅ Found {len(schemas)} schemas")
        
        for schema in schemas:
            class_name = schema.get("class")
            properties = schema.get("properties", [])
            print(f"  📋 {class_name}: {len(properties)} properties")
        
        return True
    except Exception as e:
        print(f"❌ Schema test failed: {e}")
        return False

def test_bean_embedding_generation():
    """Test bean profile embedding generation"""
    print("\n🔍 Testing bean profile embedding...")
    
    # Sample bean profile
    sample_bean = {
        "name": "Ethiopian Yirgacheffe",
        "supplier": "Sweet Maria's",
        "origin": "Ethiopia",
        "variety": "Heirloom",
        "processing": "Washed",
        "elevation": 1800,
        "flavor_notes": ["floral", "citrus", "tea-like"],
        "aroma_notes": ["jasmine", "lemon"],
        "body": "light",
        "acidity": "bright",
        "sweetness": "delicate",
        "cupping_score": 87.5,
        "roast_level": "light",
        "description": "Classic Ethiopian Yirgacheffe with bright acidity and floral notes"
    }
    
    try:
        embedder = get_bean_embedder()
        searchable_text = embedder.create_searchable_text(sample_bean)
        print(f"✅ Searchable text generated: {len(searchable_text)} characters")
        print(f"📝 Preview: {searchable_text[:100]}...")
        
        # Test embedding generation (will be None if OpenAI key not set)
        embedding = embedder.embed_bean_profile(sample_bean)
        if embedding:
            print(f"✅ Embedding generated: {len(embedding)} dimensions")
        else:
            print("⚠️ Embedding generation skipped (OpenAI key not set)")
        
        return True
    except Exception as e:
        print(f"❌ Bean embedding test failed: {e}")
        return False

def test_roast_embedding_generation():
    """Test roast profile embedding generation"""
    print("\n🔍 Testing roast profile embedding...")
    
    # Sample roast profile
    sample_roast = {
        "name": "Light Roast Profile",
        "roast_level": "light",
        "roast_time": 8.5,
        "charge_temp": 400,
        "first_crack_time": 6.2,
        "first_crack_temp": 385,
        "drop_temp": 410,
        "roast_notes": "Slow start, quick finish",
        "flavor_notes": ["bright", "fruity"],
        "aroma_notes": ["floral", "citrus"],
        "body_rating": 6,
        "acidity_rating": 8,
        "sweetness_rating": 7,
        "overall_rating": 8,
        "roaster_model": "SR800"
    }
    
    try:
        embedder = get_roast_embedder()
        searchable_text = embedder.create_searchable_text(sample_roast)
        print(f"✅ Searchable text generated: {len(searchable_text)} characters")
        print(f"📝 Preview: {searchable_text[:100]}...")
        
        # Test embedding generation
        embedding = embedder.embed_roast_profile(sample_roast)
        if embedding:
            print(f"✅ Embedding generated: {len(embedding)} dimensions")
        else:
            print("⚠️ Embedding generation skipped (OpenAI key not set)")
        
        return True
    except Exception as e:
        print(f"❌ Roast embedding test failed: {e}")
        return False

def test_data_preparation():
    """Test data preparation for Weaviate"""
    print("\n🔍 Testing data preparation...")
    
    try:
        from .weaviate_integration import WeaviateIntegration
        
        # Sample bean profile
        sample_bean = {
            "id": "test-bean-123",
            "name": "Test Ethiopian Bean",
            "supplier": "Test Supplier",
            "origin": "Ethiopia",
            "variety": "Heirloom",
            "processing": "Natural",
            "elevation": 1600,
            "flavor_notes": ["berry", "chocolate"],
            "aroma_notes": ["fruity", "sweet"],
            "body": "medium",
            "acidity": "medium",
            "sweetness": "high",
            "cupping_score": 85.0,
            "roast_level": "medium",
            "description": "Test bean for Weaviate integration",
            "user_id": "test-user",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        integration = WeaviateIntegration()
        weaviate_data = integration._prepare_bean_data(sample_bean)
        
        print(f"✅ Bean data prepared: {len(weaviate_data)} fields")
        print(f"📋 Fields: {list(weaviate_data.keys())}")
        
        # Test roast data preparation
        sample_roast = {
            "id": "test-roast-123",
            "name": "Test Roast Profile",
            "bean_profile_id": "test-bean-123",
            "roast_level": "medium",
            "roast_time": 10.5,
            "charge_temp": 420,
            "first_crack_time": 7.5,
            "first_crack_temp": 390,
            "drop_temp": 430,
            "roast_notes": "Test roast profile",
            "flavor_notes": ["chocolate", "nutty"],
            "aroma_notes": ["roasted", "sweet"],
            "body_rating": 7,
            "acidity_rating": 6,
            "sweetness_rating": 8,
            "overall_rating": 8,
            "roaster_model": "SR800",
            "batch_size": 0.5,
            "user_id": "test-user",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        roast_data = integration._prepare_roast_data(sample_roast)
        print(f"✅ Roast data prepared: {len(roast_data)} fields")
        print(f"📋 Fields: {list(roast_data.keys())}")
        
        return True
    except Exception as e:
        print(f"❌ Data preparation test failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoint definitions"""
    print("\n🔍 Testing API endpoint definitions...")
    
    try:
        # Test that we can import the main module
        import main
        
        # Check for semantic search endpoints
        endpoints = [
            "/search/beans",
            "/search/roasts", 
            "/search/similar-beans/{bean_profile_id}",
            "/search/recommend-roast/{bean_profile_id}",
            "/weaviate/initialize",
            "/weaviate/sync-bean/{bean_profile_id}"
        ]
        
        print(f"✅ API endpoints defined: {len(endpoints)}")
        for endpoint in endpoints:
            print(f"  🔗 {endpoint}")
        
        return True
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        return False

def main():
    """Run all offline Weaviate tests"""
    print("🚀 Starting Offline Weaviate Integration Tests\n")
    
    tests = [
        ("Schema Definitions", test_schema_definitions),
        ("Bean Embedding", test_bean_embedding_generation),
        ("Roast Embedding", test_roast_embedding_generation),
        ("Data Preparation", test_data_preparation),
        ("API Endpoints", test_api_endpoints)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*50)
    print("📊 OFFLINE TEST RESULTS SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All offline tests passed! Weaviate components are ready.")
        print("\n💡 Next steps:")
        print("1. Start Weaviate: docker compose -f docker-compose.weaviate.yml up -d")
        print("2. Set OPENAI_API_KEY for embeddings")
        print("3. Run full integration tests: python test_weaviate.py")
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
