import React, { useState } from 'react';

const URLInputModal = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
      setUrl('');
      onClose();
    }
  };

  const handleCancel = () => {
    setUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
            Enter Supplier URL
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              Coffee Supplier URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
              placeholder="https://example.com/coffee-bag"
              autoFocus
            />
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-2">
              Enter the URL from your coffee bag's QR code or website
            </p>
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium rounded-lg border border-gray-300 dark:border-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Process URL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default URLInputModal;

