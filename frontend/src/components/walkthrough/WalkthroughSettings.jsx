import React from 'react';
import { useWalkthrough } from '../../contexts/WalkthroughContext';

const WalkthroughSettings = () => {
  const { 
    isWalkthrough, 
    enableWalkthrough, 
    disableWalkthrough 
  } = useWalkthrough();

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
            Demo Mode
          </h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Show sample data to demonstrate app capabilities
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isWalkthrough 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {isWalkthrough ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
          <h4 className="font-medium text-gray-800 dark:text-dark-text-primary mb-2">
            Demo includes:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-dark-text-secondary space-y-1">
            <li>• 7 sample roasts with realistic curves</li>
            <li>• 11 diverse bean profiles from different origins</li>
            <li>• Complete roast event data with milestones</li>
            <li>• Star ratings and roast analysis</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          {isWalkthrough ? (
            <button
              onClick={disableWalkthrough}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              Disable Demo Mode
            </button>
          ) : (
            <button
              onClick={enableWalkthrough}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              Enable Demo Mode
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-dark-text-tertiary">
          <p>
            <strong>Note:</strong> Demo mode replaces your real data with sample data. 
            Your actual roasts and bean profiles are safe and will return when demo mode is disabled.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughSettings;
