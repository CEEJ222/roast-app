import React, { useState, useEffect } from 'react';
import FloatingActionButton from '../../shared/FloatingActionButton';

const RoastFloatingActionButton = ({ 
  isEditing, 
  onActionMenuOpen 
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isEditing || !isMobile) return null;

  return (
    <FloatingActionButton
      onClick={onActionMenuOpen}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      label="Roast Actions"
      position="bottom-right"
      className="mb-20"
    />
  );
};

export default RoastFloatingActionButton;
