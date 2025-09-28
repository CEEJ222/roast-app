import React, { useState } from 'react'

const EnvironmentalConditions = ({ conditions, units, userProfile }) => {
  const [isMinimized, setIsMinimized] = useState(false)
  
  if (!conditions) return null

  const formatTemperature = (tempCelsius) => {
    if (!tempCelsius || isNaN(tempCelsius)) return 'N/A'
    if (units?.temperature === 'celsius') {
      return `${Math.round(tempCelsius)}°C`
    } else {
      const fahrenheit = (tempCelsius * 9/5) + 32
      return `${Math.round(fahrenheit)}°F`
    }
  }

  const formatElevation = (elevationMeters) => {
    if (!elevationMeters || isNaN(elevationMeters)) return 'N/A'
    if (units?.elevation === 'meters') {
      return `${Math.round(elevationMeters)}m`
    } else {
      const feet = elevationMeters * 3.28084
      return `${Math.round(feet)}ft`
    }
  }

  const formatPressure = (pressureHPa) => {
    if (!pressureHPa || isNaN(pressureHPa)) return 'N/A'
    // Convert hPa to inHg for US users, keep hPa for metric
    if (units?.temperature === 'fahrenheit') {
      const inHg = pressureHPa * 0.02953
      return `${inHg.toFixed(2)} inHg`
    } else {
      return `${Math.round(pressureHPa)} hPa`
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown'
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
      return 'Unknown'
    }
  }

  const getCityName = () => {
    if (!userProfile?.address) return 'Environmental'
    try {
      // Extract city name from address (assuming format like "City, State" or "City, Country")
      const addressParts = userProfile.address.split(',')
      return addressParts[0].trim() || 'Environmental'
    } catch {
      return 'Environmental'
    }
  }

  // Determine weather condition based on temperature and humidity
  const getWeatherCondition = () => {
    const temp = conditions.temperature_c
    const humidity = conditions.humidity_pct
    
    if (temp < 0) return 'snow'
    if (temp < 10 && humidity > 80) return 'fog'
    if (temp < 15 && humidity > 70) return 'cloudy'
    if (temp < 25 && humidity > 60) return 'partly-cloudy'
    if (temp >= 25 && humidity < 40) return 'sunny'
    return 'clear'
  }

  const weatherCondition = getWeatherCondition()

  // Weather-specific backgrounds and effects
  const getWeatherStyles = () => {
    switch (weatherCondition) {
      case 'sunny':
        return {
          background: 'linear-gradient(135deg, #e67e22 0%, #f39c12 25%, #f1c40f 50%, #f4d03f 75%, #f7dc6f 100%)',
          overlay: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          icon: '☀️',
          glow: 'rgba(230, 126, 34, 0.6)',
          textColor: 'text-white',
          labelColor: 'text-white'
        }
      case 'clear':
        return {
          background: 'linear-gradient(135deg, #2980b9 0%, #3498db 25%, #5dade2 50%, #85c1e9 75%, #aed6f1 100%)',
          overlay: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
          icon: '🌤️',
          glow: 'rgba(41, 128, 185, 0.6)',
          textColor: 'text-white',
          labelColor: 'text-white'
        }
      case 'partly-cloudy':
        return {
          background: 'linear-gradient(135deg, #5d6d7e 0%, #7f8c8d 25%, #a6acaf 50%, #bdc3c7 75%, #d5dbdb 100%)',
          overlay: 'radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
          icon: '⛅',
          glow: 'rgba(93, 109, 126, 0.6)',
          textColor: 'text-white',
          labelColor: 'text-white'
        }
      case 'cloudy':
        return {
          background: 'linear-gradient(135deg, #34495e 0%, #566573 25%, #7f8c8d 50%, #a6acaf 75%, #bdc3c7 100%)',
          overlay: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 80%)',
          icon: '☁️',
          glow: 'rgba(52, 73, 94, 0.6)',
          textColor: 'text-white',
          labelColor: 'text-white'
        }
      case 'fog':
        return {
          background: 'linear-gradient(135deg, #7f8c8d 0%, #a6acaf 25%, #bdc3c7 50%, #d5dbdb 75%, #e8f4f8 100%)',
          overlay: 'radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.4) 0%, transparent 90%)',
          icon: '🌫️',
          glow: 'rgba(127, 140, 141, 0.6)',
          textColor: 'text-gray-900',
          labelColor: 'text-gray-800'
        }
      case 'snow':
        return {
          background: 'linear-gradient(135deg, #aed6f1 0%, #d5dbdb 25%, #e8f4f8 50%, #f4f6f7 75%, #f8f9fa 100%)',
          overlay: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
          icon: '❄️',
          glow: 'rgba(174, 214, 241, 0.6)',
          textColor: 'text-gray-900',
          labelColor: 'text-gray-800'
        }
      default:
        return {
          background: 'linear-gradient(135deg, #2980b9 0%, #3498db 25%, #5dade2 50%, #85c1e9 75%, #aed6f1 100%)',
          overlay: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
          icon: '🌤️',
          glow: 'rgba(41, 128, 185, 0.6)',
          textColor: 'text-white',
          labelColor: 'text-white'
        }
    }
  }

  const weatherStyles = getWeatherStyles()

  return (
    <div 
      className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl"
      style={{
        background: weatherStyles.background,
        boxShadow: `0 8px 32px ${weatherStyles.glow}, 0 0 0 1px rgba(255, 255, 255, 0.1)`
      }}
    >
      {/* Photo-realistic overlay */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: weatherStyles.overlay
        }}
      />
      
      {/* Glassmorphism content */}
      <div className="relative z-10 p-2.5">
        {/* Header with weather icon and minimize button */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5">
            <div className="text-lg">{weatherStyles.icon}</div>
            <div>
              <h3 className={`text-xs font-semibold ${weatherStyles.labelColor}`}>{getCityName()}</h3>
              {conditions.as_of && !isMinimized && (
                <p className={`text-xs ${weatherStyles.labelColor}`}>
                  {formatTimestamp(conditions.as_of)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-1 rounded-full hover:bg-white/10 transition-colors ${weatherStyles.labelColor}`}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
        
        {isMinimized ? (
          /* Minimized version - just temperature and humidity */
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span className="text-sm">🌡️</span>
                <span className={`text-sm font-bold ${weatherStyles.textColor}`}>
                  {formatTemperature(conditions.temperature_c)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm">💧</span>
                <span className={`text-sm font-bold ${weatherStyles.textColor}`}>
                  {conditions.humidity_pct && !isNaN(conditions.humidity_pct) ? `${Math.round(conditions.humidity_pct)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Full version - all weather data */
          <div className="grid grid-cols-2 gap-1.5">
            {/* Temperature - Large display */}
            <div className="col-span-2 bg-black/20 backdrop-blur-sm rounded-lg p-1.5 border border-white/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold ${weatherStyles.labelColor} mb-0.5`}>Temperature</p>
                  <p className={`text-lg font-bold ${weatherStyles.textColor}`}>{formatTemperature(conditions.temperature_c)}</p>
                </div>
                <div className="text-xl">🌡️</div>
              </div>
            </div>
            
            {/* Humidity */}
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-1.5 border border-white/40">
              <div className="text-center">
                <div className="text-sm mb-0.5">💧</div>
                <p className={`text-xs font-semibold ${weatherStyles.labelColor} mb-0.5`}>Humidity</p>
                <p className={`text-xs font-bold ${weatherStyles.textColor}`}>
                  {conditions.humidity_pct && !isNaN(conditions.humidity_pct) ? `${Math.round(conditions.humidity_pct)}%` : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Elevation */}
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-1.5 border border-white/40">
              <div className="text-center">
                <div className="text-sm mb-0.5">⛰️</div>
                <p className={`text-xs font-semibold ${weatherStyles.labelColor} mb-0.5`}>Elevation</p>
                <p className={`text-xs font-bold ${weatherStyles.textColor}`}>{formatElevation(conditions.elevation_m)}</p>
              </div>
            </div>
            
            {/* Pressure */}
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-1.5 border border-white/40">
              <div className="text-center">
                <div className="text-sm mb-0.5">🌬️</div>
                <p className={`text-xs font-semibold ${weatherStyles.labelColor} mb-0.5`}>Pressure</p>
                <p className={`text-xs font-bold ${weatherStyles.textColor}`}>{formatPressure(conditions.pressure_hpa)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Subtle animation overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </div>
  )
}

export default EnvironmentalConditions
