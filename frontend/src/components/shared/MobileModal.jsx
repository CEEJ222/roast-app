import React, { useState, useEffect } from 'react';

const MobileModal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children, 
  showCloseButton = true,
  onSave = null,
  hasUnsavedChanges = null,
  className = "",
  headerClassName = "",
  disableSwipeToClose = false
}) => {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchCurrentY, setTouchCurrentY] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Check if form has unsaved changes
  const checkUnsavedChanges = () => {
    if (hasUnsavedChanges && typeof hasUnsavedChanges === 'function') {
      return hasUnsavedChanges();
    }
    return false;
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (checkUnsavedChanges()) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // Handle touch events for swipe-to-close
  const handleTouchStart = (e) => {
    // Don't handle swipe if disabled
    if (disableSwipeToClose) return;
    
    // Check if we're at the top of the modal content
    const modalContent = e.currentTarget.querySelector('.modal-content');
    const isAtTop = !modalContent || modalContent.scrollTop <= 10;
    
    // Only allow swipe-to-close if we're at the top
    if (!isAtTop) {
      return; // Don't start swipe detection if not at top
    }
    
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || disableSwipeToClose) return;
    setTouchCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging || !touchStartY || !touchCurrentY || disableSwipeToClose) {
      setIsDragging(false);
      return;
    }

    const deltaY = touchCurrentY - touchStartY;
    const threshold = 100; // Minimum swipe distance

    // Double-check we're still at the top before allowing close
    const modalContent = e.currentTarget.querySelector('.modal-content');
    const isAtTop = !modalContent || modalContent.scrollTop <= 10;
    
    if (!isAtTop) {
      setIsDragging(false);
      setTouchStartY(null);
      setTouchCurrentY(null);
      return;
    }

    if (deltaY > threshold) {
      // Swipe down detected
      handleClose();
    }

    setIsDragging(false);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-4 sm:items-center sm:p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        overscrollBehavior: 'none',
        touchAction: 'none'
      }}
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className={`bg-white dark:bg-dark-card rounded-t-xl sm:rounded-xl shadow-2xl w-full h-[calc(100vh-1rem)] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col ${className}`}
        style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-gray-800 dark:bg-gray-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className={`bg-white dark:bg-dark-card px-4 sm:px-6 py-3 sm:py-4 text-gray-900 dark:text-dark-text-primary flex-shrink-0 ${headerClassName}`}>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
              {subtitle && (
                <p className="opacity-90 text-sm sm:text-base">{subtitle}</p>
              )}
            </div>
            {/* Desktop only close button */}
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="text-gray-900 dark:text-dark-text-primary hover:text-gray-600 dark:hover:text-gray-300 text-xl sm:text-2xl hidden sm:block"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div 
          className="modal-content p-4 sm:p-6 overflow-y-auto flex-1 min-h-0"
          style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}
        >
          {children}
        </div>

        {/* Footer - only show if onSave is provided */}
        {onSave && (
          <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {onSave}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
              Discard Changes?
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileModal;
