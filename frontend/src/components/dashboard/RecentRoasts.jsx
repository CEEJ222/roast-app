import React, { useState, useEffect } from 'react';
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
  setShowStartRoastWizard,
  setShowHistoricalRoasts
}) => {
  const [showFullHistoricalRoasts, setShowFullHistoricalRoasts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (roast) => {
    // Try to get duration from roast events if available
    if (roastDetails[roast.id] && roastDetails[roast.id].length > 0) {
      const events = roastDetails[roast.id];
      // Use COOL event as the end of roasting (not END event)
      const coolEvent = events.find(e => e.kind === 'COOL');
      if (coolEvent) {
        const duration = coolEvent.t_offset_sec;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Fallback to END event if no COOL event exists
      const endEvent = events.find(e => e.kind === 'END');
      if (endEvent) {
        const duration = endEvent.t_offset_sec;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    // Fallback to created_at vs updated_at if no events
    if (roast.created_at && roast.updated_at) {
      const duration = Math.floor((new Date(roast.updated_at) - new Date(roast.created_at)) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return 'N/A';
  };

  return (
    <div className="bg-transparent">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary flex items-center">
            {isMobile ? 'All Roasts' : (showFullHistoricalRoasts ? 'All Roasts' : 'Recent Roasts')}
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              {historicalRoasts?.length || 0}
            </span>
          </h3>
          {!isMobile && !showFullHistoricalRoasts && (
            <button
              onClick={() => setShowHistoricalRoasts(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Compare Roasts →
            </button>
          )}
        </div>
      </div>
      {showFullHistoricalRoasts && !isMobile ? (
        <div className="p-0">
          <div className="mb-4">
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => setShowFullHistoricalRoasts(false)}
                className="mr-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
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
              <div className="text-4xl sm:text-6xl mb-4">🔥</div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
                No Roasts Yet
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">
                Start your first roast to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
              {(isMobile && showFullHistoricalRoasts ? historicalRoasts : historicalRoasts.slice(0, 5)).map((roast) => (
                <div 
                  key={roast.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary cursor-pointer"
                  onClick={() => onRoastResume(roast)}
                >
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary flex-shrink-0">
                      <span className="text-amber-600 dark:text-dark-accent-warning text-lg">🔥</span>
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
                        {formatDate(roast.created_at)} • {formatDuration(roast)}
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
                    <div className="flex items-center space-x-2">
                      {/* Star Rating Display */}
                      {roast.star_rating && roast.star_rating > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= roast.star_rating
                                    ? 'text-yellow-400'
                                    : star <= Math.ceil(roast.star_rating) && roast.star_rating % 1 !== 0
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 dark:text-dark-text-secondary">
                            {roast.star_rating}
                          </span>
                        </div>
                      )}
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
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* View All Roasts card - show when there are more than 5 roasts and not showing all on mobile */}
              {historicalRoasts.length > 5 && !(isMobile && showFullHistoricalRoasts) && (
                <div 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-center p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-200 border-2 border-dashed border-indigo-200 dark:border-indigo-700 cursor-pointer group"
                  onClick={() => setShowFullHistoricalRoasts(true)}
                >
                  <div className="flex items-center justify-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <span className="text-white text-lg">📊</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-semibold text-indigo-800 dark:text-indigo-200 text-sm sm:text-base">
                        View All Roasts
                      </p>
                      <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                        {historicalRoasts.length - 5} more roasts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center mt-2 sm:mt-0">
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      View All →
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentRoasts;


