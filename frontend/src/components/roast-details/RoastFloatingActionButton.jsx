import React from 'react';
import FloatingActionButton from '../shared/FloatingActionButton';

const RoastFloatingActionButton = ({ 
  isEditing, 
  onActionMenuOpen 
}) => {
  if (isEditing) return null;

  return (
    <FloatingActionButton
      onClick={onActionMenuOpen}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      label="Roast Actions"
    />
  );
};

export default RoastFloatingActionButton;
