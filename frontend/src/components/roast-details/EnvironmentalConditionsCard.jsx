import React from 'react';
import EnvironmentalConditions from '../shared/EnvironmentalConditions';

const EnvironmentalConditionsCard = ({ 
  roast, 
  userProfile 
}) => {
  if (!roast.temperature_c && !roast.temperature_f && !roast.humidity_pct) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Environmental Conditions
      </h3>
      <EnvironmentalConditions 
        conditions={{
          temperature_c: roast.temperature_c,
          temperature_f: roast.temperature_f,
          humidity_pct: roast.humidity_pct,
          elevation_m: roast.elevation_m,
          elevation_ft: roast.elevation_ft,
          pressure_hpa: roast.pressure_hpa,
          as_of: roast.as_of,
          timezone: roast.timezone,
          timezone_abbreviation: roast.timezone_abbreviation
        }}
        units={userProfile?.units}
        userProfile={userProfile}
      />
    </div>
  );
};

export default EnvironmentalConditionsCard;
