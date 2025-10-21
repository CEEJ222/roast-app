import React from 'react';

const ErrorState = ({ error, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-dark-card rounded-lg p-8 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Error</h3>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{error}</p>
        <button
          onClick={onClose}
          className="bg-gray-500 dark:bg-dark-bg-tertiary text-white dark:text-dark-text-primary px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-dark-bg-quaternary transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default ErrorState;
