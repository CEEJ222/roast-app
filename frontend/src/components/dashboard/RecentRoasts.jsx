import React, { useState } from 'react';
import DashboardHistoricalRoasts from './DashboardHistoricalRoasts';

const RecentRoasts = ({ 
  historicalRoasts, 
  selectedRoasts, 
  setSelectedRoasts, 
  roastDetails, 
  setRoastDetails, 
  onRoastResume, 
  roastId,
  onDataChange = null,
  setShowStartRoastWizard
}) => {
  const [showFullHistoricalRoasts, setShowFullHistoricalRoasts] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
            {showFullHistoricalRoasts ? 'All Roasts' : 'Recent Roasts'}
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowStartRoastWizard(true)}
              className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant text-white px-3 sm:px-4 py-2 rounded-lg hover:from-indigo-800 hover:via-purple-700 hover:to-purple-800 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              🏁 Start New Roast
            </button>
            {historicalRoasts?.length > 0 && (
              <button
                onClick={() => setShowFullHistoricalRoasts(!showFullHistoricalRoasts)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm sm:text-base whitespace-nowrap"
              >
                {showFullHistoricalRoasts ? 'Show Recent Only →' : 'View All Roasts →'}
              </button>
            )}
          </div>
        </div>
      </div>
      {showFullHistoricalRoasts ? (
        <div className="p-0">
          <DashboardHistoricalRoasts
            selectedRoasts={selectedRoasts}
            setSelectedRoasts={setSelectedRoasts}
            roastDetails={roastDetails}
            setRoastDetails={setRoastDetails}
            onRoastResume={onRoastResume}
            currentActiveRoastId={roastId}
            hideCompareButton={true}
            onDataChange={onDataChange}
          />
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          {!historicalRoasts || historicalRoasts.length === 0 ? (
            <div className="text-center py-8 sm:py-8 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">☕</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                No Roasts Yet
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">
                Start your first roast to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historicalRoasts.slice(0, 5).map((roast) => (
                <div 
                  key={roast.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary cursor-pointer"
                  onClick={() => onRoastResume(roast)}
                >
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary flex-shrink-0">
                      <span className="text-amber-600 dark:text-dark-accent-warning text-lg">☕</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-dark-text-primary text-sm sm:text-base break-words">
                        {roast.bean_profile_name || 
                         (roast.coffee_region && roast.coffee_type 
                          ? `${roast.coffee_region} ${roast.coffee_type}` 
                          : roast.coffee_type || roast.coffee_region || 'Unknown Coffee')
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-tertiary mt-1">
                        {formatDate(roast.created_at)} • {roast.machine_label || roast.roaster_model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 text-sm mt-2 sm:mt-0">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <span className="px-2 py-1 bg-amber-100 dark:bg-dark-bg-tertiary text-amber-800 dark:text-dark-accent-warning rounded-full text-xs font-medium border dark:border-dark-border-primary flex-shrink-0">
                        {roast.desired_roast_level}
                      </span>
                      {roast.weight_loss_pct && (
                        <span className="text-gray-600 dark:text-dark-text-secondary text-xs sm:text-sm flex-shrink-0">
                          {roast.weight_loss_pct.toFixed(1)}% loss
                        </span>
                      )}
                    </div>
                    {/* Click indicator for all screen sizes */}
                    <div className="text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      {(() => {
                        if (roast.id === roastId) {
                          return <span className="text-xs sm:text-sm">Currently Active →</span>;
                        }
                        
                        const currentTime = new Date();
                        const roastTime = new Date(roast.created_at);
                        const timeDiff = (currentTime - roastTime) / (1000 * 60);
                        
                        if (timeDiff < 120 && !roast.weight_after_g) {
                          return <span className="text-xs sm:text-sm">Continue Roast →</span>;
                        }
                        return (
                          <span title="View roast details" className="text-lg">👁️</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentRoasts;

