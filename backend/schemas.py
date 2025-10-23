"""
Request and Response models for the Roast Buddy API
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class CreateRoastRequest(BaseModel):
    machine_label: str
    address: str
    bean_profile_id: str  # Required - no more optional
    desired_roast_level: str
    weight_before_g: Optional[float] = None
    expected_roast_time_minutes: Optional[int] = None
    notes: Optional[str] = None
    # Removed: coffee_region, coffee_subregion, coffee_type, coffee_process


class CreateBeanProfileRequest(BaseModel):
    # Basic Info
    name: str
    origin: Optional[str] = None
    bean_type: Optional[str] = None  # NEW: Bean type (Regular, Peaberry, Maragogype, etc.)
    espresso_suitable: Optional[bool] = None  # Good for espresso checkbox
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
    # Only fields that exist in roast_entries table
    desired_roast_level: Optional[str] = None
    weight_before_g: Optional[float] = None
    weight_after_g: Optional[float] = None
    notes: Optional[str] = None
    tasting_notes: Optional[str] = None
    star_rating: Optional[int] = None


class UserMachineRequest(BaseModel):
    name: str
    model: str
    has_extension: bool = False


class UserProfileRequest(BaseModel):
    display_name: Optional[str] = None
    address: Optional[str] = None
    units: Optional[dict] = None
