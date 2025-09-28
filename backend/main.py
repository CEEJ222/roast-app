from fastapi import FastAPI, HTTPException, Depends, Header, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time
import os
import requests
import datetime
from jose import jwt, JWTError
from supabase import create_client, Client
from dotenv import load_dotenv
from vendor_parsers.sweet_marias import parse_sweet_marias_url, parse_sweet_marias_html, get_ai_optimized_data
from weaviate_integration import (
    get_weaviate_integration, 
    sync_bean_to_weaviate, 
    sync_roast_to_weaviate,
    search_beans_semantic,
    search_roasts_semantic
)
from weaviate_config import initialize_weaviate

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
    'Guatemala', 'Costa Rica', 'Honduras', 'Nicaragua', 'El Salvador', 
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

# Railway CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware to ensure CORS headers are added to ALL responses, including errors
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Add CORS headers to all responses
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    response.headers["Access-Control-Max-Age"] = "600"
    
    return response

# RAG API router will be included after app creation to avoid circular imports

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
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

# Request/Response models
class CreateRoastRequest(BaseModel):
    machine_label: str
    address: str
    coffee_region: str
    coffee_subregion: Optional[str] = None
    coffee_type: str
    coffee_process: str
    desired_roast_level: str
    weight_before_g: Optional[float] = None
    notes: Optional[str] = None
    bean_profile_id: Optional[str] = None

class CreateBeanProfileRequest(BaseModel):
    # Basic Info
    name: str
    origin: Optional[str] = None
    notes: Optional[str] = None
    supplier_url: Optional[str] = None
    supplier_name: Optional[str] = None
    
    # Tier 1: Must Have (Critical for AI Coaching)
    moisture_content_pct: Optional[float] = None
    density_g_ml: Optional[float] = None
    process_method: Optional[str] = None
    recommended_roast_levels: Optional[List[str]] = None
    
    # Tier 2: Very Important
    screen_size: Optional[str] = None
    variety: Optional[str] = None
    altitude_m: Optional[int] = None
    body_intensity: Optional[float] = None
    
    # Tier 3: Helpful
    harvest_year: Optional[int] = None
    acidity_intensity: Optional[float] = None
    
    # Flavor Profile (Additional)
    flavor_notes: Optional[List[str]] = None
    cupping_score: Optional[float] = None
    fragrance_score: Optional[float] = None
    floral_intensity: Optional[float] = None
    honey_intensity: Optional[float] = None
    sugars_intensity: Optional[float] = None
    caramel_intensity: Optional[float] = None
    fruits_intensity: Optional[float] = None
    citrus_intensity: Optional[float] = None
    berry_intensity: Optional[float] = None
    cocoa_intensity: Optional[float] = None
    nuts_intensity: Optional[float] = None
    rustic_intensity: Optional[float] = None
    spice_intensity: Optional[float] = None
    
    # Additional
    roasting_notes: Optional[str] = None
    qr_code_url: Optional[str] = None

class ParseQRRequest(BaseModel):
    url: str

class ParseHTMLRequest(BaseModel):
    html_content: str

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10

class LogEventRequest(BaseModel):
    kind: str
    fan_level: Optional[int] = None
    heat_level: Optional[int] = None
    temp_f: Optional[float] = None
    note: Optional[str] = None

class UpdateRoastRequest(BaseModel):
    coffee_type: Optional[str] = None
    coffee_region: Optional[str] = None
    coffee_process: Optional[str] = None
    desired_roast_level: Optional[str] = None
    weight_before_g: Optional[float] = None
    weight_after_g: Optional[float] = None
    notes: Optional[str] = None

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

def create_basic_bean_profile(user_id: str, coffee_region: str, coffee_type: str, coffee_process: str, desired_roast_level: str) -> str:
    """Auto-create a basic bean profile from roast form data"""
    sb = get_supabase()
    
    # Generate a simple name for the bean profile
    from datetime import datetime
    current_date = datetime.now().strftime("%m/%d/%Y")
    bean_name = f"{coffee_region} {coffee_process} - {current_date}"
    
    # Create basic bean profile
    bean_data = {
        "user_id": user_id,
        "name": bean_name,
        "origin": coffee_region,
        "variety": coffee_type,
        "process_method": coffee_process,
        "recommended_roast_levels": [desired_roast_level],
        "profile_completeness": "basic"
    }
    
    result = sb.table("bean_profiles").insert(bean_data).execute()
    return result.data[0]["id"]

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
            timeout=5
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
            timeout=5
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

# Health check endpoint for Railway
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/coffee-regions")
async def get_coffee_regions():
    """Get the list of valid coffee regions"""
    return {"regions": COFFEE_REGIONS}



# API endpoints
@app.post("/roasts")
async def create_roast(request: CreateRoastRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        # Validate coffee region
        if not validate_coffee_region(request.coffee_region):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid coffee region: {request.coffee_region}. Must be one of: {', '.join(COFFEE_REGIONS)}"
            )
        
        sb = get_supabase()
        
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
        
        # Auto-create basic bean profile if not provided
        bean_profile_id = request.bean_profile_id
        if not bean_profile_id:
            bean_profile_id = create_basic_bean_profile(
                user_id, 
                request.coffee_region, 
                request.coffee_type, 
                request.coffee_process, 
                request.desired_roast_level
            )
            print(f"DEBUG: Auto-created basic bean profile: {bean_profile_id}")
        
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
            "coffee_subregion": request.coffee_subregion,
            "coffee_type": request.coffee_type,
            "coffee_process": request.coffee_process,
            "desired_roast_level": request.desired_roast_level,
            "weight_before_g": request.weight_before_g,
            "notes": request.notes,
            "bean_profile_id": bean_profile_id,
        }
        
        # Remove None values
        roast_data = {k: v for k, v in roast_data.items() if v is not None}
        
        result = sb.table("roast_entries").insert(roast_data).execute()
        roast_id = result.data[0]["id"]
        start_ts = time.time()
        
        response_data = {
            "roast_id": roast_id,
            "start_ts": start_ts,
            "env": env,
            "weight_before_g": request.weight_before_g,
            "bean_profile_id": bean_profile_id
        }
        print(f"DEBUG: Returning response with weight_before_g: {request.weight_before_g}")
        return response_data
        
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
        
        # Update all provided fields
        if request.coffee_type is not None:
            update_data["coffee_type"] = request.coffee_type
        if request.coffee_region is not None:
            update_data["coffee_region"] = request.coffee_region
        if request.coffee_process is not None:
            update_data["coffee_process"] = request.coffee_process
        if request.desired_roast_level is not None:
            update_data["desired_roast_level"] = request.desired_roast_level
        if request.weight_before_g is not None:
            update_data["weight_before_g"] = request.weight_before_g
        if request.weight_after_g is not None:
            update_data["weight_after_g"] = request.weight_after_g
        if request.notes is not None:
            update_data["notes"] = request.notes
            
        # Calculate weight loss percentage if weight_after_g is being updated
        if request.weight_after_g is not None:
            # Get current weight_before_g (either from request or existing)
            weight_before = request.weight_before_g if request.weight_before_g is not None else roast_result.data[0]["weight_before_g"]
            if weight_before:
                loss_pct = ((weight_before - request.weight_after_g) / weight_before) * 100
                update_data["weight_loss_pct"] = loss_pct
        
        sb.table("roast_entries").update(update_data).eq("id", roast_id).execute()
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/roasts")
async def get_roasts(limit: int = 100, user_id: str = Depends(verify_jwt_token)):
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

@app.delete("/roasts/{roast_id}")
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
        return {"id": result.data[0]["id"], "message": "Bean profile created successfully"}
        
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
        
        # Delete the bean profile
        sb.table("bean_profiles").delete().eq("id", bean_profile_id).execute()
        
        return {"success": True, "message": "Bean profile deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/bean-profiles/parse-qr")
async def parse_bean_qr(request: ParseQRRequest, user_id: str = Depends(verify_jwt_token)):
    try:
        # Parse the Sweet Maria's URL to extract bean data
        bean_data = parse_sweet_marias_url(request.url)
        
        # Return the parsed data without creating a profile
        return {
            "bean_data": bean_data,
            "message": "URL parsed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse QR code: {str(e)}")

@app.post("/bean-profiles/parse-html")
async def parse_bean_html(request: ParseHTMLRequest, user_id: str = Depends(verify_jwt_token)):
    """Parse Sweet Maria's HTML content and create bean profile"""
    try:
        # Parse the HTML content
        parsed_data = parse_sweet_marias_html(request.html_content)
        ai_data = get_ai_optimized_data(request.html_content)
        
        # Create bean profile from parsed data
        sb = get_supabase()
        
        # Build profile data with all extracted information
        profile_data = {
            "user_id": user_id,
            "name": parsed_data.get("name", "Unknown Bean"),
            "origin": ai_data.get("origin", "Unknown Origin"),
            "variety": ai_data.get("variety", "Unknown Variety"),
            "process_method": ai_data.get("process_method", "Unknown Process"),
            "recommended_roast_levels": ai_data.get("recommended_roast_levels", []),
            "notes": parsed_data.get("description", ""),
            "supplier_name": "Sweet Maria's",
            "profile_completeness": "complete",
            
            # AI-optimized fields
            "screen_size": ai_data.get("screen_size"),
            "altitude_m": ai_data.get("altitude_m"),
            "body_intensity": ai_data.get("body_intensity"),
            "acidity_intensity": ai_data.get("acidity_intensity"),
            "cupping_score": ai_data.get("cupping_score"),
            
            # Espresso suitability
            "espresso_suitable": parsed_data.get("espresso_suitable"),
            
            # Flavor profile
            "floral_intensity": ai_data.get("floral_intensity"),
            "honey_intensity": ai_data.get("honey_intensity"),
            "sugars_intensity": ai_data.get("sugars_intensity"),
            "caramel_intensity": ai_data.get("caramel_intensity"),
            "fruits_intensity": ai_data.get("fruits_intensity"),
            "citrus_intensity": ai_data.get("citrus_intensity"),
            "berry_intensity": ai_data.get("berry_intensity"),
            "cocoa_intensity": ai_data.get("cocoa_intensity"),
            "nuts_intensity": ai_data.get("nuts_intensity"),
            "rustic_intensity": ai_data.get("rustic_intensity"),
            "spice_intensity": ai_data.get("spice_intensity"),
            
            # Store raw parsed data for reference
            "raw_data": parsed_data
        }
        
        # Remove None values
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        
        result = sb.table("bean_profiles").insert(profile_data).execute()
        return result.data[0]
        
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

@app.post("/search/roasts")
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

# Include RAG API router (imported here to avoid circular dependency)
try:
    from rag_endpoints import router as rag_router
    app.include_router(rag_router, prefix="/api", tags=["RAG Copilot"])
    print("✅ RAG API router included successfully")
except ImportError as e:
    print(f"⚠️ Could not import RAG API router: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)