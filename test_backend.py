#!/usr/bin/env python3
"""
Test script to verify backend CORS functionality
"""
import requests
import json

BACKEND_URL = "https://roast-backend-production-8883.up.railway.app"

def test_cors():
    """Test CORS functionality"""
    print("Testing CORS functionality...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print("❌ Health endpoint failed")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    # Test OPTIONS request (CORS preflight)
    try:
        headers = {
            'Origin': 'https://www.roastbuddy.app',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization'
        }
        response = requests.options(f"{BACKEND_URL}/roasts", headers=headers)
        print(f"OPTIONS request: {response.status_code}")
        print(f"CORS headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ OPTIONS request working")
        else:
            print("❌ OPTIONS request failed")
    except Exception as e:
        print(f"❌ OPTIONS request error: {e}")
    
    # Test actual GET request
    try:
        headers = {
            'Origin': 'https://www.roastbuddy.app',
            'Authorization': 'Bearer test-token'
        }
        response = requests.get(f"{BACKEND_URL}/roasts", headers=headers)
        print(f"GET request: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if 'Access-Control-Allow-Origin' in response.headers:
            print("✅ CORS headers present")
        else:
            print("❌ CORS headers missing")
    except Exception as e:
        print(f"❌ GET request error: {e}")

if __name__ == "__main__":
    test_cors()
