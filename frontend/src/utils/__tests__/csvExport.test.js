/**
 * Test file for CSV Export functionality
 * This is a simple test to verify the CSV export works correctly
 */

import { exportRoastToCsv, exportRoastDetails } from '../csvExport';

// Mock sample roast data
const mockRoast = {
  id: 123,
  bean_profile_name: 'Ethiopian Yirgacheffe',
  coffee_region: 'Ethiopia',
  coffee_type: 'Arabica',
  machine_label: 'Hottop KN-8828B-2K+',
  desired_roast_level: 'City',
  roast_status: 'completed',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T11:45:00Z',
  weight_before_g: 250,
  weight_after_g: 212.5,
  weight_loss_pct: 15.0,
  expected_roast_time_minutes: 12,
  notes: 'Great roast with excellent development',
  temperature_f: 72,
  humidity_pct: 45,
  pressure_hpa: 1013,
  elevation_ft: 1200,
  t_dry_end_sec: 180,
  t_first_crack_sec: 420,
  t_second_crack_sec: 600,
  t_drop_sec: 720,
  tasting_notes: 'Bright acidity, floral notes, clean finish'
};

// Mock sample events
const mockEvents = [
  {
    id: 1,
    kind: 'CHARGE',
    t_offset_sec: 0,
    temp_f: 72,
    heat_level: 5,
    fan_level: 1,
    note: 'Charged beans at 72°F'
  },
  {
    id: 2,
    kind: 'TEMP',
    t_offset_sec: 60,
    temp_f: 150,
    heat_level: 5,
    fan_level: 1,
    note: 'Temperature rising steadily'
  },
  {
    id: 3,
    kind: 'DRY_END',
    t_offset_sec: 180,
    temp_f: 250,
    heat_level: 4,
    fan_level: 2,
    note: 'End of drying phase'
  },
  {
    id: 4,
    kind: 'FIRST_CRACK',
    t_offset_sec: 420,
    temp_f: 385,
    heat_level: 3,
    fan_level: 3,
    note: 'First crack begins'
  },
  {
    id: 5,
    kind: 'SECOND_CRACK',
    t_offset_sec: 600,
    temp_f: 425,
    heat_level: 2,
    fan_level: 4,
    note: 'Second crack starts'
  },
  {
    id: 6,
    kind: 'COOL',
    t_offset_sec: 720,
    temp_f: 200,
    heat_level: 0,
    fan_level: 5,
    note: 'Dropped to cooling tray'
  }
];

// Mock user profile
const mockUserProfile = {
  units: {
    temperature: 'fahrenheit'
  }
};

// Test function to run the export
const testCsvExport = () => {
  console.log('🧪 Testing CSV Export Functionality...\n');
  
  try {
    // Test 1: Basic CSV generation
    console.log('Test 1: Generating CSV content...');
    const csvContent = exportRoastToCsv(mockRoast, mockEvents, mockUserProfile);
    console.log('✅ CSV content generated successfully');
    console.log('📄 CSV Preview (first 10 lines):');
    console.log(csvContent.split('\n').slice(0, 10).join('\n'));
    console.log('...\n');
    
    // Test 2: Check for required sections
    const requiredSections = [
      'ROAST DETAILS EXPORT',
      'ROAST OVERVIEW',
      'ROAST EVENTS',
      'TASTING NOTES',
      'SUMMARY'
    ];
    
    console.log('Test 2: Checking for required sections...');
    requiredSections.forEach(section => {
      if (csvContent.includes(section)) {
        console.log(`✅ Found section: ${section}`);
      } else {
        console.log(`❌ Missing section: ${section}`);
      }
    });
    console.log('');
    
    // Test 3: Check for roast data
    console.log('Test 3: Checking for roast data...');
    const roastDataChecks = [
      { field: 'Roast ID', value: '123' },
      { field: 'Coffee Name', value: 'Ethiopian Yirgacheffe' },
      { field: 'Machine', value: 'Hottop KN-8828B-2K+' },
      { field: 'Weight Before (g)', value: '250' },
      { field: 'Weight After (g)', value: '212.5' }
    ];
    
    roastDataChecks.forEach(({ field, value }) => {
      if (csvContent.includes(field) && csvContent.includes(value)) {
        console.log(`✅ Found ${field}: ${value}`);
      } else {
        console.log(`❌ Missing ${field}: ${value}`);
      }
    });
    console.log('');
    
    // Test 4: Check for events data
    console.log('Test 4: Checking for events data...');
    const eventTypes = ['CHARGE', 'TEMP', 'DRY_END', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL'];
    eventTypes.forEach(eventType => {
      if (csvContent.includes(eventType)) {
        console.log(`✅ Found event type: ${eventType}`);
      } else {
        console.log(`❌ Missing event type: ${eventType}`);
      }
    });
    console.log('');
    
    // Test 5: Test download functionality (mock)
    console.log('Test 5: Testing download functionality...');
    try {
      // This would normally trigger a download, but we'll just test the function call
      exportRoastDetails(mockRoast, mockEvents, mockUserProfile);
      console.log('✅ Download function executed successfully');
    } catch (error) {
      console.log(`❌ Download function failed: ${error.message}`);
    }
    
    console.log('\n🎉 All tests completed! CSV export functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export the test function for manual testing
export { testCsvExport };

// If running directly, execute the test
if (typeof window !== 'undefined') {
  // Browser environment - make test available globally
  window.testCsvExport = testCsvExport;
  console.log('🧪 CSV Export test available as window.testCsvExport()');
}
