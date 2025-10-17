import React from 'react';

const RoastTimer = ({
  elapsedTime,
  formatTime,
  currentPhase,
  dryingTime,
  maillardTime,
  developmentTime,
  coolingTime,
  milestonesMarked,
  isPaused,
  pauseRoast,
  resumeRoast,
  loading
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 lg:gap-8">
      {/* Circular Chart and Timer */}
      <div className="text-center flex-shrink-0">
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 lg:w-80 lg:h-80">
          {/* Circular Progress Chart */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
            />
            
            {/* Simple solid color circle for current phase */}
            {elapsedTime > 0 && (
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={
                  currentPhase === 'drying' ? '#10b981' :
                  currentPhase === 'maillard' ? '#eab308' :
                  currentPhase === 'development' ? '#f59e0b' :
                  currentPhase === 'cooling' ? '#06b6d4' :
                  '#374151'
                }
                strokeWidth="8"
                style={{ transition: 'stroke 0.3s ease' }}
              />
            )}
          </svg>
          
          {/* Timer in center - Responsive sizing */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
              <div className="text-3xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-green-400 text-center" style={{
                fontFamily: '"Orbitron", "Seven Segment", "DS-Digital", monospace',
                letterSpacing: '0.1em',
                textShadow: '0 0 3px #22c55e',
                fontWeight: '900',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1'
              }}>
                {formatTime(elapsedTime)}
              </div>
              
              {/* Pause/Resume Button - Below timer inside chart - HIDDEN */}
              <button
                onClick={isPaused ? resumeRoast : pauseRoast}
                disabled={loading}
                className={`hidden p-2 sm:p-3 rounded-full border-2 transition-all duration-200 hover:scale-105 ${
                  isPaused 
                    ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'border-gray-400 text-gray-600 hover:border-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:border-gray-300 dark:hover:bg-gray-800/20'
                } ${loading ? 'opacity-50' : ''}`}
              >
                {isPaused ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Indicators - 2x2 grid on mobile, row on desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:flex md:flex-col pt-4 sm:pt-8">
        <div className={`flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition ${
          currentPhase === 'drying' 
            ? 'bg-indigo-100 dark:bg-dark-accent-primary/20 text-indigo-800 dark:text-dark-accent-primary' 
            : 'text-gray-500 dark:text-dark-text-tertiary'
        }`}>
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm sm:text-base truncate">Drying</span>
            <span className="text-xs sm:text-sm font-mono">
              {formatTime(dryingTime)}
            </span>
          </div>
        </div>
        
        <div className={`flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition ${
          currentPhase === 'maillard' 
            ? 'bg-indigo-100 dark:bg-dark-accent-primary/20 text-indigo-800 dark:text-dark-accent-primary' 
            : 'text-gray-500 dark:text-dark-text-tertiary'
        }`}>
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-500 flex-shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm sm:text-base truncate">Maillard</span>
            <span className="text-xs sm:text-sm font-mono">
              {milestonesMarked.dryEnd ? formatTime(maillardTime) : '—'}
            </span>
          </div>
        </div>
        
        <div className={`flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition ${
          currentPhase === 'development' 
            ? 'bg-indigo-100 dark:bg-dark-accent-primary/20 text-indigo-800 dark:text-dark-accent-primary' 
            : 'text-gray-500 dark:text-dark-text-tertiary'
        }`}>
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-500 flex-shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm sm:text-base truncate">Development</span>
            <span className="text-xs sm:text-sm font-mono">
              {milestonesMarked.firstCrack ? formatTime(developmentTime) : '—'}
            </span>
            {/* Development Time Ratio (DTR) tracker */}
            {milestonesMarked.firstCrack && developmentTime > 0 && elapsedTime > 0 && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                <div className="font-medium">
                  {Math.round((developmentTime / elapsedTime) * 100)}% DTR
                </div>
                <div className="text-xs opacity-75">
                  Target: 20-25%
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className={`flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition ${
          currentPhase === 'cooling' 
            ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400' 
            : 'text-gray-500 dark:text-dark-text-tertiary'
        }`}>
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-500 flex-shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm sm:text-base truncate">Cooling</span>
            <span className="text-xs sm:text-sm font-mono">
              {milestonesMarked.cool ? formatTime(coolingTime) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoastTimer;
