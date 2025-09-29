"""
Sweet Maria's HTML Parser
Extracts comprehensive coffee bean data from Sweet Maria's product pages
"""

import re
import json
from typing import Dict, List, Optional, Any
from bs4 import BeautifulSoup


class SweetMariasParser:
    def __init__(self):
        self.parsed_data = {}
    
    def parse_html(self, html_content: str) -> Dict[str, Any]:
        """
        Parse Sweet Maria's HTML content and extract coffee bean data
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract basic product info
        self._extract_basic_info(soup)
        
        # Extract cupping scores from chart data
        self._extract_cupping_scores(soup)
        
        # Extract flavor profile from chart data
        self._extract_flavor_profile(soup)
        
        # Extract technical specifications
        self._extract_specifications(soup)
        
        # Extract farm information
        self._extract_farm_info(soup)
        
        # Extract cupping notes
        self._extract_cupping_notes(soup)
        
        return self.parsed_data
    
    def _extract_basic_info(self, soup: BeautifulSoup):
        """Extract basic product information"""
        # Product name
        title = soup.find('h1', class_='page-title')
        if title:
            self.parsed_data['name'] = title.get_text().strip()
        
        # Price
        price_element = soup.find('span', class_='price')
        if price_element:
            price_text = price_element.get_text().strip()
            # Extract numeric price
            price_match = re.search(r'\$(\d+\.?\d*)', price_text)
            if price_match:
                self.parsed_data['price'] = float(price_match.group(1))
        
        # Description
        description = soup.find('div', class_='product attribute overview')
        if description:
            desc_text = description.find('div', class_='value')
            if desc_text:
                self.parsed_data['description'] = desc_text.get_text().strip()
        
        # Stock status
        stock = soup.find('div', class_='stock')
        if stock:
            self.parsed_data['stock_status'] = stock.get_text().strip()
    
    def _extract_cupping_scores(self, soup: BeautifulSoup):
        """Extract cupping scores from chart data"""
        # Look for chart data in div elements with data attributes
        chart_divs = soup.find_all('div', class_='forix-chartjs')
        
        for div in chart_divs:
            # Check for cupping chart data
            cupping_data = div.get('data-chart-value')
            if cupping_data and 'Dry Fragrance' in cupping_data:
                self._parse_cupping_scores(cupping_data)
            
            # Extract total score
            score = div.get('data-chart-score')
            if score:
                try:
                    self.parsed_data['total_score'] = float(score)
                except ValueError:
                    pass
    
    def _parse_cupping_scores(self, cupping_data: str):
        """Parse cupping scores from chart data string"""
        scores = {}
        for item in cupping_data.split(','):
            if ':' in item:
                key, value = item.split(':', 1)
                key = key.strip()
                value = value.strip()
                try:
                    scores[key] = float(value)
                except ValueError:
                    scores[key] = value
        
        self.parsed_data['cupping_scores'] = scores
    
    def _extract_flavor_profile(self, soup: BeautifulSoup):
        """Extract flavor profile from chart data"""
        # Look for chart data in div elements with data attributes
        chart_divs = soup.find_all('div', class_='forix-chartjs')
        
        for div in chart_divs:
            # Check for flavor chart data
            chart_type = div.get('data-chart-type')
            if chart_type == 'polarArea':
                flavor_data = div.get('data-chart-value')
                if flavor_data:
                    self._parse_flavor_profile(flavor_data)
    
    def _parse_flavor_profile(self, flavor_data: str):
        """Parse flavor profile from chart data string"""
        flavors = {}
        for item in flavor_data.split(','):
            if ':' in item:
                key, value = item.split(':', 1)
                key = key.strip()
                value = value.strip()
                try:
                    flavors[key] = float(value)
                except ValueError:
                    flavors[key] = value
        
        self.parsed_data['flavor_profile'] = flavors
    
    def _extract_specifications(self, soup: BeautifulSoup):
        """Extract technical specifications from specs table"""
        specs_table = soup.find('table', class_='additional-attributes-table')
        if not specs_table:
            return
        
        specs = {}
        rows = specs_table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) >= 2:
                key = cells[0].get_text().strip()
                value = cells[1].get_text().strip()
                specs[key] = value
        
        self.parsed_data['specifications'] = specs
        
        # Extract specific important fields
        if 'Processing' in specs:
            self.parsed_data['process_method'] = specs['Processing']
        if 'Region' in specs:
            self.parsed_data['origin'] = specs['Region']
        if 'Cultivar Detail' in specs:
            self.parsed_data['variety'] = specs['Cultivar Detail']
        if 'Appearance' in specs:
            # Extract screen size and density from appearance
            appearance = specs['Appearance']
            
            # Extract screen size
            screen_match = re.search(r'(\d+)\+?\s*(?:Peaberry\s+)?screen', appearance, re.IGNORECASE)
            if screen_match:
                screen_size = int(screen_match.group(1))
                # Convert to frontend format (ranges)
                if screen_size == 14:
                    self.parsed_data['screen_size'] = '14-15'
                elif screen_size == 15:
                    self.parsed_data['screen_size'] = '15-16'
                elif screen_size == 16:
                    self.parsed_data['screen_size'] = '16-17'
                elif screen_size == 17:
                    self.parsed_data['screen_size'] = '17-18'
                else:
                    # For other sizes, use the closest range
                    if screen_size < 15:
                        self.parsed_data['screen_size'] = '14-15'
                    elif screen_size < 16:
                        self.parsed_data['screen_size'] = '15-16'
                    elif screen_size < 17:
                        self.parsed_data['screen_size'] = '16-17'
                    else:
                        self.parsed_data['screen_size'] = '17-18'
            
            # Extract density (e.g., ".4 d/300gr" -> 0.4)
            print(f"DEBUG: Extracting density from appearance: '{appearance}'")
            density_match = re.search(r'(\d+\.?\d*)\s*d/', appearance)
            if density_match:
                density = float(density_match.group(1))
                print(f"DEBUG: Found density: {density}")
                self.parsed_data['density_g_ml'] = density
            else:
                print("DEBUG: No density match found")
        if 'Roast Recommendations' in specs:
            self.parsed_data['roast_recommendations'] = specs['Roast Recommendations']
        if 'Recommended for Espresso' in specs:
            self.parsed_data['espresso_suitable'] = specs['Recommended for Espresso'] == 'Yes'
    
    def _extract_farm_info(self, soup: BeautifulSoup):
        """Extract farm information from content"""
        # Look for altitude information in text content
        content_divs = soup.find_all('div', class_='value')
        
        for div in content_divs:
            text = div.get_text()
            # Look for altitude information (various formats)
            altitude_match = re.search(r'(?:between\s+)?(\d+)\s*(?:to|-)\s*(\d+)\s*meters?', text, re.IGNORECASE)
            if altitude_match:
                self.parsed_data['altitude_min'] = int(altitude_match.group(1))
                self.parsed_data['altitude_max'] = int(altitude_match.group(2))
                break
        
        # Look for farmer count
        for div in content_divs:
            text = div.get_text()
            farmer_match = re.search(r'(\d+)\s*farmers?', text, re.IGNORECASE)
            if farmer_match:
                self.parsed_data['farmer_count'] = int(farmer_match.group(1))
                break
        
        # Also look in all text content for altitude
        all_text = soup.get_text()
        altitude_match = re.search(r'(?:between\s+)?(\d+)\s*(?:to|-)\s*(\d+)\s*meters?', all_text, re.IGNORECASE)
        if altitude_match and 'altitude_min' not in self.parsed_data:
            self.parsed_data['altitude_min'] = int(altitude_match.group(1))
            self.parsed_data['altitude_max'] = int(altitude_match.group(2))
    
    def _extract_cupping_notes(self, soup: BeautifulSoup):
        """Extract detailed cupping notes"""
        cupping_notes = soup.find('div', class_='product attribute cupping-notes')
        if cupping_notes:
            notes_div = cupping_notes.find('div', class_='value')
            if notes_div:
                self.parsed_data['cupping_notes'] = notes_div.get_text().strip()
    
    def get_ai_optimized_data(self) -> Dict[str, Any]:
        """
        Return data optimized for AI coaching
        """
        ai_data = {}
        
        # Basic info
        if 'name' in self.parsed_data:
            ai_data['name'] = self.parsed_data['name']
        if 'origin' in self.parsed_data:
            ai_data['origin'] = self.parsed_data['origin']
        if 'variety' in self.parsed_data:
            ai_data['variety'] = self.parsed_data['variety']
        if 'process_method' in self.parsed_data:
            ai_data['process_method'] = self.parsed_data['process_method']
        
        # Technical specs
        if 'screen_size' in self.parsed_data:
            ai_data['screen_size'] = self.parsed_data['screen_size']
        if 'density_g_ml' in self.parsed_data:
            ai_data['density_g_ml'] = self.parsed_data['density_g_ml']
        if 'altitude_min' in self.parsed_data and 'altitude_max' in self.parsed_data:
            ai_data['altitude_m'] = (self.parsed_data['altitude_min'] + self.parsed_data['altitude_max']) // 2
        
        # Cupping scores
        if 'cupping_scores' in self.parsed_data:
            cupping = self.parsed_data['cupping_scores']
            if 'Body' in cupping:
                ai_data['body_intensity'] = cupping['Body']
            if 'Brightness' in cupping:
                ai_data['acidity_intensity'] = cupping['Brightness']
            if 'Flavor' in cupping:
                ai_data['cupping_score'] = cupping['Flavor'] * 10  # Convert to 0-100 scale
        
        # Flavor profile
        if 'flavor_profile' in self.parsed_data:
            flavors = self.parsed_data['flavor_profile']
            for flavor, intensity in flavors.items():
                if isinstance(intensity, (int, float)):
                    ai_data[f'{flavor.lower()}_intensity'] = intensity
        
        # Roast recommendations
        if 'roast_recommendations' in self.parsed_data:
            recommendations = self.parsed_data['roast_recommendations']
            ai_data['recommended_roast_levels'] = [r.strip() for r in recommendations.split('to')]
        
        return ai_data


def parse_sweet_marias_html(html_content: str) -> Dict[str, Any]:
    """
    Main function to parse Sweet Maria's HTML content
    """
    parser = SweetMariasParser()
    return parser.parse_html(html_content)


def get_ai_optimized_data(html_content: str) -> Dict[str, Any]:
    """
    Get AI-optimized data from Sweet Maria's HTML
    """
    parser = SweetMariasParser()
    parser.parse_html(html_content)
    return parser.get_ai_optimized_data()


if __name__ == "__main__":
    # Test with sample HTML
    sample_html = """
    <html>
        <head><title>Test Coffee</title></head>
        <body>
            <h1 class="page-title">Test Coffee</h1>
            <div class="product attribute overview">
                <div class="value">Test description</div>
            </div>
        </body>
    </html>
    """
    
    result = parse_sweet_marias_html(sample_html)
    print(json.dumps(result, indent=2))
