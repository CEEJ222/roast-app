import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const RoastChatFeedback = ({
  messageId,
  messageText,
  roastId,
  roastContext,
  existingFeedback,
  onFeedbackSubmit
}) => {
  const { getAuthToken } = useAuth();
  const [feedbackType, setFeedbackType] = useState(existingFeedback || null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [detailedFeedbackType, setDetailedFeedbackType] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // If user already gave feedback, show confirmation
  if (existingFeedback) {
    return (
      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  const handleThumbsUp = async () => {
    await submitFeedback('thumbs_up');
  };

  const handleThumbsDown = () => {
    setShowDetailedFeedback(true);
  };

  const handleDetailedFeedback = async () => {
    if (!detailedFeedbackType) return;
    await submitFeedback(detailedFeedbackType);
  };

  const submitFeedback = async (type) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const requestBody = {
        roast_id: roastId,
        chat_message_id: messageId,
        feedback_type: type,
        feedback_comment: feedbackComment || null,
        ai_message_text: messageText,
        roast_context: roastContext
      };

      const response = await fetch(`${API_BASE}/api/roast-chat/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeedbackType(type);
      setShowDetailedFeedback(false);
      
      // Show success toast
      if (window.showToast) {
        window.showToast('Feedback submitted successfully!', 'success');
      }

      // Call callback if provided
      if (onFeedbackSubmit) {
        onFeedbackSubmit(type, data.feedback_id);
      }

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error.message);
      
      // Show error toast
      if (window.showToast) {
        window.showToast('Failed to submit feedback. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const detailedFeedbackOptions = [
    { 
      value: 'too_late', 
      label: 'Too late', 
      icon: <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    },
    { 
      value: 'wrong_advice', 
      label: 'Wrong advice', 
      icon: <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    },
    { 
      value: 'confusing', 
      label: 'Confusing', 
      icon: <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    },
    { 
      value: 'not_relevant', 
      label: 'Not relevant', 
      icon: <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    }
  ];

  return (
    <div className="mt-2">
      {!showDetailedFeedback ? (
        // Initial feedback buttons
        <div className="flex items-center space-x-2">
          <button
            onClick={handleThumbsUp}
            disabled={isSubmitting}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900 rounded transition-colors disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>Helpful</span>
          </button>
          <button
            onClick={handleThumbsDown}
            disabled={isSubmitting}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 rounded transition-colors disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 0110.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10H9m8 0h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2.5" />
            </svg>
            <span>Not helpful</span>
          </button>
        </div>
      ) : (
        // Detailed feedback options
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            What wasn't helpful?
          </div>
          
          <div className="space-y-2">
            {detailedFeedbackOptions.map((option) => {
              return (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                >
                  <input
                    type="radio"
                    name="detailedFeedback"
                    value={option.value}
                    checked={detailedFeedbackType === option.value}
                    onChange={(e) => setDetailedFeedbackType(e.target.value)}
                    className="w-3 h-3 text-blue-600"
                  />
                  {option.icon}
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional comments (optional)
            </label>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Tell us more about what went wrong..."
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows="2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDetailedFeedback}
              disabled={!detailedFeedbackType || isSubmitting}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={() => {
                setShowDetailedFeedback(false);
                setDetailedFeedbackType('');
                setFeedbackComment('');
                setError(null);
              }}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoastChatFeedback;
