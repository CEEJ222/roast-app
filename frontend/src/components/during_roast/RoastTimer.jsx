import React from 'react';

const RoastTimer = ({
  elapsedTime,
  formatTime,
  currentPhase,
  dryingTime,
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
            
            {/* Progress segments drawn sequentially */}
            {(() => {
              const circumference = 2 * Math.PI * 50;
              const radius = 50;
              const centerX = 60;
              const centerY = 60;
              
              // Calculate phase angles
              const dryingAngle = (dryingTime / elapsedTime) * 2 * Math.PI;
              const developmentAngle = (developmentTime / elapsedTime) * 2 * Math.PI;
              const coolingAngle = (coolingTime / elapsedTime) * 2 * Math.PI;
              
              // Helper function to create arc path
              const createArcPath = (startAngle, endAngle, radius) => {
                const start = {
                  x: centerX + radius * Math.cos(startAngle - Math.PI / 2),
                  y: centerY + radius * Math.sin(startAngle - Math.PI / 2)
                };
                const end = {
                  x: centerX + radius * Math.cos(endAngle - Math.PI / 2),
                  y: centerY + radius * Math.sin(endAngle - Math.PI / 2)
                };
                
                const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
                
                return [
                  `M ${start.x} ${start.y}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
                ].join(" ");
              };
              
              let currentAngle = 0;
              
              return (
                <>
                  {/* Drying phase (green) */}
                  {elapsedTime > 0 && dryingTime > 0 && (
                    <path
                      d={createArcPath(currentAngle, currentAngle + dryingAngle, radius)}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeLinecap="round"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  )}
                  
                  {/* Development phase (orange) */}
                  {elapsedTime > 0 && developmentTime > 0 && (
                    <path
                      d={createArcPath(
                        currentAngle + dryingAngle, 
                        currentAngle + dryingAngle + developmentAngle, 
                        radius
                      )}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeLinecap="round"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  )}
                  
                  {/* Cooling phase (blue) */}
                  {elapsedTime > 0 && coolingTime > 0 && (
                    <path
                      d={createArcPath(
                        currentAngle + dryingAngle + developmentAngle,
                        currentAngle + dryingAngle + developmentAngle + coolingAngle,
                        radius
                      )}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="8"
                      strokeLinecap="round"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  )}
                </>
              );
            })()}
          </svg>
          
          {/* Timer in center - Responsive sizing */}
          <div className="p-4 sm:p-6 w-32 h-20 sm:w-44 sm:h-28 lg:w-48 lg:h-32">
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
              
              {/* Pause/Resume Button - Below timer inside chart */}
              <button
                onClick={isPaused ? resumeRoast : pauseRoast}
                disabled={loading}
                className={`p-2 sm:p-3 rounded-full border-2 transition-all duration-200 hover:scale-105 ${
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

      {/* Phase Indicators - Responsive layout */}
      <div className="flex flex-row md:flex-col gap-2 sm:gap-4 md:gap-4 pt-4 sm:pt-8">
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
