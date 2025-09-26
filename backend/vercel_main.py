from fastapi import FastAPI, HTTPException, Depends, Header, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time
import os
import requests
import datetime
from jose import jwt
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Vercel-optimized CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.roastbuddy.app",
        "https://roastbuddy.app", 
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Additional CORS middleware for Vercel serverless
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Handle preflight requests
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "https://www.roastbuddy.app",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400",
            }
        )
    
    # Process the request
    response = await call_next(request)
    
    # Add CORS headers to all responses
    response.headers["Access-Control-Allow-Origin"] = "https://www.roastbuddy.app"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

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

# Helper functions
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
    """Fetch ambient weather and elevation for a given address using OpenStreetMap and Open-Meteo."""
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
            if not times or not target_iso: return -1
            if target_iso in times: return times.index(target_iso)
            
            # Try to find the closest hourly forecast time
            from datetime import datetime
            try:
                target_dt = datetime.fromisoformat(target_iso.replace('Z', '+00:00'))
                closest_idx = -1
                min_diff = float('inf')
                
                for i, time_str in enumerate(times):
                    try:
                        forecast_dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
                        diff = abs((target_dt - forecast_dt).total_seconds())
                        if diff < min_diff:
                            min_diff = diff
                            closest_idx = i
                    except:
                        continue
                
                # Only use hourly data if we found a close match (within 2 hours)
                if closest_idx >= 0 and min_diff <= 7200:  # 2 hours in seconds
                    return closest_idx
            except:
                pass
            
            return -1

        # Use current weather data as primary source, fall back to hourly if needed
        cw = weather.get("current_weather", {})
        temp_c = cw.get("temperature")
        sample_time = cw.get("time")
        rh = pressure = None
        
        # Try to get humidity and pressure from hourly data
        idx = index_for_time(current_time) if current_time else -1
        if idx >= 0 and idx < len(times):
            sample_time = times[idx] if idx < len(times) else sample_time
            rh = rh_series[idx] if idx < len(rh_series) else None
            pressure = p_series[idx] if idx < len(p_series) else None

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
        return result
    except Exception as e:
        return {"error": f"Error fetching environmental conditions: {e}"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

# Explicit OPTIONS handlers for Vercel
@app.options("/roasts")
async def options_roasts():
    return Response(status_code=200)

@app.options("/user/profile")
async def options_user_profile():
    return Response(status_code=200)

@app.options("/user/machines")
async def options_user_machines():
    return Response(status_code=200)

@app.options("/roasts/{roast_id}/events")
async def options_roast_events(roast_id: int):
    return Response(status_code=200)

@app.options("/roasts/{roast_id}")
async def options_roast_detail(roast_id: int):
    return Response(status_code=200)

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

@app.get("/roasts")
async def get_roasts(limit: int = 25, user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        # Join with machines table to get machine name
        result = sb.table("roast_entries").select("*, machines(name)").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        # Flatten the machine name into the roast data
        roasts = []
        for roast in result.data:
            roast_data = roast.copy()
            if roast.get('machines') and roast['machines'].get('name'):
                roast_data['machine_label'] = roast['machines']['name']
            else:
                roast_data['machine_label'] = None
            # Remove the nested machines object
            roast_data.pop('machines', None)
            roasts.append(roast_data)
        
        return roasts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/user/machines")
async def get_user_machines(user_id: str = Depends(verify_jwt_token)):
    try:
        sb = get_supabase()
        # Get machines directly from machines table filtered by user_id
        machines_result = sb.table("machines").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return machines_result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Vercel handler
def handler(request):
    return app
