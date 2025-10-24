import React from 'react';
import { useWalkthrough } from '../../contexts/WalkthroughContext';

const WalkthroughBanner = () => {
  const { isWalkthrough, disableWalkthrough } = useWalkthrough();

  if (!isWalkthrough) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white shadow-lg">
      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Left side - Tour info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg">Tour Mode</h3>
                <p className="text-xs sm:text-sm opacity-90 truncate">
                  You're exploring the app with sample data
                </p>
              </div>
            </div>
            
            {/* Right side - End Tour button */}
            <div className="flex-shrink-0 ml-4">
              <button
                onClick={disableWalkthrough}
                className="bg-white bg-opacity-25 hover:bg-opacity-35 backdrop-blur-sm border border-white border-opacity-30 px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <span className="hidden sm:inline">End Tour</span>
                <span className="sm:hidden">End</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle bottom border for better separation */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white bg-opacity-20"></div>
    </div>
  );
};

export default WalkthroughBanner;
