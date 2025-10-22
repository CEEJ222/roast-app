"""
Bean profile router - handles all bean profile related endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict

from schemas import CreateBeanProfileRequest, ParseHTMLRequest, SemanticSearchRequest
from utils.database import get_supabase
from utils.auth import verify_jwt_token
from RAG_system.weaviate.weaviate_integration import (
    get_weaviate_integration, 
    sync_bean_to_weaviate,
    search_beans_semantic
)

router = APIRouter(prefix="", tags=["Bean Profiles"])

# Coffee regions validation - using shared data file
import json
import os

def load_coffee_regions():
    """Load coffee regions from shared data file"""
    try:
        # Get the path to the shared data file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        shared_data_path = os.path.join(current_dir, '..', '..', 'shared', 'data', 'coffee_regions.json')
        
        with open(shared_data_path, 'r') as f:
            data = json.load(f)
            return data['regions']
    except Exception as e:
        # Fallback to a minimal list if file can't be loaded
        print(f"Warning: Could not load coffee regions from shared file: {e}")
        return ['Other']

def validate_coffee_region(region: str) -> bool:
    """Validate that the coffee region is in our predefined list"""
    regions = load_coffee_regions()
    return region in regions

@router.get("/coffee-regions")
async def get_coffee_regions():
    """Get the list of valid coffee regions from shared data file"""
    regions = load_coffee_regions()
    return {"regions": regions}

@router.post("/bean-profiles")
async def create_bean_profile(request: CreateBeanProfileRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        bean_data = {
            "user_id": user_id,
            "name": request.name,
            "origin": request.origin,
            "bean_type": request.bean_type,  # NEW: Include bean type
            "espresso_suitable": request.espresso_suitable,  # Good for espresso checkbox
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

@router.get("/bean-profiles")
async def get_bean_profiles(user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        result = sb.table("bean_profiles").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bean-profiles/{bean_profile_id}")
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

@router.patch("/bean-profiles/{bean_profile_id}")
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

@router.delete("/bean-profiles/{bean_profile_id}")
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

@router.post("/bean-profiles/parse-html")
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

@router.post("/bean-profiles/parse-supplier")
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
@router.post("/search/beans")
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

@router.get("/search/similar-beans/{bean_profile_id}")
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

@router.get("/search/recommend-roast/{bean_profile_id}")
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

@router.post("/weaviate/initialize")
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

@router.post("/weaviate/sync-bean/{bean_profile_id}")
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
