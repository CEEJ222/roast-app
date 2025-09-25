from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time
import os
import requests
import datetime
import jwt
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file for local development
load_dotenv()

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000",
        "https://roast-app-production.up.railway.app",  # Add your frontend Railway URL if you deploy it
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# JWT verification
security = HTTPBearer()

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return user ID"""
    try:
        if not credentials or not credentials.credentials:
            raise HTTPException(status_code=401, detail="No token provided")
        
        token = credentials.credentials
        if not isinstance(token, str) or not token.strip():
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        # Decode JWT token
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

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
    note: Optional[str] = None

class UpdateRoastRequest(BaseModel):
    weight_after_g: Optional[float] = None

class UserMachineRequest(BaseModel):
    name: str
    model: str
    has_extension: bool = False

class UserProfileRequest(BaseModel):
    display_name: Optional[str] = None
    address: Optional[str] = None
    units: Optional[dict] = None

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

def get_environmental_conditions(address: str, unit: str = "C") -> Dict[str, Any]:
    """
    Fetch ambient weather and elevation for a given address using OpenStreetMap and Open-Meteo.
    """
    
    try:
        # 1) Geocode using OpenStreetMap Nominatim
        geo_resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": "coffee-roast-agent/1.0"},
            timeout=10
        )
        geo_data = geo_resp.json()
        if not geo_data:
            return {"error": f"Could not find location for '{address}'."}
        
        lat = float(geo_data[0]["lat"])
        lon = float(geo_data[0]["lon"])
        display_name = geo_data[0].get("display_name", address)

        # 2) Weather using Open-Meteo
        weather_resp = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat, "longitude": lon,
                "hourly": "temperature_2m,relative_humidity_2m,pressure_msl",
                "current_weather": True, "timezone": "auto"
            },
            headers={"User-Agent": "coffee-roast-agent/1.0"},
            timeout=10
        )
        weather = weather_resp.json()

        tz_name = weather.get("timezone")
        tz_abbr = weather.get("timezone_abbreviation")
        current_time = weather.get("current_weather", {}).get("time")
        hourly = weather.get("hourly", {})
        times = hourly.get("time", []) or []
        temp_series = hourly.get("temperature_2m", []) or []
        rh_series = hourly.get("relative_humidity_2m", []) or []
        p_series = hourly.get("pressure_msl", []) or []

        def index_for_time(target_iso: str) -> int:
            if not times: return -1
            if target_iso in times: return times.index(target_iso)
            return len(times) - 1

        idx = index_for_time(current_time) if current_time else (len(times) - 1 if times else -1)
        temp_c = rh = pressure = sample_time = None
        if idx >= 0:
            sample_time = times[idx] if idx < len(times) else None
            temp_c = temp_series[idx] if idx < len(temp_series) else None
            rh = rh_series[idx] if idx < len(rh_series) else None
            pressure = p_series[idx] if idx < len(p_series) else None
        else:
            cw = weather.get("current_weather", {})
            temp_c = cw.get("temperature")
            sample_time = cw.get("time")

        # 3) Elevation using Open-Meteo
        elev_resp = requests.get(
            "https://api.open-meteo.com/v1/elevation",
            params={"latitude": lat, "longitude": lon},
            headers={"User-Agent": "coffee-roast-agent/1.0"},
            timeout=10
        )
        elev_json = elev_resp.json()
        elevation_m = (
            elev_json["elevation"][0]
            if isinstance(elev_json.get("elevation"), list) and elev_json["elevation"]
            else elev_json.get("elevation")
        )

        temperature_f = (temp_c * 9 / 5 + 32) if isinstance(temp_c, (int, float)) else None
        elevation_ft = (elevation_m * 3.28084) if isinstance(elevation_m, (int, float)) else None

        result = {
            "resolved_address": display_name, "latitude": lat, "longitude": lon,
            "temperature_c": temp_c, "temperature_f": temperature_f,
            "humidity_pct": rh, "pressure_hpa": pressure,
            "elevation_m": elevation_m, "elevation_ft": elevation_ft,
            "as_of": sample_time, "timezone": tz_name, "timezone_abbreviation": tz_abbr,
        }
        print(f"DEBUG: Environmental conditions for address '{address}':")
        print(f"  - Resolved to: {display_name}")
        print(f"  - Coordinates: {lat}, {lon}")
        print(f"  - Temperature: {temp_c}°C ({temperature_f}°F)")
        print(f"  - Humidity: {rh}%")
        print(f"  - Pressure: {pressure} hPa")
        print(f"  - Elevation: {elevation_m}m ({elevation_ft}ft)")
        print(f"  - Data timestamp: {sample_time}")
        print(f"  - Timezone: {tz_name} ({tz_abbr})")
        return result
    except Exception as e:
        print(f"DEBUG: Error fetching environmental conditions: {e}")
        return {"error": f"Error fetching environmental conditions: {e}"}

# API endpoints
@app.post("/roasts")
async def create_roast(request: CreateRoastRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Get machine ID
        machine_id = get_or_create_machine_id(request.machine_label)
        
        # Get environmental conditions
        env = get_environmental_conditions(request.address)
        if "error" in env:
            raise HTTPException(status_code=400, detail=env["error"])
        
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
async def log_event(roast_id: int, request: LogEventRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Get roast start time and verify ownership
        roast_result = sb.table("roast_entries").select("created_at").eq("id", roast_id).eq("user_id", user_id).execute()
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
            "note": request.note,
        }
        
        # Remove None values
        event_data = {k: v for k, v in event_data.items() if v is not None}
        
        sb.table("roast_events").insert(event_data).execute()
        
        # Update milestone fields for special events
        if request.kind in ["FIRST_CRACK", "SECOND_CRACK", "COOL"]:
            col_map = {
                "FIRST_CRACK": {"t_first_crack_sec": t_offset_sec, "t_first_crack": t_offset_sec // 60},
                "SECOND_CRACK": {"t_second_crack_sec": t_offset_sec, "t_second_crack": t_offset_sec // 60},
                "COOL": {"t_drop_sec": t_offset_sec, "t_drop": t_offset_sec // 60},
            }
            update_data = col_map[request.kind]
            sb.table("roast_entries").update(update_data).eq("id", roast_id).execute()
        
        return {"success": True, "t_offset_sec": t_offset_sec}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/roasts/{roast_id}/events")
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

@app.delete("/roasts/{roast_id}/events/{event_id}")
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

@app.put("/roasts/{roast_id}/events/{event_id}")
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

@app.patch("/roasts/{roast_id}")
async def update_roast(roast_id: int, request: UpdateRoastRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        
        # Verify roast ownership first
        roast_result = sb.table("roast_entries").select("weight_before_g").eq("id", roast_id).eq("user_id", user_id).execute()
        if not roast_result.data:
            raise HTTPException(status_code=404, detail="Roast not found")
        
        update_data = {}
        if request.weight_after_g is not None:
            update_data["weight_after_g"] = request.weight_after_g
            
            # Calculate weight loss percentage
            if roast_result.data[0]["weight_before_g"]:
                weight_before = roast_result.data[0]["weight_before_g"]
                loss_pct = ((weight_before - request.weight_after_g) / weight_before) * 100
                update_data["weight_loss_pct"] = loss_pct
        
        sb.table("roast_entries").update(update_data).eq("id", roast_id).execute()
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/roasts")
async def get_roasts(limit: int = 25, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        result = sb.table("roast_entries").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)