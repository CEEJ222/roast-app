import React from 'react';
import { formatDate } from '../../utils/dateUtils';
import RoastActionButtons from './RoastActionButtons';

const RoastDetailHeader = ({ 
  roast, 
  isEditing, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit,
  onCopyRoastData,
  onShare,
  onDelete,
  onClose 
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-4 sm:px-6 py-4 text-white">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0 mr-2">
          <h2 className="text-xl sm:text-2xl font-bold">☕ Roast Details</h2>
          <p className="opacity-90 text-sm sm:text-base truncate max-w-full">
            {roast.bean_profile_name || roast.coffee_type || 'Unknown Coffee'} • {formatDate(roast.created_at)}
          </p>
        </div>
        <RoastActionButtons 
          isEditing={isEditing}
          onEdit={onEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onCopyRoastData={onCopyRoastData}
          onShare={onShare}
          onDelete={onDelete}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default RoastDetailHeader;
