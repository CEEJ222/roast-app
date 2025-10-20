import { useState, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const BottomSheetModal = ({ isOpen, onClose, children, title, className = '' }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      Haptics.impact({ style: ImpactStyle.Light });
    }
  }, [isOpen]);

  const handleClose = async () => {
    setIsAnimating(false);
    await Haptics.impact({ style: ImpactStyle.Light });
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
      />
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary rounded-t-xl shadow-2xl transform transition-transform duration-300 ${className} ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{title}</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheetModal;
