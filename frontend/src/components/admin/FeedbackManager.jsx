import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const FeedbackManager = ({ isOpen, onClose }) => {
  const { getAuthToken } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'search', 'summary'

  useEffect(() => {
    if (isOpen) {
      loadAllFeedback();
      loadSummary();
    }
  }, [isOpen]);

  const loadAllFeedback = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000'
        : 'https://roast-backend-production-8883.up.railway.app';

      const response = await fetch(`${API_BASE}/admin/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
      alert('Error loading feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000'
        : 'https://roast-backend-production-8883.up.railway.app';

      const response = await fetch(`${API_BASE}/admin/feedback/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const searchFeedback = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const API_BASE = import.meta.env.DEV 
        ? 'http://localhost:8000'
        : 'https://roast-backend-production-8883.up.railway.app';

      const response = await fetch(`${API_BASE}/admin/feedback/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching feedback:', error);
      alert('Error searching feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Development Feedback Manager
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                View and search AI Copilot feedback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'all'
                ? 'text-orange-600 border-b-2 border-orange-600 dark:text-orange-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            All Feedback ({feedback.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'search'
                ? 'text-orange-600 border-b-2 border-orange-600 dark:text-orange-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Search Results ({searchResults.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'summary'
                ? 'text-orange-600 border-b-2 border-orange-600 dark:text-orange-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Summary
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback semantically (e.g., 'temperature control', 'roast timing', 'user experience')..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && searchFeedback()}
            />
            <button
              onClick={searchFeedback}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading...</span>
            </div>
          )}

          {!loading && activeTab === 'all' && (
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No feedback submitted yet
                </div>
              ) : (
                feedback.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.user_email}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{item.feedback_text}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && activeTab === 'search' && (
            <div className="space-y-4">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No results found for your search' : 'Enter a search query to find relevant feedback'}
                </div>
              ) : (
                searchResults.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.user_email}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{item.feedback_text}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && activeTab === 'summary' && (
            <div className="space-y-6">
              {summary ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg p-4 text-white">
                      <div className="text-2xl font-bold">{summary.total_feedback}</div>
                      <div className="text-sm opacity-90">Total Feedback</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg p-4 text-white">
                      <div className="text-2xl font-bold">{Object.keys(summary.by_feature).length}</div>
                      <div className="text-sm opacity-90">Features</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-lg p-4 text-white">
                      <div className="text-2xl font-bold">{Object.keys(summary.by_status).length}</div>
                      <div className="text-sm opacity-90">Status Types</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Feedback by Feature
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(summary.by_feature).map(([feature, count]) => (
                          <div key={feature} className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                            <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-sm">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Feedback by Status
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(summary.by_status).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">{status}</span>
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {summary.recent_feedback && summary.recent_feedback.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Recent Feedback
                      </h3>
                      <div className="space-y-3">
                        {summary.recent_feedback.slice(0, 5).map((item, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.user_email}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {item.feedback_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading summary...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackManager;
