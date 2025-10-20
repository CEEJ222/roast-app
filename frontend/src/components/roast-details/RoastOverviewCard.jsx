import React from 'react';

const RoastOverviewCard = ({ 
  roast, 
  isEditing, 
  editFormData, 
  onEditFormChange 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Roast Overview</h3>
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Coffee Type:</label>
            <input
              type="text"
              value={editFormData.coffee_type}
              onChange={(e) => onEditFormChange({...editFormData, coffee_type: e.target.value})}
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Coffee Region:</label>
            <input
              type="text"
              value={editFormData.coffee_region}
              onChange={(e) => onEditFormChange({...editFormData, coffee_region: e.target.value})}
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Process:</label>
            <input
              type="text"
              value={editFormData.coffee_process}
              onChange={(e) => onEditFormChange({...editFormData, coffee_process: e.target.value})}
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Target Roast:</label>
            <input
              type="text"
              value={editFormData.desired_roast_level}
              onChange={(e) => onEditFormChange({...editFormData, desired_roast_level: e.target.value})}
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Machine:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">{roast.machine_label || 'Unknown'}</p>
            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-1">Machine cannot be changed after roast creation</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Coffee:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">
              {roast.bean_profile_name || roast.coffee_type || 'Not specified'}
            </p>
            {roast.coffee_region && (
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{roast.coffee_region}</p>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Process:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">{roast.coffee_process || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Target Roast:</span>
            <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-sm font-medium">
              {roast.desired_roast_level}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Machine:</span>
            <p className="text-gray-900 dark:text-dark-text-primary">{roast.machine_label || 'Unknown'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoastOverviewCard;
