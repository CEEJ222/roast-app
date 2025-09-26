// Comprehensive list of coffee-producing regions/countries
// Based on specialty coffee industry standards and major coffee-producing areas

export const COFFEE_REGIONS = [
  // Africa
  'Ethiopia',
  'Kenya', 
  'Rwanda',
  'Burundi',
  'Tanzania',
  'Uganda',
  'Zambia',
  'Malawi',
  'Zimbabwe',
  'Madagascar',
  'Côte d\'Ivoire',
  'Cameroon',
  'Angola',
  'Mozambique',
  
  // Central & South America
  'Colombia',
  'Brazil',
  'Peru',
  'Ecuador',
  'Bolivia',
  'Venezuela',
  'Guyana',
  'Suriname',
  'French Guiana',
  
  // Central America & Caribbean
  'Guatemala',
  'Costa Rica',
  'Honduras',
  'Nicaragua',
  'El Salvador',
  'Panama',
  'Mexico',
  'Jamaica',
  'Cuba',
  'Dominican Republic',
  'Haiti',
  'Puerto Rico',
  
  // Asia Pacific
  'Indonesia',
  'Vietnam',
  'India',
  'Papua New Guinea',
  'Philippines',
  'Thailand',
  'Myanmar',
  'Laos',
  'Cambodia',
  'Malaysia',
  'Sri Lanka',
  'Nepal',
  'China',
  'Japan',
  'Taiwan',
  'South Korea',
  'Australia',
  'New Zealand',
  'Hawaii',
  
  // Middle East
  'Yemen',
  'Saudi Arabia',
  'Oman',
  'United Arab Emirates',
  
  // Other
  'Other'
];

// Helper function to get regions by continent for better organization
export const COFFEE_REGIONS_BY_CONTINENT = {
  'Africa': [
    'Ethiopia', 'Kenya', 'Rwanda', 'Burundi', 'Tanzania', 'Uganda', 
    'Zambia', 'Malawi', 'Zimbabwe', 'Madagascar', 'Côte d\'Ivoire', 
    'Cameroon', 'Angola', 'Mozambique'
  ],
  'Central & South America': [
    'Colombia', 'Brazil', 'Peru', 'Ecuador', 'Bolivia', 'Venezuela', 
    'Guyana', 'Suriname', 'French Guiana'
  ],
  'Central America & Caribbean': [
    'Guatemala', 'Costa Rica', 'Honduras', 'Nicaragua', 'El Salvador', 
    'Panama', 'Mexico', 'Jamaica', 'Cuba', 'Dominican Republic', 
    'Haiti', 'Puerto Rico'
  ],
  'Asia Pacific': [
    'Indonesia', 'Vietnam', 'India', 'Papua New Guinea', 'Philippines', 
    'Thailand', 'Myanmar', 'Laos', 'Cambodia', 'Malaysia', 'Sri Lanka', 
    'Nepal', 'China', 'Japan', 'Taiwan', 'South Korea', 'Australia', 
    'New Zealand', 'Hawaii'
  ],
  'Middle East': [
    'Yemen', 'Saudi Arabia', 'Oman', 'United Arab Emirates'
  ],
  'Other': ['Other']
};

// Validation function
export const isValidCoffeeRegion = (region) => {
  return COFFEE_REGIONS.includes(region);
};
