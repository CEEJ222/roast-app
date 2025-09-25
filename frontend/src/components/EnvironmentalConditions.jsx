import React from 'react'

const EnvironmentalConditions = ({ conditions, units }) => {
  if (!conditions) return null
  
  // Debug logging
  console.log('EnvironmentalConditions received:', conditions)

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

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center mb-2">
        <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        <h3 className="text-xs font-semibold text-blue-800">Environmental</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-blue-700">Temp:</span>
          <span className="font-medium text-blue-800">{formatTemperature(conditions.temperature_c)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-700">Humidity:</span>
          <span className="font-medium text-blue-800">
            {conditions.humidity_pct && !isNaN(conditions.humidity_pct) ? `${Math.round(conditions.humidity_pct)}%` : 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-700">Elevation:</span>
          <span className="font-medium text-blue-800">{formatElevation(conditions.elevation_m)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-700">Pressure:</span>
          <span className="font-medium text-blue-800">{formatPressure(conditions.pressure_hpa)}</span>
        </div>
      </div>
    </div>
  )
}

export default EnvironmentalConditions
