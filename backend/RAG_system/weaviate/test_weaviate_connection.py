#!/usr/bin/env python3
"""
Test Weaviate connection and basic operations
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from .weaviate_config import get_weaviate_client, initialize_weaviate
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_weaviate_connection():
    """Test Weaviate connection and basic operations"""
    print("🧪 Testing Weaviate Connection...")
    
    # Initialize Weaviate
    if not initialize_weaviate():
        print("❌ Failed to initialize Weaviate")
        return False
    
    # Get client
    client = get_weaviate_client()
    if not client:
        print("❌ Failed to get Weaviate client")
        return False
    
    # Test connection
    if not client.is_connected():
        print("❌ Weaviate client not connected")
        return False
    
    print("✅ Weaviate connection successful!")
    
    # Test basic operations
    try:
        # Test schema creation
        test_schema = {
            "class": "TestClass",
            "description": "Test class for connection verification",
            "properties": [
                {
                    "name": "test_property",
                    "dataType": ["text"],
                    "description": "Test property"
                }
            ]
        }
        
        print("🧪 Testing schema creation...")
        if client.create_schema(test_schema):
            print("✅ Schema creation successful")
        else:
            print("⚠️ Schema creation failed (may already exist)")
        
        # Test search
        print("🧪 Testing search...")
        results = client.search("TestClass", "test query", limit=5)
        print(f"✅ Search returned {len(results)} results")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

if __name__ == "__main__":
    success = test_weaviate_connection()
    if success:
        print("🎉 Weaviate connection test passed!")
    else:
        print("💥 Weaviate connection test failed!")
        sys.exit(1)
