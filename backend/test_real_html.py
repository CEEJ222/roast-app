#!/usr/bin/env python3
"""
Test script with real Sweet Maria's HTML
"""

import json
from sweet_marias_parser import parse_sweet_marias_html, get_ai_optimized_data

def test_with_real_html():
    """Test with the real Yemen Mokha Sanani HTML"""
    
    # Real HTML from Sweet Maria's (truncated for testing)
    real_html = """
    <!doctype html>
    <html lang="en">
        <head>
            <title>Yemen Mokha Saanani</title>
        </head>
        <body>
            <h1 class="page-title">Yemen Mokha Saanani</h1>
            <div class="product attribute overview">
                <div class="value">Strong spiced character in the cup, a potpourri of woody whole spices like cardamom, cinnamon stick, and clove, accents of cooked pear, raw brown sugar, and rustic bittersweets. City+ to Full City+. Good for espresso.</div>
            </div>
            <span class="price">$11.10</span>
            <div class="stock unavailable">
                <span>Out of stock</span>
            </div>
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
                <div class="value">This dry process lot from Sanani is our final Yemeni coffee of the season, and while I want to say it leaves us on a "high note" (because it does!), I think "spiced fruit" note is more accurate in terms of brewing.</div>
            </div>
            <div class="value">Altitude is extremely high, starting around 2000 meters and stretching upwards of 2400 meters above sea level.</div>
        </body>
    </html>
    """
    
    print("Testing with Real Sweet Maria's HTML...")
    print("=" * 60)
    
    # Parse the HTML
    parsed_data = parse_sweet_marias_html(real_html)
    
    print("PARSED DATA:")
    print(json.dumps(parsed_data, indent=2))
    print("\n" + "=" * 60)
    
    # Get AI-optimized data
    ai_data = get_ai_optimized_data(real_html)
    
    print("AI-OPTIMIZED DATA:")
    print(json.dumps(ai_data, indent=2))
    print("\n" + "=" * 60)
    
    # Show what we extracted
    print("EXTRACTED INFORMATION:")
    print(f"Name: {parsed_data.get('name', 'N/A')}")
    print(f"Price: ${parsed_data.get('price', 'N/A')}")
    print(f"Origin: {ai_data.get('origin', 'N/A')}")
    print(f"Process: {ai_data.get('process_method', 'N/A')}")
    print(f"Screen Size: {ai_data.get('screen_size', 'N/A')}")
    print(f"Altitude: {ai_data.get('altitude_m', 'N/A')}m")
    print(f"Body Intensity: {ai_data.get('body_intensity', 'N/A')}")
    print(f"Acidity Intensity: {ai_data.get('acidity_intensity', 'N/A')}")
    print(f"Cupping Score: {ai_data.get('cupping_score', 'N/A')}")
    print(f"Roast Recommendations: {ai_data.get('recommended_roast_levels', 'N/A')}")
    
    if 'cupping_scores' in parsed_data:
        print(f"\nCupping Scores:")
        for key, value in parsed_data['cupping_scores'].items():
            print(f"  {key}: {value}")
    
    if 'flavor_profile' in parsed_data:
        print(f"\nFlavor Profile:")
        for key, value in parsed_data['flavor_profile'].items():
            print(f"  {key}: {value}")

if __name__ == "__main__":
    test_with_real_html()
