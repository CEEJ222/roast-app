import { useState } from 'react';

const FloatingActionButton = ({ onClick, icon, label, className = '', position = 'bottom-right' }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = async () => {
    if (isProcessing) return; // Prevent multiple rapid clicks
    
    setIsProcessing(true);
    setIsPressed(true);
    
    // Try haptic feedback, but don't let it block the click
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (error) {
      // Haptics not available or failed, continue anyway
      console.log('Haptics not available:', error);
    }
    
    onClick();
    
    setTimeout(() => {
      setIsPressed(false);
      setIsProcessing(false);
    }, 300);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'top-center':
        return 'top-6 left-1/2 transform -translate-x-1/2';
      default:
        return 'bottom-6 right-6';
    }
  };

  return (
    <button
      onClick={handlePress}
      className={`fixed w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl z-40 ${getPositionClasses()} ${
        isPressed ? 'scale-95' : 'scale-100'
      } ${className}`}
      style={{ 
        touchAction: 'manipulation',
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(147, 51, 234, 0.3), 0 4px 15px rgba(0, 0, 0, 0.2)'
      }}
      aria-label={label}
    >
      {icon}
    </button>
  );
};

export default FloatingActionButton;
