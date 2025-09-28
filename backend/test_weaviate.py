"""
Test Weaviate Integration
Test script to verify Weaviate setup and functionality
"""

import os
import sys
import json
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from weaviate_config import get_weaviate_client, initialize_weaviate
from weaviate_schemas import get_all_schemas
from weaviate_integration import get_weaviate_integration
from weaviate_embeddings import get_bean_embedder, get_roast_embedder

def test_weaviate_connection():
    """Test basic Weaviate connection"""
    print("🔍 Testing Weaviate connection...")
    
    client = get_weaviate_client()
    if client and client.is_connected():
        print("✅ Weaviate connection successful")
        return True
    else:
        print("❌ Weaviate connection failed")
        return False

def test_schema_creation():
    """Test schema creation"""
    print("\n🔍 Testing schema creation...")
    
    integration = get_weaviate_integration()
    success = integration.initialize_schemas()
    
    if success:
        print("✅ Schemas created successfully")
        return True
    else:
        print("❌ Schema creation failed")
        return False

def test_bean_embedding():
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
    
    embedder = get_bean_embedder()
    searchable_text = embedder.create_searchable_text(sample_bean)
    print(f"📝 Searchable text: {searchable_text[:100]}...")
    
    # Test embedding generation (will be None if OpenAI key not set)
    embedding = embedder.embed_bean_profile(sample_bean)
    if embedding:
        print(f"✅ Embedding generated: {len(embedding)} dimensions")
    else:
        print("⚠️ Embedding generation skipped (OpenAI key not set)")
    
    return True

def test_roast_embedding():
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
    
    embedder = get_roast_embedder()
    searchable_text = embedder.create_searchable_text(sample_roast)
    print(f"📝 Searchable text: {searchable_text[:100]}...")
    
    # Test embedding generation
    embedding = embedder.embed_roast_profile(sample_roast)
    if embedding:
        print(f"✅ Embedding generated: {len(embedding)} dimensions")
    else:
        print("⚠️ Embedding generation skipped (OpenAI key not set)")
    
    return True

def test_semantic_search():
    """Test semantic search functionality"""
    print("\n🔍 Testing semantic search...")
    
    integration = get_weaviate_integration()
    
    # Test bean search
    bean_results = integration.search_beans_semantic("floral Ethiopian coffee", limit=3)
    print(f"🔍 Bean search results: {len(bean_results)} found")
    
    # Test roast search
    roast_results = integration.search_roasts_semantic("light roast profile", limit=3)
    print(f"🔍 Roast search results: {len(roast_results)} found")
    
    return True

def test_sample_data_sync():
    """Test syncing sample data to Weaviate"""
    print("\n🔍 Testing sample data sync...")
    
    # Sample bean profile for sync
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
    
    integration = get_weaviate_integration()
    success = integration.sync_bean_profile(sample_bean)
    
    if success:
        print("✅ Sample bean synced successfully")
    else:
        print("❌ Sample bean sync failed")
    
    return success

def main():
    """Run all Weaviate tests"""
    print("🚀 Starting Weaviate Integration Tests\n")
    
    tests = [
        ("Connection Test", test_weaviate_connection),
        ("Schema Creation", test_schema_creation),
        ("Bean Embedding", test_bean_embedding),
        ("Roast Embedding", test_roast_embedding),
        ("Semantic Search", test_semantic_search),
        ("Sample Data Sync", test_sample_data_sync)
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
    print("📊 TEST RESULTS SUMMARY")
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
        print("🎉 All tests passed! Weaviate integration is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
