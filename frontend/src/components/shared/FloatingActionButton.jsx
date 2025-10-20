import { useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const FloatingActionButton = ({ onClick, icon, label, className = '', position = 'bottom-right' }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    setIsPressed(true);
    await Haptics.impact({ style: ImpactStyle.Medium });
    onClick();
    setTimeout(() => setIsPressed(false), 150);
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
      className={`fixed w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform duration-150 hover:shadow-xl ${getPositionClasses()} ${
        isPressed ? 'scale-95' : 'scale-100'
      } ${className}`}
      aria-label={label}
    >
      {icon}
    </button>
  );
};

export default FloatingActionButton;
