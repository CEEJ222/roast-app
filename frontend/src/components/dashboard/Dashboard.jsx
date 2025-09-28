import React from 'react';
import RoastCurveGraph from '../shared/RoastCurveGraph';
import DashboardHistoricalRoasts from './DashboardHistoricalRoasts';
import BeanProfiles from './BeanProfiles';

const Dashboard = ({
  historicalRoasts,
  recentRoastDetails,
  userProfile,
  loadingHistoricalRoasts,
  showFullHistoricalRoasts,
  setShowFullHistoricalRoasts,
  setShowStartRoastWizard,
  setShowHistoricalRoasts,
  handleRoastResume,
  selectedRoasts,
  setSelectedRoasts,
  roastDetails,
  setRoastDetails,
  roastId,
  getAuthToken
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Roast Dashboard</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Your roasting history and quick actions</p>
        </div>
        <button
          onClick={() => setShowStartRoastWizard(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant text-white px-4 sm:px-6 py-3 rounded-lg hover:from-indigo-800 hover:via-purple-700 hover:to-purple-800 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105 flex items-center justify-center gap-2"
        >
          🏁 Start New Roast
        </button>
      </div>

      {/* Roast Curve Visualization */}
      {historicalRoasts?.length > 0 && (
        <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">All Roast Curves</h3>
              <button
                onClick={() => setShowHistoricalRoasts(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                Compare Roasts →
              </button>
            </div>
          </div>
          <RoastCurveGraph
            data={historicalRoasts.map(roast => ({
              id: roast.id,
              name: roast.coffee_type || 'Unknown',
              fullName: `${roast.coffee_type || 'Unknown'} - ${new Date(roast.created_at).toLocaleDateString()}`,
              events: recentRoastDetails[roast.id] || []
            }))}
            mode="historical"
            showROR={true}
            showMilestones={true}
            height={500}
            title=""
            units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
            className=""
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
      )}

      {/* Historical Roasts Table */}
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
              onRoastResume={handleRoastResume}
              currentActiveRoastId={roastId}
              hideCompareButton={true}
            />
          </div>
        ) : (
          <div className="p-6">
            {loadingHistoricalRoasts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 dark:border-dark-accent-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-dark-text-secondary">Loading roast history...</p>
              </div>
            ) : historicalRoasts?.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-dark-text-tertiary">
                <div className="text-6xl mb-4">☕</div>
                <p className="text-lg font-semibold mb-2 dark:text-dark-text-primary">Ready to start your roasting journey?</p>
                <p className="text-sm mb-6 dark:text-dark-text-secondary">Begin with your first roast to see your progress and curves here!</p>
                <button
                  onClick={() => setShowStartRoastWizard(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105"
                >
                  🚦 Start Your First Roast
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {historicalRoasts.slice(0, 5).map((roast) => (
                  <div 
                    key={roast.id} 
                    onClick={() => handleRoastResume(roast)}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center border dark:border-dark-border-primary">
                        <span className="text-orange-600 dark:text-dark-accent-primary font-bold">☕</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {roast.coffee_region && roast.coffee_type 
                            ? `${roast.coffee_region} ${roast.coffee_type}` 
                            : roast.coffee_type || roast.coffee_region || 'Unknown Coffee'
                          }
                        </p>
                        <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                          {new Date(roast.created_at).toLocaleDateString()} • {roast.machine_label || 'Unknown Machine'}
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
                            <>
                              <span className="hidden sm:inline">View Details </span>→
                            </>
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

      {/* Bean Profiles */}
      <BeanProfiles getAuthToken={getAuthToken} />
    </div>
  );
};

export default Dashboard;
