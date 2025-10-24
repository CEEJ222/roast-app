import React from 'react';
import { useWalkthrough } from '../../contexts/WalkthroughContext';

const WalkthroughPrompt = () => {
  const { 
    showWalkthroughPrompt, 
    enableWalkthrough, 
    dismissWalkthroughPrompt 
  } = useWalkthrough();

  if (!showWalkthroughPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔥☕</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
              Welcome to Roast Buddy!
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Let's take a quick tour to see what you can do with your roasting
            </p>
          </div>

          {/* Features Preview */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-lg">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary">
                  Roast Curve Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Track temperature and rate of rise
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-lg">☕</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary">
                  Bean Profile Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Track your favorite coffee origins
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-lg">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary">
                  AI Roasting Coach
                </h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Get real-time roasting advice
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={enableWalkthrough}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold"
            >
              🚀 Start Tour
            </button>
            
            <button
              onClick={dismissWalkthroughPrompt}
              className="w-full bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-quaternary transition-colors"
            >
              Skip Tour
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
              This tour shows sample data to help you get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughPrompt;
