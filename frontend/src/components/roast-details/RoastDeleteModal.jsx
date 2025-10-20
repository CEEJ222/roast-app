import React from 'react';

const RoastDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🗑️</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
              Delete Roast
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-gray-700 dark:text-dark-text-secondary mb-6">
          Are you sure you want to delete this roast? All roast data, events, and notes will be permanently removed.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            Delete Roast
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoastDeleteModal;
