import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FeedbackManager from './FeedbackManager';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const FeatureFlagManager = () => {
  const { user, getAuthToken } = useAuth();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFeedbackManager, setShowFeedbackManager] = useState(false);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE}/admin/feature-flags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeatures(data.features);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureName, enabled) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const endpoint = enabled ? 'enable' : 'disable';
      const response = await fetch(`${API_BASE}/admin/feature-flags/${featureName}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess(data.message);
      await loadFeatureFlags(); // Reload the list
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addBetaUser = async (featureName, userId) => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE}/admin/feature-flags/${featureName}/beta-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add',
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess(data.message);
      await loadFeatureFlags(); // Reload the list
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeBetaUser = async (featureName, userId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE}/admin/feature-flags/${featureName}/beta-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'remove',
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess(data.message);
      await loadFeatureFlags(); // Reload the list
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && features.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading feature flags...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Feature Flag Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage AI Copilot access and feature rollout
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid gap-6">
        {features.map((feature) => (
          <div key={feature.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {feature.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    feature.enabled 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {feature.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    feature.type === 'development' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : feature.type === 'beta'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }`}>
                    {feature.type.charAt(0).toUpperCase() + feature.type.slice(1)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => toggleFeature(feature.name, !feature.enabled)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  feature.enabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {feature.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {/* Beta Users Management */}
            {feature.type === 'beta' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Beta Users ({feature.beta_users.length})
                </h4>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Enter user ID to add"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addBetaUser(feature.name, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector(`input[placeholder="Enter user ID to add"]`);
                      if (input) {
                        addBetaUser(feature.name, input.value);
                        input.value = '';
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>

                {feature.beta_users.length > 0 ? (
                  <div className="space-y-2">
                    {feature.beta_users.map((userId, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-600 rounded-lg p-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{userId}</span>
                        <button
                          onClick={() => removeBetaUser(feature.name, userId)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No beta users added yet</p>
                )}
              </div>
            )}

            {/* Feature Details */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>Created: {new Date(feature.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(feature.updated_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Manager Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Development Feedback
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              View and search AI Copilot development feedback from users
            </p>
          </div>
          <button
            onClick={() => setShowFeedbackManager(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            View Feedback
          </button>
        </div>
      </div>

      {/* Feedback Manager Modal */}
      <FeedbackManager 
        isOpen={showFeedbackManager}
        onClose={() => setShowFeedbackManager(false)}
      />
    </div>
  );
};

export default FeatureFlagManager;
