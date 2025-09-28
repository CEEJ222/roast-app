import React from 'react';
import RoastCurveGraph from '../shared/RoastCurveGraph';
import RecentRoasts from './RecentRoasts';
import BeanProfiles from './BeanProfiles';

const Dashboard = ({
  historicalRoasts,
  recentRoastDetails,
  userProfile,
  setShowStartRoastWizard,
  setShowHistoricalRoasts,
  handleRoastResume,
  selectedRoasts,
  setSelectedRoasts,
  roastDetails,
  setRoastDetails,
  roastId,
  getAuthToken,
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

      {/* Recent Roasts */}
      <RecentRoasts
        historicalRoasts={historicalRoasts}
        selectedRoasts={selectedRoasts}
        setSelectedRoasts={setSelectedRoasts}
        roastDetails={roastDetails}
        setRoastDetails={setRoastDetails}
        onRoastResume={handleRoastResume}
        roastId={roastId}
      />

      {/* Bean Profiles */}
      <BeanProfiles getAuthToken={getAuthToken} />
    </div>
  );
};

export default Dashboard;
