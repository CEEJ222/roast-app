import React from 'react';
import BottomSheetModal from '../../shared/BottomSheetModal';

const RoastShareModal = ({ 
  isOpen, 
  onClose, 
  onCopyRoastData,
  onCopyEvents 
}) => {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Roast"
    >
      <div className="space-y-4">
        <button
          onClick={onCopyRoastData}
          className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-3"
        >
          📋 Copy Roast Summary
        </button>
        <button
          onClick={onCopyEvents}
          className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-3"
        >
          📊 Copy Roast Events
        </button>
        <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
          Use these options to share your roast data via text, email, or other apps.
        </div>
      </div>
    </BottomSheetModal>
  );
};

export default RoastShareModal;
