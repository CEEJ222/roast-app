import React from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const RoastControls = ({ 
  formData, 
  handleInputChange, 
  logChange, 
  loading,
  machineSensorType = 'builtin',
  elapsedTime = 0
}) => {
  // Calculate calibrated temperature for built-in sensor
  const getCalibratedTemp = (rawTemp) => {
    if (machineSensorType !== 'builtin' || !rawTemp) return null;
    
    const elapsedSeconds = elapsedTime * 60;
    let offset = 8; // Default for 10+ min
    
    if (elapsedSeconds < 180) offset = 35;      // 0-3 min
    else if (elapsedSeconds < 300) offset = 25; // 3-5 min  
    else if (elapsedSeconds < 420) offset = 15; // 5-7 min
    else if (elapsedSeconds < 600) offset = 10; // 7-10 min
    
    return Math.round(rawTemp - offset);
  };

  const currentTemp = parseFloat(formData.tempF) || 0;
  const calibratedTemp = getCalibratedTemp(currentTemp);
  const sensorLabel = machineSensorType === 'probe' ? 'Bean Temperature' : 'Air Temperature';
  const sensorIcon = machineSensorType === 'probe' ? '🌡️' : '🌡️';

  return (
    <div className="w-full max-w-md lg:flex-1">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-bold text-white mb-6 text-center">Roaster Controls</h3>
        
        <div className="space-y-6">
          {/* Left Side - Fan & Heat Controls */}
          <div className="space-y-4">
            {/* Fan Control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-xs font-semibold tracking-wide text-gray-300">
                  FAN SPEED
                </div>
                <div className="text-sm font-bold text-white">
                  {formData.fan}
                </div>
              </div>
              
              <div className="relative h-4 rounded-full overflow-hidden cursor-pointer"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = e.clientX - rect.left;
                     const newValue = Math.round((x / rect.width) * 9);
                     handleInputChange('fan', Math.max(0, Math.min(9, newValue)));
                   }}>
                {/* Color spectrum background */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #8b5cf6, #a855f7, #c084fc, #ddd6fe, #10b981, #34d399, #6ee7b7, #a7f3d0)'
                  }}
                />
                
                {/* Overlay for inactive portion */}
                <div 
                  className="absolute inset-0 bg-gray-800/60 rounded-full transition-all duration-300"
                  style={{
                    clipPath: `polygon(${(formData.fan / 9) * 100}% 0%, 100% 0%, 100% 100%, ${(formData.fan / 9) * 100}% 100%)`
                  }}
                />
                
                {/* Active indicator */}
                <div 
                  className="absolute top-1/2 w-2 h-2 bg-white rounded-full border border-gray-900 transform -translate-y-1/2 transition-all duration-300 shadow-lg"
                  style={{
                    left: `calc(${(formData.fan / 9) * 100}% - 4px)`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>5</span>
                <span>9</span>
              </div>
            </div>

            {/* Heat Control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-xs font-semibold tracking-wide text-gray-300">
                  HEAT LEVEL
                </div>
                <div className="text-sm font-bold text-white">
                  {formData.heat}
                </div>
              </div>
              
              <div className="relative h-4 rounded-full overflow-hidden cursor-pointer"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = e.clientX - rect.left;
                     const newValue = Math.round((x / rect.width) * 9);
                     handleInputChange('heat', Math.max(0, Math.min(9, newValue)));
                   }}>
                {/* Color spectrum background */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #f97316, #fb923c, #fdba74, #fed7aa, #dc2626, #ef4444, #f87171, #fca5a5)'
                  }}
                />
                
                {/* Overlay for inactive portion */}
                <div 
                  className="absolute inset-0 bg-gray-800/60 rounded-full transition-all duration-300"
                  style={{
                    clipPath: `polygon(${(formData.heat / 9) * 100}% 0%, 100% 0%, 100% 100%, ${(formData.heat / 9) * 100}% 100%)`
                  }}
                />
                
                {/* Active indicator */}
                <div 
                  className="absolute top-1/2 w-2 h-2 bg-white rounded-full border border-gray-900 transform -translate-y-1/2 transition-all duration-300 shadow-lg"
                  style={{
                    left: `calc(${(formData.heat / 9) * 100}% - 4px)`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>5</span>
                <span>9</span>
              </div>
            </div>
          </div>

          {/* Temperature Input Section */}
          <div className="bg-gray-800 rounded-lg p-3 w-full border border-gray-600">
            <div className="text-sm font-semibold tracking-wide text-cyan-400 text-center mb-2">
              {sensorIcon} {sensorLabel.toUpperCase()}
            </div>
            
            {/* Sensor Type Indicator */}
            <div className="text-xs text-gray-400 text-center mb-3">
              {machineSensorType === 'builtin' 
                ? 'Built-in FreshRoast Sensor (reads higher than bean temp)'
                : 'External Temperature Probe (measures actual bean temp)'
              }
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => {
                  const currentValue = parseFloat(formData.tempF) || 0;
                  handleInputChange('tempF', (currentValue - 1).toString());
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold py-2 px-3 rounded transition-all duration-150"
              >
                −
              </button>
              
              <div className="flex-1 min-w-0">
                <input
                  type="number"
                  step="1"
                  value={formData.tempF}
                  onChange={(e) => handleInputChange('tempF', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      logChange();
                    }
                  }}
                  placeholder="°F"
                  className="w-full bg-gray-900 text-white text-lg font-bold text-center rounded px-3 py-2 border border-gray-600 focus:border-cyan-400 focus:outline-none"
                />
                
                {/* Calibrated Temperature Display for Built-in Sensor */}
                {machineSensorType === 'builtin' && currentTemp > 0 && calibratedTemp && (
                  <div className="text-xs text-gray-400 text-center mt-1">
                    Est. Bean Temp: {calibratedTemp}°F
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  const currentValue = parseFloat(formData.tempF) || 0;
                  handleInputChange('tempF', (currentValue + 1).toString());
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold py-2 px-3 rounded transition-all duration-150"
              >
                +
              </button>
            </div>
            
            <button
              onClick={async () => {
                // Add haptic feedback
                await Haptics.impact({ style: ImpactStyle.Medium });
                logChange();
              }}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 rounded-lg text-sm font-bold transition-all duration-150 disabled:opacity-50 touch-manipulation"
              style={{ minHeight: '44px' }} // iOS minimum touch target
            >
              LOG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoastControls;
