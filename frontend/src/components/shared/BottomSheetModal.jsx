import { useState, useEffect } from 'react';

const BottomSheetModal = ({ isOpen, onClose, children, title, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('BottomSheetModal useEffect - isOpen:', isOpen);
    if (isOpen) {
      console.log('BottomSheetModal - setting isVisible to true');
      setIsVisible(true);
    } else {
      console.log('BottomSheetModal - setting isVisible to false');
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
      />
      <div 
        className={`relative w-full bg-white dark:bg-dark-bg-secondary rounded-t-xl shadow-2xl transform transition-transform duration-300 ${className} ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          maxHeight: '70vh',
          minHeight: '200px',
          marginBottom: '80px'
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{title}</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 pb-20 overflow-y-auto bg-white dark:bg-dark-bg-secondary" style={{ minHeight: '150px' }}>
          {children || <div className="text-center text-gray-500 py-8">No content available</div>}
        </div>
      </div>
    </div>
  );
};

export default BottomSheetModal;
