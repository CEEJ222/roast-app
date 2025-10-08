#!/usr/bin/env python3
"""
Database migration script to add tasting_notes column to roast_entries table
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def run_migration():
    """Run the database migration to add tasting_notes column"""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Missing Supabase credentials")
        print("Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
        
        # Run the migration SQL
        migration_sql = """
        ALTER TABLE roast_entries 
        ADD COLUMN IF NOT EXISTS tasting_notes TEXT;
        """
        
        print("🔄 Running migration: Adding tasting_notes column to roast_entries table...")
        
        # Execute the migration
        result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
        
        print("✅ Migration completed successfully!")
        print("The tasting_notes column has been added to the roast_entries table.")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("\nAlternative: You can run this SQL directly in your Supabase dashboard:")
        print("ALTER TABLE roast_entries ADD COLUMN IF NOT EXISTS tasting_notes TEXT;")
        return False

if __name__ == "__main__":
    print("🚀 Running database migration...")
    success = run_migration()
    sys.exit(0 if success else 1)
