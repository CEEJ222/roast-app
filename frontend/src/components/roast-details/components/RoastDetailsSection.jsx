import React from 'react';
import { formatDate } from '../../../utils/dateUtils';

const RoastDetailsSection = ({ roast, events, formatDuration }) => {

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
        Roast Details
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
          <p className="text-gray-900 dark:text-dark-text-primary font-medium">
            {formatDate(roast.created_at)}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Machine</label>
          <p className="text-gray-900 dark:text-dark-text-primary font-medium">
            {roast.machine_label || roast.machine_name || 'Not specified'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoastDetailsSection;
