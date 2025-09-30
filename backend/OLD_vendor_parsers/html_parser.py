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
    
    print(f"DEBUG: Checking vendor detection...")
    print(f"DEBUG: HTML contains 'sweetmarias.com': {'sweetmarias.com' in html_lower}")
    print(f"DEBUG: HTML contains 'sweet maria': {'sweet maria' in html_lower}")
    sweet_maria_check = "sweet maria's" in html_lower
    print(f"DEBUG: HTML contains 'sweet maria's': {sweet_maria_check}")
    print(f"DEBUG: HTML contains 'additional-attributes-table': {'additional-attributes-table' in html_lower}")
    
    # Check for Sweet Maria's indicators - expanded detection
    sweet_maria_indicators = [
        'sweetmarias.com',
        'sweet maria',
        "sweet maria's",
        'additional-attributes-table',
        'forix-chartjs',  # Sweet Maria's chart class
        'data-chart-value',  # Sweet Maria's chart data
        'cupping-notes',  # Sweet Maria's cupping notes class
        'product attribute',  # Sweet Maria's product attribute class
        'page-title'  # Sweet Maria's page title class
    ]
    
    if any(indicator in html_lower for indicator in sweet_maria_indicators):
        print("DEBUG: Detected Sweet Maria's vendor")
        return 'sweet_marias'
    elif 'bluebottlecoffee.com' in html_lower or 'blue bottle' in html_lower:
        return 'blue_bottle'
    elif 'counterculturecoffee.com' in html_lower or 'counter culture' in html_lower:
        return 'counter_culture'
    else:
        print("DEBUG: No vendor detected, using unknown")
        return 'unknown'

def parse_html_content(html_content: str) -> Dict[str, Any]:
    """Parse HTML content and return structured bean profile data"""
    print("DEBUG: Using updated html_parser.py version 2.0")
    vendor = detect_vendor(html_content)
    
    if vendor == 'sweet_marias':
        try:
            # Get parser functions with development reload capability
            from main import get_parser_functions
            parse_func, ai_func = get_parser_functions()
            
            # Parse with Sweet Maria's parser
            raw_data = parse_func(html_content)
            ai_data = ai_func(html_content)
            
            # Apply mapping logic for dropdown compatibility
            origin = raw_data.get('origin', '')
            variety = raw_data.get('variety', '')
            process_method = raw_data.get('process_method', '')
            
            # Map origin to dropdown values
            print(f"DEBUG: Mapping origin '{origin}' to dropdown value")
            if 'Sumatra' in origin or 'Kerinci' in origin or 'Gunung' in origin:
                origin = 'Indonesia'
                print(f"DEBUG: Mapped to Indonesia")
            elif 'Ethiopia' in origin:
                origin = 'Ethiopia'
            elif 'Colombia' in origin:
                origin = 'Colombia'
            elif 'Guatemala' in origin:
                origin = 'Guatemala'
            elif 'Costa Rica' in origin:
                origin = 'Costa Rica'
            elif 'Kenya' in origin or 'Nyeri' in origin or 'Karima' in origin:
                origin = 'Kenya'
                print(f"DEBUG: Mapped to Kenya")
            elif 'Brazil' in origin:
                origin = 'Brazil'
            elif 'Peru' in origin:
                origin = 'Peru'
            elif 'Honduras' in origin:
                origin = 'Honduras'
            elif 'Nicaragua' in origin:
                origin = 'Nicaragua'
            elif 'El Salvador' in origin:
                origin = 'El Salvador'
            elif 'Panama' in origin:
                origin = 'Panama'
            elif 'Mexico' in origin:
                origin = 'Mexico'
            elif 'Rwanda' in origin:
                origin = 'Rwanda'
            elif 'Burundi' in origin:
                origin = 'Burundi'
            elif 'Tanzania' in origin:
                origin = 'Tanzania'
            elif 'Uganda' in origin:
                origin = 'Uganda'
            elif 'Yemen' in origin:
                origin = 'Yemen'
            elif origin and origin not in ['Ethiopia', 'Colombia', 'Guatemala', 'Costa Rica', 'Kenya', 'Brazil', 'Peru', 'Honduras', 'Nicaragua', 'El Salvador', 'Panama', 'Mexico', 'Rwanda', 'Burundi', 'Tanzania', 'Uganda', 'Yemen', 'Indonesia']:
                origin = 'Other'
            
            # Map variety to dropdown values
            if 'Ateng' in variety or 'Jember' in variety or 'Tim Tim' in variety:
                variety = 'Other'  # These are specific Indonesian varieties
            
            # Map process method to dropdown values
            if 'Dry Process' in process_method or 'Natural' in process_method:
                process_method = 'Natural'
            elif 'Washed' in process_method or 'Wet Process' in process_method:
                process_method = 'Washed'
            elif 'Honey' in process_method:
                process_method = 'Honey'
            elif 'Semi-Washed' in process_method:
                process_method = 'Semi-Washed'
            elif 'Anaerobic' in process_method:
                process_method = 'Anaerobic'
            elif 'Carbonic Maceration' in process_method:
                process_method = 'Carbonic Maceration'
            elif process_method and process_method not in ['Washed', 'Natural', 'Honey', 'Semi-Washed', 'Anaerobic', 'Carbonic Maceration']:
                process_method = 'Other'
            
            # Map recommended roast levels to all levels in range
            recommended_roast_levels = raw_data.get('recommended_roast_levels', [])
            if 'City to Full City+' in str(recommended_roast_levels) or 'City to Full City+' in raw_data.get('roast_recommendations', ''):
                recommended_roast_levels = ['City', 'City+', 'Full City', 'Full City+']
            
            # Determine bean type with default to "Regular"
            bean_type = 'Regular'  # Default to Regular unless otherwise specified
            all_text = html_content.lower()
            
            # Check for specific bean type indicators with more precise matching
            # Look for peaberry in specific contexts (not just anywhere)
            peaberry_patterns = [
                'peaberry coffee',
                'peaberry beans',
                'peaberry selection',
                'peaberry lot',
                'peaberry grade',
                'peaberry screen',
                'peaberry only',
                '100% peaberry',
                'pure peaberry'
            ]
            
            # Look for maragogype in specific contexts
            maragogype_patterns = [
                'maragogype coffee',
                'maragogype beans',
                'maragogype selection',
                'maragogype lot',
                'maragogype grade',
                'maragogype screen',
                'maragogype only',
                '100% maragogype',
                'pure maragogype'
            ]
            
            # Check for peaberry with more specific patterns
            peaberry_found = any(pattern in all_text for pattern in peaberry_patterns)
            maragogype_found = any(pattern in all_text for pattern in maragogype_patterns)
            
            # Also check for mixed content
            mixed_content = 'mixed' in all_text and (peaberry_found or maragogype_found)
            
            if mixed_content:
                bean_type = 'Mixed'
                print("DEBUG: Detected Mixed bean type (contains mixed + specific bean type)")
            elif peaberry_found:
                bean_type = 'Peaberry'
                print("DEBUG: Detected Peaberry bean type (found specific peaberry context)")
            elif maragogype_found:
                bean_type = 'Maragogype'
                print("DEBUG: Detected Maragogype bean type (found specific maragogype context)")
            else:
                print("DEBUG: No specific bean type indicators found, defaulting to Regular")
            
            print(f"DEBUG: Bean type determined as: {bean_type}")
            
            # Combine and structure the data
            bean_profile = {
                # Basic info
                'name': raw_data.get('name', ''),
                'origin': origin,
                'variety': variety,
                'process_method': process_method,
                'bean_type': bean_type,  # NEW: Include mapped bean type
                'description': raw_data.get('description', ''),
                'recommended_roast_levels': recommended_roast_levels,
                
                # Technical specs
                'screen_size': raw_data.get('screen_size', ''),
                'density_g_ml': raw_data.get('density_g_ml'),
                'altitude_m': ai_data.get('altitude_m'),
                'harvest_year': None,  # Not typically available
                
                # Cupping scores - prioritize raw data over AI data
                'cupping_score': raw_data.get('total_score') or ai_data.get('cupping_score'),
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
                
                # Critical AI coaching data (will need manual input)
                'moisture_content_pct': None,
                
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
        # Generic parsing attempt - try to extract basic info from any HTML
        print("DEBUG: Attempting generic parsing...")
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Try to extract basic info
            name = 'Unknown Coffee'
            description = ''
            
            # Look for title or h1
            title = soup.find('title')
            if title:
                name = title.get_text().strip()
            else:
                h1 = soup.find('h1')
                if h1:
                    name = h1.get_text().strip()
            
            # Look for description
            desc_selectors = [
                'div.description',
                'div.product-description',
                'div.overview',
                'p.description',
                'div.value'
            ]
            
            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    description = desc_elem.get_text().strip()
                    break
            
            # Try to extract origin from text content
            origin = 'Unknown'
            all_text = soup.get_text().lower()
            countries = ['ethiopia', 'colombia', 'guatemala', 'costa rica', 'kenya', 'yemen', 'brazil', 'peru', 'honduras', 'nicaragua', 'el salvador', 'panama', 'mexico', 'rwanda', 'burundi', 'tanzania', 'india', 'indonesia', 'sumatra', 'java', 'sulawesi', 'timor']
            for country in countries:
                if country in all_text:
                    origin = country.title()
                    break
            
            return {
                'name': name,
                'origin': origin,
                'variety': 'Unknown',
                'process_method': 'Unknown',
                'bean_type': 'Regular',
                'description': description,
                'recommended_roast_levels': ['City+'],
                'supplier_name': 'Unknown',
                'vendor_detected': vendor,
                'parsing_confidence': 'low',
                'notes': 'Generic parsing - limited data extraction'
            }
        except Exception as e:
            print(f"DEBUG: Generic parsing failed: {e}")
            return {
                'name': 'Unknown Coffee',
                'vendor_detected': vendor,
                'parsing_confidence': 'low',
                'notes': f'Generic parsing failed: {str(e)}'
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
