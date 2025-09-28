#!/usr/bin/env python3
"""
Test script for Sweet Maria's HTML parser
"""

import json
from sweet_marias_parser import parse_sweet_marias_html, get_ai_optimized_data

def test_parser():
    """Test the parser with sample HTML"""
    
    # Sample HTML (you can replace this with actual Sweet Maria's HTML)
    sample_html = """
    <!doctype html>
    <html>
        <head>
            <title>Yemen Mokha Sanani</title>
        </head>
        <body>
            <h1 class="page-title">Yemen Mokha Sanani</h1>
            <div class="product attribute overview">
                <div class="value">Strong spiced character in the cup, a potpourri of woody whole spices like cardamom, cinnamon stick, and clove, accents of cooked pear, raw brown sugar, and rustic bittersweets. City+ to Full City+. Good for espresso.</div>
            </div>
            <span class="price">$11.10</span>
            <div class="stock unavailable">
                <span>Out of stock</span>
            </div>
            <script>
                var dataGalleryConfig = {
                    "data": [{"thumb":"test.jpg","img":"test.jpg","full":"test.jpg","caption":"Test caption","position":"0","isMain":true}],
                    "options": {
                        "width": "1338",
                        "height": 576
                    }
                };
            </script>
            <div class="forix-chartjs" data-chart-value="Dry Fragrance:8.4,Wet Aroma:8.8,Brightness:8,Flavor:8.8,Body:9.3,Finish:8.2,Sweetness:8.3,Clean Cup:7.5,Complexity:9.5,Uniformity:8" data-chart-score="88.8"></div>
            <div class="forix-chartjs" data-chart-type="polarArea" data-chart-value="Floral:0,Honey:0,Sugars:3,Caramel:2,Fruits:3,Citrus:0,Berry:2,Cocoa:4,Nuts:0,Rustic:3,Spice:3.5,Body:4.5"></div>
            <table class="additional-attributes-table">
                <tr><th>Region</th><td>Sana'a Governate</td></tr>
                <tr><th>Processing</th><td>Dry Process (Natural)</td></tr>
                <tr><th>Appearance</th><td>1+ d/300gr, 14+ screen</td></tr>
                <tr><th>Roast Recommendations</th><td>City+ to Full City+</td></tr>
                <tr><th>Recommended for Espresso</th><td>Yes</td></tr>
            </table>
            <div class="product attribute cupping-notes">
                <div class="value">This dry process lot from Sanani is our final Yemeni coffee of the season...</div>
            </div>
            <div class="value">Altitude is extremely high, starting around 2000 meters and stretching upwards of 2400 meters above sea level.</div>
        </body>
    </html>
    """
    
    print("Testing Sweet Maria's HTML Parser...")
    print("=" * 50)
    
    # Parse the HTML
    parsed_data = parse_sweet_marias_html(sample_html)
    
    print("Parsed Data:")
    print(json.dumps(parsed_data, indent=2))
    print("\n" + "=" * 50)
    
    # Get AI-optimized data
    ai_data = get_ai_optimized_data(sample_html)
    
    print("AI-Optimized Data:")
    print(json.dumps(ai_data, indent=2))
    print("\n" + "=" * 50)
    
    # Test with real HTML (if provided)
    print("To test with real Sweet Maria's HTML:")
    print("1. Copy the HTML source from a Sweet Maria's product page")
    print("2. Replace the sample_html variable with the real HTML")
    print("3. Run this script again")

if __name__ == "__main__":
    test_parser()
