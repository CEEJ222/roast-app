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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature for {milestoneType} (°F)
            </label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter temperature..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              autoFocus
              min="0"
              step="1"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!temperature || isNaN(parseFloat(temperature)) || parseFloat(temperature) <= 0}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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
