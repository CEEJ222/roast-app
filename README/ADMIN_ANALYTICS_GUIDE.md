# Admin Analytics Dashboard Guide

## Overview

The Admin Analytics Dashboard provides comprehensive engagement metrics and insights for monitoring user activity, roast patterns, and application growth. This system is designed to help administrators gauge user engagement and make data-driven decisions.

## Features

### 📊 Overview Dashboard
- **Total Users**: Complete user count with active user tracking
- **Total Roasts**: All-time roast count with recent activity
- **Bean Profiles**: User-created bean profile statistics
- **Engagement Rates**: Percentage of users actively using features
- **Monthly Growth**: 6-month growth trends for users, roasts, and bean profiles

### 👥 User Activity Analytics
- **Top Active Users**: Ranked list of most engaged users
- **User Metrics**: Individual roast counts, bean profile counts, and last activity
- **Subscription Status**: Premium vs. free user breakdown
- **Activity Tracking**: Last sign-in dates and engagement patterns

### ☕ Roast Insights
- **Roast Level Distribution**: Popular roast levels (City, City+, etc.)
- **Coffee Regions**: Most popular coffee origins
- **Process Methods**: Distribution of processing methods (Natural, Washed, etc.)
- **Weight Loss Statistics**: Average weight loss percentages
- **Daily Activity**: 30-day roast activity trends

## Access Control

### Admin Authentication
- Requires `role: "admin"` in user metadata
- All endpoints protected with JWT token verification
- Admin access verified on every request

### Security Features
- JWT token validation for all analytics endpoints
- User metadata role checking
- Secure API endpoints with proper error handling

## API Endpoints

### `/admin/analytics/overview`
**GET** - Comprehensive overview metrics
```json
{
  "overview": {
    "total_users": 150,
    "active_users": 45,
    "total_roasts": 1200,
    "recent_roasts": 89,
    "total_bean_profiles": 340,
    "recent_bean_profiles": 23,
    "engagement_rate_roasts": 78.5,
    "engagement_rate_bean_profiles": 65.2
  },
  "monthly_growth": [
    {
      "month": "2024-01",
      "users": 12,
      "roasts": 45,
      "bean_profiles": 8
    }
  ]
}
```

### `/admin/analytics/user-activity`
**GET** - Detailed user activity data
```json
{
  "user_activity": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "created_at": "2024-01-01T00:00:00Z",
      "last_sign_in_at": "2024-01-15T10:30:00Z",
      "roast_count": 25,
      "bean_profile_count": 8,
      "subscription_status": "premium"
    }
  ],
  "total_users": 150
}
```

### `/admin/analytics/roast-insights`
**GET** - Roast pattern analysis
```json
{
  "roast_levels": {
    "City": 45,
    "City+": 32,
    "Full City": 28
  },
  "regions": {
    "Ethiopia": 67,
    "Colombia": 45,
    "Guatemala": 32
  },
  "processes": {
    "Washed": 89,
    "Natural": 56,
    "Honey": 23
  },
  "avg_weight_loss": 15.2,
  "daily_activity": {
    "2024-01-15": 5,
    "2024-01-14": 3
  },
  "total_roasts": 1200
}
```

## Frontend Components

### AnalyticsDashboard.jsx
Main analytics dashboard component with:
- **Tabbed Interface**: Overview, User Activity, Roast Insights
- **Responsive Design**: Mobile-friendly layout
- **Real-time Data**: Live data fetching and display
- **Interactive Charts**: Visual representation of metrics

### Integration with FeatureFlagManager
- Seamlessly integrated into existing admin interface
- Modal-based display for full-screen analytics
- Consistent styling with existing admin components

## Usage

### Accessing Analytics
1. Navigate to admin panel (requires admin role)
2. Click "View Analytics" button in the Analytics Dashboard section
3. Explore different tabs for various insights

### Key Metrics to Monitor

#### User Engagement
- **Active Users**: Users who signed in within last 30 days
- **Engagement Rate**: Percentage of users creating roasts/bean profiles
- **User Growth**: Monthly new user acquisition

#### Roast Activity
- **Daily Roasts**: Track daily roasting activity
- **Popular Regions**: Most roasted coffee origins
- **Roast Levels**: Distribution of roast preferences

#### Feature Adoption
- **Bean Profile Creation**: User adoption of bean profiling
- **Feature Usage**: Track which features are most used
- **User Retention**: Monitor long-term user engagement

## Data Privacy

### User Data Protection
- No personal information exposed beyond email and display name
- User IDs are anonymized in analytics
- No sensitive roast data exposed
- Aggregate statistics only

### Admin Access
- Analytics only accessible to users with admin role
- All data access logged and monitored
- Secure API endpoints with proper authentication

## Performance Considerations

### Data Aggregation
- Analytics queries optimized for performance
- Cached results where appropriate
- Efficient database queries with proper indexing

### Scalability
- Pagination for large user lists
- Efficient data processing for analytics
- Responsive UI for large datasets

## Troubleshooting

### Common Issues

#### "Admin access required" Error
- Ensure user has `role: "admin"` in user metadata
- Check JWT token is valid and not expired
- Verify user is properly authenticated

#### "Failed to load analytics data" Error
- Check backend API is running
- Verify database connections
- Check for any database query errors

#### Slow Loading
- Analytics queries may take time with large datasets
- Consider implementing caching for frequently accessed data
- Monitor database performance

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify API endpoints are responding
3. Check user authentication status
4. Review database query performance

## Future Enhancements

### Planned Features
- **Real-time Updates**: Live data updates without refresh
- **Export Functionality**: CSV/PDF export of analytics data
- **Advanced Filtering**: Date ranges, user segments, custom filters
- **Custom Dashboards**: Configurable dashboard layouts
- **Alerts**: Automated alerts for significant changes

### Integration Opportunities
- **Email Reports**: Automated weekly/monthly reports
- **Slack Integration**: Real-time notifications
- **Data Visualization**: Advanced charts and graphs
- **Machine Learning**: Predictive analytics and insights

## Support

For issues or questions regarding the analytics dashboard:
1. Check this guide for common solutions
2. Review browser console for errors
3. Verify admin access permissions
4. Contact development team for advanced issues

---

*Last updated: January 2024*
