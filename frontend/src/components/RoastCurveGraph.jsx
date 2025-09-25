import React, { useMemo } from 'react';
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
      .filter(event => ['FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'END'].includes(event.kind))
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

  // Calculate Rate of Rise (ROR) for live mode
  const rorData = useMemo(() => {
    if (!showROR || mode !== 'live' || chartData.length < 2) return [];

    return chartData.map((point, index) => {
      if (index === 0) return { ...point, ror: 0 };
      
      const prevPoint = chartData[index - 1];
      const timeDiff = (point.time - prevPoint.time) / 60; // Convert to minutes
      const tempDiff = point.temperature - prevPoint.temperature;
      
      return {
        ...point,
        ror: timeDiff > 0 ? tempDiff / timeDiff : 0
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
    <div className={`bg-white rounded-lg shadow-lg ${compact ? 'p-4' : 'p-6'} ${className}`}>
      <div className={`${compact ? 'mb-3' : 'mb-4'}`}>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-800`}>{title}</h3>
        {mode === 'live' && (
          <p className="text-sm text-gray-600">Real-time temperature monitoring</p>
        )}
        {mode === 'historical' && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Compare multiple roast curves ({filteredRoasts.length} selected)
            </p>
            {onRoastToggle && (
              <div className="flex gap-2">
                <button
                  onClick={() => onRoastToggle('all')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition"
                >
                  Select All
                </button>
                <button
                  onClick={() => onRoastToggle('none')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: height, position: 'relative' }}>
        <ResponsiveContainer>
          <LineChart
            data={showROR && mode === 'live' ? rorData : chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            {...(enableZoom && { zoom: { enabled: true } })}
            {...(enablePan && { pan: { enabled: true } })}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis 
              dataKey="time" 
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `${value.toFixed(1)}m`}
              stroke="#6b7280"
              xAxisId="time"
            />
            <YAxis 
              yAxisId="temp"
              orientation="left"
              tickFormatter={(value) => `${value}°${units.temperature}`}
              stroke="#6b7280"
            />
            {showROR && mode === 'live' && (
              <YAxis 
                yAxisId="ror"
                orientation="right"
                tickFormatter={(value) => `${value.toFixed(1)}°/m`}
                stroke="#6b7280"
              />
            )}
            {showTooltip && (
              <Tooltip
                content={<CustomTooltip data={data} />}
              />
            )}
            {showLegend && <Legend />}

            {/* Temperature line(s) */}
            {mode === 'live' ? (
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                stroke="#f97316"
                strokeWidth={3}
                dot={(props) => {
                  const { payload, cx, cy } = props;
                  
                  // Check if this is a milestone time
                  const milestone = milestones.find(m => 
                    Math.abs(m.time - payload.time) < 0.01 // Within 0.01 minutes
                  );
                  
                  
                  if (milestone) {
                    const color = getMilestoneColor(milestone.kind);
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill={color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }
                  
                  // Regular temperature dot
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#f97316"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
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


          </LineChart>
        </ResponsiveContainer>
        
      </div>

      {/* Milestone legend */}
      {milestones.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: getMilestoneColor(milestone.kind) }}
              />
              <span className="text-gray-600">{milestone.label}</span>
            </div>
          ))}
        </div>
      )}

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
  
  // Find the maximum time across all roasts
  const maxTime = Math.max(...roasts.map(roast => {
    if (!roast.events || roast.events.length === 0) return 0;
    return Math.max(...roast.events.map(event => event.t_offset_sec / 60));
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
      ['FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'END'].includes(event.kind) &&
      Math.abs(event.t_offset_sec - timeSeconds) < 30 // Within 30 seconds
    );
    
    
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">
          Time: {timeMinutes.toFixed(1)}m
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toFixed(1)}{entry.unit || ''}
          </p>
        ))}
        {milestoneEvents.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="font-medium text-gray-700">Milestones:</p>
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
    'FIRST_CRACK': 'First Crack',
    'SECOND_CRACK': 'Second Crack',
    'COOL': 'Drop/Cool',
    'END': 'End Roast'
  };
  return labels[kind] || kind;
}

function getMilestoneEmoji(kind) {
  const emojis = {
    'FIRST_CRACK': '🔥',
    'SECOND_CRACK': '🔥🔥',
    'COOL': '🧊',
    'END': '🛑'
  };
  return emojis[kind] || '●';
}

function getMilestoneColor(kind) {
  const colors = {
    'FIRST_CRACK': '#dc2626', // bright red
    'SECOND_CRACK': '#7c3aed', // purple
    'COOL': '#06b6d4', // cyan
    'END': '#059669' // emerald
  };
  return colors[kind] || '#6b7280';
}

function getRoastColor(index) {
  const colors = [
    '#f97316', // orange
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#84cc16'  // lime
  ];
  return colors[index % colors.length];
}

export default RoastCurveGraph;
