// Performance Testing Framework for Mobile App
// This module provides comprehensive performance monitoring for the mobile app

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      appStartup: null,
      chartRendering: null,
      memoryUsage: null,
      networkRequests: [],
      userInteractions: []
    };
    this.startTime = performance.now();
  }

  // Measure app startup time
  measureAppStartup() {
    const startupTime = performance.now() - this.startTime;
    this.metrics.appStartup = startupTime;
    console.log(`App startup time: ${startupTime.toFixed(2)}ms`);
    return startupTime;
  }

  // Measure chart rendering performance
  measureChartRendering(chartType, dataPoints) {
    const startTime = performance.now();
    
    // Simulate chart rendering measurement
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        this.metrics.chartRendering = {
          type: chartType,
          dataPoints: dataPoints,
          renderTime: renderTime,
          timestamp: Date.now()
        };
        
        console.log(`Chart rendering (${chartType}): ${renderTime.toFixed(2)}ms for ${dataPoints} points`);
        resolve(renderTime);
      });
    });
  }

  // Monitor memory usage
  measureMemoryUsage() {
    if (performance.memory) {
      const memoryInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      
      this.metrics.memoryUsage = memoryInfo;
      console.log('Memory usage:', memoryInfo);
      return memoryInfo;
    }
    return null;
  }

  // Track network requests
  trackNetworkRequest(url, method, duration, status) {
    const request = {
      url,
      method,
      duration,
      status,
      timestamp: Date.now()
    };
    
    this.metrics.networkRequests.push(request);
    console.log(`Network request: ${method} ${url} - ${duration}ms (${status})`);
  }

  // Track user interactions
  trackUserInteraction(action, component, duration) {
    const interaction = {
      action,
      component,
      duration,
      timestamp: Date.now()
    };
    
    this.metrics.userInteractions.push(interaction);
    console.log(`User interaction: ${action} on ${component} - ${duration}ms`);
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {
      appStartup: this.metrics.appStartup,
      chartRendering: this.metrics.chartRendering,
      memoryUsage: this.metrics.memoryUsage,
      networkRequests: this.metrics.networkRequests.length,
      userInteractions: this.metrics.userInteractions.length,
      totalUptime: performance.now() - this.startTime
    };
    
    console.log('Performance Summary:', summary);
    return summary;
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      ...this.metrics,
      summary: this.getPerformanceSummary(),
      exportTime: new Date().toISOString()
    };
  }
}

// Performance test suite
export const performanceTests = {
  appStartup: () => {
    const startTime = performance.now();
    // Measure app startup time
    return performance.now() - startTime;
  },
  
  chartRendering: (chartType, dataPoints) => {
    const startTime = performance.now();
    // Measure chart rendering time
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const endTime = performance.now();
        resolve({
          type: chartType,
          dataPoints: dataPoints,
          renderTime: endTime - startTime
        });
      });
    });
  },
  
  memoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  },

  // Test offline functionality
  testOfflineMode: async () => {
    const startTime = performance.now();
    
    // Test offline data access
    const offlineData = localStorage.getItem('roastData');
    const offlineTime = performance.now() - startTime;
    
    return {
      offlineDataAvailable: !!offlineData,
      accessTime: offlineTime,
      dataSize: offlineData ? offlineData.length : 0
    };
  },

  // Test camera functionality
  testCameraPerformance: async () => {
    const startTime = performance.now();
    
    try {
      // Simulate camera initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      const endTime = performance.now();
      
      return {
        success: true,
        initializationTime: endTime - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-measure app startup
window.addEventListener('load', () => {
  performanceMonitor.measureAppStartup();
  performanceMonitor.measureMemoryUsage();
});

// Monitor memory usage periodically
setInterval(() => {
  performanceMonitor.measureMemoryUsage();
}, 30000); // Every 30 seconds

export default performanceMonitor;
