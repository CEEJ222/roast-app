import React, { useState } from 'react';
import DashboardHistoricalRoasts from './DashboardHistoricalRoasts';

const RecentRoasts = ({ 
  historicalRoasts, 
  selectedRoasts, 
  setSelectedRoasts, 
  roastDetails, 
  setRoastDetails, 
  onRoastResume, 
  roastId 
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
      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
            {showFullHistoricalRoasts ? 'All Roasts' : 'Recent Roasts'}
          </h3>
          {historicalRoasts?.length > 0 && (
            <button
              onClick={() => setShowFullHistoricalRoasts(!showFullHistoricalRoasts)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              {showFullHistoricalRoasts ? 'Show Recent Only →' : 'View All Roasts →'}
            </button>
          )}
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
          />
        </div>
      ) : (
        <div className="p-6">
          {!historicalRoasts || historicalRoasts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                ☕
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                No Roasts Yet
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                Start your first roast to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historicalRoasts.slice(0, 5).map((roast) => (
                <div 
                  key={roast.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary cursor-pointer"
                  onClick={() => onRoastResume(roast.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary">
                      <span className="text-amber-600 dark:text-dark-accent-warning text-lg">☕</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                        {roast.coffee_type}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                        {formatDate(roast.created_at)} • {roast.roaster_model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="px-2 py-1 bg-amber-100 dark:bg-dark-bg-tertiary text-amber-800 dark:text-dark-accent-warning rounded-full text-xs font-medium border dark:border-dark-border-primary">
                      {roast.desired_roast_level}
                    </span>
                    {roast.weight_loss_pct && (
                      <span className="text-gray-600 dark:text-dark-text-secondary">
                        {roast.weight_loss_pct.toFixed(1)}% loss
                      </span>
                    )}
                    {/* Click indicator for all screen sizes */}
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {(() => {
                        if (roast.id === roastId) {
                          return 'Currently Active →';
                        }
                        
                        const currentTime = new Date();
                        const roastTime = new Date(roast.created_at);
                        const timeDiff = (currentTime - roastTime) / (1000 * 60);
                        
                        if (timeDiff < 120 && !roast.weight_after_g) {
                          return 'Continue Roast →';
                        }
                        return (
                          <span title="View roast details">👁️</span>
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

