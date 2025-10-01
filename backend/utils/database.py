"""
Database utilities and shared functions
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="/Users/cjbritz/roast-app/backend/.env")

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def get_supabase() -> Client:
    print(f"DEBUG: SUPABASE_URL loaded: {bool(SUPABASE_URL)}")
    print(f"DEBUG: SUPABASE_SERVICE_ROLE_KEY loaded: {bool(SUPABASE_SERVICE_ROLE_KEY)}")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise Exception("Supabase not configured")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_or_create_machine_id(label: str) -> str:
    """Get or create machine ID based on label"""
    sb = get_supabase()
    model = 'SR540' if '540' in label else 'SR800'
    has_et = 'ET' in label
    q = sb.table("machines").select("id").eq("name", label).limit(1).execute()
    if q.data and len(q.data) > 0:
        return q.data[0]["id"]
    created = sb.table("machines").insert({
        "name": label, 
        "model": model, 
        "has_extension": has_et
    }).execute()
    return created.data[0]["id"]
