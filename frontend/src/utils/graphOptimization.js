// Graph optimization utilities for better performance

/**
 * Sample data points to reduce rendering load
 * @param {Array} data - Array of data points
 * @param {number} maxPoints - Maximum number of points to keep
 * @returns {Array} Sampled data array
 */
export function sampleDataPoints(data, maxPoints = 200) {
  if (!data || data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

/**
 * Optimize chart data for mobile devices
 * @param {Array} data - Chart data
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {Array} Optimized data
 */
export function optimizeForMobile(data, isMobile = false) {
  if (!isMobile) return data;
  
  // Reduce data points for mobile
  return sampleDataPoints(data, 100);
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
