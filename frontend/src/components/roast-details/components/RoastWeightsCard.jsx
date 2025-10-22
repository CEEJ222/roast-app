import React from 'react';

const RoastWeightsCard = ({ 
  roast, 
  isEditing, 
  editFormData, 
  onEditFormChange 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Weights</h3>
      {isEditing ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Weight Before (g):</label>
            <input
              type="number"
              step="0.1"
              value={editFormData.weight_before_g}
              onChange={(e) => onEditFormChange({...editFormData, weight_before_g: e.target.value})}
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
              placeholder="Enter initial weight..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Weight After (g):</label>
            <input
              type="number"
              step="0.1"
              value={editFormData.weight_after_g}
              onChange={(e) => onEditFormChange({...editFormData, weight_after_g: e.target.value})}
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
              placeholder="Enter final weight..."
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Weight Before:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">{roast.weight_before_g ? `${roast.weight_before_g}g` : 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Weight After:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">{roast.weight_after_g ? `${roast.weight_after_g}g` : 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Weight Loss:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">
              {roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoastWeightsCard;
