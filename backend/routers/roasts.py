"""
Roast-related API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import time
from datetime import datetime

from schemas import CreateRoastRequest, LogEventRequest, UpdateRoastRequest, SemanticSearchRequest
from utils.environmental import get_environmental_conditions
from utils.database import get_supabase, get_or_create_machine_id
from utils.auth import verify_jwt_token
from RAG_system.weaviate.weaviate_integration import search_roasts_semantic, get_weaviate_integration

router = APIRouter(prefix="", tags=["Roasts"])


@router.post("/roasts")
async def create_roast(request: CreateRoastRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        print(f"DEBUG: Starting create_roast with user_id: {user_id}")
        print(f"DEBUG: Request data: {request}")
        
        sb = get_supabase()
        
        # Validate that the bean profile exists and belongs to the user
        try:
            profile_result = sb.table("bean_profiles").select("id, origin, variety, process_method").eq("id", request.bean_profile_id).eq("user_id", user_id).execute()
            if not profile_result.data:
                print(f"DEBUG: Bean profile {request.bean_profile_id} not found or doesn't belong to user {user_id}")
                raise HTTPException(status_code=400, detail="Bean profile not found or doesn't belong to user")
            print(f"DEBUG: Bean profile {request.bean_profile_id} validated successfully")
            bean_profile = profile_result.data[0]
        except Exception as e:
            print(f"DEBUG: Error validating bean profile: {e}")
            raise e
        
        # Get machine ID
        machine_id = get_or_create_machine_id(request.machine_label)
        
        # Get environmental conditions
        # Try to get environmental conditions, but don't fail if it times out
        try:
            env = get_environmental_conditions(request.address)
            if "error" in env:
                print(f"Environmental data error: {env['error']}")
                # Use default values if environmental data fails
                env = {
                    "resolved_address": request.address,
                    "latitude": None,
                    "longitude": None,
                    "temperature_c": None,
                    "temperature_f": None,
                    "humidity_pct": None,
                    "pressure_hpa": None,
                    "elevation_m": None,
                    "elevation_ft": None,
                    "as_of": None,
                    "timezone": None,
                    "timezone_abbreviation": None
                }
        except Exception as e:
            print(f"Environmental data fetch failed: {e}")
            # Use default values if environmental data fails
            env = {
                "resolved_address": request.address,
                "latitude": None,
                "longitude": None,
                "temperature_c": None,
                "temperature_f": None,
                "humidity_pct": None,
                "pressure_hpa": None,
                "elevation_m": None,
                "elevation_ft": None,
                "as_of": None,
                "timezone": None,
                "timezone_abbreviation": None
            }
        
        # Create roast entry
        roast_data = {
            "user_id": user_id,
            "machine_id": machine_id,
            "resolved_address": env.get("resolved_address"),
            "latitude": env.get("latitude"),
            "longitude": env.get("longitude"),
            "temperature_c": env.get("temperature_c"),
            "temperature_f": env.get("temperature_f"),
            "humidity_pct": env.get("humidity_pct"),
            "pressure_hpa": env.get("pressure_hpa"),
            "elevation_m": env.get("elevation_m"),
            "elevation_ft": env.get("elevation_ft"),
            "as_of": env.get("as_of"),
            "timezone": env.get("timezone"),
            "timezone_abbreviation": env.get("timezone_abbreviation"),
            "desired_roast_level": request.desired_roast_level,
            "weight_before_g": request.weight_before_g,
            "expected_roast_time_minutes": request.expected_roast_time_minutes,
            "notes": request.notes if request.notes else None,
            "bean_profile_id": request.bean_profile_id,
            "roast_status": "in_progress",  # Set initial status
        }
        
        # Remove None values
        roast_data = {k: v for k, v in roast_data.items() if v is not None}
        
        print(f"DEBUG: Inserting roast data: {roast_data}")
        
        try:
            result = sb.table("roast_entries").insert(roast_data).execute()
            print(f"DEBUG: Insert successful: {result}")
        except Exception as e:
            print(f"DEBUG: Insert failed with error: {e}")
            raise e
        roast_id = result.data[0]["id"]
        start_ts = time.time()
        
        response_data = {
            "roast_id": roast_id,
            "start_ts": start_ts,
            "env": env,
            "weight_before_g": request.weight_before_g,
            "bean_profile_id": request.bean_profile_id,
            "bean_profile": bean_profile  # Include the full bean profile object
        }
        print(f"DEBUG: Returning response with weight_before_g: {request.weight_before_g}")
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/roasts/{roast_id}/events")
async def log_event(roast_id: int, request: LogEventRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Get roast start time and verify ownership
        roast_result = sb.table("roast_entries").select("created_at").eq("id", roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        # Calculate t_offset_sec from roast creation time
        created_at_str = roast_result.data[0]["created_at"]
        created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
        now = datetime.now(created_at.tzinfo)
        t_offset_sec = int((now - created_at).total_seconds())
        
        # Insert event
        event_data = {
            "roast_id": roast_id,
            "kind": request.kind,
            "t_offset_sec": t_offset_sec,
            "fan_level": request.fan_level,
            "heat_level": request.heat_level,
            "temp_f": request.temp_f,
            "note": request.note,
        }
        
        # Remove None values
        event_data = {k: v for k, v in event_data.items() if v is not None}
        
        sb.table("roast_events").insert(event_data).execute()
        
        # Update milestone fields for special events
        if request.kind in ["DRY_END", "FIRST_CRACK", "SECOND_CRACK", "COOL"]:
            col_map = {
                "DRY_END": {"t_dry_end_sec": t_offset_sec, "t_dry_end": t_offset_sec // 60},
                "FIRST_CRACK": {"t_first_crack_sec": t_offset_sec, "t_first_crack": t_offset_sec // 60},
                "SECOND_CRACK": {"t_second_crack_sec": t_offset_sec, "t_second_crack": t_offset_sec // 60},
                "COOL": {"t_drop_sec": t_offset_sec, "t_drop": t_offset_sec // 60},
            }
            update_data = col_map[request.kind]
            sb.table("roast_entries").update(update_data).eq("id", roast_id).execute()
        
        return {"success": True, "t_offset_sec": t_offset_sec}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roasts/{roast_id}/events")
async def get_events(roast_id: int, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        # Verify roast ownership first
        roast_result = sb.table("roast_entries").select("id").eq("id", roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        result = sb.table("roast_events").select("*").eq("roast_id", roast_id).order("t_offset_sec").execute()
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/roasts/{roast_id}/events/{event_id}")
async def delete_event(roast_id: int, event_id: str, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Verify roast ownership first
        roast_result = sb.table("roast_entries").select("id").eq("id", roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        # Verify the event exists and belongs to this roast
        event_result = sb.table("roast_events").select("id").eq("id", event_id).eq("roast_id", roast_id).execute()
        if not event_result.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Delete the event
        sb.table("roast_events").delete().eq("id", event_id).execute()
        
        return {"success": True, "message": "Event deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/roasts/{roast_id}/events/{event_id}")
async def update_event(roast_id: int, event_id: str, request: LogEventRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Verify roast ownership first
        roast_result = sb.table("roast_entries").select("id").eq("id", roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        # Verify the event exists and belongs to this roast
        event_result = sb.table("roast_events").select("id").eq("id", event_id).eq("roast_id", roast_id).execute()
        if not event_result.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Update the event
        update_data = {
            "kind": request.kind,
            "fan_level": request.fan_level,
            "heat_level": request.heat_level,
            "temp_f": request.temp_f,
            "note": request.note,
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        sb.table("roast_events").update(update_data).eq("id", event_id).execute()
        
        return {"success": True, "message": "Event updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/roasts/{roast_id}")
async def update_roast(roast_id: int, request: UpdateRoastRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Verify roast ownership first
        roast_result = sb.table("roast_entries").select("weight_before_g").eq("id", roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        update_data = {}
        
        # Update only fields that exist in roast_entries table
        if request.desired_roast_level is not None:
            update_data["desired_roast_level"] = request.desired_roast_level
        if request.weight_before_g is not None:
            update_data["weight_before_g"] = request.weight_before_g
        if request.weight_after_g is not None:
            update_data["weight_after_g"] = request.weight_after_g
        if request.notes is not None:
            update_data["notes"] = request.notes
        if request.tasting_notes is not None:
            update_data["tasting_notes"] = request.tasting_notes
        if request.star_rating is not None:
            update_data["star_rating"] = request.star_rating
            
        # Calculate weight loss percentage if weight_after_g is being updated
        if request.weight_after_g is not None:
            # Get current weight_before_g (either from request or existing)
            weight_before = request.weight_before_g if request.weight_before_g is not None else roast_result.data[0]["weight_before_g"]
            if weight_before:
                loss_pct = ((weight_before - request.weight_after_g) / weight_before) * 100
                update_data["weight_loss_pct"] = loss_pct
            
            # CRITICAL BUG FIX: Mark roast as completed when final weight is recorded
            update_data["roast_status"] = "completed"
        
        print(f"DEBUG: Updating roast {roast_id} with data: {update_data}")
        try:
            result = sb.table("roast_entries").update(update_data).eq("id", roast_id).execute()
            print(f"DEBUG: Update result: {result}")
            return {"success": True}
        except Exception as supabase_error:
            print(f"DEBUG: Supabase update error: {supabase_error}")
            raise HTTPException(status_code=400, detail=f"Database update failed: {str(supabase_error)}")
        
    except Exception as e:
        print(f"DEBUG: General error in update_roast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roasts")
async def get_roasts(limit: int = 100, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        # Join with machines and bean_profiles tables to get machine name, bean profile name, origin, and process
        result = sb.table("roast_entries").select("*, machines(name), bean_profiles(name, origin, process_method, variety, bean_type)").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        # Flatten the machine name and bean profile data into the roast data
        roasts = []
        for roast in result.data:
            roast_data = roast.copy()
            if roast.get('machines') and roast['machines'].get('name'):
                roast_data['machine_label'] = roast['machines']['name']
            else:
                roast_data['machine_label'] = None
            
            if roast.get('bean_profiles'):
                bean_profile = roast['bean_profiles']
                if bean_profile.get('name'):
                    roast_data['bean_profile_name'] = bean_profile['name']
                else:
                    roast_data['bean_profile_name'] = None
                
                # Add bean profile origin and process to roast data for display
                if bean_profile.get('origin'):
                    roast_data['coffee_region'] = bean_profile['origin']
                elif bean_profile.get('name'):
                    # Extract region from bean profile name (first word)
                    roast_data['coffee_region'] = bean_profile['name'].split()[0] if bean_profile['name'] else None
                if bean_profile.get('process_method'):
                    roast_data['coffee_process'] = bean_profile['process_method']
                if bean_profile.get('variety'):
                    roast_data['variety'] = bean_profile['variety']
                if bean_profile.get('bean_type'):
                    roast_data['coffee_type'] = bean_profile['bean_type']
            else:
                roast_data['bean_profile_name'] = None
                print(f"DEBUG: Roast {roast.get('id')} has no linked bean profile")
            
            # Remove the nested objects
            roast_data.pop('machines', None)
            roast_data.pop('bean_profiles', None)
            roasts.append(roast_data)
        
        return roasts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/roasts/{roast_id}")
async def delete_roast(roast_id: int, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Verify roast ownership first
        roast_result = sb.table("roast_entries").select("id").eq("id", roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        # Delete all events associated with this roast first (cascade delete)
        sb.table("roast_events").delete().eq("roast_id", roast_id).execute()
        
        # Delete the roast entry
        sb.table("roast_entries").delete().eq("id", roast_id).execute()
        
        return {"success": True, "message": "Roast and all associated events deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Search endpoints related to roasts
@router.post("/search/roasts")
async def search_roasts_semantic_endpoint(request: SemanticSearchRequest, user_id: str = Depends(verify_jwt_token)):
    """Search for roast profiles using semantic similarity"""
    try:
        results = search_roasts_semantic(request.query, request.limit)
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
