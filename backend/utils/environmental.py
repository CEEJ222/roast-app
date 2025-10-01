"""
Environmental conditions utilities for fetching weather and elevation data
"""
import requests
from typing import Dict, Any


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
