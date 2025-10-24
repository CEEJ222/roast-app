/**
 * Walkthrough Data Generator
 * Creates realistic fake data to showcase app capabilities for new users
 */

// Coffee regions and types for realistic variety
const COFFEE_REGIONS = [
  'Ethiopia', 'Colombia', 'Guatemala', 'Costa Rica', 'Kenya', 
  'Brazil', 'Peru', 'Honduras', 'Rwanda', 'Tanzania', 'Panama'
];

const COFFEE_TYPES = [
  'Arabica', 'Bourbon', 'Catuai', 'Geisha', 'Typica', 'Caturra', 'Pacamara'
];

const PROCESSES = ['Washed', 'Natural', 'Honey', 'Semi-washed'];

const ROAST_LEVELS = ['Light', 'City', 'City+', 'Full City', 'Full City+', 'Vienna', 'French'];

// Generate realistic roast curve data
function generateRoastCurveData(roastId, duration = 12) {
  const events = [];
  const startTime = Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in last 30 days
  
  // Initial temperature
  let currentTemp = 200 + Math.random() * 50; // 200-250°F start
  let currentTime = 0;
  
  // Add initial SET event
  events.push({
    id: `${roastId}_event_0`,
    roast_id: roastId,
    kind: 'SET',
    t_offset_sec: 0,
    temp_f: currentTemp,
    fan_level: 8,
    heat_level: 4,
    note: 'Initial settings',
    created_at: new Date(startTime).toISOString()
  });
  
  // Generate temperature progression with realistic curve
  const timePoints = [];
  for (let i = 0; i <= duration * 60; i += 15) { // Every 15 seconds for smoother curves
    timePoints.push(i);
  }
  
  // Add milestone events at realistic times
  const dryEndTime = 2 + Math.random() * 2; // 2-4 minutes
  const firstCrackTime = 6 + Math.random() * 3; // 6-9 minutes
  const secondCrackTime = firstCrackTime + 1 + Math.random() * 2; // 1-3 minutes after first crack
  const coolTime = Math.min(duration - 1, secondCrackTime + 0.5 + Math.random() * 1); // Cool 1-2 minutes before end
  
  // Generate realistic temperature curve
  timePoints.forEach((time, index) => {
    const timeMinutes = time / 60;
    
    // Calculate temperature based on realistic roasting curve
    let targetTemp;
    if (timeMinutes < dryEndTime) {
      // Drying phase - steady rise from 200°F to ~300°F
      const progress = timeMinutes / dryEndTime;
      targetTemp = 200 + (progress * 100); // 200°F to 300°F
    } else if (timeMinutes < firstCrackTime) {
      // Maillard phase - slower rise from 300°F to ~380°F
      const progress = (timeMinutes - dryEndTime) / (firstCrackTime - dryEndTime);
      targetTemp = 300 + (progress * 80); // 300°F to 380°F
    } else if (timeMinutes < secondCrackTime) {
      // Development phase - controlled rise from 380°F to ~420°F
      const progress = (timeMinutes - firstCrackTime) / (secondCrackTime - firstCrackTime);
      targetTemp = 380 + (progress * 40); // 380°F to 420°F
    } else if (timeMinutes < coolTime) {
      // Cooling phase - temperature drops from 420°F to ~200°F
      const progress = (timeMinutes - secondCrackTime) / (coolTime - secondCrackTime);
      targetTemp = 420 - (progress * 220); // 420°F to 200°F
    } else {
      // After cooling - maintain low temperature
      targetTemp = 200;
    }
    
    // Add some realistic variation (±3°F)
    currentTemp = targetTemp + (Math.random() - 0.5) * 6;
    
    // Cap temperature at reasonable limits
    currentTemp = Math.max(180, Math.min(450, currentTemp));
    
    // Add temperature reading every 15 seconds for smoother curves
    events.push({
      id: `${roastId}_event_${index + 1}`,
      roast_id: roastId,
      kind: 'SET', // Use 'SET' kind as expected by the graph component
      t_offset_sec: time,
      temp_f: Math.round(currentTemp * 10) / 10,
      created_at: new Date(startTime + time * 1000).toISOString()
    });
    
    // Add milestone events
    if (Math.abs(timeMinutes - dryEndTime) < 0.1) {
      events.push({
        id: `${roastId}_milestone_dry`,
        roast_id: roastId,
        kind: 'DRY_END',
        t_offset_sec: time,
        temp_f: Math.round(currentTemp * 10) / 10,
        note: 'End of drying phase',
        created_at: new Date(startTime + time * 1000).toISOString()
      });
    }
    
    if (Math.abs(timeMinutes - firstCrackTime) < 0.1) {
      events.push({
        id: `${roastId}_milestone_fc`,
        roast_id: roastId,
        kind: 'FIRST_CRACK',
        t_offset_sec: time,
        temp_f: Math.round(currentTemp * 10) / 10,
        note: 'First crack',
        created_at: new Date(startTime + time * 1000).toISOString()
      });
    }
    
    if (Math.abs(timeMinutes - secondCrackTime) < 0.1) {
      events.push({
        id: `${roastId}_milestone_sc`,
        roast_id: roastId,
        kind: 'SECOND_CRACK',
        t_offset_sec: time,
        temp_f: Math.round(currentTemp * 10) / 10,
        note: 'Second crack',
        created_at: new Date(startTime + time * 1000).toISOString()
      });
    }
    
    if (Math.abs(timeMinutes - coolTime) < 0.1) {
      events.push({
        id: `${roastId}_milestone_cool`,
        roast_id: roastId,
        kind: 'COOL',
        t_offset_sec: time,
        temp_f: Math.round(currentTemp * 10) / 10,
        note: 'Cooling phase',
        created_at: new Date(startTime + time * 1000).toISOString()
      });
    }
  });
  
  // Add final END event
  events.push({
    id: `${roastId}_event_end`,
    roast_id: roastId,
    kind: 'END',
    t_offset_sec: duration * 60,
    note: 'Roast completed',
    created_at: new Date(startTime + duration * 60 * 1000).toISOString()
  });
  
  return events.sort((a, b) => a.t_offset_sec - b.t_offset_sec);
}

// Generate fake roast data
export function generateFakeRoasts(count = 7) {
  const roasts = [];
  
  for (let i = 0; i < count; i++) {
    const region = COFFEE_REGIONS[Math.floor(Math.random() * COFFEE_REGIONS.length)];
    const type = COFFEE_TYPES[Math.floor(Math.random() * COFFEE_TYPES.length)];
    const process = PROCESSES[Math.floor(Math.random() * PROCESSES.length)];
    const roastLevel = ROAST_LEVELS[Math.floor(Math.random() * ROAST_LEVELS.length)];
    
    const roastId = `walkthrough_roast_${i + 1}`;
    const created_at = new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString();
    
    const weightBefore = 200 + Math.random() * 100; // 200-300g
    const weightLoss = 12 + Math.random() * 8; // 12-20% loss
    const weightAfter = weightBefore * (1 - weightLoss / 100);
    
    const roast = {
      id: roastId,
      user_id: 'walkthrough_user',
      bean_profile_id: `walkthrough_bean_${i + 1}`,
      bean_profile_name: `${region} ${type}`,
      coffee_region: region,
      coffee_type: type,
      coffee_process: process,
      desired_roast_level: roastLevel,
      weight_before_g: Math.round(weightBefore),
      weight_after_g: Math.round(weightAfter),
      weight_loss_pct: Math.round(weightLoss * 10) / 10,
      created_at: created_at,
      updated_at: created_at,
      star_rating: Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 3 : null, // 3-5 stars or null
      temperature_c: 20 + Math.random() * 10, // 20-30°C
      temperature_f: 68 + Math.random() * 18, // 68-86°F
      humidity_pct: 40 + Math.random() * 30, // 40-70%
      elevation_m: 1000 + Math.random() * 2000, // 1000-3000m
      elevation_ft: Math.round((1000 + Math.random() * 2000) * 3.28084),
      pressure_hpa: 1013 + Math.random() * 20, // 1013-1033 hPa
      timezone: 'America/New_York',
      timezone_abbreviation: 'EST',
      // Add demo-specific fields
      is_demo: true,
      demo_highlight: i === 0, // First roast gets highlighted
      notes: `Demo roast notes: ${roastLevel} roast of ${region} ${type}. ${['Excellent development', 'Great first crack timing', 'Perfect color development', 'Smooth roast progression'][Math.floor(Math.random() * 4)]}.`,
      tasting_notes: {
        aroma: ['Chocolate', 'Caramel', 'Nutty'][Math.floor(Math.random() * 3)],
        flavor: ['Bright acidity', 'Sweet finish', 'Balanced body'][Math.floor(Math.random() * 3)],
        body: ['Medium', 'Full', 'Light'][Math.floor(Math.random() * 3)],
        aftertaste: ['Clean', 'Lingering', 'Sweet'][Math.floor(Math.random() * 3)]
      }
    };
    
    roasts.push(roast);
  }
  
  return roasts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Generate fake bean profiles
export function generateFakeBeanProfiles(count = 11) {
  const profiles = [];
  
  for (let i = 0; i < count; i++) {
    const region = COFFEE_REGIONS[Math.floor(Math.random() * COFFEE_REGIONS.length)];
    const type = COFFEE_TYPES[Math.floor(Math.random() * COFFEE_TYPES.length)];
    const process = PROCESSES[Math.floor(Math.random() * PROCESSES.length)];
    
    const profileId = `walkthrough_bean_${i + 1}`;
    const created_at = new Date(Date.now() - (Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString(); // Last 60 days
    
    const profile = {
      id: profileId,
      user_id: 'walkthrough_user',
      name: `${region} ${type}`,
      origin: region,
      variety: type,
      process: process,
      altitude: Math.floor(1000 + Math.random() * 2000), // 1000-3000m
      density: Math.round((0.7 + Math.random() * 0.3) * 100) / 100, // 0.7-1.0
      cupping_score: Math.round((80 + Math.random() * 15) * 10) / 10, // 80-95
      screen_size: `${Math.floor(14 + Math.random() * 6)}-${Math.floor(16 + Math.random() * 4)}`, // 14-20
      moisture_content: Math.round((8 + Math.random() * 4) * 10) / 10, // 8-12%
      harvest_year: new Date().getFullYear() - Math.floor(Math.random() * 2), // Current or last year
      notes: `Premium ${region} ${type} with ${process.toLowerCase()} processing. Notes from cupping: ${['bright acidity', 'chocolate notes', 'fruity undertones', 'smooth body', 'clean finish'][Math.floor(Math.random() * 5)]}.`,
      espresso_suitable: Math.random() > 0.4, // 60% chance
      created_at: created_at,
      updated_at: created_at,
      // Add demo-specific fields
      is_demo: true,
      demo_highlight: i === 0, // First bean profile gets highlighted
      flavor_notes: ['Chocolate', 'Caramel', 'Nutty', 'Fruity', 'Floral'][Math.floor(Math.random() * 5)],
      roasting_notes: `Demo roasting notes: ${['Great for light roasts', 'Excellent for espresso', 'Perfect for filter coffee', 'Versatile roast profile'][Math.floor(Math.random() * 4)]}.`,
      supplier_name: ['Sweet Maria\'s', 'Happy Mug', 'Blue Bottle', 'Counter Culture'][Math.floor(Math.random() * 4)]
    };
    
    profiles.push(profile);
  }
  
  return profiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Generate roast details (events) for all roasts
export function generateFakeRoastDetails(roasts) {
  const details = {};
  
  roasts.forEach(roast => {
    const events = generateRoastCurveData(roast.id);
    details[roast.id] = events;
    console.log(`🔥 Generated ${events.length} events for roast ${roast.id}`, events.slice(0, 5));
  });
  
  return details;
}

// Check if walkthrough mode is enabled
export function isWalkthroughMode() {
  const value = localStorage.getItem('walkthrough_mode');
  console.log('🔍 isWalkthroughMode check:', { value, result: value === 'true' });
  return value === 'true';
}

// Enable walkthrough mode
export function enableWalkthroughMode() {
  localStorage.setItem('walkthrough_mode', 'true');
}

// Disable walkthrough mode
export function disableWalkthroughMode() {
  console.log('🗑️ Removing walkthrough_mode from localStorage');
  localStorage.removeItem('walkthrough_mode');
  console.log('🗑️ After removal, walkthrough_mode is now:', localStorage.getItem('walkthrough_mode'));
}

// Reset onboarding (for testing)
export function resetOnboarding() {
  localStorage.removeItem('has_seen_onboarding');
  localStorage.removeItem('walkthrough_mode');
  console.log('🔄 Onboarding reset - refresh the page to see the onboarding prompt');
}

// Debug function to check current state
export function debugWalkthroughState() {
  console.log('🐛 Walkthrough Debug State:');
  console.log('  - walkthrough_mode:', localStorage.getItem('walkthrough_mode'));
  console.log('  - has_seen_onboarding:', localStorage.getItem('has_seen_onboarding'));
  console.log('  - isWalkthroughMode():', isWalkthroughMode());
  
  // Also log all localStorage keys that start with 'walkthrough' or 'onboarding'
  const allKeys = Object.keys(localStorage);
  const relevantKeys = allKeys.filter(key => 
    key.includes('walkthrough') || key.includes('onboarding')
  );
  console.log('  - Relevant localStorage keys:', relevantKeys);
  
  return {
    walkthroughMode: localStorage.getItem('walkthrough_mode'),
    hasSeenOnboarding: localStorage.getItem('has_seen_onboarding'),
    isWalkthroughMode: isWalkthroughMode(),
    relevantKeys
  };
}

// Make debug function available globally for easy testing
if (typeof window !== 'undefined') {
  window.debugWalkthrough = debugWalkthroughState;
  window.resetWalkthrough = resetOnboarding;
  window.enableWalkthrough = enableWalkthroughMode;
  window.disableWalkthrough = disableWalkthroughMode;
  window.clearOnboarding = () => {
    localStorage.removeItem('has_seen_onboarding');
    localStorage.removeItem('walkthrough_mode');
    console.log('🧹 Cleared onboarding state - refresh to see onboarding prompt');
  };
  window.clearAllDemoData = () => {
    localStorage.removeItem('has_seen_onboarding');
    localStorage.removeItem('walkthrough_mode');
    console.log('🧹 Cleared all demo data - refresh the page');
  };
}

// Test function to verify data generation
export function testDataGeneration() {
  const data = getWalkthroughData();
  console.log('🧪 Testing data generation:');
  console.log('Roasts:', data.roasts.length);
  console.log('Bean Profiles:', data.beanProfiles.length);
  console.log('Roast Details:', Object.keys(data.roastDetails).length);
  
  // Test first roast's events
  const firstRoastId = data.roasts[0].id;
  const firstRoastEvents = data.roastDetails[firstRoastId];
  console.log(`First roast (${firstRoastId}) events:`, firstRoastEvents.length);
  console.log('Sample events:', firstRoastEvents.slice(0, 5));
  
  return data;
}

// Get all walkthrough data
export function getWalkthroughData() {
  try {
    console.log('🎯 Generating walkthrough data...');
    const roasts = generateFakeRoasts(7);
    const beanProfiles = generateFakeBeanProfiles(11);
    const roastDetails = generateFakeRoastDetails(roasts);
    
    console.log('🎯 Generated walkthrough data:', {
      roasts: roasts.length,
      beanProfiles: beanProfiles.length,
      roastDetails: Object.keys(roastDetails).length
    });
    
    // Log first roast and bean profile for debugging
    if (roasts.length > 0) {
      console.log('🎯 First demo roast:', roasts[0]);
    }
    if (beanProfiles.length > 0) {
      console.log('🎯 First demo bean profile:', beanProfiles[0]);
    }
    
    return {
      roasts,
      beanProfiles,
      roastDetails
    };
  } catch (error) {
    console.error('❌ Error generating walkthrough data:', error);
    // Return empty data structure to prevent crashes
    return {
      roasts: [],
      beanProfiles: [],
      roastDetails: {}
    };
  }
}

// Mock API responses for walkthrough mode
export function getMockApiResponse(endpoint) {
  const data = getWalkthroughData();
  
  switch (endpoint) {
    case '/roasts?limit=100':
      return data.roasts;
    
    case '/bean-profiles':
      return data.beanProfiles;
    
    default:
      if (endpoint.startsWith('/roasts/') && endpoint.endsWith('/events')) {
        const roastId = endpoint.split('/')[2];
        return data.roastDetails[roastId] || [];
      }
      return [];
  }
}
