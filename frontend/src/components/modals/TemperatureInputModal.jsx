import React, { useState, useEffect } from 'react';

const TemperatureInputModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  milestoneType, 
  title = "Enter Temperature" 
}) => {
  const [temperature, setTemperature] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTemperature('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const temp = parseFloat(temperature);
    if (!isNaN(temp) && temp > 0) {
      onConfirm(temp);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl dark:shadow-dark-glow p-4 sm:p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              Temperature for {milestoneType} (°F)
            </label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter temperature..."
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
              autoFocus
              min="0"
              step="1"
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-quaternary font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!temperature || isNaN(parseFloat(temperature)) || parseFloat(temperature) <= 0}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemperatureInputModal;
