import React, { useState, useEffect } from 'react';
import GeneralFeedbackModal from '../modals/GeneralFeedbackModal';

const FeedbackPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedbackType, setSelectedFeedbackType] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1 = select type, 2 = write feedback

  const feedbackTypes = [
    {
      id: 'general',
      title: 'General Feedback',
      icon: '☁️',
      description: 'Thoughts, suggestions, or comments',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'bug',
      title: 'Bug Report',
      icon: '🐛',
      description: 'Something isn\'t working',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'feature',
      title: 'Feature Request',
      icon: '⭐',
      description: 'New functionality ideas',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'improvement',
      title: 'Improvement',
      icon: '🚀',
      description: 'Make existing features better',
      color: 'from-red-500 to-red-600'
    }
  ];

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg-primary">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-primary px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">Send Feedback</h1>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Help us improve the app with your thoughts and suggestions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="bg-white dark:bg-dark-bg-primary px-4 pb-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Feedback Content */}
      <div className={`max-w-4xl mx-auto px-4 ${isMobile ? 'py-8 pb-24' : 'py-8'}`}>
        {isMobile ? (
          // Mobile two-step flow
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-border-primary p-6">
            {currentStep === 1 ? (
              // Step 1: Select feedback type
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                    What type of feedback is this?
                  </h2>
                </div>
                
                <div className="flex flex-col space-y-4">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedFeedbackType(type);
                        setCurrentStep(2);
                      }}
                      className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{type.icon}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary text-sm">
                          {type.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-dark-text-secondary">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Step 2: Write feedback
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {selectedFeedbackType?.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {selectedFeedbackType?.description}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your feedback
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={6}
                    placeholder="Please share your thoughts, suggestions, or describe the issue..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg transition-all"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Desktop version (existing)
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-border-primary p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                We'd Love Your Feedback!
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                Your input helps us make the app better for everyone. Share your thoughts, suggestions, or report any issues you've encountered.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">💭</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">General Feedback</h3>
                </div>
                <p className="text-gray-600 dark:text-dark-text-secondary text-sm">
                  Share your thoughts, suggestions, or ideas for new features
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">🐛</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Bug Reports</h3>
                </div>
                <p className="text-gray-600 dark:text-dark-text-secondary text-sm">
                  Help us fix issues by reporting bugs or unexpected behavior
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">✍️</span>
                  Send Feedback
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <GeneralFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
};

export default FeedbackPage;
