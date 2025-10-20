# Phase 2: Core Mobile Features

## Overview
This phase implements the core mobile-specific features that will enhance the user experience on mobile devices. We'll add camera integration, push notifications, offline data synchronization, and background processing.

## Timeline
**Week 2-3** - Core mobile feature implementation

## Prerequisites
- [ ] Phase 1 completed successfully
- [ ] Mobile apps building and running
- [ ] Basic mobile testing environment set up

## Phase 2 Checklist

### 2.1 Camera Integration
- [ ] Install camera plugin
- [ ] Implement QR code scanning for bean profiles
- [ ] Add camera permissions handling
- [ ] Test camera functionality on both platforms

### 2.2 Push Notifications
- [ ] Install push notifications plugin
- [ ] Configure notification permissions
- [ ] Implement roast milestone notifications
- [ ] Set up notification handling

### 2.3 Offline Data Synchronization
- [ ] Implement local data storage
- [ ] Add offline mode detection
- [ ] Create data synchronization logic
- [ ] Handle conflict resolution

### 2.4 Background Processing
- [ ] Implement background timer functionality
- [ ] Add local notifications for roast milestones
- [ ] Handle app state changes
- [ ] Test background behavior

### 2.5 Mobile-Specific UI Enhancements
- [ ] Optimize touch interactions
- [ ] Improve mobile navigation
- [ ] Add haptic feedback
- [ ] Enhance mobile-specific gestures

## Detailed Implementation

### Step 2.1: Camera Integration
```bash
# Install camera plugin
npm install @capacitor/camera
npx cap sync
```

**Implementation in BeanProfileForm.jsx:**
```jsx
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const BeanProfileForm = () => {
  const [qrCodeData, setQrCodeData] = useState(null);

  const scanQRCode = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      
      // Process QR code from image
      const qrResult = await processQRCode(image.base64String);
      setQrCodeData(qrResult);
    } catch (error) {
      console.error('QR scan failed:', error);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={scanQRCode}
        className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Scan QR Code
      </button>
    </div>
  );
};
```

### Step 2.2: Push Notifications
```bash
# Install push notifications plugin
npm install @capacitor/push-notifications
npx cap sync
```

**Implementation in RoastTimer.jsx:**
```jsx
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

const RoastTimer = () => {
  useEffect(() => {
    // Request notification permissions
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      }
    });

    // Handle notification events
    PushNotifications.addListener('registration', token => {
      console.log('Push registration success, token: ' + token);
      // Send token to backend
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Push registration error: ' + JSON.stringify(err));
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push notification received: ', notification);
    });
  }, []);

  const scheduleMilestoneNotification = async (milestone, time) => {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Roast Milestone",
          body: `${milestone} should occur around ${time}`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + time * 1000) }
        }
      ]
    });
  };
};
```

### Step 2.3: Offline Data Synchronization
```bash
# Install storage plugin
npm install @capacitor/storage
npx cap sync
```

**Implementation in apiCall function:**
```jsx
import { Storage } from '@capacitor/storage';
import { Network } from '@capacitor/network';

const apiCall = async (url, options = {}) => {
  try {
    // Check network status
    const status = await Network.getStatus();
    
    if (!status.connected) {
      // Store request for later synchronization
      await storeOfflineRequest(url, options);
      return { offline: true, message: 'Request stored for offline sync' };
    }

    // Make API call
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Handle offline scenario
    if (error.message.includes('Network')) {
      await storeOfflineRequest(url, options);
      return { offline: true, message: 'Request stored for offline sync' };
    }
    throw error;
  }
};

const storeOfflineRequest = async (url, options) => {
  const offlineRequests = await Storage.get({ key: 'offlineRequests' });
  const requests = offlineRequests.value ? JSON.parse(offlineRequests.value) : [];
  
  requests.push({
    url,
    options,
    timestamp: Date.now()
  });
  
  await Storage.set({
    key: 'offlineRequests',
    value: JSON.stringify(requests)
  });
};

const syncOfflineRequests = async () => {
  const offlineRequests = await Storage.get({ key: 'offlineRequests' });
  
  if (offlineRequests.value) {
    const requests = JSON.parse(offlineRequests.value);
    
    for (const request of requests) {
      try {
        await fetch(request.url, request.options);
      } catch (error) {
        console.error('Failed to sync offline request:', error);
      }
    }
    
    // Clear synced requests
    await Storage.remove({ key: 'offlineRequests' });
  }
};
```

### Step 2.4: Background Processing
```bash
# Install background mode plugin
npm install @capacitor/background-mode
npx cap sync
```

**Implementation in ActiveRoast.jsx:**
```jsx
import { BackgroundMode } from '@capacitor/background-mode';
import { LocalNotifications } from '@capacitor/local-notifications';

const ActiveRoast = () => {
  useEffect(() => {
    if (roastId) {
      // Enable background mode
      BackgroundMode.enable();
      
      // Set up background timer
      const backgroundInterval = setInterval(() => {
        if (document.hidden) {
          // App is in background, use local notifications
          scheduleBackgroundNotifications();
        }
      }, 1000);
      
      return () => {
        clearInterval(backgroundInterval);
        BackgroundMode.disable();
      };
    }
  }, [roastId]);

  const scheduleBackgroundNotifications = async () => {
    // Schedule notifications for upcoming milestones
    const upcomingMilestones = calculateUpcomingMilestones();
    
    for (const milestone of upcomingMilestones) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Roast Milestone",
            body: `${milestone.name} is approaching`,
            id: milestone.id,
            schedule: { at: new Date(Date.now() + milestone.timeRemaining * 1000) }
          }
        ]
      });
    }
  };
};
```

### Step 2.5: Mobile UI Enhancements
**Add to RoastControls.jsx:**
```jsx
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const RoastControls = () => {
  const handleLogChange = async () => {
    // Add haptic feedback
    await Haptics.impact({ style: ImpactStyle.Medium });
    
    // Existing log change logic
    await logChange();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <button 
        onClick={handleLogChange}
        className="bg-blue-500 text-white px-6 py-4 rounded-lg text-lg font-semibold touch-manipulation"
        style={{ minHeight: '44px' }} // iOS minimum touch target
      >
        Log Change
      </button>
    </div>
  );
};
```

## Testing Checklist
- [ ] Camera opens and captures images
- [ ] QR code scanning works correctly
- [ ] Push notifications display properly
- [ ] Local notifications work in background
- [ ] Offline mode stores requests correctly
- [ ] Data syncs when connection restored
- [ ] Background timer continues when app backgrounded
- [ ] Haptic feedback works on device
- [ ] Touch targets are appropriately sized

## Platform-Specific Considerations

### iOS
- [ ] Camera permissions properly requested
- [ ] Background app refresh enabled
- [ ] Notification permissions granted
- [ ] App Store review guidelines compliance

### Android
- [ ] Camera permissions in manifest
- [ ] Background processing permissions
- [ ] Notification channels configured
- [ ] Target SDK version compatibility

## Success Criteria
- [ ] All core mobile features implemented
- [ ] Features work on both iOS and Android
- [ ] Offline functionality working correctly
- [ ] Background processing functional
- [ ] User experience enhanced for mobile
- [ ] Ready to proceed to Phase 3

## Next Phase
Once Phase 2 is complete, proceed to **MOBILE_PHASE_3_ENHANCED_EXPERIENCE.md** for advanced mobile optimizations.

## Important Notes
- **NO GIT COMMITS** until explicitly requested
- Test all features on real devices
- Document any platform-specific issues
- Ensure backward compatibility with web version
