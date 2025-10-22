/**
 * CSV Export Utility for Roast Data
 * Handles exporting roast details and events to CSV format
 */

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
const escapeCsvField = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Formats a date for CSV export
 */
const formatDateForCsv = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Formats duration in seconds to MM:SS format
 */
const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats time offset in seconds to MM:SS format
 */
const formatTimeOffset = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Exports roast data to CSV format
 */
export const exportRoastToCsv = (roast, events = [], userProfile = null) => {
  if (!roast) {
    throw new Error('Roast data is required for export');
  }

  const csvLines = [];
  
  // Add header information
  csvLines.push('ROAST DETAILS EXPORT');
  csvLines.push(`Generated: ${formatDateForCsv(new Date().toISOString())}`);
  csvLines.push(`Coffee: ${roast.bean_profile_name || roast.coffee_type || 'Unknown Coffee'}`);
  csvLines.push(`Date: ${formatDateForCsv(roast.created_at)}`);
  csvLines.push(''); // Empty line
  
  // Roast Overview Section
  csvLines.push('ROAST OVERVIEW');
  csvLines.push('Field,Value');
  
  const roastFields = [
    ['Roast ID', roast.id],
    ['Coffee Name', roast.bean_profile_name || roast.coffee_type || 'Unknown'],
    ['Coffee Region', roast.coffee_region || 'N/A'],
    ['Coffee Type', roast.coffee_type || 'N/A'],
    ['Machine', roast.machine_label || 'Unknown'],
    ['Desired Roast Level', roast.desired_roast_level || 'N/A'],
    ['Roast Status', roast.roast_status || 'N/A'],
    ['Created At', formatDateForCsv(roast.created_at)],
    ['Updated At', formatDateForCsv(roast.updated_at)],
    ['Weight Before (g)', roast.weight_before_g || 'N/A'],
    ['Weight After (g)', roast.weight_after_g || 'N/A'],
    ['Weight Loss %', roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'],
    ['Expected Roast Time (min)', roast.expected_roast_time_minutes || 'N/A'],
    ['Notes', roast.notes || 'N/A']
  ];

  // Add environmental conditions if available
  if (roast.temperature_f || roast.temperature_c) {
    roastFields.push(['Ambient Temperature', roast.temperature_f ? `${roast.temperature_f}°F` : roast.temperature_c ? `${roast.temperature_c}°C` : 'N/A']);
  }
  if (roast.humidity_pct) {
    roastFields.push(['Humidity', `${roast.humidity_pct}%`]);
  }
  if (roast.pressure_hpa) {
    roastFields.push(['Pressure', `${roast.pressure_hpa} hPa`]);
  }
  if (roast.elevation_ft || roast.elevation_m) {
    roastFields.push(['Elevation', roast.elevation_ft ? `${roast.elevation_ft} ft` : roast.elevation_m ? `${roast.elevation_m} m` : 'N/A']);
  }

  // Add milestone times if available
  if (roast.t_dry_end_sec) {
    roastFields.push(['Dry End Time', formatTimeOffset(roast.t_dry_end_sec)]);
  }
  if (roast.t_first_crack_sec) {
    roastFields.push(['First Crack Time', formatTimeOffset(roast.t_first_crack_sec)]);
  }
  if (roast.t_second_crack_sec) {
    roastFields.push(['Second Crack Time', formatTimeOffset(roast.t_second_crack_sec)]);
  }
  if (roast.t_drop_sec) {
    roastFields.push(['Drop Time', formatTimeOffset(roast.t_drop_sec)]);
  }

  // Add roast fields to CSV
  roastFields.forEach(([field, value]) => {
    csvLines.push(`${escapeCsvField(field)},${escapeCsvField(value)}`);
  });

  csvLines.push(''); // Empty line

  // Roast Events Section
  if (events && events.length > 0) {
    csvLines.push('ROAST EVENTS');
    csvLines.push('Time,Event Type,Temperature (°F),Heat Level,Fan Level,Notes');
    
    // Sort events by time offset
    const sortedEvents = [...events].sort((a, b) => (a.t_offset_sec || 0) - (b.t_offset_sec || 0));
    
    sortedEvents.forEach(event => {
      const time = formatTimeOffset(event.t_offset_sec);
      const eventType = event.kind || 'N/A';
      const temperature = event.temp_f || 'N/A';
      const heatLevel = event.heat_level || 'N/A';
      const fanLevel = event.fan_level || 'N/A';
      const notes = event.note || '';
      
      csvLines.push(`${escapeCsvField(time)},${escapeCsvField(eventType)},${escapeCsvField(temperature)},${escapeCsvField(heatLevel)},${escapeCsvField(fanLevel)},${escapeCsvField(notes)}`);
    });
  } else {
    csvLines.push('ROAST EVENTS');
    csvLines.push('No events recorded for this roast');
  }

  csvLines.push(''); // Empty line

  // Tasting Notes Section (if available)
  if (roast.tasting_notes) {
    csvLines.push('TASTING NOTES');
    csvLines.push('Notes');
    csvLines.push(`${escapeCsvField(roast.tasting_notes)}`);
    csvLines.push('');
  }

  // Summary Section
  csvLines.push('SUMMARY');
  csvLines.push('Metric,Value');
  
  const totalDuration = events && events.length > 0 
    ? Math.max(...events.map(e => e.t_offset_sec || 0))
    : null;
  
  if (totalDuration) {
    csvLines.push(['Total Duration', formatTimeOffset(totalDuration)]);
  }
  
  if (roast.weight_before_g && roast.weight_after_g) {
    const weightLoss = ((roast.weight_before_g - roast.weight_after_g) / roast.weight_before_g) * 100;
    csvLines.push(['Calculated Weight Loss %', `${weightLoss.toFixed(1)}%`]);
  }

  // Count events by type
  if (events && events.length > 0) {
    const eventCounts = events.reduce((acc, event) => {
      const type = event.kind || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(eventCounts).forEach(([type, count]) => {
      csvLines.push([`${type} Events`, count]);
    });
  }

  return csvLines.join('\n');
};

/**
 * Downloads CSV content as a file
 */
export const downloadCsv = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Main export function that combines roast data and downloads CSV
 */
export const exportRoastDetails = (roast, events = [], userProfile = null) => {
  try {
    const csvContent = exportRoastToCsv(roast, events, userProfile);
    
    // Generate filename with roast info and timestamp
    const roastName = roast.bean_profile_name || roast.coffee_type || 'Unknown';
    const date = new Date(roast.created_at);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `roast-${roastName.replace(/[^a-zA-Z0-9]/g, '-')}-${dateStr}.csv`;
    
    downloadCsv(csvContent, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting roast to CSV:', error);
    throw error;
  }
};

