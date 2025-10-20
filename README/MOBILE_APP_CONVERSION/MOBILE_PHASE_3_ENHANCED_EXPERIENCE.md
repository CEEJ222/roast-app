# Phase 3: Enhanced Mobile Experience

## Overview
This phase focuses on optimizing the mobile user experience with advanced features, performance improvements, and mobile-specific enhancements. We'll add advanced gestures, optimize performance, and implement mobile-specific UI patterns.

## Timeline
**Week 4** - Enhanced mobile experience and optimizations

## Prerequisites
- [ ] Phase 2 completed successfully
- [ ] Core mobile features working
- [ ] Basic mobile functionality tested

## Phase 3 Checklist

### 3.1 Advanced Mobile Features
- [ ] Implement swipe gestures for navigation
- [ ] Add pull-to-refresh functionality
- [ ] Implement shake-to-log events
- [ ] Add voice commands for hands-free operation

### 3.2 Performance Optimizations
- [ ] Optimize chart rendering for mobile
- [ ] Implement lazy loading for large datasets
- [ ] Optimize image loading and caching
- [ ] Reduce bundle size for mobile

### 3.3 Mobile-Specific UI Patterns
- [ ] Implement bottom sheet modals
- [ ] Add floating action buttons
- [ ] Optimize for one-handed use
- [ ] Implement mobile-specific navigation patterns

### 3.4 Advanced Native Integrations
- [ ] Add device sensor integration
- [ ] Implement clipboard integration
- [ ] Add share functionality
- [ ] Integrate with device calendar

### 3.5 Accessibility Improvements
- [ ] Implement screen reader support
- [ ] Add voice-over navigation
- [ ] Optimize for accessibility tools
- [ ] Test with accessibility features

## Detailed Implementation

### Step 3.1: Advanced Mobile Features

#### Swipe Gestures
```bash
# Install gesture plugin
npm install @capacitor/gestures
npx cap sync
```

**Implementation in RoastDetailPage.jsx:**
```jsx
import { Gesture } from '@capacitor/gestures';

const RoastDetailPage = () => {
  useEffect(() => {
    const gesture = new Gesture({
      element: document.getElementById('roast-detail'),
      gestureName: 'swipe',
      options: {
        direction: 'horizontal',
        threshold: 100
      }
    });

    gesture.on('gesture', (detail) => {
      if (detail.direction === 'left') {
        // Navigate to next roast
        navigateToNextRoast();
      } else if (detail.direction === 'right') {
        // Navigate to previous roast
        navigateToPreviousRoast();
      }
    });

    return () => gesture.destroy();
  }, []);

  return (
    <div id="roast-detail" className="h-full">
      {/* Existing roast detail content */}
    </div>
  );
};
```

#### Pull-to-Refresh
**Implementation in Dashboard.jsx:**
```jsx
import { PullToRefresh } from '@capacitor/pull-to-refresh';

const Dashboard = () => {
  useEffect(() => {
    const pullToRefresh = new PullToRefresh({
      element: document.getElementById('dashboard'),
      onRefresh: async () => {
        await loadHistoricalRoasts();
        pullToRefresh.complete();
      }
    });

    return () => pullToRefresh.destroy();
  }, []);

  return (
    <div id="dashboard" className="h-full overflow-y-auto">
      {/* Existing dashboard content */}
    </div>
  );
};
```

#### Shake-to-Log Events
```bash
# Install device motion plugin
npm install @capacitor/device-motion
npx cap sync
```

**Implementation in ActiveRoast.jsx:**
```jsx
import { DeviceMotion } from '@capacitor/device-motion';

const ActiveRoast = () => {
  useEffect(() => {
    if (roastId) {
      DeviceMotion.addListener('devicemotion', (event) => {
        const acceleration = event.acceleration;
        const totalAcceleration = Math.sqrt(
          acceleration.x * acceleration.x +
          acceleration.y * acceleration.y +
          acceleration.z * acceleration.z
        );

        // Detect shake gesture
        if (totalAcceleration > 15) {
          handleShakeGesture();
        }
      });

      return () => DeviceMotion.removeAllListeners();
    }
  }, [roastId]);

  const handleShakeGesture = async () => {
    // Add haptic feedback
    await Haptics.impact({ style: ImpactStyle.Heavy });
    
    // Log a quick event
    await logQuickEvent('SHAKE_LOG');
  };
};
```

### Step 3.2: Performance Optimizations

#### Optimized Chart Rendering
**Update RoastCurveGraph.jsx:**
```jsx
import { memo, useMemo } from 'react';

const RoastCurveGraph = memo(({ data, mode, showROR, ...props }) => {
  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    if (mode === 'live') {
      return data.slice(-100); // Only show last 100 points for performance
    }
    return data;
  }, [data, mode]);

  // Use virtual scrolling for large datasets
  const renderChart = () => {
    if (data.length > 1000) {
      return <VirtualizedChart data={chartData} />;
    }
    return <StandardChart data={chartData} />;
  };

  return (
    <div className="roast-curve-graph">
      {renderChart()}
    </div>
  );
});
```

#### Lazy Loading Implementation
**Create LazyLoadWrapper.jsx:**
```jsx
import { useState, useEffect, useRef } from 'react';

const LazyLoadWrapper = ({ children, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className="lazy-load-wrapper">
      {isVisible ? children : <div className="loading-placeholder">Loading...</div>}
    </div>
  );
};
```

### Step 3.3: Mobile-Specific UI Patterns

#### Bottom Sheet Modals
**Create BottomSheetModal.jsx:**
```jsx
import { useState, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const BottomSheetModal = ({ isOpen, onClose, children, title }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      Haptics.impact({ style: ImpactStyle.Light });
    }
  }, [isOpen]);

  const handleClose = async () => {
    setIsAnimating(false);
    await Haptics.impact({ style: ImpactStyle.Light });
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary rounded-t-xl shadow-2xl transform transition-transform duration-300 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
```

#### Floating Action Button
**Create FloatingActionButton.jsx:**
```jsx
import { useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const FloatingActionButton = ({ onClick, icon, label }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    setIsPressed(true);
    await Haptics.impact({ style: ImpactStyle.Medium });
    onClick();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <button
      onClick={handlePress}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform duration-150 ${
        isPressed ? 'scale-95' : 'scale-100'
      }`}
      aria-label={label}
    >
      {icon}
    </button>
  );
};
```

### Step 3.4: Advanced Native Integrations

#### Device Sensor Integration
```bash
# Install device plugins
npm install @capacitor/device @capacitor/screen-orientation
npx cap sync
```

**Implementation in RoastControls.jsx:**
```jsx
import { Device } from '@capacitor/device';
import { ScreenOrientation } from '@capacitor/screen-orientation';

const RoastControls = () => {
  useEffect(() => {
    // Lock screen orientation during roasting
    ScreenOrientation.lock({ orientation: 'portrait' });

    // Get device info for optimization
    Device.getInfo().then(info => {
      console.log('Device info:', info);
      // Adjust UI based on device capabilities
    });

    return () => {
      ScreenOrientation.unlock();
    };
  }, []);

  return (
    <div className="roast-controls">
      {/* Existing controls */}
    </div>
  );
};
```

#### Clipboard Integration
```bash
# Install clipboard plugin
npm install @capacitor/clipboard
npx cap sync
```

**Implementation in RoastDetailPage.jsx:**
```jsx
import { Clipboard } from '@capacitor/clipboard';

const RoastDetailPage = ({ roast }) => {
  const copyRoastData = async () => {
    const roastSummary = `
Roast Summary:
Date: ${roast.created_at}
Machine: ${roast.machine_name}
Coffee: ${roast.coffee_region} ${roast.coffee_type}
Roast Level: ${roast.desired_roast_level}
Weight In: ${roast.weight_before_g}g
Weight Out: ${roast.weight_after_g}g
Weight Loss: ${roast.weight_loss_pct}%
Duration: ${roast.t_drop} minutes
    `.trim();

    await Clipboard.write({
      string: roastSummary
    });

    // Show success feedback
    await Haptics.notification({ type: 'success' });
  };

  return (
    <div className="roast-detail">
      <button
        onClick={copyRoastData}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
      >
        Copy Roast Data
      </button>
    </div>
  );
};
```

### Step 3.5: Accessibility Improvements

#### Screen Reader Support
**Update components with proper ARIA labels:**
```jsx
const RoastTimer = () => {
  return (
    <div 
      className="roast-timer"
      role="timer"
      aria-label={`Roast timer: ${formatTime(elapsedTime)}`}
      aria-live="polite"
    >
      <div className="timer-display">
        {formatTime(elapsedTime)}
      </div>
      <div className="phase-indicator">
        <span className="sr-only">Current phase: {currentPhase}</span>
        <span aria-hidden="true">{currentPhase}</span>
      </div>
    </div>
  );
};
```

## Testing Checklist
- [ ] Swipe gestures work smoothly
- [ ] Pull-to-refresh functions correctly
- [ ] Shake-to-log events trigger properly
- [ ] Charts render efficiently on mobile
- [ ] Lazy loading improves performance
- [ ] Bottom sheet modals animate smoothly
- [ ] Floating action buttons respond correctly
- [ ] Device sensors integrate properly
- [ ] Clipboard functionality works
- [ ] Screen reader support functional
- [ ] Accessibility features work correctly

## Performance Metrics
- [ ] App startup time < 3 seconds
- [ ] Chart rendering time < 1 second
- [ ] Memory usage optimized
- [ ] Battery usage minimized
- [ ] Network requests optimized

## Success Criteria
- [ ] Enhanced mobile user experience implemented
- [ ] Performance optimizations working
- [ ] Advanced native features functional
- [ ] Accessibility improvements in place
- [ ] Mobile-specific UI patterns implemented
- [ ] Ready to proceed to Phase 4

## Next Phase
Once Phase 3 is complete, proceed to **MOBILE_PHASE_4_TESTING_DEPLOYMENT.md** for final testing and app store deployment.

## Important Notes
- **NO GIT COMMITS** until explicitly requested
- Test all performance optimizations on real devices
- Ensure accessibility features work correctly
- Document any platform-specific optimizations
- Maintain backward compatibility with web version
