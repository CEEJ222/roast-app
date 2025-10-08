import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Customized
} from 'recharts';

const RoastCurveGraph = ({
  data = [],
  mode = 'live', // 'live' or 'historical'
  showROR = false,
  showMilestones = true,
  height = 400,
  className = '',
  title = 'Roast Curve',
  units = { temperature: 'F', time: 'min' },
  // Historical mode specific options
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  enableZoom = false,
  enablePan = false,
  // Filtering and labeling options for historical mode
  selectedRoasts = [],
  onRoastToggle = null,
  showRoastLabels = true,
  // Styling options
  compact = false,
  interactive = true
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Filter roasts for historical mode (must be defined first)
  const filteredRoasts = useMemo(() => {
    if (mode !== 'historical') return data;
    
    if (selectedRoasts.length === 0) return data;
    
    return data.filter(roast => selectedRoasts.includes(roast.id));
  }, [data, mode, selectedRoasts]);

  // Extract milestone data for markers
  const milestones = useMemo(() => {
    if (!showMilestones || mode !== 'live') return [];
    
    return data
      .filter(event => ['DRY_END', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'END'].includes(event.kind))
      .map(event => ({
        time: event.t_offset_sec / 60, // Convert to minutes
        kind: event.kind,
        label: getMilestoneLabel(event.kind)
      }));
  }, [data, showMilestones, mode]);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let baseData;
    // For live mode, we expect a single roast's events
    // For historical mode, we expect multiple roasts
    if (mode === 'live') {
      baseData = processLiveData(data);
    } else {
      baseData = processHistoricalData(filteredRoasts);
    }
    
    return baseData;
  }, [data, mode, filteredRoasts, milestones]);

  // Calculate Rate of Rise (ROR) for live mode with proper smoothing
  const rorData = useMemo(() => {
    if (!showROR || mode !== 'live' || chartData.length < 2) return [];
    

    // First pass: calculate raw RoR values using time-weighted approach
    const rawRorData = chartData.map((point, index) => {
      if (index === 0) return { ...point, ror: 0 };
      
      // Use a time window for more stable RoR calculation (like professional roasters)
      // Adjust window based on data density - longer window for sparse data
      const dataDensity = chartData.length / Math.max(1, chartData[chartData.length - 1]?.time || 1);
      const timeWindow = dataDensity < 2 ? 1.0 : 0.5; // 1 minute for sparse data, 30 seconds for dense data
      const currentTime = point.time;
      const windowStart = Math.max(0, currentTime - timeWindow);
      
      // Find points within the time window
      const windowPoints = chartData.filter(p => p.time >= windowStart && p.time <= currentTime);
      
      if (windowPoints.length < 2) {
        // Fallback to simple calculation if not enough data
        const prevPoint = chartData[index - 1];
        const timeDiff = point.time - prevPoint.time;
        const tempDiff = point.temperature - prevPoint.temperature;
        const ror = timeDiff > 0 ? tempDiff / timeDiff : 0;
        return { ...point, ror };
      }
      
      // Calculate RoR using linear regression over the time window
      const n = windowPoints.length;
      const sumX = windowPoints.reduce((sum, p) => sum + p.time, 0);
      const sumY = windowPoints.reduce((sum, p) => sum + p.temperature, 0);
      const sumXY = windowPoints.reduce((sum, p) => sum + p.time * p.temperature, 0);
      const sumXX = windowPoints.reduce((sum, p) => sum + p.time * p.time, 0);
      
      // Linear regression slope (RoR)
      const ror = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      
      return {
        ...point,
        ror: isNaN(ror) || !isFinite(ror) ? 0 : ror
      };
    });

     // Second pass: apply aggressive smoothing and outlier detection
     return rawRorData.map((point, index) => {
       if (index === 0) return { ...point, ror: 0 };
       
       let smoothedRor = point.ror;
       
       // Apply exponential smoothing with larger window for more stable RoR
       const smoothingWindow = Math.min(5, index); // Use up to 5 previous points
       if (smoothingWindow > 0) {
         const windowStart = Math.max(0, index - smoothingWindow);
         const windowData = rawRorData.slice(windowStart, index + 1);
         const validRorValues = windowData
           .map(p => p.ror)
           .filter(ror => !isNaN(ror) && isFinite(ror));
         
         if (validRorValues.length > 0) {
           // Weighted average with more weight on recent values
           let weightedSum = 0;
           let totalWeight = 0;
           validRorValues.forEach((ror, i) => {
             const weight = (i + 1) / validRorValues.length; // Linear weight increase
             weightedSum += ror * weight;
             totalWeight += weight;
           });
           smoothedRor = weightedSum / totalWeight;
         }
       }
       
       // Apply exponential smoothing between consecutive points
       if (index > 0) {
         const prevSmoothedRor = index > 1 ? rawRorData[index - 1].ror : 0;
         const alpha = 0.3; // Smoothing factor (0.1 = very smooth, 0.9 = less smooth)
         smoothedRor = alpha * smoothedRor + (1 - alpha) * prevSmoothedRor;
       }
       
       // Aggressive outlier detection and correction
       if (index > 0) {
         const prevRor = index > 1 ? rawRorData[index - 1].ror : 0;
         const rorChange = Math.abs(smoothedRor - prevRor);
         
         // If RoR change is too dramatic (>20°F/min change), smooth it aggressively
         if (rorChange > 20) {
           smoothedRor = prevRor + (smoothedRor - prevRor) * 0.1; // Very gradual change
         }
         
         // Additional check for extreme spikes (>80°F/min)
         if (Math.abs(smoothedRor) > 80) {
           smoothedRor = Math.sign(smoothedRor) * 80; // Cap at ±80°F/min
         }
       }
       
       // Apply additional smoothing for very volatile data
       if (index > 2) {
         const recentPoints = rawRorData.slice(Math.max(0, index - 2), index + 1);
         const recentRorValues = recentPoints
           .map(p => p.ror)
           .filter(ror => !isNaN(ror) && isFinite(ror));
         
         if (recentRorValues.length > 1) {
           const medianRor = recentRorValues.sort((a, b) => a - b)[Math.floor(recentRorValues.length / 2)];
           // Blend with median to reduce extreme values
           smoothedRor = smoothedRor * 0.7 + medianRor * 0.3;
         }
       }
       
       // Final validation bounds
       smoothedRor = Math.max(-20, Math.min(80, smoothedRor));
       
       return {
         ...point,
         ror: smoothedRor
       };
     });
  }, [chartData, showROR, mode]);

  // Generate roast labels for historical mode
  const roastLabels = useMemo(() => {
    if (mode !== 'historical' || !showRoastLabels) return {};
    
    return filteredRoasts.reduce((labels, roast, index) => {
      const shortLabel = roast.name || `Roast ${index + 1}`;
      const fullLabel = roast.fullName || shortLabel;
      labels[roast.id || index] = { short: shortLabel, full: fullLabel };
      return labels;
    }, {});
  }, [filteredRoasts, mode, showRoastLabels]);

  return (
    <div className={`bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg dark:shadow-dark-glow border-metallic border-gray-200 dark:border-gray-600 ${compact ? 'p-4' : isMobile ? 'px-1 py-3' : 'p-6'} ${className}`}>
      <div className={`${compact ? 'mb-3' : 'mb-4'} ${isMobile ? 'pl-3' : ''}`}>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-800 dark:text-dark-text-primary`}>{title}</h3>
        {mode === 'historical' && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Compare multiple roast curves ({filteredRoasts.length} selected)
            </p>
            {onRoastToggle && (
              <div className="flex gap-2">
                <button
                  onClick={() => onRoastToggle('all')}
                  className="text-xs bg-gray-100 dark:bg-dark-bg-quaternary hover:bg-gray-200 dark:hover:bg-dark-border-primary px-2 py-1 rounded transition text-gray-700 dark:text-dark-text-primary"
                >
                  Select All
                </button>
                <button
                  onClick={() => onRoastToggle('none')}
                  className="text-xs bg-gray-100 dark:bg-dark-bg-quaternary hover:bg-gray-200 dark:hover:bg-dark-border-primary px-2 py-1 rounded transition text-gray-700 dark:text-dark-text-primary"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: height, position: 'relative', overflow: 'visible' }}>
        <ResponsiveContainer>
          <LineChart
            data={showROR && mode === 'live' ? rorData : chartData}
            margin={{ 
              top: 20, 
              right: isMobile ? 5 : 30, 
              left: isMobile ? -5 : 20, 
              bottom: isMobile ? 80 : 20 
            }}
            {...(enableZoom && { zoom: { enabled: true } })}
            {...(enablePan && { pan: { enabled: true } })}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-dark-border-primary" />}
            <XAxis 
              dataKey="time" 
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => isMobile ? `${value.toFixed(0)}m` : `${value.toFixed(1)}m`}
              stroke="#6b7280"
              className="dark:stroke-dark-text-tertiary"
              xAxisId="time"
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <YAxis 
              yAxisId="temp"
              orientation="left"
              tickFormatter={(value) => isMobile ? `${value}°` : `${value}°${units.temperature}`}
              stroke="#6b7280"
              className="dark:stroke-dark-text-tertiary"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              domain={[200, 500]}
            />
            {(showROR && mode === 'live') || mode === 'historical' ? (
              <YAxis 
                yAxisId="ror"
                orientation="right"
                tickFormatter={(value) => `${value.toFixed(1)}°/m`}
                stroke="#6b7280"
                className="dark:stroke-dark-text-tertiary"
                domain={[-20, 100]}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
            ) : null}
            {showTooltip && (
              <Tooltip
                content={<CustomTooltip data={data} />}
              />
            )}
            {showLegend && (
              <Legend 
                wrapperStyle={{
                  paddingTop: isMobile ? '10px' : '20px',
                  fontSize: isMobile ? '10px' : '12px'
                }}
                iconType="line"
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
              />
            )}

            {/* Temperature line(s) */}
            {mode === 'live' ? (
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={(props) => {
                  const { payload, cx, cy } = props;
                  
                  // Regular temperature dot
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#4f46e5"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2 }}
                name={`Temperature (°${units.temperature})`}
                isAnimationActive={false}
              />
            ) : (
              // Historical mode - multiple lines
              filteredRoasts.map((roast, index) => {
                const label = roastLabels[roast.id || index];
                const color = getRoastColor(index);
                return (
                  <React.Fragment key={roast.id || index}>
                    {/* Temperature line */}
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey={`temp_${roast.id || index}`}
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      name={label?.short || `Roast ${index + 1}`}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    {/* RoR line - same color but dotted and semi-transparent */}
                    <Line
                      yAxisId="ror"
                      type="monotone"
                      dataKey={`ror_${roast.id || index}`}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                      dot={false}
                      name={`${label?.short || `Roast ${index + 1}`} RoR`}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </React.Fragment>
                );
              })
            )}

            {/* Rate of Rise line (live mode only) */}
            {showROR && mode === 'live' && (
              <Line
                yAxisId="ror"
                type="monotone"
                dataKey="ror"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Rate of Rise (°/m)"
                isAnimationActive={false}
              />
            )}

            {/* Milestone markers as separate reference dots */}
            {mode === 'live' && milestones.map((milestone, index) => {
              // Find the temperature at the milestone time by interpolating from nearby points
              const milestoneTime = milestone.time;
              const tempAtMilestone = getTemperatureAtMilestoneTime(data, milestoneTime * 60);
              
              return (
                <ReferenceDot
                  key={`milestone-${index}`}
                  x={milestoneTime}
                  y={tempAtMilestone}
                  r={8}
                  fill={getMilestoneColor(milestone.kind)}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            })}


          </LineChart>
        </ResponsiveContainer>
        
      </div>


    </div>
  );
};

// Helper functions
function processLiveData(events) {
  // Filter temperature events and convert to chart format
  // Only include events that have actual temperature data (exclude milestone events without temps)
  const tempEvents = events.filter(event => {
    
    return event.temp_f !== null && 
           event.temp_f !== undefined && 
           event.temp_f !== 0 && // Exclude 0 degree readings
           event.t_offset_sec !== null && 
           event.t_offset_sec !== undefined &&
           event.kind === 'SET'; // Only include SET events which have temperature data
  });
  
  // Sort by time and remove duplicates
  const sortedEvents = tempEvents
    .map(event => ({
      time: event.t_offset_sec / 60, // Convert to minutes
      temperature: event.temp_f,
      timestamp: event.created_at,
      originalEvent: event
    }))
    .sort((a, b) => a.time - b.time);
  
  
  // Remove duplicate time points (keep the latest temperature reading for each time)
  const uniqueEvents = [];
  const timeMap = new Map();
  
  sortedEvents.forEach(event => {
    const timeKey = Math.round(event.time * 10) / 10; // Round to 0.1 minute precision
    if (!timeMap.has(timeKey) || event.timestamp > timeMap.get(timeKey).timestamp) {
      timeMap.set(timeKey, event);
    }
  });
  
  return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
}

function processHistoricalData(roasts) {
  // For historical mode, we need to process multiple roasts
  if (!roasts || roasts.length === 0) return [];
  
  // Find the maximum time across all roasts, but only consider events with temperature data
  const maxTime = Math.max(...roasts.map(roast => {
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
    
    roasts.forEach((roast, index) => {
      const tempAtTime = getTemperatureAtTime(roast.events, time * 60);
      dataPoint[`temp_${roast.id || index}`] = tempAtTime;
      
       // Calculate RoR for this roast at this time point
       if (timeIndex > 0) {
         const prevTime = timePoints[timeIndex - 1];
         const prevTemp = getTemperatureAtTime(roast.events, prevTime * 60);
         const timeDiff = time - prevTime;
         
         let ror = 0;
         if (tempAtTime && prevTemp && timeDiff > 0) {
           ror = (tempAtTime - prevTemp) / timeDiff;
           
           // Apply basic bounds
           ror = Math.max(-20, Math.min(80, ror));
         }
         
         dataPoint[`ror_${roast.id || index}`] = ror;
       } else {
         dataPoint[`ror_${roast.id || index}`] = 0;
       }
    });
    
    return dataPoint;
  });

  // Apply aggressive smoothing to RoR data for each roast
  const smoothedData = rawData.map((point, timeIndex) => {
    const smoothedPoint = { ...point };
    
    roasts.forEach((roast, index) => {
      const rorKey = `ror_${roast.id || index}`;
      let smoothedRor = point[rorKey];
      
      if (timeIndex > 0 && smoothedRor !== undefined) {
        // Apply exponential smoothing
        const prevRor = timeIndex > 1 ? rawData[timeIndex - 1][rorKey] || 0 : 0;
        const alpha = 0.4; // Smoothing factor
        smoothedRor = alpha * smoothedRor + (1 - alpha) * prevRor;
        
        // Apply moving average smoothing
        const smoothingWindow = Math.min(3, timeIndex);
        if (smoothingWindow > 0) {
          const windowStart = Math.max(0, timeIndex - smoothingWindow);
          const windowRorValues = rawData
            .slice(windowStart, timeIndex + 1)
            .map(p => p[rorKey])
            .filter(ror => ror !== undefined && !isNaN(ror));
          
          if (windowRorValues.length > 0) {
            const avgRor = windowRorValues.reduce((sum, ror) => sum + ror, 0) / windowRorValues.length;
            smoothedRor = smoothedRor * 0.6 + avgRor * 0.4; // Blend with average
          }
        }
        
        // Final bounds check
        smoothedRor = Math.max(-20, Math.min(80, smoothedRor));
      }
      
      smoothedPoint[rorKey] = smoothedRor;
    });
    
    return smoothedPoint;
  });

  return smoothedData;
}

function getTemperatureAtTime(events, timeInSeconds) {
  // Only use SET events with valid temperature data
  const tempEvents = events.filter(event => 
    event.temp_f !== null && 
    event.temp_f !== undefined && 
    event.temp_f !== 0 && 
    event.kind === 'SET'
  );
  
  if (tempEvents.length === 0) return null;
  
  // Find the closest temperature reading
  const closest = tempEvents.reduce((prev, curr) => 
    Math.abs(curr.t_offset_sec - timeInSeconds) < Math.abs(prev.t_offset_sec - timeInSeconds) ? curr : prev
  );
  
  return closest.temp_f;
}

function getTemperatureAtMilestoneTime(events, milestoneTimeInSeconds) {
  // Only use SET events with valid temperature data
  const tempEvents = events.filter(event => 
    event.temp_f !== null && 
    event.temp_f !== undefined && 
    event.temp_f !== 0 && 
    event.kind === 'SET'
  );
  
  if (tempEvents.length === 0) {
    return 0;
  }
  
  // Find the closest temperature reading to the milestone time
  const closest = tempEvents.reduce((prev, curr) => 
    Math.abs(curr.t_offset_sec - milestoneTimeInSeconds) < Math.abs(prev.t_offset_sec - milestoneTimeInSeconds) ? curr : prev
  );
  
  return closest.temp_f || 0;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, data }) => {
  if (active && payload && payload.length) {
    const timeMinutes = label;
    const timeSeconds = timeMinutes * 60;
    
    // Find milestone events at this time
    const milestoneEvents = data.filter(event => 
      ['DRY_END', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'END'].includes(event.kind) &&
      Math.abs(event.t_offset_sec - timeSeconds) < 30 // Within 30 seconds
    );
    
    
    return (
      <div className="bg-white dark:bg-dark-bg-tertiary p-3 border border-gray-300 dark:border-dark-border-primary rounded-lg shadow-lg dark:shadow-dark-lg">
        <p className="font-medium text-gray-900 dark:text-dark-text-primary">
          Time: {timeMinutes.toFixed(1)}m
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="dark:text-dark-text-secondary">
            {entry.name}: {entry.value?.toFixed(1)}{entry.unit || ''}
          </p>
        ))}
        {milestoneEvents.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-border-primary">
            <p className="font-medium text-gray-700 dark:text-dark-text-secondary">Milestones:</p>
            {milestoneEvents.map((event, index) => (
              <p key={index} className="text-sm" style={{ color: getMilestoneColor(event.kind) }}>
                {getMilestoneLabel(event.kind)} {event.temp_f ? `at ${event.temp_f}°F` : ''}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

function getMilestoneLabel(kind) {
  const labels = {
    'DRY_END': 'Dry End',
    'FIRST_CRACK': 'First Crack',
    'SECOND_CRACK': 'Second Crack',
    'COOL': 'Cool',
    'END': 'End Roast'
  };
  return labels[kind] || kind;
}

function getMilestoneEmoji(kind) {
  const emojis = {
    'DRY_END': '🌾',
    'FIRST_CRACK': '🔥',
    'SECOND_CRACK': '🔥🔥',
    'COOL': '🧊',
    'END': '🛑'
  };
  return emojis[kind] || '●';
}

function getMilestoneColor(kind) {
  const colors = {
    'DRY_END': '#eab308', // yellow
    'FIRST_CRACK': '#dc2626', // bright red
    'SECOND_CRACK': '#7c3aed', // purple
    'COOL': '#06b6d4', // cyan
    'END': '#059669' // emerald
  };
  return colors[kind] || '#6b7280';
}

function getRoastColor(index) {
  const colors = [
    '#4f46e5', // deep indigo
    '#7c3aed', // vibrant purple
    '#3b82f6', // blue
    '#10b981', // emerald
    '#ef4444', // red
    '#a855f7', // bright purple
    '#06b6d4', // cyan
    '#84cc16'  // lime
  ];
  return colors[index % colors.length];
}


export default RoastCurveGraph;
