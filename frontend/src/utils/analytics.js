// Analytics and Monitoring System for Mobile App
// This module provides comprehensive analytics tracking for the mobile app

import { Capacitor } from '@capacitor/core';

class AnalyticsManager {
  constructor() {
    this.events = [];
    this.sessionStart = Date.now();
    this.isOnline = true;
    this.initializeAnalytics();
  }

  // Initialize analytics system
  initializeAnalytics() {
    // Track app launch
    this.trackEvent('app_launched', {
      platform: Capacitor.getPlatform(),
      timestamp: new Date().toISOString(),
      session_id: this.generateSessionId()
    });

    // Monitor network status
    this.monitorNetworkStatus();
    
    // Track performance metrics
    this.trackPerformanceMetrics();
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track custom events
  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: Capacitor.getPlatform(),
        session_id: this.generateSessionId()
      }
    };

    this.events.push(event);
    console.log('Analytics Event:', event);

    // Send to analytics service (implement based on your analytics provider)
    this.sendToAnalytics(event);
  }

  // Track roast-specific events
  trackRoastEvent(eventType, roastData = {}) {
    this.trackEvent(`roast_${eventType}`, {
      roast_id: roastData.id,
      machine_type: roastData.machineType,
      bean_type: roastData.beanType,
      duration: roastData.duration,
      weight_loss: roastData.weightLoss,
      final_temperature: roastData.finalTemperature
    });
  }

  // Track AI recommendation usage
  trackAIRecommendation(recommendationType, context = {}) {
    this.trackEvent('ai_recommendation_used', {
      recommendation_type: recommendationType,
      context: context,
      user_feedback: context.feedback || null
    });
  }

  // Track user engagement
  trackUserEngagement(action, component, duration = null) {
    this.trackEvent('user_engagement', {
      action: action,
      component: component,
      duration: duration,
      engagement_level: this.calculateEngagementLevel(duration)
    });
  }

  // Calculate engagement level based on duration
  calculateEngagementLevel(duration) {
    if (!duration) return 'unknown';
    if (duration < 1000) return 'low';
    if (duration < 5000) return 'medium';
    return 'high';
  }

  // Track performance metrics
  trackPerformanceMetrics() {
    // Track app startup time
    window.addEventListener('load', () => {
      const startupTime = performance.now();
      this.trackEvent('app_startup_time', {
        startup_time: startupTime,
        memory_usage: this.getMemoryUsage()
      });
    });

    // Track memory usage periodically
    setInterval(() => {
      this.trackEvent('memory_usage', {
        memory_info: this.getMemoryUsage(),
        event_count: this.events.length
      });
    }, 60000); // Every minute
  }

  // Get memory usage information
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Monitor network status
  monitorNetworkStatus() {
    // Track network connectivity
    this.trackEvent('network_status', {
      online: navigator.onLine,
      connection_type: this.getConnectionType()
    });

    // Listen for network changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent('network_connected');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent('network_disconnected');
    });
  }

  // Get connection type (if available)
  getConnectionType() {
    if (navigator.connection) {
      return navigator.connection.effectiveType;
    }
    return 'unknown';
  }

  // Send events to analytics service
  async sendToAnalytics(event) {
    try {
      // Implement your analytics service integration here
      // Examples: Google Analytics, Mixpanel, Amplitude, etc.
      
      if (this.isOnline) {
        // Send to external analytics service
        await this.sendToExternalService(event);
      } else {
        // Store for later sync
        this.storeOfflineEvent(event);
      }
    } catch (error) {
      console.error('Analytics error:', error);
      this.storeOfflineEvent(event);
    }
  }

  // Send to external analytics service
  async sendToExternalService(event) {
    // Implement your preferred analytics service
    // Example with fetch API:
    /*
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    });
    */
  }

  // Store events for offline sync
  storeOfflineEvent(event) {
    const offlineEvents = JSON.parse(localStorage.getItem('offline_analytics') || '[]');
    offlineEvents.push(event);
    localStorage.setItem('offline_analytics', JSON.stringify(offlineEvents));
  }

  // Sync offline events when back online
  async syncOfflineEvents() {
    const offlineEvents = JSON.parse(localStorage.getItem('offline_analytics') || '[]');
    
    for (const event of offlineEvents) {
      await this.sendToExternalService(event);
    }
    
    localStorage.removeItem('offline_analytics');
    this.trackEvent('offline_events_synced', {
      event_count: offlineEvents.length
    });
  }

  // Track key user actions
  trackRoastStarted(roastData) {
    this.trackRoastEvent('started', roastData);
  }

  trackRoastCompleted(roastData) {
    this.trackRoastEvent('completed', roastData);
  }

  trackRoastPaused(roastData) {
    this.trackRoastEvent('paused', roastData);
  }

  trackBeanProfileCreated(profileData) {
    this.trackEvent('bean_profile_created', {
      bean_type: profileData.beanType,
      origin: profileData.origin,
      processing_method: profileData.processingMethod
    });
  }

  trackQRCodeScanned(scanData) {
    this.trackEvent('qr_code_scanned', {
      scan_success: scanData.success,
      data_type: scanData.dataType,
      scan_duration: scanData.duration
    });
  }

  trackPushNotificationReceived(notificationData) {
    this.trackEvent('push_notification_received', {
      notification_type: notificationData.type,
      action_taken: notificationData.actionTaken
    });
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const summary = {
      total_events: this.events.length,
      session_duration: Date.now() - this.sessionStart,
      platform: Capacitor.getPlatform(),
      is_online: this.isOnline,
      memory_usage: this.getMemoryUsage()
    };

    return summary;
  }

  // Export analytics data
  exportAnalytics() {
    return {
      events: this.events,
      summary: this.getAnalyticsSummary(),
      export_time: new Date().toISOString()
    };
  }
}

// Create global analytics instance
export const analytics = new AnalyticsManager();

// Track key events automatically
export const trackEvent = (eventName, properties = {}) => {
  analytics.trackEvent(eventName, properties);
};

// Track roast events
export const trackRoastStarted = (roastData) => {
  analytics.trackRoastStarted(roastData);
};

export const trackRoastCompleted = (roastData) => {
  analytics.trackRoastCompleted(roastData);
};

export const trackAIRecommendation = (recommendationType, context) => {
  analytics.trackAIRecommendation(recommendationType, context);
};

export const trackUserEngagement = (action, component, duration) => {
  analytics.trackUserEngagement(action, component, duration);
};

export default analytics;
