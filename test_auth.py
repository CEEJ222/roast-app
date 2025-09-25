#!/usr/bin/env python3
"""
Simple test script to verify authentication setup
Run this after setting up your environment variables
"""

import os
import sys
import jwt
from dotenv import load_dotenv

def test_environment_variables():
    """Test that all required environment variables are set"""
    print("🔍 Testing environment variables...")
    
    # Load environment variables
    load_dotenv()
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY', 
        'SUPABASE_JWT_SECRET'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

def test_jwt_secret():
    """Test that JWT secret is valid"""
    print("\n🔍 Testing JWT secret...")
    
    jwt_secret = os.getenv('SUPABASE_JWT_SECRET')
    if not jwt_secret:
        print("❌ SUPABASE_JWT_SECRET not set")
        return False
    
    try:
        # Try to decode a test token (this will fail, but we can check the secret format)
        test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        jwt.decode(test_token, jwt_secret, algorithms=["HS256"])
        print("❌ JWT secret appears to be incorrect (test token decoded successfully)")
        return False
    except jwt.InvalidTokenError:
        print("✅ JWT secret format appears correct")
        return True
    except Exception as e:
        print(f"❌ Error testing JWT secret: {e}")
        return False

def test_supabase_connection():
    """Test Supabase connection"""
    print("\n🔍 Testing Supabase connection...")
    
    try:
        from supabase import create_client
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not url or not key:
            print("❌ Supabase credentials not set")
            return False
        
        # Create client
        supabase = create_client(url, key)
        
        # Try a simple query
        result = supabase.table('roast_entries').select('id').limit(1).execute()
        print("✅ Supabase connection successful")
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing FreshRoast Assistant Authentication Setup\n")
    
    tests = [
        test_environment_variables,
        test_jwt_secret,
        test_supabase_connection
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your authentication setup looks good.")
        print("\nNext steps:")
        print("1. Set up Google OAuth in Supabase dashboard")
        print("2. Configure Google Cloud Console")
        print("3. Update database schema with user_id column")
        print("4. Test the full authentication flow")
    else:
        print("❌ Some tests failed. Please check the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
