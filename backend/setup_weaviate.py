#!/usr/bin/env python3
"""
Weaviate Setup Script
Easy setup and initialization of Weaviate for the coffee roasting app
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_docker():
    """Check if Docker is installed and running"""
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker is installed")
            return True
        else:
            print("❌ Docker is not installed")
            return False
    except FileNotFoundError:
        print("❌ Docker is not installed")
        return False

def check_docker_compose():
    """Check if Docker Compose is available"""
    try:
        result = subprocess.run(['docker', 'compose', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker Compose is available")
            return True
        else:
            print("❌ Docker Compose is not available")
            return False
    except FileNotFoundError:
        print("❌ Docker Compose is not available")
        return False

def start_weaviate():
    """Start Weaviate using Docker Compose"""
    print("🚀 Starting Weaviate...")
    
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Change to project root directory
    os.chdir(project_root)
    
    try:
        # Start Weaviate
        result = subprocess.run([
            'docker', 'compose', '-f', 'docker-compose.weaviate.yml', 'up', '-d'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Weaviate started successfully")
            return True
        else:
            print(f"❌ Failed to start Weaviate: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error starting Weaviate: {e}")
        return False

def wait_for_weaviate(max_wait=60):
    """Wait for Weaviate to be ready"""
    print("⏳ Waiting for Weaviate to be ready...")
    
    for i in range(max_wait):
        try:
            response = requests.get("http://localhost:8080/v1/meta", timeout=5)
            if response.status_code == 200:
                print("✅ Weaviate is ready!")
                return True
        except requests.exceptions.RequestException:
            pass
        
        time.sleep(1)
        if i % 10 == 0 and i > 0:
            print(f"⏳ Still waiting... ({i}s)")
    
    print("❌ Weaviate did not become ready within the timeout period")
    return False

def test_weaviate_connection():
    """Test connection to Weaviate"""
    print("🔍 Testing Weaviate connection...")
    
    try:
        # Test basic connection
        response = requests.get("http://localhost:8080/v1/meta", timeout=10)
        if response.status_code == 200:
            meta = response.json()
            print(f"✅ Connected to Weaviate {meta.get('version', 'unknown')}")
            return True
        else:
            print(f"❌ Weaviate returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to Weaviate: {e}")
        return False

def initialize_schemas():
    """Initialize Weaviate schemas"""
    print("🔧 Initializing Weaviate schemas...")
    
    try:
        # Import and run schema initialization
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from weaviate_integration import get_weaviate_integration
        
        integration = get_weaviate_integration()
        success = integration.initialize_schemas()
        
        if success:
            print("✅ Schemas initialized successfully")
            return True
        else:
            print("❌ Schema initialization failed")
            return False
    except Exception as e:
        print(f"❌ Error initializing schemas: {e}")
        return False

def run_tests():
    """Run Weaviate integration tests"""
    print("🧪 Running Weaviate integration tests...")
    
    try:
        # Run the test script
        result = subprocess.run([
            sys.executable, 'test_weaviate.py'
        ], cwd=os.path.dirname(os.path.abspath(__file__)))
        
        if result.returncode == 0:
            print("✅ All tests passed!")
            return True
        else:
            print("❌ Some tests failed")
            return False
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Weaviate Setup for Coffee Roasting App")
    print("=" * 50)
    
    # Check prerequisites
    if not check_docker():
        print("\n💡 Please install Docker first: https://docs.docker.com/get-docker/")
        return False
    
    if not check_docker_compose():
        print("\n💡 Please install Docker Compose first: https://docs.docker.com/compose/install/")
        return False
    
    # Start Weaviate
    if not start_weaviate():
        return False
    
    # Wait for Weaviate to be ready
    if not wait_for_weaviate():
        return False
    
    # Test connection
    if not test_weaviate_connection():
        return False
    
    # Initialize schemas
    if not initialize_schemas():
        return False
    
    # Run tests
    if not run_tests():
        print("⚠️ Tests failed, but Weaviate is running")
    
    print("\n🎉 Weaviate setup complete!")
    print("\n📋 Next steps:")
    print("1. Set your OPENAI_API_KEY environment variable for embeddings")
    print("2. Start your FastAPI backend: python main.py")
    print("3. Test the semantic search endpoints")
    print("\n🔗 Weaviate is available at: http://localhost:8080")
    print("📚 Weaviate console: http://localhost:8080/v1/console")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
