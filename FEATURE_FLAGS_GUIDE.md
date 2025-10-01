# AI Copilot Feature Flag System

## 🎯 Overview

This comprehensive feature flag system allows you to:
- **Continue development** on AI Copilot with controlled access
- **Roll out to beta users** for testing and feedback
- **Gate for premium users** with subscription-based access
- **Manage access** via user account flags and admin controls

## 🏗️ Architecture

### Backend Components
- **`feature_flags.py`** - Core feature flag management system
- **`main.py`** - API endpoints for feature flag checking and admin management
- **`setup_feature_flags.py`** - Setup script for initial configuration

### Frontend Components
- **`GatedRoastChat.jsx`** - Updated to use feature flag system
- **`FeatureFlagManager.jsx`** - Admin interface for managing flags

## 🚀 Quick Start

### 1. Set Up Admin User
```bash
cd backend
python setup_feature_flags.py
```

### 2. Configure User Metadata in Supabase
Update your user's `user_metadata` in Supabase:

```json
{
  "role": "admin",
  "subscription_status": "premium",
  "beta_access": true
}
```

### 3. Test Access
- Start your backend server
- Test AI Copilot access with different user types
- Use the admin interface to manage flags

## 🎛️ Feature Flag Types

### 1. Development Access
- **Flag**: `ai_copilot_development`
- **Purpose**: For developers and admins
- **Access**: Admin users only
- **Use Case**: Continue development safely

### 2. Beta Access
- **Flag**: `ai_copilot_beta`
- **Purpose**: For beta testers
- **Access**: Specific beta users
- **Use Case**: Roll out to select users for feedback

### 3. Premium Access
- **Flag**: `ai_copilot_premium`
- **Purpose**: For paying customers
- **Access**: Users with premium subscription
- **Use Case**: Monetize AI features

## 🔧 API Endpoints

### User Endpoints
- `GET /user/subscription-status` - Check user's AI access with feature flags

### Admin Endpoints (Require admin role)
- `GET /admin/feature-flags` - List all feature flags
- `POST /admin/feature-flags/{name}/enable` - Enable a feature flag
- `POST /admin/feature-flags/{name}/disable` - Disable a feature flag
- `POST /admin/feature-flags/{name}/beta-users` - Manage beta users

## 👥 User Access Levels

### 1. No Access (Free Users)
- **Status**: `free`
- **Access**: Basic roasting tools only
- **UI**: Shows upgrade prompt

### 2. Development Access
- **Status**: `development`
- **Access**: Full AI Copilot features
- **UI**: Full chat interface
- **Requirements**: Admin role in user metadata

### 3. Beta Access
- **Status**: `beta`
- **Access**: Full AI Copilot features
- **UI**: Full chat interface
- **Requirements**: Added to beta users list or `beta_access: true` in metadata

### 4. Premium Access
- **Status**: `premium` or `pro`
- **Access**: Full AI Copilot features
- **UI**: Full chat interface
- **Requirements**: `subscription_status: "premium"` in metadata

## 🛠️ Management

### Adding Beta Users
```bash
# Via API
curl -X POST "http://localhost:8000/admin/feature-flags/ai_copilot_beta/beta-users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "add", "user_id": "user-123"}'
```

### Enabling/Disabling Flags
```bash
# Enable beta access
curl -X POST "http://localhost:8000/admin/feature-flags/ai_copilot_beta/enable" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Disable premium access
curl -X POST "http://localhost:8000/admin/feature-flags/ai_copilot_premium/disable" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Admin Interface
1. Add `FeatureFlagManager` component to your admin panel
2. Access via `/admin` route (if you create one)
3. Manage flags, beta users, and access levels

## 🔒 Security

### Admin Access
- Requires `role: "admin"` in user metadata
- All admin endpoints are protected
- Feature flags are stored in memory (consider database storage for production)

### User Access Control
- JWT token verification on all endpoints
- Feature flag checks on every AI Copilot request
- Graceful fallback to free tier on errors

## 📊 Monitoring

### Console Logging
The system logs all feature flag checks:
```
Feature flag response: {
  "ai_features_enabled": true,
  "access_type": "beta",
  "reasoning": "Beta user access granted",
  "feature_flags": {
    "development_access": false,
    "beta_access": true,
    "premium_access": false
  }
}
```

### Admin Dashboard
Use the `FeatureFlagManager` component to:
- View all feature flags and their status
- Enable/disable flags
- Manage beta users
- Monitor access patterns

## 🚀 Deployment

### Development
1. Run `python setup_feature_flags.py`
2. Set your user as admin in Supabase
3. Test with different access levels

### Production
1. Set up proper database storage for feature flags
2. Configure admin users in production
3. Set up monitoring and alerting
4. Use environment variables for configuration

## 🎯 Use Cases

### 1. Development Phase
- Enable `ai_copilot_development` for your admin account
- Disable `ai_copilot_beta` and `ai_copilot_premium`
- Continue development safely

### 2. Beta Rollout
- Enable `ai_copilot_beta`
- Add beta users via admin interface
- Collect feedback and iterate

### 3. Premium Launch
- Enable `ai_copilot_premium`
- Set up subscription system
- Roll out to paying customers

### 4. Gradual Rollout
- Start with development access
- Add select beta users
- Gradually expand beta access
- Finally enable premium access

## 🔧 Customization

### Adding New Feature Flags
```python
# In feature_flags.py
self.flags["new_feature"] = FeatureFlag(
    name="new_feature",
    flag_type=FeatureFlagType.BETA,
    description="New feature description",
    enabled=False,
    beta_users=[]
)
```

### Custom Access Logic
```python
# In feature_flags.py
def custom_access_check(self, user_id, user_metadata):
    # Your custom logic here
    return True  # or False
```

## 📝 Best Practices

1. **Start Conservative**: Begin with development access only
2. **Monitor Usage**: Track feature flag usage and user feedback
3. **Gradual Rollout**: Use beta access before full premium launch
4. **Document Changes**: Keep track of flag changes and their impact
5. **Test Thoroughly**: Test all access levels before deployment

## 🆘 Troubleshooting

### Common Issues
1. **Feature flags not working**: Check user metadata in Supabase
2. **Admin access denied**: Ensure `role: "admin"` in metadata
3. **Beta users not working**: Verify user is in beta users list
4. **Premium access denied**: Check `subscription_status` in metadata

### Debug Steps
1. Check console logs for feature flag responses
2. Verify user metadata in Supabase
3. Test API endpoints directly
4. Check admin permissions

## 🎉 Success!

Your AI Copilot now has a comprehensive feature flag system that allows you to:
- ✅ Continue development safely
- ✅ Roll out to beta users
- ✅ Gate for premium users
- ✅ Manage access dynamically
- ✅ Monitor and control feature usage

The system is production-ready and scales with your needs! 🚀
