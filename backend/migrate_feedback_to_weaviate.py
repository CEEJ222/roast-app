#!/usr/bin/env python3
"""
Script to migrate existing feedback from JSON to Weaviate
Run this once to sync all historical feedback to Weaviate for semantic search
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    """Migrate feedback to Weaviate"""
    print("🚀 Starting Feedback Migration to Weaviate")
    print("=" * 60)
    
    try:
        # Import feedback storage
        from feedback_storage import feedback_storage
        from RAG_system.weaviate.weaviate_config import get_weaviate_client
        
        # Check Weaviate connection
        client = get_weaviate_client()
        if not client or not client.is_connected():
            print("❌ Weaviate is not connected!")
            print("\n💡 Make sure Weaviate is running:")
            print("   docker compose -f docker-compose.weaviate.yml up -d")
            return False
        
        print("✅ Weaviate is connected")
        print(f"📊 Found {len(feedback_storage.feedback_data)} feedback entries in JSON")
        
        # Perform migration
        print("\n🔄 Starting migration...")
        result = feedback_storage.migrate_to_weaviate()
        
        print("\n" + "=" * 60)
        if result["success"]:
            print("✅ MIGRATION SUCCESSFUL!")
            print(f"   Migrated: {result['migrated']} entries")
            print(f"   Failed: {result['failed']} entries")
            print(f"   Total: {result['total']} entries")
            print("\n🎉 All feedback is now stored in Weaviate for semantic search!")
            return True
        else:
            print("❌ MIGRATION FAILED!")
            print(f"   Error: {result.get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Migration error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


