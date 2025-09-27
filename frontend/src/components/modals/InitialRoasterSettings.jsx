import React from 'react';

const InitialRoasterSettings = ({ 
  isOpen, 
  onClose, 
  onStart, 
  initialSettings, 
  setInitialSettings, 
  loading, 
  weightBefore 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg p-4 sm:p-6 w-full max-w-md shadow-2xl dark:shadow-dark-glow">
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-dark-text-primary">Initial Roaster Settings</h3>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">Set your starting fan and heat levels before beginning the roast.</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">Fan Level</label>
              <input
                type="number"
                min="0"
                max="9"
                value={initialSettings.fan_level}
                onChange={(e) => setInitialSettings(prev => ({ ...prev, fan_level: e.target.value }))}
                className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">Heat Level</label>
              <input
                type="number"
                min="0"
                max="9"
                value={initialSettings.heat_level}
                onChange={(e) => setInitialSettings(prev => ({ ...prev, heat_level: e.target.value }))}
                className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-6">
          <button
            onClick={onStart}
            disabled={loading || !weightBefore || parseFloat(weightBefore) <= 0}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting...
              </div>
            ) : !weightBefore || parseFloat(weightBefore) <= 0 ? (
              '⚠️ Enter Valid Weight'
            ) : (
              '🏁 Start Roast'
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-quaternary font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialRoasterSettings;
