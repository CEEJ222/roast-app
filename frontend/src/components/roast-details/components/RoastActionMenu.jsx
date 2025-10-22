import React from 'react';
import BottomSheetModal from '../../shared/BottomSheetModal';

const RoastActionMenu = ({ 
  isOpen, 
  onClose, 
  onCopyRoastData,
  onShare,
  onExport,
  onEdit,
  onDelete,
  onEditBeanProfile,
  roast
}) => {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Roast Actions"
    >
      <div className="space-y-4">
        <button
          onClick={() => {
            onCopyRoastData();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">📋</span>
          <div>
            <div className="font-semibold text-lg">Copy Roast Data</div>
            <div className="text-sm opacity-90">Copy roast summary to clipboard</div>
          </div>
        </button>
        
        <button
          onClick={() => {
            onShare();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">📤</span>
          <div>
            <div className="font-semibold text-lg">Share Roast</div>
            <div className="text-sm opacity-90">Share roast data with others</div>
          </div>
        </button>
        
        <button
          onClick={() => {
            onExport();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-4 rounded-lg hover:from-orange-700 hover:to-amber-700 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">📊</span>
          <div>
            <div className="font-semibold text-lg">Export to CSV</div>
            <div className="text-sm opacity-90">Download roast data as CSV file</div>
          </div>
        </button>
        
        {/* Edit Bean Profile - only show if roast has a bean profile */}
        {roast?.bean_profile_id && onEditBeanProfile && (
          <button
            onClick={() => {
              onEditBeanProfile();
              onClose();
            }}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-4 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-colors flex items-center gap-3 text-left"
          >
            <span className="text-2xl">☕</span>
            <div>
              <div className="font-semibold text-lg">Edit Bean Profile</div>
              <div className="text-sm opacity-90">Modify coffee bean details</div>
            </div>
          </button>
        )}
        
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">✏️</span>
          <div>
            <div className="font-semibold text-lg">Edit Roast</div>
            <div className="text-sm opacity-90">Modify roast details</div>
          </div>
        </button>
        
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">🗑️</span>
          <div>
            <div className="font-semibold text-lg">Delete Roast</div>
            <div className="text-sm opacity-90">Permanently remove this roast</div>
          </div>
        </button>
      </div>
    </BottomSheetModal>
  );
};

export default RoastActionMenu;
