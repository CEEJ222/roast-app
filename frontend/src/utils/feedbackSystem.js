// Feedback Collection System for Mobile App
// This module provides comprehensive user feedback collection and review management

import { Capacitor } from '@capacitor/core';

class FeedbackManager {
  constructor() {
    this.feedbackData = [];
    this.reviewRequests = [];
    this.initializeFeedbackSystem();
  }

  // Initialize feedback system
  initializeFeedbackSystem() {
    // Load existing feedback data
    this.loadFeedbackData();
    
    // Set up review request triggers
    this.setupReviewTriggers();
    
    // Monitor user satisfaction
    this.monitorUserSatisfaction();
  }

  // Load feedback data from storage
  loadFeedbackData() {
    const stored = localStorage.getItem('feedback_data');
    if (stored) {
      this.feedbackData = JSON.parse(stored);
    }
  }

  // Save feedback data to storage
  saveFeedbackData() {
    localStorage.setItem('feedback_data', JSON.stringify(this.feedbackData));
  }

  // Set up automatic review request triggers
  setupReviewTriggers() {
    // Request review after successful roasts
    this.setupRoastCompletionTrigger();
    
    // Request review after app usage milestones
    this.setupUsageMilestoneTriggers();
    
    // Request review after positive feedback
    this.setupPositiveFeedbackTrigger();
  }

  // Request review after roast completion
  setupRoastCompletionTrigger() {
    // This would be called from the roast completion logic
    window.addEventListener('roast_completed', (event) => {
      const roastData = event.detail;
      this.handleRoastCompletion(roastData);
    });
  }

  // Handle roast completion for review requests
  handleRoastCompletion(roastData) {
    const roastCount = this.getRoastCount();
    
    // Request review after 5 successful roasts
    if (roastCount >= 5 && roastCount % 5 === 0) {
      this.requestInAppReview('roast_milestone', {
        roast_count: roastCount,
        roast_quality: roastData.quality || 'good'
      });
    }
  }

  // Get total roast count
  getRoastCount() {
    const roasts = JSON.parse(localStorage.getItem('roasts') || '[]');
    return roasts.length;
  }

  // Set up usage milestone triggers
  setupUsageMilestoneTriggers() {
    const usageMilestones = [7, 14, 30]; // days
    
    usageMilestones.forEach(days => {
      this.checkUsageMilestone(days);
    });
  }

  // Check if user has reached usage milestone
  checkUsageMilestone(days) {
    const firstLaunch = localStorage.getItem('first_launch');
    if (firstLaunch) {
      const daysSinceLaunch = (Date.now() - parseInt(firstLaunch)) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLaunch >= days) {
        this.requestInAppReview('usage_milestone', {
          days_used: Math.floor(daysSinceLaunch),
          milestone: days
        });
      }
    } else {
      // Set first launch timestamp
      localStorage.setItem('first_launch', Date.now().toString());
    }
  }

  // Set up positive feedback trigger
  setupPositiveFeedbackTrigger() {
    // Monitor for positive user interactions
    this.monitorPositiveInteractions();
  }

  // Monitor positive user interactions
  monitorPositiveInteractions() {
    // Track successful feature usage
    const positiveEvents = [
      'roast_completed_successfully',
      'ai_recommendation_accepted',
      'bean_profile_created',
      'qr_code_scanned_successfully'
    ];

    positiveEvents.forEach(eventName => {
      window.addEventListener(eventName, () => {
        this.incrementPositiveInteractionCount();
      });
    });
  }

  // Increment positive interaction count
  incrementPositiveInteractionCount() {
    const count = parseInt(localStorage.getItem('positive_interactions') || '0') + 1;
    localStorage.setItem('positive_interactions', count.toString());
    
    // Request review after 10 positive interactions
    if (count % 10 === 0) {
      this.requestInAppReview('positive_interactions', {
        interaction_count: count
      });
    }
  }

  // Request in-app review
  async requestInAppReview(trigger, context = {}) {
    try {
      // Check if we've already requested review for this trigger recently
      if (this.hasRecentReviewRequest(trigger)) {
        return;
      }

      // Record the review request
      this.recordReviewRequest(trigger, context);

      // Use native in-app review if available
      if (Capacitor.isNativePlatform()) {
        await this.requestNativeReview();
      } else {
        // Fallback to custom review modal for web
        this.showCustomReviewModal(trigger, context);
      }
    } catch (error) {
      console.error('Review request failed:', error);
      // Fallback to custom review modal
      this.showCustomReviewModal(trigger, context);
    }
  }

  // Check if we've made a recent review request for this trigger
  hasRecentReviewRequest(trigger) {
    const recentRequests = this.reviewRequests.filter(
      request => request.trigger === trigger && 
      (Date.now() - request.timestamp) < (7 * 24 * 60 * 60 * 1000) // 7 days
    );
    return recentRequests.length > 0;
  }

  // Record review request
  recordReviewRequest(trigger, context) {
    const request = {
      trigger,
      context,
      timestamp: Date.now(),
      platform: Capacitor.getPlatform()
    };
    
    this.reviewRequests.push(request);
    localStorage.setItem('review_requests', JSON.stringify(this.reviewRequests));
  }

  // Request native review
  async requestNativeReview() {
    // This would use the actual in-app review plugin
    // For now, we'll simulate it
    console.log('Requesting native in-app review...');
    
    // In a real implementation, you would use:
    // import { InAppReview } from '@capacitor/in-app-review';
    // await InAppReview.requestReview();
  }

  // Show custom review modal
  showCustomReviewModal(trigger, context) {
    // Create and show a custom review modal
    const modal = this.createReviewModal(trigger, context);
    document.body.appendChild(modal);
  }

  // Create custom review modal
  createReviewModal(trigger, context) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">Enjoying Roast Buddy?</h3>
        <p class="text-gray-600 mb-6">
          Your feedback helps us improve the app for all coffee roasters!
        </p>
        <div class="flex space-x-3">
          <button class="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
                  onclick="this.requestAppStoreReview()">
            Rate App
          </button>
          <button class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400" 
                  onclick="this.closeModal()">
            Maybe Later
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    modal.querySelector('button[onclick*="requestAppStoreReview"]').onclick = () => {
      this.handleReviewResponse('positive', trigger, context);
      this.closeModal(modal);
    };
    
    modal.querySelector('button[onclick*="closeModal"]').onclick = () => {
      this.handleReviewResponse('dismissed', trigger, context);
      this.closeModal(modal);
    };
    
    return modal;
  }

  // Close modal
  closeModal(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  // Handle review response
  handleReviewResponse(response, trigger, context) {
    this.trackFeedbackEvent('review_request_response', {
      response,
      trigger,
      context,
      timestamp: new Date().toISOString()
    });

    if (response === 'positive') {
      // Open app store for review
      this.openAppStoreForReview();
    }
  }

  // Open app store for review
  openAppStoreForReview() {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'ios') {
      // iOS App Store URL
      window.open('https://apps.apple.com/app/roast-buddy/id[APP_ID]?action=write-review');
    } else if (platform === 'android') {
      // Google Play Store URL
      window.open('https://play.google.com/store/apps/details?id=com.roastbuddy.app&showAllReviews=true');
    }
  }

  // Monitor user satisfaction
  monitorUserSatisfaction() {
    // Track user satisfaction indicators
    this.trackSatisfactionIndicators();
  }

  // Track satisfaction indicators
  trackSatisfactionIndicators() {
    // Track successful feature usage
    const satisfactionEvents = [
      'roast_completed',
      'ai_recommendation_used',
      'bean_profile_created',
      'qr_code_scanned'
    ];

    satisfactionEvents.forEach(eventName => {
      window.addEventListener(eventName, (event) => {
        this.recordSatisfactionEvent(eventName, event.detail);
      });
    });
  }

  // Record satisfaction event
  recordSatisfactionEvent(eventName, data) {
    const satisfactionEvent = {
      event: eventName,
      data: data,
      timestamp: Date.now(),
      satisfaction_score: this.calculateSatisfactionScore(eventName, data)
    };

    this.feedbackData.push(satisfactionEvent);
    this.saveFeedbackData();
  }

  // Calculate satisfaction score
  calculateSatisfactionScore(eventName, data) {
    // Simple satisfaction scoring based on event type and data
    const baseScores = {
      'roast_completed': 8,
      'ai_recommendation_used': 9,
      'bean_profile_created': 7,
      'qr_code_scanned': 6
    };

    let score = baseScores[eventName] || 5;
    
    // Adjust based on data quality
    if (data && data.quality === 'excellent') score += 2;
    if (data && data.quality === 'good') score += 1;
    if (data && data.quality === 'poor') score -= 2;
    
    return Math.max(1, Math.min(10, score));
  }

  // Track feedback event
  trackFeedbackEvent(eventName, properties) {
    const feedbackEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: Capacitor.getPlatform()
      }
    };

    this.feedbackData.push(feedbackEvent);
    this.saveFeedbackData();
    
    console.log('Feedback Event:', feedbackEvent);
  }

  // Get feedback summary
  getFeedbackSummary() {
    const summary = {
      total_feedback_events: this.feedbackData.length,
      review_requests: this.reviewRequests.length,
      average_satisfaction: this.calculateAverageSatisfaction(),
      positive_interactions: parseInt(localStorage.getItem('positive_interactions') || '0'),
      roast_count: this.getRoastCount()
    };

    return summary;
  }

  // Calculate average satisfaction
  calculateAverageSatisfaction() {
    const satisfactionEvents = this.feedbackData.filter(
      event => event.satisfaction_score
    );
    
    if (satisfactionEvents.length === 0) return 0;
    
    const totalScore = satisfactionEvents.reduce(
      (sum, event) => sum + event.satisfaction_score, 0
    );
    
    return (totalScore / satisfactionEvents.length).toFixed(2);
  }

  // Export feedback data
  exportFeedbackData() {
    return {
      feedback_data: this.feedbackData,
      review_requests: this.reviewRequests,
      summary: this.getFeedbackSummary(),
      export_time: new Date().toISOString()
    };
  }
}

// Create global feedback manager instance
export const feedbackManager = new FeedbackManager();

// Export convenience functions
export const requestReview = (trigger, context) => {
  feedbackManager.requestInAppReview(trigger, context);
};

export const trackFeedback = (eventName, properties) => {
  feedbackManager.trackFeedbackEvent(eventName, properties);
};

export const getFeedbackSummary = () => {
  return feedbackManager.getFeedbackSummary();
};

export default feedbackManager;
