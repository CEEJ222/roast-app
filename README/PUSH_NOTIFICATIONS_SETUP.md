# Push Notifications Setup Guide

This guide explains how to set up unified push notifications for iOS, Android, and Web in your Roast Buddy app.

## Overview

Push notifications allow you to send messages to users even when your app isn't actively running. The system supports:

- **iOS**: Apple Push Notification Service (APNs)
- **Android**: Firebase Cloud Messaging (FCM)
- **Web**: Web Push API

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │───▶│   Backend API    │───▶│  Push Services  │
│                 │    │                  │    │                 │
│ - Send Messages │    │ - User Management │    │ - FCM (Android) │
│ - Templates     │    │ - Device Tokens  │    │ - APNs (iOS)    │
│ - Analytics     │    │ - Scheduling     │    │ - Web Push      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Firebase Cloud Messaging Setup

#### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Cloud Messaging in the project settings

#### 1.2 Configure Web App
1. Add a web app to your Firebase project
2. Copy the Firebase configuration
3. Add to your frontend environment variables:

```javascript
// .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### 1.3 Configure iOS App
1. Add iOS app to Firebase project
2. Download `GoogleService-Info.plist`
3. Add to your iOS project
4. Configure APNs certificates in Firebase

#### 1.4 Configure Android App
1. Add Android app to Firebase project
2. Download `google-services.json`
3. Add to `android/app/` directory
4. Update `android/app/build.gradle`

### 2. Backend Configuration

#### 2.1 Install Dependencies
```bash
pip install firebase-admin
```

#### 2.2 Environment Variables
```bash
# .env
FIREBASE_CREDENTIALS_PATH=path/to/service-account-key.json
FIREBASE_PROJECT_ID=your_project_id
```

#### 2.3 Initialize Firebase Admin
```python
# backend/utils/firebase_admin.py
import firebase_admin
from firebase_admin import credentials, messaging
import os

def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    return messaging
```

### 3. Frontend Implementation

#### 3.1 Install Dependencies
```bash
npm install firebase @capacitor/push-notifications
```

#### 3.2 Firebase Configuration
```javascript
// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js');
}
```

#### 3.3 Service Worker
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/fire-emoji.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### 4. Device Token Registration

#### 4.1 Web Implementation
```javascript
// src/hooks/usePushNotifications.js
import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebase';

export const usePushNotifications = () => {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'your-vapid-key'
          });
          setToken(token);
          
          // Send token to backend
          if (token) {
            await registerDeviceToken(token, 'web');
          }
        }
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    };

    requestPermission();
  }, []);

  return { token, permission };
};
```

#### 4.2 Mobile Implementation (Capacitor)
```javascript
// src/hooks/useMobilePushNotifications.js
import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';

export const useMobilePushNotifications = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Request permissions
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      }
    });

    // Handle registration
    PushNotifications.addListener('registration', token => {
      console.log('Push registration success, token: ' + token.value);
      setToken(token.value);
      registerDeviceToken(token.value, 'mobile');
    });

    // Handle errors
    PushNotifications.addListener('registrationError', err => {
      console.error('Push registration error: ' + JSON.stringify(err));
    });

    // Handle incoming notifications
    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push notification received: ', notification);
    });
  }, []);

  return { token };
};
```

### 5. Admin Dashboard Integration

The admin dashboard includes a comprehensive push notification manager with:

#### Features:
- **Template Management**: Pre-built notification templates
- **Audience Targeting**: Send to specific user segments
- **Scheduling**: Schedule notifications for later delivery
- **Analytics**: Track delivery and open rates
- **Preview**: See how notifications will appear

#### Usage:
1. Navigate to Admin Dashboard
2. Click "Push Notifications" card
3. Choose template or create custom message
4. Select target audience
5. Schedule or send immediately

### 6. Notification Templates

Pre-built templates for common scenarios:

#### Roast Milestones
```javascript
{
  id: 'roast-milestone',
  title: 'Roast Milestone Reached',
  body: 'Your roast has reached the {milestone} phase',
  category: 'roast'
}
```

#### Roast Complete
```javascript
{
  id: 'roast-complete',
  title: 'Roast Finished!',
  body: 'Your {roastLevel} roast is complete and ready for cooling',
  category: 'roast'
}
```

#### Educational Tips
```javascript
{
  id: 'bean-profile-tip',
  title: 'Pro Tip',
  body: 'Did you know {beanOrigin} beans typically perform best at {temperature}°F?',
  category: 'education'
}
```

### 7. User Segmentation

Target specific user groups:

- **All Users**: Everyone who has the app
- **Active Roasters**: Users who roasted in the last 30 days
- **Beginner Roasters**: Users with < 10 roasts
- **Advanced Roasters**: Users with > 50 roasts
- **Platform Specific**: iOS, Android, or Web users
- **Subscription Status**: Free vs Premium users

### 8. Analytics and Monitoring

Track notification performance:

- **Delivery Rate**: Percentage of notifications successfully delivered
- **Open Rate**: Percentage of notifications opened by users
- **Platform Breakdown**: Performance by iOS/Android/Web
- **Template Performance**: Which templates perform best
- **Time-based Analytics**: Best times to send notifications

### 9. Best Practices

#### Content Guidelines
- Keep titles under 50 characters
- Keep body text under 150 characters
- Use clear, actionable language
- Include relevant emojis sparingly

#### Timing
- Avoid sending during sleep hours
- Consider user time zones
- Test with small audiences first
- Don't overwhelm users with too many notifications

#### Personalization
- Use user's name when possible
- Reference their recent activity
- Provide relevant, timely information
- Segment based on user behavior

### 10. Troubleshooting

#### Common Issues

**Web Notifications Not Working:**
- Check service worker registration
- Verify VAPID key configuration
- Ensure HTTPS in production

**Mobile Notifications Not Working:**
- Check APNs certificates (iOS)
- Verify Firebase configuration
- Ensure proper permissions

**Backend Errors:**
- Check Firebase service account permissions
- Verify project ID configuration
- Monitor Firebase quotas

#### Debug Tools
- Firebase Console: Monitor message delivery
- Browser DevTools: Check service worker logs
- Mobile Debug: Use device logs and Firebase console

### 11. Security Considerations

- **Token Management**: Securely store and rotate device tokens
- **User Privacy**: Respect user notification preferences
- **Rate Limiting**: Implement limits to prevent spam
- **Content Filtering**: Validate notification content
- **Access Control**: Restrict admin access to notification sending

### 12. Cost Considerations

- **Firebase**: Free tier includes 1M messages/month
- **APNs**: No direct cost, but requires Apple Developer account
- **Web Push**: No direct cost
- **Storage**: Minimal cost for token storage

### 13. Future Enhancements

- **Rich Notifications**: Images, actions, and custom layouts
- **A/B Testing**: Test different notification content
- **Automated Triggers**: Send notifications based on user behavior
- **Deep Linking**: Direct users to specific app sections
- **Localization**: Multi-language support

## Implementation Checklist

- [ ] Set up Firebase project
- [ ] Configure iOS app with APNs
- [ ] Configure Android app with FCM
- [ ] Set up web push with service worker
- [ ] Implement device token registration
- [ ] Create admin dashboard interface
- [ ] Set up notification templates
- [ ] Implement user segmentation
- [ ] Add analytics tracking
- [ ] Test on all platforms
- [ ] Deploy to production
- [ ] Monitor and optimize

## Support

For issues or questions:
- Check Firebase documentation
- Review Capacitor push notification docs
- Monitor Firebase console for errors
- Test with small user groups first
