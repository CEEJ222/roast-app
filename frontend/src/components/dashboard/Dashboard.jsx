import React, { useState, useRef, useEffect } from 'react';
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
  onDataChange = null,
}) => {
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [triggerBeanProfileCreate, setTriggerBeanProfileCreate] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Roast Dashboard</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Your roasting history and quick actions</p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white px-4 sm:px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold shadow-lg dark:shadow-vibrant-glow transform transition hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            ⚡ Actions
            <svg className={`w-4 h-4 transition-transform ${showActionsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showActionsDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg dark:shadow-dark-lg border dark:border-dark-border-primary z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowStartRoastWizard(true);
                    setShowActionsDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-quaternary flex items-center gap-3 transition-colors"
                >
                  <span className="text-lg">🏁</span>
                  <span className="font-medium">Start New Roast</span>
                </button>
                <button
                  onClick={() => {
                    setTriggerBeanProfileCreate(true);
                    setShowActionsDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-quaternary flex items-center gap-3 transition-colors"
                >
                  <span className="text-lg">📝</span>
                  <span className="font-medium">Add Bean Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
            data={historicalRoasts.map(roast => {
              const coffeeName = roast.bean_profile_name || 
                                (roast.coffee_region && roast.coffee_type 
                                 ? `${roast.coffee_region} ${roast.coffee_type}` 
                                 : roast.coffee_type || roast.coffee_region || 'Unknown Coffee');
              return {
                id: roast.id,
                name: coffeeName,
                fullName: `${coffeeName} - ${new Date(roast.created_at).toLocaleDateString()}`,
                events: recentRoastDetails[roast.id] || []
              };
            })}
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
        onDataChange={onDataChange}
        setShowStartRoastWizard={setShowStartRoastWizard}
      />

      {/* Bean Profiles */}
      <div data-section="bean-profiles">
        <BeanProfiles 
          getAuthToken={getAuthToken} 
          onDataChange={onDataChange} 
          triggerCreateModal={triggerBeanProfileCreate}
          onTriggerReset={() => setTriggerBeanProfileCreate(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;
