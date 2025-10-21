import React from 'react';

const LoadingState = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-dark-card rounded-lg p-8 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-dark-accent-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-dark-text-secondary">Loading roast details...</p>
      </div>
    </div>
  </div>
);

export default LoadingState;
