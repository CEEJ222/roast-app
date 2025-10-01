from fastapi import FastAPI, HTTPException, Depends, Header, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
import time
import os
import requests
import datetime
from jose import jwt, JWTError
from supabase import create_client, Client
from dotenv import load_dotenv
from schemas import (
    UserMachineRequest, UserProfileRequest
)
from utils.environmental import get_environmental_conditions
from utils.database import get_supabase, get_or_create_machine_id
from utils.auth import verify_jwt_token
# RAG system integration for AI-powered roast coaching
from RAG_system.weaviate.weaviate_integration import (
    get_weaviate_integration, 
    sync_roast_to_weaviate,
    search_roasts_semantic
)
from RAG_system.weaviate.weaviate_config import initialize_weaviate

# Coffee regions validation moved to routers/beans.py

# Load environment variables from .env file for local development
load_dotenv()

app = FastAPI()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Roast Buddy Backend is running"}

# Railway CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.roastbuddy.app",
        "https://roastbuddy.app", 
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
)

# Custom middleware to ensure CORS headers on ALL responses (Railway compatibility)
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        response = Response()
        origin = request.headers.get("origin")
        
        # Define allowed origins
        allowed_origins = [
            "https://www.roastbuddy.app",
            "https://roastbuddy.app", 
            "http://localhost:3000",
            "http://localhost:5173"
        ]
        
        # Set CORS headers if origin is allowed
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
        response.headers["Access-Control-Max-Age"] = "600"
        return response
    
    # Handle regular requests
    response = await call_next(request)
    
    # Get the origin from the request
    origin = request.headers.get("origin")
    
    # Define allowed origins
    allowed_origins = [
        "https://www.roastbuddy.app",
        "https://roastbuddy.app", 
        "http://localhost:3000",
        "http://localhost:5173"
    ]
    
    # Set CORS headers if origin is allowed
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    response.headers["Access-Control-Max-Age"] = "600"
    
    return response


# RAG API router will be included after app creation to avoid circular imports

# Supabase and auth utilities moved to utils/ modules

# Request/Response models moved to schemas.py

# Helper functions moved to utils/ modules

# Environmental conditions function moved to utils/environmental.py

# Duplicate health check endpoint removed - using the one above

# Coffee regions endpoint moved to routers/beans.py



# Roast endpoints moved to routers/roasts.py

# User Profile Endpoints
@app.get("/user/profile")
async def get_user_profile(user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        # Use Supabase Admin API to get user data
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_response.user
        user_meta = user_data.user_metadata or {}
        
        return {
            "id": user_data.id,
            "email": user_data.email,
            "display_name": user_meta.get("display_name") or user_meta.get("full_name") or user_meta.get("name") or user_data.email.split("@")[0],
            "address": user_meta.get("address", ""),
            "avatar_url": user_meta.get("avatar_url") or user_meta.get("picture"),
            "units": user_meta.get("units", {"temperature": "fahrenheit", "elevation": "feet"}),
            "created_at": user_data.created_at,
            "last_sign_in_at": user_data.last_sign_in_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/user/profile")
async def update_user_profile(request: UserProfileRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Get current user data using Admin API
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_meta = user_response.user.user_metadata or {}
        
        # Update the metadata with new display name, address, and units
        updated_meta = current_meta.copy()
        if request.display_name:
            updated_meta["display_name"] = request.display_name
        if request.address is not None:
            updated_meta["address"] = request.address
        if request.units is not None:
            updated_meta["units"] = request.units
        
        # Update the user record using Admin API
        sb.auth.admin.update_user_by_id(user_id, {
            "user_metadata": updated_meta
        })
        
        return {"success": True, "message": "Profile updated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Import feature flags
from feature_flags import check_ai_copilot_access, feature_manager

# Test endpoint for feature flags (no auth required)
@app.get("/test/feature-flags")
async def test_feature_flags():
    """Test endpoint to check if feature flags are working"""
    try:
        features = feature_manager.list_all_features()
        return {
            "features": features,
            "timestamp": datetime.datetime.now().isoformat(),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

# Subscription Status Endpoint
@app.get("/user/subscription-status")
async def get_subscription_status(user_id: str = Depends(verify_jwt_token)):
    """
    Get user's subscription status for AI features with feature flag support
    """
    try:
        sb = get_supabase()
        
        # Get user data to check for premium status
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_meta = user_response.user.user_metadata or {}
        
        # Check AI Copilot access using feature flags
        ai_access = check_ai_copilot_access(user_id, user_meta)
        
        # Get subscription status
        subscription_status = user_meta.get("subscription_status", "free")
        
        if ai_access["has_access"]:
            return {
                "status": subscription_status,
                "ai_features_enabled": True,
                "access_type": ai_access["access_type"],
                "reasoning": ai_access["reasoning"],
                "features": [
                    "AI Roasting Copilot",
                    "Real-time guidance", 
                    "Intelligent recommendations",
                    "Historical analysis"
                ],
                "feature_flags": {
                    "development_access": ai_access["development_access"],
                    "beta_access": ai_access["beta_access"],
                    "premium_access": ai_access["premium_access"]
                }
            }
        else:
            return {
                "status": subscription_status,
                "ai_features_enabled": False,
                "access_type": "none",
                "reasoning": ai_access["reasoning"],
                "features": [
                    "Basic roasting tools",
                    "Manual logging"
                ],
                "upgrade_required": "AI features require premium subscription or beta access"
            }
        
    except Exception as e:
        # Default to no access on error
        return {
            "status": "free",
            "ai_features_enabled": False,
            "access_type": "none",
            "reasoning": "Error checking access",
            "error": str(e)
        }

# Feature Flag Management Endpoints
@app.get("/admin/feature-flags")
async def get_all_feature_flags(user_id: str = Depends(verify_jwt_token)):
    """Get all feature flags (admin only)"""
    try:
        # For now, allow any authenticated user to access feature flags
        # TODO: Add proper admin role checking when Supabase admin API is working
        print(f"DEBUG: Getting feature flags for user: {user_id}")
        
        return {
            "features": feature_manager.list_all_features(),
            "timestamp": datetime.datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"DEBUG: Error in get_all_feature_flags: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/feature-flags/{feature_name}/enable")
async def enable_feature_flag(feature_name: str, user_id: str = Depends(verify_jwt_token)):
    """Enable a feature flag (admin only)"""
    try:
        print(f"DEBUG: Enabling feature {feature_name} for user: {user_id}")
        
        success = feature_manager.enable_feature(feature_name)
        if not success:
            raise HTTPException(status_code=404, detail="Feature flag not found")
        
        return {"success": True, "message": f"Feature flag '{feature_name}' enabled"}
        
    except Exception as e:
        print(f"DEBUG: Error enabling feature flag: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/feature-flags/{feature_name}/disable")
async def disable_feature_flag(feature_name: str, user_id: str = Depends(verify_jwt_token)):
    """Disable a feature flag (admin only)"""
    try:
        print(f"DEBUG: Disabling feature {feature_name} for user: {user_id}")
        
        success = feature_manager.disable_feature(feature_name)
        if not success:
            raise HTTPException(status_code=404, detail="Feature flag not found")
        
        return {"success": True, "message": f"Feature flag '{feature_name}' disabled"}
        
    except Exception as e:
        print(f"DEBUG: Error disabling feature flag: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/feature-flags/{feature_name}/beta-users")
async def manage_beta_users(feature_name: str, request: dict, user_id: str = Depends(verify_jwt_token)):
    """Add or remove beta users (admin only)"""
    try:
        # Check if user is admin
        sb = get_supabase()
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_meta = user_response.user.user_metadata or {}
        if user_meta.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        action = request.get("action")  # "add" or "remove"
        target_user_id = request.get("user_id")
        
        if action == "add":
            success = feature_manager.add_beta_user(feature_name, target_user_id)
        elif action == "remove":
            success = feature_manager.remove_beta_user(feature_name, target_user_id)
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'add' or 'remove'")
        
        if not success:
            raise HTTPException(status_code=404, detail="Feature flag not found")
        
        return {"success": True, "message": f"Beta user {action}ed for {feature_name}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Development Feedback Endpoint
@app.post("/feedback/development")
async def submit_development_feedback(
    feedback_data: dict,
    user_id: str = Depends(verify_jwt_token)
):
    """Submit development feedback for AI Copilot"""
    try:
        from feedback_storage import feedback_storage
        
        sb = get_supabase()
        
        # Get user info
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user_response.user.email
        feedback_text = feedback_data.get("feedback", "")
        
        if not feedback_text.strip():
            raise HTTPException(status_code=400, detail="Feedback cannot be empty")
        
        # Store feedback using the storage system
        feedback_id = feedback_storage.store_feedback(
            user_id=user_id,
            user_email=user_email,
            feedback_text=feedback_text,
            feature="ai_copilot",
            status="development"
        )
        
        return {
            "success": True,
            "message": "Thank you for your feedback! We'll consider it for the final product.",
            "feedback_id": feedback_id
        }
        
    except Exception as e:
        print(f"Error in feedback submission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Admin Feedback Management Endpoints
@app.get("/admin/feedback")
async def get_all_feedback(user_id: str = Depends(verify_jwt_token)):
    """Get all development feedback (admin only)"""
    try:
        # Check if user is admin
        sb = get_supabase()
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_meta = user_response.user.user_metadata or {}
        if user_meta.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        from feedback_storage import feedback_storage
        
        feedback_items = feedback_storage.get_all_feedback()
        
        return {
            "success": True,
            "feedback": feedback_items,
            "total": len(feedback_items)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/feedback/search")
async def search_feedback(query: str, user_id: str = Depends(verify_jwt_token)):
    """Search feedback using semantic search (admin only)"""
    try:
        # Check if user is admin
        sb = get_supabase()
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_meta = user_response.user.user_metadata or {}
        if user_meta.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        from feedback_storage import feedback_storage
        
        search_results = feedback_storage.search_feedback(query)
        
        return {
            "success": True,
            "query": query,
            "results": search_results,
            "total": len(search_results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/feedback/summary")
async def get_feedback_summary(user_id: str = Depends(verify_jwt_token)):
    """Get feedback summary and analytics (admin only)"""
    try:
        # Check if user is admin
        sb = get_supabase()
        user_response = sb.auth.admin.get_user_by_id(user_id)
        if not user_response.user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_meta = user_response.user.user_metadata or {}
        if user_meta.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        from feedback_storage import feedback_storage
        
        summary = feedback_storage.get_feedback_summary()
        
        return {
            "success": True,
            "summary": summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Machines Endpoints
@app.get("/user/machines")
async def get_user_machines(user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        # Get machines directly from machines table filtered by user_id
        machines_result = sb.table("machines").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return machines_result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/machines")
async def add_user_machine(request: UserMachineRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Create machine in machines table
        machine_result = sb.table("machines").insert({
            "user_id": user_id,
            "name": request.name,
            "model": request.model,
            "has_extension": request.has_extension
        }).execute()
        
        machine_id = machine_result.data[0]["id"]
        
        return {"success": True, "machine_id": machine_id, "message": "Machine added"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/user/machines/{machine_id}")
async def update_user_machine(machine_id: str, request: UserMachineRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Verify machine ownership
        machine_result = sb.table("machines").select("id").eq("id", machine_id).eq("user_id", user_id).execute()
        if not machine_result.data:
            raise HTTPException(status_code=404, detail="Machine not found")
        
        # Update machine in machines table
        sb.table("machines").update({
            "name": request.name,
            "model": request.model,
            "has_extension": request.has_extension
        }).eq("id", machine_id).execute()
        
        return {"success": True, "message": "Machine updated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/user/machines/{machine_id}")
async def delete_user_machine(machine_id: str, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Verify machine ownership
        machine_result = sb.table("machines").select("id").eq("id", machine_id).eq("user_id", user_id).execute()
        if not machine_result.data:
            raise HTTPException(status_code=404, detail="Machine not found")
        
        # Delete the machine
        sb.table("machines").delete().eq("id", machine_id).execute()
        
        return {"success": True, "message": "Machine deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Bean Profile endpoints moved to routers/beans.py

# Include routers
try:
    from routers.roasts import router as roasts_router
    app.include_router(roasts_router, tags=["Roasts"])
    print("✅ Roasts router included successfully")
except ImportError as e:
    print(f"⚠️ Could not import roasts router: {e}")

try:
    from routers.beans import router as beans_router
    app.include_router(beans_router, tags=["Bean Profiles"])
    print("✅ Bean profiles router included successfully")
except ImportError as e:
    print(f"⚠️ Could not import bean profiles router: {e}")

# Include RAG API router (imported here to avoid circular dependency)
try:
    from RAG_system.rag_endpoints import router as rag_router
    app.include_router(rag_router, prefix="/api", tags=["RAG Copilot"])
    print("✅ RAG API router included successfully")
except ImportError as e:
    print(f"⚠️ Could not import RAG API router: {e}")



# Include LLM Roast Coaching router
try:
    from RAG_system.roast_coach.llm_roast_endpoints import router as llm_roast_router
    app.include_router(llm_roast_router, prefix="/api", tags=["LLM Roast Coaching"])
    print("✅ LLM Roast Coaching router included successfully")
except ImportError as e:
    print(f"⚠️ Could not import LLM Roast Coaching router: {e}")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Roast Buddy Backend Server...")
    print(f"✅ Supabase URL configured: {bool(os.getenv('SUPABASE_URL'))}")
    print(f"✅ Supabase Service Key configured: {bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY'))}")
    print(f"✅ Supabase JWT Secret configured: {bool(os.getenv('SUPABASE_JWT_SECRET'))}")
    uvicorn.run(app, host="0.0.0.0", port=8000)