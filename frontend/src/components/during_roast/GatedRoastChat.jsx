import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoastChat from './RoastChat';
import SimpleAlert from '../modals/SimpleAlert';
import { useDevMessageSeen } from '../../hooks/useDevMessageSeen';

const GatedRoastChat = (props) => {
  const { user, loading, getAuthToken } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDevFeedback, setShowDevFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const { hasSeenDevMessage, markAsSeen } = useDevMessageSeen();

  // Check subscription status when user is authenticated
  useEffect(() => {
    if (user && !checkingSubscription && subscriptionStatus === null) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    setCheckingSubscription(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setSubscriptionStatus('free');
        setCheckingSubscription(false);
        return;
      }

      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000'
        : 'https://roast-backend-production-8883.up.railway.app';

      try {
        const response = await fetch(`${API_BASE}/user/subscription-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Use the new feature flag system
          if (data.ai_features_enabled) {
            setSubscriptionStatus(data.access_type || 'premium');
          } else {
            setSubscriptionStatus('free');
          }
        } else {
          setSubscriptionStatus('free');
        }
      } catch (error) {
        setSubscriptionStatus('free');
      }
    } catch (error) {
      setSubscriptionStatus('free');
    } finally {
      setCheckingSubscription(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      alert('Please enter your feedback before submitting.');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000'
        : 'https://roast-backend-production-8883.up.railway.app';

      const response = await fetch(`${API_BASE}/feedback/development`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feedback: feedback.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Show custom alert
      setAlertMessage(data.message || 'Thank you for your feedback! We appreciate your input and will consider it for the final product.');
      setShowAlert(true);
      
      // Close the feedback modal
      setShowDevFeedback(false);
      setFeedback('');
      
    } catch (error) {
      alert('Sorry, there was an error submitting your feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Don't render if not open
  if (!props.isOpen) {
    return null;
  }
  
  // Show loading state while checking authentication or subscription
  if (loading || checkingSubscription) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-96 h-[500px] flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-300">Loading AI Copilot...</span>
            </div>
          </div>
        </div>
        <SimpleAlert 
          isOpen={showAlert}
          message={alertMessage}
          onClose={() => {
            setShowAlert(false);
            markAsSeen();
            props.onClose();
          }}
        />
      </>
    );
  }

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50">
        <div 
          onClick={isMinimized ? (e) => {
            if (e.target === e.currentTarget) {
              setIsMinimized(false);
            }
          } : undefined}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
            isMinimized ? 'w-80 h-16 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : 'w-96 h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Roasting Copilot
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                {isMinimized ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  props.onClose && props.onClose();
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Login Prompt */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Copilot Requires Login
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm">
                  Sign in to access the AI Roasting Copilot for personalized roasting guidance and real-time recommendations.
                </p>

                <div className="space-y-3 w-full max-w-xs">
                  <button
                    onClick={() => {
                      window.location.href = '/profile';
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Sign In to Access AI
                  </button>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get personalized roasting advice, real-time guidance, and AI-powered recommendations
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        <SimpleAlert 
          isOpen={showAlert}
          message={alertMessage}
          onClose={() => {
            setShowAlert(false);
            markAsSeen();
            props.onClose();
          }}
        />
      </>
    );
  }

  // If user is authenticated but on free tier, show development feedback modal
  if (user && subscriptionStatus === 'free') {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50">
        <div 
          onClick={isMinimized ? (e) => {
            if (e.target === e.currentTarget) {
              setIsMinimized(false);
            }
          } : undefined}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
            isMinimized ? 'w-80 h-16 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : 'w-96 h-[500px]'
          } ${hasSeenDevMessage ? 'opacity-75 border-gray-300' : ''}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Roasting Copilot
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                {isMinimized ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  props.onClose && props.onClose();
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Development Feedback Modal */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Feature in Development
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm">
                  This feature is in development. Please leave a note on if/how you would like to use this feature and we may incorporate that feedback into the final product.
                </p>

                <div className="w-full max-w-sm space-y-4">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us how you'd like to use the AI Roasting Copilot..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={submitFeedback}
                      disabled={!feedback.trim() || submittingFeedback}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                    
                    <button
                      onClick={() => props.onClose && props.onClose()}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your feedback helps us build better features for everyone
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        <SimpleAlert 
          isOpen={showAlert}
          message={alertMessage}
          onClose={() => {
            setShowAlert(false);
            markAsSeen();
            props.onClose();
          }}
        />
      </>
    );
  }

  // If user is authenticated and has access (development, beta, or premium), render the normal RoastChat component
  if (user && (subscriptionStatus === 'development' || subscriptionStatus === 'beta' || subscriptionStatus === 'premium' || subscriptionStatus === 'pro')) {
    return (
      <>
        <RoastChat {...props} />
        <SimpleAlert 
          isOpen={showAlert}
          message={alertMessage}
          onClose={() => {
            setShowAlert(false);
            markAsSeen();
            props.onClose();
          }}
        />
      </>
    );
  }

  // Fallback - if subscription status is still loading, show the normal chat
  // This handles edge cases where subscription check fails
  return (
    <>
      <RoastChat {...props} />
      <SimpleAlert 
        isOpen={showAlert}
        message={alertMessage}
        onClose={() => {
          setShowAlert(false);
          props.onClose();
        }}
      />
    </>
  );
};

export default GatedRoastChat;