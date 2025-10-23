import React from 'react';

const RoastActionButtons = ({ 
  isEditing, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit,
  onCopyRoastData,
  onShare,
  onExport,
  onDelete,
  onClose 
}) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button 
          onClick={onSaveEdit} 
          className="bg-green-500/80 hover:bg-green-500 text-white px-1.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          💾 Save
        </button>
        <button 
          onClick={onCancelEdit} 
          className="bg-gray-500/80 hover:bg-gray-500 text-white px-1.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          ❌ Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      <button 
        onClick={onCopyRoastData} 
        className="bg-blue-500/80 hover:bg-blue-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
        title="Copy roast data"
      >
        📋 Copy
      </button>
      <button 
        onClick={onShare} 
        className="bg-green-500/80 hover:bg-green-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
        title="Share roast"
      >
        📤 Share
      </button>
      <button 
        onClick={onExport} 
        className="bg-orange-500/80 hover:bg-orange-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
        title="Export to CSV"
      >
        📊 Export
      </button>
      <button 
        onClick={onEdit} 
        className="bg-purple-500/80 hover:bg-purple-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
        title="Edit roast"
      >
        ✏️ Edit
      </button>
      <button 
        onClick={onDelete} 
        className="bg-red-500/80 hover:bg-red-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
        title="Delete roast"
      >
        🗑️ Delete
      </button>
    </div>
  );
};

export default RoastActionButtons;
