#!/usr/bin/env python3
"""
Script to update frontend API URLs from Railway to Vercel
"""
import os
import re

# Files that contain API_BASE definitions
FRONTEND_FILES = [
    'frontend/src/App.jsx',
    'frontend/src/components/ProfilePage.jsx', 
    'frontend/src/components/SetupWizard.jsx',
    'frontend/src/components/HistoricalRoasts.jsx',
    'frontend/src/components/DashboardHistoricalRoasts.jsx',
    'frontend/src/components/RoastDetailPage.jsx'
]

# Current Railway URL
RAILWAY_URL = 'https://roast-backend-production-8883.up.railway.app'

# New Vercel URL (update this after deploying to Vercel)
VERCEL_URL = 'https://roast-app-backend.vercel.app'  # Production Vercel URL

def update_file(file_path):
    """Update API_BASE URL in a file"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace Railway URL with Vercel URL
    updated_content = content.replace(RAILWAY_URL, VERCEL_URL)
    
    if updated_content != content:
        with open(file_path, 'w') as f:
            f.write(updated_content)
        print(f"✅ Updated {file_path}")
        return True
    else:
        print(f"ℹ️  No changes needed in {file_path}")
        return False

def main():
    print("Updating frontend API URLs from Railway to Vercel...")
    print(f"Railway URL: {RAILWAY_URL}")
    print(f"Vercel URL: {VERCEL_URL}")
    print()
    
    updated_files = []
    for file_path in FRONTEND_FILES:
        if update_file(file_path):
            updated_files.append(file_path)
    
    if updated_files:
        print(f"\n✅ Updated {len(updated_files)} files:")
        for file in updated_files:
            print(f"  - {file}")
        print("\nNext steps:")
        print("1. Deploy to Vercel and get the actual URL")
        print("2. Update VERCEL_URL in this script with the actual URL")
        print("3. Run this script again")
        print("4. Commit and push changes")
    else:
        print("\nℹ️  No files needed updating")

if __name__ == "__main__":
    main()
