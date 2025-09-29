"""
HTML Parser for Coffee Bean Profiles
Handles parsing HTML source code from various coffee suppliers
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

# Import vendor parsers
from vendor_parsers.sweet_marias.sweet_marias_parser import parse_sweet_marias_html, get_ai_optimized_data

logger = logging.getLogger(__name__)
router = APIRouter()

class HTMLParseRequest(BaseModel):
    html_source: str

class HTMLParseResponse(BaseModel):
    success: bool
    bean_profile: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    vendor_detected: Optional[str] = None

def detect_vendor(html_content: str) -> str:
    """Detect which vendor the HTML content is from"""
    html_lower = html_content.lower()
    
    if 'sweetmarias.com' in html_lower or 'sweet maria' in html_lower:
        return 'sweet_marias'
    elif 'bluebottlecoffee.com' in html_lower or 'blue bottle' in html_lower:
        return 'blue_bottle'
    elif 'counterculturecoffee.com' in html_lower or 'counter culture' in html_lower:
        return 'counter_culture'
    else:
        return 'unknown'

def parse_html_content(html_content: str) -> Dict[str, Any]:
    """Parse HTML content and return structured bean profile data"""
    vendor = detect_vendor(html_content)
    
    if vendor == 'sweet_marias':
        try:
            # Parse with Sweet Maria's parser
            raw_data = parse_sweet_marias_html(html_content)
            ai_data = get_ai_optimized_data(html_content)
            
            # Combine and structure the data
            # Debug: Check what's in raw_data
            print(f"DEBUG: raw_data contains: {raw_data}")
            print(f"DEBUG: density from raw_data: {raw_data.get('density_g_ml')}")
            
            bean_profile = {
                # Basic info
                'name': raw_data.get('name', ''),
                'origin': raw_data.get('origin', ''),
                'variety': raw_data.get('variety', ''),
                'process_method': raw_data.get('process_method', ''),
                'description': raw_data.get('description', ''),
                
                # Technical specs
                'screen_size': raw_data.get('screen_size', ''),
                'density_g_ml': raw_data.get('density_g_ml'),
                'altitude_m': ai_data.get('altitude_m'),
                'harvest_year': None,  # Not typically available
                
                # Cupping scores
                'cupping_score': ai_data.get('cupping_score'),
                'fragrance_score': None,  # Not directly available
                
                # Flavor profile
                'body_intensity': ai_data.get('body_intensity', 0),
                'acidity_intensity': ai_data.get('acidity_intensity', 0),
                'floral_intensity': ai_data.get('floral_intensity', 0),
                'honey_intensity': ai_data.get('honey_intensity', 0),
                'sugars_intensity': ai_data.get('sugars_intensity', 0),
                'caramel_intensity': ai_data.get('caramel_intensity', 0),
                'fruits_intensity': ai_data.get('fruits_intensity', 0),
                'citrus_intensity': ai_data.get('citrus_intensity', 0),
                'berry_intensity': ai_data.get('berry_intensity', 0),
                'cocoa_intensity': ai_data.get('cocoa_intensity', 0),
                'nuts_intensity': ai_data.get('nuts_intensity', 0),
                'rustic_intensity': ai_data.get('rustic_intensity', 0),
                'spice_intensity': ai_data.get('spice_intensity', 0),
                
                # Supplier info
                'supplier_name': 'Sweet Maria\'s',
                'supplier_url': '',  # Will be set by user
                
                # Additional data
                'notes': raw_data.get('cupping_notes', ''),
                'roasting_notes': raw_data.get('roast_recommendations', ''),
                'recommended_roast_levels': ai_data.get('recommended_roast_levels', []),
                
                # Critical AI coaching data (will need manual input)
                'moisture_content_pct': None,
                'density_g_ml': None,
                
                # Metadata
                'vendor_detected': vendor,
                'parsing_confidence': 'high' if raw_data.get('name') else 'medium'
            }
            
            return bean_profile
            
        except Exception as e:
            logger.error(f"Error parsing Sweet Maria's HTML: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse Sweet Maria's HTML: {str(e)}")
    
    elif vendor == 'blue_bottle':
        # Placeholder for Blue Bottle parsing
        return {
            'name': 'Blue Bottle Coffee',
            'vendor_detected': vendor,
            'parsing_confidence': 'low',
            'notes': 'Blue Bottle parsing not yet implemented'
        }
    
    elif vendor == 'counter_culture':
        # Placeholder for Counter Culture parsing
        return {
            'name': 'Counter Culture Coffee',
            'vendor_detected': vendor,
            'parsing_confidence': 'low',
            'notes': 'Counter Culture parsing not yet implemented'
        }
    
    else:
        # Generic parsing attempt
        return {
            'name': 'Unknown Coffee',
            'vendor_detected': vendor,
            'parsing_confidence': 'low',
            'notes': 'Generic parsing - limited data extraction'
        }

@router.post("/bean-profiles/parse-html", response_model=HTMLParseResponse)
async def parse_html_source(
    request: HTMLParseRequest,
    user_id: str = Depends(lambda: "anonymous")  # Placeholder for auth
):
    """
    Parse HTML source code and extract bean profile data
    """
    try:
        if not request.html_source.strip():
            raise HTTPException(status_code=400, detail="HTML source code is required")
        
        # Parse the HTML content
        bean_profile = parse_html_content(request.html_source)
        vendor = detect_vendor(request.html_source)
        
        return HTMLParseResponse(
            success=True,
            bean_profile=bean_profile,
            vendor_detected=vendor
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing HTML: {e}")
        return HTMLParseResponse(
            success=False,
            error=f"Failed to parse HTML: {str(e)}"
        )

@router.post("/test-parser")
async def test_parser(request: HTMLParseRequest):
    """Test endpoint to debug parser issues"""
    try:
        raw_data = parse_sweet_marias_html(request.html_source)
        return {"raw_data": raw_data}
    except Exception as e:
        return {"error": str(e)}
