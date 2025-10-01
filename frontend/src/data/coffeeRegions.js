// Coffee regions data - now imported from shared data file
// This ensures both frontend and backend use the same source of truth

import coffeeRegionsData from '../../../shared/data/coffee_regions.json';

export const COFFEE_REGIONS = coffeeRegionsData.regions;
export const COFFEE_REGIONS_BY_CONTINENT = coffeeRegionsData.regions_by_continent;

// Validation function
export const isValidCoffeeRegion = (region) => {
  return COFFEE_REGIONS.includes(region);
};
