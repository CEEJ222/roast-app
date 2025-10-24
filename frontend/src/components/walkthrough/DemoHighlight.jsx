import React from 'react';

const DemoHighlight = ({ children, isHighlighted = false, className = "" }) => {
  if (!isHighlighted) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-75 animate-pulse blur-sm"></div>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-50 animate-ping"></div>
      
      {/* Content with subtle glow */}
      <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-lg border-2 border-yellow-400 dark:border-yellow-300">
        {children}
      </div>
      
      {/* Demo indicator */}
      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
        DEMO
      </div>
    </div>
  );
};

export default DemoHighlight;
