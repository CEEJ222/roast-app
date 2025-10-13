#!/usr/bin/env python3
"""
Script to migrate existing feedback from JSON to Supabase
Run this once to sync all historical feedback to Supabase for persistent storage
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    """Migrate feedback to Supabase"""
    print("🚀 Starting Feedback Migration to Supabase")
    print("=" * 60)
    
    try:
        # Import feedback storage
        from feedback_storage import feedback_storage
        from utils.database import get_supabase
        
        # Check Supabase connection
        client = get_supabase()
        if not client:
            print("❌ Supabase is not connected!")
            print("\n💡 Check your environment variables:")
            print("   - SUPABASE_URL")
            print("   - SUPABASE_SERVICE_ROLE_KEY")
            return False
        
        print("✅ Supabase is connected")
        print(f"📊 Found {len(feedback_storage.feedback_data)} feedback entries in JSON")
        
        # Perform migration
        print("\n🔄 Starting migration...")
        result = feedback_storage.migrate_to_supabase()
        
        print("\n" + "=" * 60)
        if result["success"]:
            print("✅ MIGRATION SUCCESSFUL!")
            print(f"   Migrated: {result['migrated']} entries")
            print(f"   Failed: {result['failed']} entries")
            print(f"   Total: {result['total']} entries")
            print("\n🎉 All feedback is now stored in Supabase!")
            print("\n💡 Feedback will now persist across deployments and restarts")
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


