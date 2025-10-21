import React from 'react';
import RoastCurveGraph from '../../shared/RoastCurveGraph';

const RoastCurveSection = ({ 
  roast, 
  events, 
  userProfile 
}) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow">
      <div className="px-4 py-3 border-b dark:border-dark-border-primary">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
          Roast Curve
        </h3>
      </div>
      <div className="p-4">
        <RoastCurveGraph
          data={[{ id: roast?.id, name: roast?.bean_profile_name || 'Roast', events: events }]}
          mode="historical"
          showROR={true}
          showMilestones={true}
          height={300}
          title=""
          units={{ 
            temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', 
            time: 'min' 
          }}
          showLegend={true}
          showGrid={true}
          showTooltip={true}
          enableZoom={true}
          enablePan={true}
          compact={false}
          interactive={true}
          showRoastLabels={true}
        />
      </div>
    </div>
  );
};

export default RoastCurveSection;
