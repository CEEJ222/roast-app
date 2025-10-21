import React from 'react';

const RoastNotesCard = ({ 
  roast, 
  isEditing, 
  editFormData, 
  onEditFormChange 
}) => {
  // Only render if there are notes or we're in editing mode
  if (!roast.notes && !isEditing) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Roast Notes</h3>
      {isEditing ? (
        <textarea
          value={editFormData.notes}
          onChange={(e) => onEditFormChange({...editFormData, notes: e.target.value})}
          className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
          rows={4}
          placeholder="Add notes about this roast..."
        />
      ) : (
        <p className="text-gray-900 dark:text-dark-text-primary whitespace-pre-wrap">{roast.notes}</p>
      )}
    </div>
  );
};

export default RoastNotesCard;
