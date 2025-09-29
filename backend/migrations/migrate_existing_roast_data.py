#!/usr/bin/env python3
"""
Migration script to consolidate bean data from roast_entries to bean_profiles.
This script handles existing roasts that have coffee_region, coffee_type, etc. 
but no bean_profile_id.
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase():
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise Exception("Supabase credentials not found")
    
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def migrate_roast_data():
    """Migrate existing roast data to use bean profiles"""
    sb = get_supabase()
    
    # Get all roasts that have coffee data but no bean_profile_id
    roasts_without_bean_profile = sb.table("roast_entries").select(
        "id, user_id, coffee_region, coffee_type, coffee_process, coffee_subregion"
    ).is_("bean_profile_id", "null").execute()
    
    print(f"Found {len(roasts_without_bean_profile.data)} roasts without bean profiles")
    
    for roast in roasts_without_bean_profile.data:
        print(f"Processing roast {roast['id']}...")
        
        # Check if a bean profile already exists with this data
        existing_profile = sb.table("bean_profiles").select("id").eq("user_id", roast["user_id"]).eq("origin", roast["coffee_region"]).eq("variety", roast["coffee_type"]).eq("process_method", roast["coffee_process"]).execute()
        
        if existing_profile.data:
            # Use existing profile
            bean_profile_id = existing_profile.data[0]["id"]
            print(f"  Using existing bean profile: {bean_profile_id}")
        else:
            # Create new bean profile
            from datetime import datetime
            current_date = datetime.now().strftime("%m/%d/%Y")
            bean_name = f"{roast['coffee_region']} {roast['coffee_process']} - {current_date}"
            
            bean_data = {
                "user_id": roast["user_id"],
                "name": bean_name,
                "origin": roast["coffee_region"],
                "variety": roast["coffee_type"],
                "process_method": roast["coffee_process"],
                "subregion": roast.get("coffee_subregion"),
                "profile_completeness": "basic"
            }
            
            result = sb.table("bean_profiles").insert(bean_data).execute()
            bean_profile_id = result.data[0]["id"]
            print(f"  Created new bean profile: {bean_profile_id}")
        
        # Update the roast to link to the bean profile
        sb.table("roast_entries").update({
            "bean_profile_id": bean_profile_id
        }).eq("id", roast["id"]).execute()
        
        print(f"  Updated roast {roast['id']} to use bean profile {bean_profile_id}")

if __name__ == "__main__":
    try:
        migrate_roast_data()
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
