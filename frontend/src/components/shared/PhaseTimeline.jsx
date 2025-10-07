import React from 'react';

const PhaseTimeline = ({
  elapsedTime = 0,
  currentPhase = 'drying',
  dryingTime = 0,
  maillardTime = 0,
  developmentTime = 0,
  coolingTime = 0,
  milestonesMarked = {},
  roastDuration = 15, // Expected roast time in minutes (default 15)
  height = 80,
  className = ''
}) => {
  // Dynamic timeline configuration - roastDuration already includes cooling buffer
  const MAX_TIMELINE_MINUTES = roastDuration; // roastDuration = roast time + 3 minutes cooling
  const TICK_INTERVAL = Math.max(1, Math.floor(MAX_TIMELINE_MINUTES / 15)); // Tick marks every minute or every 2 minutes for longer roasts
  
  // Calculate progressive timeline based on milestones and current time
  const getTimelineData = () => {
    const elapsedMinutes = elapsedTime / 60;
    
    
    // Create progressive timeline segments based on milestones and current phase
    const segments = [];
    
    // Build timeline progressively based on current phase and milestones
    let currentTime = 0;
    
    // Phase 1: Drying (always present)
    if (milestonesMarked.dryEnd) {
      // Drying phase is complete
      const dryingDuration = dryingTime / 60;
      segments.push({
        phase: 'drying',
        startTime: currentTime,
        endTime: currentTime + dryingDuration,
        duration: dryingDuration,
        color: '#10b981',
        label: 'Drying',
        completed: true
      });
      currentTime += dryingDuration;
    } else {
      // Still in drying phase - show current progress
      segments.push({
        phase: 'drying',
        startTime: currentTime,
        endTime: elapsedMinutes,
        duration: dryingTime / 60,
        color: '#10b981',
        label: 'Drying',
        completed: false
      });
      
      // Add planned phases for the rest of the timeline
      const dryingEndTime = elapsedMinutes; // Drying ends at current elapsed time
      const remainingTime = MAX_TIMELINE_MINUTES - dryingEndTime;
      if (remainingTime > 0) {
        segments.push({
          phase: 'planned',
          startTime: dryingEndTime,
          endTime: MAX_TIMELINE_MINUTES - 3, // Reserve last 3 minutes for cooling
          duration: remainingTime - 3,
          color: '#e5e7eb',
          label: 'Planned Roast',
          completed: false
        });
        
        segments.push({
          phase: 'cooling',
          startTime: MAX_TIMELINE_MINUTES - 3,
          endTime: MAX_TIMELINE_MINUTES,
          duration: 3,
          color: '#06b6d4',
          label: 'Cooling',
          completed: false
        });
      }
      
      return { segments, elapsedMinutes }; // Exit early if still in drying
    }
    
    // Phase 2: Maillard (only if dry end is marked)
    if (milestonesMarked.firstCrack) {
      // Maillard phase is complete
      const maillardDuration = maillardTime / 60;
      segments.push({
        phase: 'maillard',
        startTime: currentTime,
        endTime: currentTime + maillardDuration,
        duration: maillardDuration,
        color: '#eab308',
        label: 'Maillard',
        completed: true
      });
      currentTime += maillardDuration;
    } else {
      // Still in maillard phase - only show elapsed time, not planned duration
      const maillardDurationMinutes = maillardTime / 60;
      
      segments.push({
        phase: 'maillard',
        startTime: currentTime,
        endTime: elapsedMinutes, // End at current elapsed time, not projected future
        duration: maillardDurationMinutes,
        color: '#eab308',
        label: 'Maillard',
        completed: false
      });
      
      // Add planned phases for the rest of the timeline
      const remainingTime = MAX_TIMELINE_MINUTES - elapsedMinutes;
      if (remainingTime > 0) {
        segments.push({
          phase: 'planned',
          startTime: elapsedMinutes, // Start after current elapsed time
          endTime: MAX_TIMELINE_MINUTES - 3, // Reserve last 3 minutes for cooling
          duration: remainingTime - 3,
          color: '#e5e7eb',
          label: 'Planned Roast',
          completed: false
        });
        
        segments.push({
          phase: 'cooling',
          startTime: MAX_TIMELINE_MINUTES - 3,
          endTime: MAX_TIMELINE_MINUTES,
          duration: 3,
          color: '#06b6d4',
          label: 'Cooling',
          completed: false
        });
      }
      
      return { segments, elapsedMinutes }; // Exit early if still in maillard
    }
    
        // Phase 3: Development (only if first crack is marked)
        if (milestonesMarked.cool) {
          // Development phase is complete
          const developmentDuration = developmentTime / 60;
          segments.push({
            phase: 'development',
            startTime: currentTime,
            endTime: currentTime + developmentDuration,
            duration: developmentDuration,
            color: '#f59e0b',
            label: 'Development',
            completed: true
          });
          currentTime += developmentDuration;
          
          // Phase 4: Cooling (cool milestone reached)
          const coolingDuration = coolingTime / 60;
          segments.push({
            phase: 'cooling',
            startTime: currentTime,
            endTime: currentTime + coolingDuration,
            duration: coolingDuration,
            color: '#06b6d4',
            label: 'Cooling',
            completed: true
          });
        } else {
          // Still in development phase
          segments.push({
            phase: 'development',
            startTime: currentTime,
            endTime: elapsedMinutes,
            duration: developmentTime / 60,
            color: '#f59e0b',
            label: 'Development',
            completed: false
          });
          
          // Always add planned cooling phase (3 minutes) at the end
          const coolingStartTime = currentTime + (developmentTime / 60);
          segments.push({
            phase: 'cooling',
            startTime: coolingStartTime,
            endTime: coolingStartTime + 3, // Always 3 minutes
            duration: 3,
            color: '#06b6d4',
            label: 'Cooling',
            completed: false
          });
        }
    
    return { segments, elapsedMinutes };
  };
  
  const { segments, elapsedMinutes } = getTimelineData();
  
  return (
    <div className={`bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg dark:shadow-dark-glow border-metallic border-gray-200 dark:border-gray-600 p-4 ${className}`}>
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-dark-text-primary">Roast Phases Timeline</h4>
        <p className="text-xs text-gray-600 dark:text-dark-text-secondary">
          Expected roast time: {roastDuration - 3}min + 3min cooling = {roastDuration}min total
        </p>
      </div>
      
      <div style={{ width: '100%', height: height, position: 'relative' }}>
        <svg width="100%" height={height} className="overflow-visible">
          {/* Timeline background */}
          <rect 
            x="0" 
            y={height * 0.3} 
            width="100%" 
            height={height * 0.4} 
            fill="#f3f4f6" 
            className="dark:fill-dark-bg-quaternary"
          />
          
          {/* Phase segments */}
          {segments.map((segment, index) => {
            const startPercent = (segment.startTime / MAX_TIMELINE_MINUTES) * 100;
            const widthPercent = ((segment.endTime - segment.startTime) / MAX_TIMELINE_MINUTES) * 100;
            
            return (
              <rect
                key={segment.phase}
                x={`${startPercent}%`}
                y={height * 0.3}
                width={`${widthPercent}%`}
                height={height * 0.4}
                fill={segment.color}
                opacity={segment.completed ? 0.8 : 0.6}
              />
            );
          })}
          
          {/* Current time indicator */}
          {elapsedMinutes > 0 && elapsedMinutes <= MAX_TIMELINE_MINUTES && (
            <line
              x1={`${(elapsedMinutes / MAX_TIMELINE_MINUTES) * 100}%`}
              y1={height * 0.1}
              x2={`${(elapsedMinutes / MAX_TIMELINE_MINUTES) * 100}%`}
              y2={height * 0.9}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          
          {/* Time markers - dynamic interval based on roast duration */}
          {Array.from({ length: Math.floor(MAX_TIMELINE_MINUTES / TICK_INTERVAL) + 1 }, (_, i) => {
            const time = i * TICK_INTERVAL;
            const xPercent = (time / MAX_TIMELINE_MINUTES) * 100;
            
            return (
              <g key={time}>
                <line
                  x1={`${xPercent}%`}
                  y1={height * 0.7}
                  x2={`${xPercent}%`}
                  y2={height * 0.9}
                  stroke="#6b7280"
                  strokeWidth={1}
                  className="dark:stroke-dark-text-tertiary"
                />
                <text
                  x={`${xPercent}%`}
                  y={height * 0.95}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                  className="dark:fill-dark-text-tertiary"
                >
                  {time}m
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Phase legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {segments.map((segment, index) => {
          // Format duration as M:SS (e.g., "0:37", "1:23")
          const formatDuration = (durationMinutes) => {
            const totalSeconds = Math.round(durationMinutes * 60);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          };
          
          return (
            <div key={segment.phase} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color, opacity: segment.completed ? 1 : 0.7 }}
              />
              <span className="text-gray-600 dark:text-dark-text-secondary">
                {segment.label}: {formatDuration(segment.duration)} {!segment.completed && '(in progress)'}
                {segment.phase === 'cooling' && ' (planned cooling)'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseTimeline;