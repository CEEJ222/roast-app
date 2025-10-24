import React, { useMemo, useState, useEffect } from 'react';

// Temperature conversion utility
function convertTemperature(tempF, targetUnit) {
  if (targetUnit === 'C') {
    return (tempF - 32) * 5/9;
  }
  return tempF; // Default to Fahrenheit
}

const MobileRoastCurveGraph = ({
  data = [],
  height = 300,
  units = { temperature: 'F', time: 'min' }
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 640;
      setIsMobile(newIsMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Process data for the chart using the same logic as the original component
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Find the maximum time across all roasts
    const maxTime = Math.max(...data.map(roast => {
      if (!roast.events || roast.events.length === 0) return 0;
      const tempEvents = roast.events.filter(event => 
        event.temp_f !== null && 
        event.temp_f !== undefined && 
        event.temp_f !== 0 && 
        event.kind === 'SET'
      );
      if (tempEvents.length === 0) return 0;
      return Math.max(...tempEvents.map(event => event.t_offset_sec / 60));
    }));

    if (maxTime === 0) return [];

    // Create time points every 0.5 minutes
    const timePoints = [];
    for (let i = 0; i <= maxTime; i += 0.5) {
      timePoints.push(i);
    }

    const rawData = timePoints.map((time, timeIndex) => {
      const dataPoint = { time };
      
      data.forEach((roast, index) => {
        const tempAtTimeF = getTemperatureAtTime(roast.events, time * 60);
        const tempAtTime = tempAtTimeF ? convertTemperature(tempAtTimeF, units.temperature) : null;
        dataPoint[`temp_${roast.id || index}`] = tempAtTime;
        
        // Calculate RoR for this roast at this time point
        if (timeIndex > 0) {
          const prevTime = timePoints[timeIndex - 1];
          const prevTempF = getTemperatureAtTime(roast.events, prevTime * 60);
          const prevTemp = prevTempF ? convertTemperature(prevTempF, units.temperature) : null;
          const timeDiff = time - prevTime;
          
          let ror = 0;
          if (tempAtTime && prevTemp && timeDiff > 0) {
            ror = (tempAtTime - prevTemp) / timeDiff;
            // Apply bounds based on temperature unit
            const maxRor = units.temperature === 'C' ? 44 : 80;
            const minRor = units.temperature === 'C' ? -11 : -20;
            ror = Math.max(minRor, Math.min(maxRor, ror));
          }
          
          dataPoint[`ror_${roast.id || index}`] = ror;
        } else {
          dataPoint[`ror_${roast.id || index}`] = 0;
        }
      });
      
      return dataPoint;
    });

    return rawData;
  }, [data, units]);

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#84cc16', '#f59e0b'
  ];

  console.log('MobileRoastCurveGraph data:', data);
  console.log('MobileRoastCurveGraph chartData:', chartData);

  return (
    <div className="w-full bg-black" style={{ height: height }}>
      <svg width="100%" height={height} style={{ background: 'black' }}>
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="3,3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Temperature lines */}
        {data.map((roast, index) => {
          if (!roast.events || roast.events.length === 0) return null;
          
          const points = roast.events
            .filter(event => event.temp_f && event.t_offset_sec !== undefined)
            .map(event => {
              const x = (event.t_offset_sec / 60) * 50; // Scale time to pixels
              const y = height - ((event.temp_f - 200) / 300) * height; // Scale temp to pixels
              return `${x},${y}`;
            })
            .join(' ');
            
          return (
            <polyline
              key={`temp_${roast.id}`}
              points={points}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth="2"
            />
          );
        })}
        
        {/* Rate of Rise lines */}
        {data.map((roast, index) => {
          if (!roast.events || roast.events.length === 0) return null;
          
          const points = roast.events
            .filter(event => event.rate_of_rise && event.t_offset_sec !== undefined)
            .map(event => {
              const x = (event.t_offset_sec / 60) * 50; // Scale time to pixels
              const y = height - ((event.rate_of_rise + 20) / 120) * height; // Scale RoR to pixels
              return `${x},${y}`;
            })
            .join(' ');
            
          return (
            <polyline
              key={`ror_${roast.id}`}
              points={points}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}
      </svg>
    </div>
  );
};

// Helper function to get temperature at a specific time
function getTemperatureAtTime(events, timeSeconds) {
  if (!events || events.length === 0) return null;
  
  // Filter to only SET events with temperature data
  const tempEvents = events.filter(event => 
    event.temp_f !== null && 
    event.temp_f !== undefined && 
    event.temp_f !== 0 && 
    event.t_offset_sec !== null && 
    event.t_offset_sec !== undefined &&
    event.kind === 'SET'
  );
  
  if (tempEvents.length === 0) return null;
  
  // Sort by time
  const sortedEvents = tempEvents.sort((a, b) => a.t_offset_sec - b.t_offset_sec);
  
  // Find the closest event to the target time
  let closestEvent = sortedEvents[0];
  let minDiff = Math.abs(sortedEvents[0].t_offset_sec - timeSeconds);
  
  for (const event of sortedEvents) {
    const diff = Math.abs(event.t_offset_sec - timeSeconds);
    if (diff < minDiff) {
      minDiff = diff;
      closestEvent = event;
    }
  }
  
  // If the closest event is within 30 seconds, use it
  if (minDiff <= 30) {
    return closestEvent.temp_f;
  }
  
  return null;
}

export default MobileRoastCurveGraph;
