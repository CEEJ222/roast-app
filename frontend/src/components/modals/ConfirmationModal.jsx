import React from 'react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonColor = "bg-red-600 hover:bg-red-700",
  icon = "⚠️"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl dark:shadow-dark-glow max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-6 py-4 rounded-t-xl border-b border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-b-xl flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors ${confirmButtonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;