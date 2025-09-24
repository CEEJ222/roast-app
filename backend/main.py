from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time
import os
from supabase import create_client, Client

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Request/Response models
class CreateRoastRequest(BaseModel):
    machine_label: str
    address: str
    coffee_region: str
    coffee_type: str
    coffee_process: str
    desired_roast_level: str
    weight_before_g: Optional[float] = None
    notes: Optional[str] = None

class LogEventRequest(BaseModel):
    kind: str
    fan_level: Optional[int] = None
    heat_level: Optional[int] = None
    temp_f: Optional[float] = None

class UpdateRoastRequest(BaseModel):
    weight_after_g: Optional[float] = None

# Your existing helper functions (copied from your code)
def get_or_create_machine_id(label: str) -> str:
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

def get_environmental_conditions(address: str) -> Dict[str, Any]:
    # Simplified version - you can add your full weather API logic here
    return {
        "resolved_address": address,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "temperature_f": 72.0,
        "humidity_pct": 65.0,
        "pressure_hpa": 1013.25,
        "elevation_ft": 100.0,
        "timezone": "America/New_York"
    }

# API endpoints
@app.post("/roasts")
async def create_roast(request: CreateRoastRequest):
    try:
        sb = get_supabase()
        
        # Get machine ID
        machine_id = get_or_create_machine_id(request.machine_label)
        
        # Get environmental conditions
        env = get_environmental_conditions(request.address)
        
        # Create roast entry
        roast_data = {
            "machine_id": machine_id,
            "resolved_address": env.get("resolved_address"),
            "latitude": env.get("latitude"),
            "longitude": env.get("longitude"),
            "temperature_f": env.get("temperature_f"),
            "humidity_pct": env.get("humidity_pct"),
            "pressure_hpa": env.get("pressure_hpa"),
            "elevation_ft": env.get("elevation_ft"),
            "timezone": env.get("timezone"),
            "coffee_region": request.coffee_region,
            "coffee_type": request.coffee_type,
            "coffee_process": request.coffee_process,
            "desired_roast_level": request.desired_roast_level,
            "weight_before_g": request.weight_before_g,
            "notes": request.notes,
        }
        
        # Remove None values
        roast_data = {k: v for k, v in roast_data.items() if v is not None}
        
        result = sb.table("roast_entries").insert(roast_data).execute()
        roast_id = result.data[0]["id"]
        start_ts = time.time()
        
        return {
            "roast_id": roast_id,
            "start_ts": start_ts,
            "env": env
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/roasts/{roast_id}/events")
async def log_event(roast_id: int, request: LogEventRequest):
    try:
        sb = get_supabase()
        
        # Get roast start time
        roast_result = sb.table("roast_entries").select("created_at").eq("id", roast_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        # Calculate t_offset_sec from roast creation time
        from datetime import datetime
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
        }
        
        # Remove None values
        event_data = {k: v for k, v in event_data.items() if v is not None}
        
        sb.table("roast_events").insert(event_data).execute()
        
        # Update milestone fields for special events
        if request.kind in ["FIRST_CRACK", "SECOND_CRACK", "DROP"]:
            col_map = {
                "FIRST_CRACK": {"t_first_crack_sec": t_offset_sec, "t_first_crack": t_offset_sec // 60},
                "SECOND_CRACK": {"t_second_crack_sec": t_offset_sec, "t_second_crack": t_offset_sec // 60},
                "DROP": {"t_drop_sec": t_offset_sec, "t_drop": t_offset_sec // 60},
            }
            update_data = col_map[request.kind]
            sb.table("roast_entries").update(update_data).eq("id", roast_id).execute()
        
        return {"success": True, "t_offset_sec": t_offset_sec}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/roasts/{roast_id}/events")
async def get_events(roast_id: int):
    try:
        sb = get_supabase()
        result = sb.table("roast_events").select("*").eq("roast_id", roast_id).order("t_offset_sec").execute()
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/roasts/{roast_id}")
async def update_roast(roast_id: int, request: UpdateRoastRequest):
    try:
        sb = get_supabase()
        
        update_data = {}
        if request.weight_after_g is not None:
            update_data["weight_after_g"] = request.weight_after_g
            
            # Calculate weight loss percentage
            roast_result = sb.table("roast_entries").select("weight_before_g").eq("id", roast_id).execute()
            if roast_result.data and roast_result.data[0]["weight_before_g"]:
                weight_before = roast_result.data[0]["weight_before_g"]
                loss_pct = ((weight_before - request.weight_after_g) / weight_before) * 100
                update_data["weight_loss_pct"] = loss_pct
        
        sb.table("roast_entries").update(update_data).eq("id", roast_id).execute()
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/roasts")
async def get_roasts(limit: int = 25):
    try:
        sb = get_supabase()
        result = sb.table("roast_entries").select("*").order("created_at", desc=True).limit(limit).execute()
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)