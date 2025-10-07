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

  // Calculate Rate of Rise (ROR) for live mode with validation
  const rorData = useMemo(() => {
    if (!showROR || mode !== 'live' || chartData.length < 2) return [];

    return chartData.map((point, index) => {
      if (index === 0) return { ...point, ror: 0 };
      
      const prevPoint = chartData[index - 1];
      const timeDiff = point.time - prevPoint.time; // Time is already in minutes
      const tempDiff = point.temperature - prevPoint.temperature;
      
      let ror = 0;
      if (timeDiff > 0) {
        ror = tempDiff / timeDiff;
        
        // Validate ROR - coffee roasting typically ranges from -20 to 100 °F/min
        // If ROR is outside this range, it's likely due to sparse data or errors
        if (ror > 100 || ror < -20) {
          // Use a more reasonable default or smooth with previous values
          ror = Math.max(-20, Math.min(100, ror));
        }
      }
      
      return {
        ...point,
        ror: ror
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
        {mode === 'live' && (
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Real-time temperature monitoring</p>
        )}
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
            />
            {showROR && mode === 'live' && (
              <YAxis 
                yAxisId="ror"
                orientation="right"
                tickFormatter={(value) => `${value.toFixed(1)}°/m`}
                stroke="#6b7280"
                className="dark:stroke-dark-text-tertiary"
                domain={[-20, 100]}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
            )}
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
                return (
                  <Line
                    key={roast.id || index}
                    yAxisId="temp"
                    type="monotone"
                    dataKey={`temp_${roast.id || index}`}
                    stroke={getRoastColor(index)}
                    strokeWidth={2}
                    dot={false}
                    name={label?.short || `Roast ${index + 1}`}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
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
  const tempEvents = events.filter(event => event.temp_f !== null && event.temp_f !== undefined);
  
  return tempEvents.map(event => ({
    time: event.t_offset_sec / 60, // Convert to minutes
    temperature: event.temp_f,
    timestamp: event.created_at
  })).sort((a, b) => a.time - b.time);
}

function processHistoricalData(roasts) {
  // For historical mode, we need to process multiple roasts
  if (!roasts || roasts.length === 0) return [];
  
  // Find the maximum time across all roasts, but only consider events with temperature data
  const maxTime = Math.max(...roasts.map(roast => {
    if (!roast.events || roast.events.length === 0) return 0;
    const tempEvents = roast.events.filter(event => event.temp_f !== null && event.temp_f !== undefined);
    if (tempEvents.length === 0) return 0;
    return Math.max(...tempEvents.map(event => event.t_offset_sec / 60));
  }));

  if (maxTime === 0) return [];

  // Create time points every 0.5 minutes
  const timePoints = [];
  for (let i = 0; i <= maxTime; i += 0.5) {
    timePoints.push(i);
  }

  return timePoints.map(time => {
    const dataPoint = { time };
    
    roasts.forEach((roast, index) => {
      const tempAtTime = getTemperatureAtTime(roast.events, time * 60);
      dataPoint[`temp_${roast.id || index}`] = tempAtTime;
    });
    
    return dataPoint;
  });
}

function getTemperatureAtTime(events, timeInSeconds) {
  const tempEvents = events.filter(event => event.temp_f !== null && event.temp_f !== undefined);
  
  if (tempEvents.length === 0) return null;
  
  // Find the closest temperature reading
  const closest = tempEvents.reduce((prev, curr) => 
    Math.abs(curr.t_offset_sec - timeInSeconds) < Math.abs(prev.t_offset_sec - timeInSeconds) ? curr : prev
  );
  
  return closest.temp_f;
}

function getTemperatureAtMilestoneTime(events, milestoneTimeInSeconds) {
  const tempEvents = events.filter(event => event.temp_f !== null && event.temp_f !== undefined);
  
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
