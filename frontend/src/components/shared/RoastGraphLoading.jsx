import React, { useState, useEffect } from 'react';

const RoastGraphLoading = ({ height = 600 }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Ensure loading screen shows for at least 1 second
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="bg-transparent rounded-lg shadow-lg dark:shadow-dark-glow border-metallic border-gray-200 dark:border-gray-600 p-6">
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3"></div>
      </div>
      
      {/* Loading container with fire emoji animation */}
      <div 
        className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-orange-200 dark:border-gray-700 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ height: height - 100 }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-red-400 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-4 right-4 w-1 h-1 bg-orange-400 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        {/* Main loading content */}
        <div className="text-center z-10">
          {/* Fire emoji with animation */}
          <div className="text-6xl mb-4 animate-bounce">
            🔥
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Heating up your roast data...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Processing temperature curves and rate of rise
            </p>
          </div>
          
          {/* Animated progress bar */}
          <div className="mt-6 w-48 mx-auto">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Loading dots */}
          <div className="flex justify-center space-x-1 mt-4">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
        
        {/* Subtle roasting-themed text */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500 italic">
            "Good things come to those who wait... and roast"
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoastGraphLoading;
