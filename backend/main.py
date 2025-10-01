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
    CreateBeanProfileRequest, ParseHTMLRequest,
    SemanticSearchRequest, UserMachineRequest, UserProfileRequest
)
from utils.environmental import get_environmental_conditions
from utils.database import get_supabase, get_or_create_machine_id
from utils.auth import verify_jwt_token
# RAG system integration for AI-powered bean analysis and roast coaching
from RAG_system.weaviate.weaviate_integration import (
    get_weaviate_integration, 
    sync_bean_to_weaviate, 
    sync_roast_to_weaviate,
    search_beans_semantic,
    search_roasts_semantic
)
from RAG_system.weaviate.weaviate_config import initialize_weaviate

# Coffee regions validation
COFFEE_REGIONS = [
    # Africa
    'Ethiopia', 'Kenya', 'Rwanda', 'Burundi', 'Tanzania', 'Uganda', 
    'Zambia', 'Malawi', 'Zimbabwe', 'Madagascar', 'Côte d\'Ivoire', 
    'Cameroon', 'Angola', 'Mozambique',
    # Central & South America
    'Colombia', 'Brazil', 'Peru', 'Ecuador', 'Bolivia', 'Venezuela', 
    'Guyana', 'Suriname', 'French Guiana',
    # Central America & Caribbean
    'Guatemala', 'Acatenango', 'Costa Rica', 'Honduras', 'Nicaragua', 'El Salvador', 
    'Panama', 'Mexico', 'Jamaica', 'Cuba', 'Dominican Republic', 
    'Haiti', 'Puerto Rico',
    # Asia Pacific
    'Indonesia', 'Vietnam', 'India', 'Papua New Guinea', 'Philippines', 
    'Thailand', 'Myanmar', 'Laos', 'Cambodia', 'Malaysia', 'Sri Lanka', 
    'Nepal', 'China', 'Japan', 'Taiwan', 'South Korea', 'Australia', 
    'New Zealand', 'Hawaii',
    # Middle East
    'Yemen', 'Saudi Arabia', 'Oman', 'United Arab Emirates',
    # Other
    'Other'
]

def validate_coffee_region(region: str) -> bool:
    """Validate that the coffee region is in our predefined list"""
    return region in COFFEE_REGIONS

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

@app.get("/coffee-regions")
async def get_coffee_regions():
    """Get the list of valid coffee regions"""
    return {"regions": COFFEE_REGIONS}



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

# Bean Profile endpoints
@app.post("/bean-profiles")
async def create_bean_profile(request: CreateBeanProfileRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        bean_data = {
            "user_id": user_id,
            "name": request.name,
            "origin": request.origin,
            "bean_type": request.bean_type,  # NEW: Include bean type
            "notes": request.notes,
            "supplier_url": request.supplier_url,
            "supplier_name": request.supplier_name,
            
            # Tier 1: Must Have
            "moisture_content_pct": request.moisture_content_pct,
            "density_g_ml": request.density_g_ml,
            "process_method": request.process_method,
            "recommended_roast_levels": request.recommended_roast_levels,
            
            # Tier 2: Very Important
            "screen_size": request.screen_size,
            "variety": request.variety,
            "altitude_m": request.altitude_m,
            "body_intensity": request.body_intensity,
            
            # Tier 3: Helpful
            "harvest_year": request.harvest_year,
            "acidity_intensity": request.acidity_intensity,
            
            # Flavor Profile
            "flavor_notes": request.flavor_notes,
            "cupping_score": request.cupping_score,
            "fragrance_score": request.fragrance_score,
            "floral_intensity": request.floral_intensity,
            "honey_intensity": request.honey_intensity,
            "sugars_intensity": request.sugars_intensity,
            "caramel_intensity": request.caramel_intensity,
            "fruits_intensity": request.fruits_intensity,
            "citrus_intensity": request.citrus_intensity,
            "berry_intensity": request.berry_intensity,
            "cocoa_intensity": request.cocoa_intensity,
            "nuts_intensity": request.nuts_intensity,
            "rustic_intensity": request.rustic_intensity,
            "spice_intensity": request.spice_intensity,
            
            # Additional
            "roasting_notes": request.roasting_notes,
            "qr_code_url": request.qr_code_url
        }
        
        # Remove None values
        bean_data = {k: v for k, v in bean_data.items() if v is not None}
        
        result = sb.table("bean_profiles").insert(bean_data).execute()
        return result.data[0]  # Return the full bean profile data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/bean-profiles")
async def get_bean_profiles(user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        result = sb.table("bean_profiles").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/bean-profiles/{bean_profile_id}")
async def get_bean_profile(bean_profile_id: str, user_id: str = Depends(verify_jwt_token)):
    """Get a single bean profile by ID"""
    try:
        sb = get_supabase()
        
        # Get the bean profile
        result = sb.table("bean_profiles").select("*").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/bean-profiles/{bean_profile_id}")
async def enhance_bean_profile(bean_profile_id: str, request: CreateBeanProfileRequest, user_id: str = Depends(verify_jwt_token)):
    """Enhance an existing bean profile with AI-optimized data"""
    try:
        sb = get_supabase()
        
        # Verify bean profile ownership
        existing = sb.table("bean_profiles").select("id").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        # Prepare update data (only include fields that are provided)
        update_data = {}
        for field, value in request.dict().items():
            if value is not None:  # Allow updating all fields including name
                update_data[field] = value
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not update_data:
            return {"message": "No changes to update"}
        
        # Update the bean profile
        sb.table("bean_profiles").update(update_data).eq("id", bean_profile_id).execute()
        
        # Return the updated profile data
        updated_profile = sb.table("bean_profiles").select("*").eq("id", bean_profile_id).execute()
        return updated_profile.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/bean-profiles/{bean_profile_id}")
async def delete_bean_profile(bean_profile_id: str, user_id: str = Depends(verify_jwt_token)):
    """Delete a bean profile by ID"""
    try:
        sb = get_supabase()
        
        # Verify bean profile ownership first
        profile_result = sb.table("bean_profiles").select("id").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        if not profile_result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        # Check if there are any roast entries that reference this bean profile
        roast_check = sb.table("roast_entries").select("id").eq("bean_profile_id", bean_profile_id).execute()
        if roast_check.data:
            # There are roast entries using this bean profile
            roast_count = len(roast_check.data)
            raise HTTPException(
                status_code=409, 
                detail=f"Cannot delete bean profile. It is currently being used by {roast_count} roast{'s' if roast_count > 1 else ''}. Please delete the associated roast entries first or update them to use a different bean profile."
            )
        
        # Delete the bean profile (no foreign key constraints to worry about)
        sb.table("bean_profiles").delete().eq("id", bean_profile_id).execute()
        
        return {"success": True, "message": "Bean profile deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        # Handle foreign key constraint errors specifically
        if "violates foreign key constraint" in str(e) or "23503" in str(e):
            raise HTTPException(
                status_code=409, 
                detail="Cannot delete bean profile. It is currently being used by one or more roast entries. Please delete the associated roast entries first or update them to use a different bean profile."
            )
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bean-profiles/parse-html")
async def parse_bean_html(request: ParseHTMLRequest, user_id: str = Depends(verify_jwt_token)):
    """
    Parse HTML content and create bean profile using AI-powered analysis.
    This endpoint is deprecated in favor of the RAG-powered bean recognition system.
    """
    try:
        # This endpoint is deprecated - users should use the RAG system for bean analysis
        raise HTTPException(
            status_code=410, 
            detail="This endpoint is deprecated. Please use the RAG-powered bean recognition system instead."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/bean-profiles/parse-supplier")
async def parse_supplier_url(request: Dict[str, str], user_id: str = Depends(verify_jwt_token)):
    """
    Parse a supplier URL to extract bean information.
    This endpoint is deprecated in favor of the RAG-powered bean recognition system.
    """
    try:
        # This endpoint is deprecated - users should use the RAG system for bean analysis
        raise HTTPException(
            status_code=410, 
            detail="This endpoint is deprecated. Please use the RAG-powered bean recognition system instead."
        )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Semantic Search Endpoints
@app.post("/search/beans")
async def search_beans_semantic_endpoint(request: SemanticSearchRequest, user_id: str = Depends(verify_jwt_token)):
    """Search for beans using semantic similarity"""
    try:
        results = search_beans_semantic(request.query, request.limit)
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Roast search endpoint moved to routers/roasts.py

@app.get("/search/similar-beans/{bean_profile_id}")
async def find_similar_beans(bean_profile_id: str, limit: int = 5, user_id: str = Depends(verify_jwt_token)):
    """Find similar beans based on a bean profile"""
    try:
        sb = get_supabase()
        
        # Get the bean profile
        bean_result = sb.table("bean_profiles").select("*").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        if not bean_result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        bean_profile = bean_result.data[0]
        
        # Find similar beans using Weaviate
        integration = get_weaviate_integration()
        similar_beans = integration.find_similar_beans(bean_profile, limit)
        
        return {
            "bean_profile_id": bean_profile_id,
            "similar_beans": similar_beans,
            "count": len(similar_beans)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/recommend-roast/{bean_profile_id}")
async def recommend_roast_profile(bean_profile_id: str, user_id: str = Depends(verify_jwt_token)):
    """Get roast profile recommendation for a bean"""
    try:
        sb = get_supabase()
        
        # Get the bean profile
        bean_result = sb.table("bean_profiles").select("*").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        if not bean_result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        bean_profile = bean_result.data[0]
        
        # Get roast recommendation using Weaviate
        integration = get_weaviate_integration()
        recommended_roast = integration.recommend_roast_profile(bean_profile)
        
        return {
            "bean_profile_id": bean_profile_id,
            "recommended_roast": recommended_roast
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/weaviate/initialize")
async def initialize_weaviate_schemas(user_id: str = Depends(verify_jwt_token)):
    """Initialize Weaviate schemas (admin endpoint)"""
    try:
        integration = get_weaviate_integration()
        success = integration.initialize_schemas()
        
        if success:
            return {"message": "Weaviate schemas initialized successfully"}
        else:
            return {"message": "Weaviate not available or schema initialization failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/weaviate/sync-bean/{bean_profile_id}")
async def sync_bean_to_weaviate_endpoint(bean_profile_id: str, user_id: str = Depends(verify_jwt_token)):
    """Sync a bean profile to Weaviate"""
    try:
        sb = get_supabase()
        
        # Get the bean profile
        bean_result = sb.table("bean_profiles").select("*").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        if not bean_result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        bean_profile = bean_result.data[0]
        
        # Sync to Weaviate
        success = sync_bean_to_weaviate(bean_profile)
        
        return {
            "bean_profile_id": bean_profile_id,
            "synced": success,
            "message": "Bean profile synced to Weaviate" if success else "Failed to sync to Weaviate"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include routers
try:
    from routers.roasts import router as roasts_router
    app.include_router(roasts_router, tags=["Roasts"])
    print("✅ Roasts router included successfully")
except ImportError as e:
    print(f"⚠️ Could not import roasts router: {e}")

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