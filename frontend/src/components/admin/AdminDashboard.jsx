import React, { useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import FeedbackManager from './FeedbackManager';
import FeatureFlagManager from './FeatureFlagManager';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('analytics');
  const [showFeedbackManager, setShowFeedbackManager] = useState(false);
  const [showFeatureFlagManager, setShowFeatureFlagManager] = useState(false);

  const navigationItems = [
    {
      id: 'feedback',
      label: 'User Feedback',
      icon: '💬',
      description: 'View and manage user feedback and suggestions'
    },
    {
      id: 'feature-flags',
      label: 'Feature Flags & Beta Program',
      icon: '🚩',
      description: 'Manage feature flags, beta users, and access controls'
    }
  ];

  const handleFeedbackClick = () => {
    setShowFeedbackManager(true);
  };

  const handleFeatureFlagsClick = () => {
    setShowFeatureFlagManager(true);
  };

  return (
    <div className="min-h-screen bg-light-gradient-blue dark:bg-dark-gradient">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your application, monitor engagement, and control feature access
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {navigationItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 ${
                activeView === item.id 
                  ? 'ring-2 ring-orange-500 dark:ring-orange-400' 
                  : 'hover:border-orange-300 dark:hover:border-orange-600'
              }`}
              onClick={() => {
                if (item.id === 'feedback') {
                  handleFeedbackClick();
                } else if (item.id === 'feature-flags') {
                  handleFeatureFlagsClick();
                } else {
                  setActiveView(item.id);
                }
              }}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-end">
                    {item.id === 'feedback' ? (
                      <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 text-sm font-medium">
                        <span>View Feedback</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </button>
                    ) : (
                      <button className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                        <span className="relative z-10">Manage Flags</span>
                        <svg className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Main Content Area */}
        {activeView === 'analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <AnalyticsDashboard />
          </div>
        )}

        {/* Feedback Manager Modal */}
        <FeedbackManager 
          isOpen={showFeedbackManager}
          onClose={() => setShowFeedbackManager(false)}
        />

        {/* Feature Flag Manager Modal */}
        {showFeatureFlagManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Feature Flags & Beta Program
                </h2>
                <button
                  onClick={() => setShowFeatureFlagManager(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <FeatureFlagManager />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
