# Phase 1: Setup & Foundation

## Overview
This phase sets up the foundation for mobile app development using Capacitor. We'll install Capacitor, configure the mobile development environment, and ensure the existing web app can run in a native container.

## Timeline
**Week 1** - Setup and initial testing

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] Xcode installed (for iOS development)
- [ ] Android Studio installed (for Android development)
- [ ] Existing web app running successfully

## Phase 1 Checklist

### 1.1 Capacitor Installation
- [ ] Install Capacitor core packages
- [ ] Initialize Capacitor in the project
- [ ] Configure app metadata (name, ID, version)

### 1.2 Platform Setup
- [ ] Add iOS platform support
- [ ] Add Android platform support
- [ ] Configure platform-specific settings

### 1.3 Development Environment
- [ ] Set up iOS simulator testing
- [ ] Set up Android emulator testing
- [ ] Configure build scripts for mobile

### 1.4 Initial Testing
- [ ] Build and test iOS app in simulator
- [ ] Build and test Android app in emulator
- [ ] Verify existing web functionality works

### 1.5 Project Configuration
- [ ] Update package.json with mobile scripts
- [ ] Configure Capacitor settings
- [ ] Set up mobile-specific build process

## Detailed Steps

### Step 1.1: Capacitor Installation
```bash
# Navigate to frontend directory
cd /Users/cjbritz/roast-app/frontend

# Install Capacitor core packages
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init "Roast Buddy" "com.roastbuddy.app"

# Install platform packages
npm install @capacitor/ios @capacitor/android
```

### Step 1.2: Platform Setup
```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android
```

### Step 1.3: Configuration Files
Create/update the following configuration files:

**capacitor.config.ts**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roastbuddy.app',
  appName: 'Roast Buddy',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
```

### Step 1.4: Build Scripts
Update **package.json** to include mobile build scripts:
```json
{
  "scripts": {
    "build:mobile": "npm run build && npx cap copy",
    "ios": "npm run build:mobile && npx cap open ios",
    "android": "npm run build:mobile && npx cap open android",
    "sync": "npx cap sync"
  }
}
```

### Step 1.5: Initial Testing
```bash
# Build the web app
npm run build

# Copy to native projects
npx cap copy

# Test on iOS
npx cap open ios

# Test on Android
npx cap open android
```

## Verification Checklist
- [ ] Capacitor installed successfully
- [ ] iOS and Android platforms added
- [ ] Web app builds without errors
- [ ] iOS simulator opens and app runs
- [ ] Android emulator opens and app runs
- [ ] Basic navigation works on mobile
- [ ] Authentication flow works on mobile
- [ ] Roast logging interface displays correctly

## Troubleshooting
### Common Issues:
1. **Build errors**: Check that all dependencies are installed
2. **Simulator not opening**: Verify Xcode/Android Studio installation
3. **App not loading**: Check capacitor.config.ts configuration
4. **Styling issues**: Verify Tailwind CSS builds correctly

## Success Criteria
- [ ] Mobile development environment fully set up
- [ ] Existing web app runs in iOS and Android containers
- [ ] No critical functionality broken on mobile
- [ ] Ready to proceed to Phase 2

## Next Phase
Once Phase 1 is complete, proceed to **MOBILE_PHASE_2_CORE_FEATURES.md** for implementing native mobile features.

## Important Notes
- **NO GIT COMMITS** until explicitly requested
- Test on real devices when possible
- Keep web app running throughout development
- Document any issues encountered for future reference
