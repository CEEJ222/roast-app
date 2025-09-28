import requests
from bs4 import BeautifulSoup
import re
import json
from typing import Dict, List, Optional
from urllib.parse import urlparse, parse_qs

class SweetMariasParser:
    """Parser for Sweet Maria's coffee bean data from their product pages"""
    
    def __init__(self):
        self.base_url = "https://www.sweetmarias.com"
        
    def parse_bean_data(self, url: str) -> Dict:
        """
        Parse Sweet Maria's coffee bean data from URL
        Returns structured bean profile data
        """
        try:
            # Fetch the page content with more realistic headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }
            
            # Add session to handle cookies
            session = requests.Session()
            session.headers.update(headers)
            
            response = session.get(url, timeout=15, allow_redirects=True)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract bean information
            bean_data = {
                'name': self._extract_name(soup),
                'origin': self._extract_origin(soup),
                'variety': self._extract_variety(soup),
                'process_method': self._extract_process_method(soup),
                'altitude': self._extract_altitude(soup),
                'harvest_year': self._extract_harvest_year(soup),
                'flavor_notes': self._extract_flavor_notes(soup),
                'roasting_notes': self._extract_roasting_notes(soup),
                'recommended_roast_levels': self._extract_roast_levels(soup),
                'density': self._extract_density(soup),
                'moisture_content': self._extract_moisture_content(soup),
                'supplier_url': url,
                'supplier_name': 'Sweet Maria\'s',
                'raw_data': self._extract_raw_data(soup)
            }
            
            return bean_data
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                # Return basic data when blocked by anti-bot protection
                return {
                    'name': self._extract_name_from_url(url),
                    'origin': 'Unknown',
                    'variety': 'Unknown',
                    'process_method': 'Unknown',
                    'altitude': None,
                    'harvest_year': None,
                    'flavor_notes': [],
                    'roasting_notes': '',
                    'recommended_roast_levels': ['City', 'City+'],
                    'density': None,
                    'moisture_content': None,
                    'supplier_url': url,
                    'supplier_name': 'Sweet Maria\'s',
                    'raw_data': {'error': 'Website blocked request, using URL-based extraction'}
                }
            else:
                raise Exception(f"HTTP Error {e.response.status_code}: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to parse Sweet Maria's data: {str(e)}")
    
    def _extract_name_from_url(self, url: str) -> str:
        """Extract a basic name from the URL when parsing fails"""
        try:
            # Extract the last part of the URL path
            path_parts = url.split('/')[-1].split('.')[0]
            # Convert hyphens to spaces and title case
            name = path_parts.replace('-', ' ').title()
            return name
        except:
            return "Unknown Coffee Bean"
    
    def _extract_name(self, soup: BeautifulSoup) -> str:
        """Extract coffee bean name from page title or heading"""
        # Try to find the main product title
        title_selectors = [
            'h1.product-title',
            'h1.entry-title',
            '.product-name h1',
            'h1'
        ]
        
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return "Unknown Bean"
    
    def _extract_origin(self, soup: BeautifulSoup) -> str:
        """Extract origin information"""
        # Look for origin in product details or description
        origin_patterns = [
            r'Origin:\s*([^,\n]+)',
            r'Country:\s*([^,\n]+)',
            r'Region:\s*([^,\n]+)'
        ]
        
        text_content = soup.get_text()
        for pattern in origin_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "Unknown Origin"
    
    def _extract_variety(self, soup: BeautifulSoup) -> str:
        """Extract coffee variety"""
        variety_patterns = [
            r'Variety:\s*([^,\n]+)',
            r'Cultivar:\s*([^,\n]+)',
            r'Varietal:\s*([^,\n]+)'
        ]
        
        text_content = soup.get_text()
        for pattern in variety_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "Unknown Variety"
    
    def _extract_process_method(self, soup: BeautifulSoup) -> str:
        """Extract processing method"""
        process_patterns = [
            r'Process:\s*([^,\n]+)',
            r'Processing:\s*([^,\n]+)',
            r'Method:\s*([^,\n]+)'
        ]
        
        text_content = soup.get_text()
        for pattern in process_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Common process methods to look for
        common_processes = ['Washed', 'Natural', 'Honey', 'Semi-washed', 'Wet-hulled']
        for process in common_processes:
            if process.lower() in text_content.lower():
                return process
        
        return "Unknown Process"
    
    def _extract_altitude(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract altitude information"""
        altitude_patterns = [
            r'(\d+)\s*meters?',
            r'(\d+)\s*m\b',
            r'Altitude:\s*(\d+)',
            r'Elevation:\s*(\d+)'
        ]
        
        text_content = soup.get_text()
        for pattern in altitude_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return int(match.group(1))
        
        return None
    
    def _extract_harvest_year(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract harvest year"""
        year_patterns = [
            r'Harvest:\s*(\d{4})',
            r'Crop:\s*(\d{4})',
            r'(\d{4})\s*harvest',
            r'(\d{4})\s*crop'
        ]
        
        text_content = soup.get_text()
        for pattern in year_patterns:
            match = re.search(pattern, text_content)
            if match:
                year = int(match.group(1))
                # Sanity check - should be recent year
                if 2020 <= year <= 2025:
                    return year
        
        return None
    
    def _extract_flavor_notes(self, soup: BeautifulSoup) -> List[str]:
        """Extract flavor notes"""
        flavor_patterns = [
            r'Flavor notes?:\s*([^.\n]+)',
            r'Tasting notes?:\s*([^.\n]+)',
            r'Aroma:\s*([^.\n]+)',
            r'Flavor:\s*([^.\n]+)'
        ]
        
        text_content = soup.get_text()
        for pattern in flavor_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                notes_text = match.group(1).strip()
                # Split by common separators
                notes = re.split(r'[,;]', notes_text)
                return [note.strip() for note in notes if note.strip()]
        
        return []
    
    def _extract_roasting_notes(self, soup: BeautifulSoup) -> str:
        """Extract roasting-specific notes"""
        roasting_sections = soup.find_all(['div', 'p'], string=re.compile(r'roast|roasting', re.IGNORECASE))
        
        for section in roasting_sections:
            text = section.get_text().strip()
            if len(text) > 20:  # Only meaningful content
                return text
        
        return ""
    
    def _extract_roast_levels(self, soup: BeautifulSoup) -> List[str]:
        """Extract recommended roast levels"""
        roast_levels = ['Light', 'Medium', 'Dark', 'City', 'City+', 'Full City', 'Vienna', 'French']
        found_levels = []
        
        text_content = soup.get_text()
        for level in roast_levels:
            if level.lower() in text_content.lower():
                found_levels.append(level)
        
        return found_levels if found_levels else ['City', 'City+']
    
    def _extract_density(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract bean density if mentioned"""
        density_patterns = [
            r'Density:\s*([\d.]+)',
            r'(\d+\.?\d*)\s*g/ml'
        ]
        
        text_content = soup.get_text()
        for pattern in density_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return float(match.group(1))
        
        return None
    
    def _extract_moisture_content(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract moisture content if mentioned"""
        moisture_patterns = [
            r'Moisture:\s*([\d.]+)%',
            r'([\d.]+)%\s*moisture'
        ]
        
        text_content = soup.get_text()
        for pattern in moisture_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return float(match.group(1))
        
        return None
    
    def _extract_raw_data(self, soup: BeautifulSoup) -> Dict:
        """Extract raw structured data if available"""
        # Look for JSON-LD structured data
        json_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_scripts:
            try:
                data = json.loads(script.string)
                if data.get('@type') == 'Product':
                    return data
            except:
                continue
        
        return {}

# Usage example
def parse_sweet_marias_url(url: str) -> Dict:
    """Main function to parse Sweet Maria's URL and return bean data"""
    parser = SweetMariasParser()
    return parser.parse_bean_data(url)
