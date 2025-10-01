#!/usr/bin/env python3
"""
Feature Flag Setup Script

This script helps you set up feature flags and manage user access.
Run this script to:
1. Set up admin users
2. Add beta users
3. Configure feature flags
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from feature_flags import feature_manager
import json

def setup_admin_user():
    """Set up admin user in feature flags"""
    print("🔧 Setting up admin user...")
    
    # Add your admin user ID here
    admin_user_id = input("Enter your admin user ID (from Supabase auth.users table): ").strip()
    
    if not admin_user_id:
        print("❌ No admin user ID provided")
        return False
    
    # Add admin to development flag
    feature_manager.flags["ai_copilot_development"].admin_users.append(admin_user_id)
    print(f"✅ Added {admin_user_id} as admin user")
    return True

def setup_beta_users():
    """Set up beta users"""
    print("\n🧪 Setting up beta users...")
    
    beta_users = []
    while True:
        user_id = input("Enter beta user ID (or press Enter to finish): ").strip()
        if not user_id:
            break
        beta_users.append(user_id)
    
    if beta_users:
        # Add beta users to the beta flag
        feature_manager.flags["ai_copilot_beta"].beta_users.extend(beta_users)
        print(f"✅ Added {len(beta_users)} beta users: {', '.join(beta_users)}")
    else:
        print("ℹ️  No beta users added")
    
    return True

def configure_feature_flags():
    """Configure feature flags"""
    print("\n⚙️  Configuring feature flags...")
    
    # Development flag
    dev_enabled = input("Enable development access? (y/n): ").lower().startswith('y')
    feature_manager.flags["ai_copilot_development"].enabled = dev_enabled
    print(f"Development access: {'Enabled' if dev_enabled else 'Disabled'}")
    
    # Beta flag
    beta_enabled = input("Enable beta access? (y/n): ").lower().startswith('y')
    feature_manager.flags["ai_copilot_beta"].enabled = beta_enabled
    print(f"Beta access: {'Enabled' if beta_enabled else 'Disabled'}")
    
    # Premium flag
    premium_enabled = input("Enable premium access? (y/n): ").lower().startswith('y')
    feature_manager.flags["ai_copilot_premium"].enabled = premium_enabled
    print(f"Premium access: {'Enabled' if premium_enabled else 'Disabled'}")
    
    return True

def show_current_status():
    """Show current feature flag status"""
    print("\n📊 Current Feature Flag Status:")
    print("=" * 50)
    
    for name, flag in feature_manager.flags.items():
        print(f"\n🔹 {name.replace('_', ' ').title()}")
        print(f"   Type: {flag.flag_type.value}")
        print(f"   Enabled: {flag.enabled}")
        print(f"   Description: {flag.description}")
        
        if flag.admin_users:
            print(f"   Admin Users: {', '.join(flag.admin_users)}")
        if flag.beta_users:
            print(f"   Beta Users: {', '.join(flag.beta_users)}")

def main():
    """Main setup function"""
    print("🚀 AI Copilot Feature Flag Setup")
    print("=" * 40)
    
    try:
        # Show current status
        show_current_status()
        
        print("\n" + "=" * 40)
        print("Let's configure your feature flags...")
        
        # Setup admin user
        if not setup_admin_user():
            return
        
        # Setup beta users
        setup_beta_users()
        
        # Configure flags
        configure_feature_flags()
        
        # Show final status
        print("\n" + "=" * 40)
        print("✅ Setup Complete!")
        show_current_status()
        
        print("\n📝 Next Steps:")
        print("1. Update user metadata in Supabase:")
        print("   - Add 'role': 'admin' to your user_metadata")
        print("   - Add 'subscription_status': 'premium' for premium users")
        print("   - Add 'beta_access': true for beta users")
        print("\n2. Test the feature flags:")
        print("   - Start your backend server")
        print("   - Test AI Copilot access with different users")
        print("\n3. Use the admin interface:")
        print("   - Access /admin/feature-flags endpoint")
        print("   - Or use the FeatureFlagManager component in frontend")
        
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")

if __name__ == "__main__":
    main()
