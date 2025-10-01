import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FeedbackConfirmationModal from './FeedbackConfirmationModal';

const GeneralFeedbackModal = ({ isOpen, onClose }) => {
  const { getAuthToken } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      alert('Please enter your feedback before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000'
        : 'https://roast-backend-production-8883.up.railway.app';

      const response = await fetch(`${API_BASE}/feedback/general`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          type: feedbackType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Show confirmation modal
      setConfirmationMessage(data.message || 'Thank you for your feedback! We appreciate your input and will review it soon.');
      setShowConfirmation(true);
      
      // Reset form
      setFeedback('');
      setFeedbackType('general');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Sorry, there was an error submitting your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedback('');
    setFeedbackType('general');
    setShowConfirmation(false);
    setConfirmationMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Send Feedback
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Help us improve Roast Buddy
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Feedback Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What type of feedback is this?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackType('general')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    feedbackType === 'general'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">💭</span>
                    <div className="text-left">
                      <div className="font-medium">General Feedback</div>
                      <div className="text-xs opacity-75">Thoughts, suggestions, or comments</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFeedbackType('bug')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    feedbackType === 'bug'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🐛</span>
                    <div className="text-left">
                      <div className="font-medium">Bug Report</div>
                      <div className="text-xs opacity-75">Something isn't working</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFeedbackType('feature')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    feedbackType === 'feature'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">✨</span>
                    <div className="text-left">
                      <div className="font-medium">Feature Request</div>
                      <div className="text-xs opacity-75">New functionality ideas</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFeedbackType('improvement')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    feedbackType === 'improvement'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🚀</span>
                    <div className="text-left">
                      <div className="font-medium">Improvement</div>
                      <div className="text-xs opacity-75">Make existing features better</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Feedback Text Area */}
            <div className="mb-6">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Feedback
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  feedbackType === 'bug' 
                    ? "Please describe the bug you encountered. Include steps to reproduce if possible..."
                    : feedbackType === 'feature'
                    ? "Describe the feature you'd like to see added..."
                    : feedbackType === 'improvement'
                    ? "How can we improve this feature or the app overall?"
                    : "Share your thoughts, suggestions, or any feedback you have about the app..."
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows={6}
                maxLength={2000}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Be as specific as possible to help us understand your feedback
                </p>
                <span className="text-xs text-gray-400">
                  {feedback.length}/2000
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <FeedbackConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        message={confirmationMessage}
      />
    </>
  );
};

export default GeneralFeedbackModal;
