import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
const RoastCurveGraph = lazy(() => import('../shared/RoastCurveGraph'));
import RecentRoasts from './RecentRoasts';
import BeanProfiles from './BeanProfiles';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import FloatingActionButton from '../shared/FloatingActionButton';
import BottomSheetModal from '../shared/BottomSheetModal';

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
  showStartRoastWizard = false,
  showRoastDetail = false,
}) => {
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [triggerBeanProfileCreate, setTriggerBeanProfileCreate] = useState(false);
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [beanProfileState, setBeanProfileState] = useState(null);
  const dropdownRef = useRef(null);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    if (onDataChange) {
      await onDataChange();
    }
  };

  const { elementRef: pullToRefreshRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh(handleRefresh);

  // Handle bean profile state changes
  const handleBeanProfileStateChange = (state) => {
    setBeanProfileState(state);
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


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
    <div className="space-y-6" ref={pullToRefreshRef} id="dashboard">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white text-center py-2 text-sm">
          {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}
      
      {/* Loading indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white text-center py-2 text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            Refreshing...
          </div>
        </div>
      )}
      
      {/* Main content container with proper margins */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 mt-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Roast Dashboard</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Your roasting history and quick actions</p>
        </div>
        {/* Actions dropdown - hidden on mobile */}
        {!isMobile && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white px-4 sm:px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-bold transform transition hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto mr-4"
            >
              ⚡ Actions
              <svg className={`w-4 h-4 transition-transform ${showActionsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showActionsDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-tertiary rounded-lg border dark:border-dark-border-primary z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowStartRoastWizard(true);
                      setShowActionsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-quaternary flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">🔥</span>
                    <span className="font-medium">Start New Roast</span>
                  </button>
                  <button
                    onClick={() => {
                      setTriggerBeanProfileCreate(true);
                      setShowActionsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-quaternary flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">☕</span>
                    <span className="font-medium">Add Bean Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roast Curve Visualization */}
      {historicalRoasts?.length > 0 && (
        <div className="bg-transparent">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowHistoricalRoasts(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium "
              >
                Compare Roasts →
              </button>
            </div>
          </div>
          {/* Extra wide graph container for desktop */}
          <div className="w-full">
            <Suspense fallback={null}>
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
                  events: recentRoastDetails[roast.id] || [],
                  created_at: roast.created_at,
                  coffee_region: roast.coffee_region
                };
              })}
              mode="historical"
              showROR={true}
              showMilestones={true}
              height={isMobile ? 400 : 700}
              title=""
              units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
              className=""
              showLegend={!isMobile}
              showGrid={true}
              showTooltip={!isMobile}
              enableZoom={false}
              enablePan={false}
              compact={isMobile}
              interactive={!isMobile}
              showRoastLabels={!isMobile}
            />
            </Suspense>
          </div>
        </div>
      )}

      {/* Recent Roasts */}
      <RecentRoasts
        historicalRoasts={historicalRoasts}
        selectedRoasts={selectedRoasts}
        setSelectedRoasts={setSelectedRoasts}
        roastDetails={recentRoastDetails}
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
          onProfileStateChange={handleBeanProfileStateChange}
          showRoastDetail={showRoastDetail}
        />
      </div>

      {/* Floating Action Button - hide when Start New Roast modal or roast details modal is open, only show on mobile */}
      {!showStartRoastWizard && !showRoastDetail && isMobile && (
        <FloatingActionButton
          onClick={() => {
            console.log('Dashboard FAB clicked, opening menu');
            setShowFABMenu(true);
          }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          label="Quick Actions"
        />
      )}

      {/* Mobile FAB Menu */}
      <BottomSheetModal
        isOpen={showFABMenu}
        onClose={() => setShowFABMenu(false)}
        title={beanProfileState?.selectedProfile ? "Bean Profile Actions" : "Quick Actions"}
      >
        <div className="space-y-4">
          {/* Show different options based on bean profile state */}
          {beanProfileState?.selectedProfile ? (
            // Bean Profile Actions
            <>
              <button
                onClick={() => {
                  if (beanProfileState.handleEditProfile) {
                    beanProfileState.handleEditProfile();
                  }
                  setShowFABMenu(false);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center gap-3 text-left"
              >
                <span className="text-2xl">✏️</span>
                <div>
                  <div className="font-semibold text-lg">Edit Bean Profile</div>
                  <div className="text-sm opacity-90">Edit "{beanProfileState.selectedProfile.name}"</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowStartRoastWizard(true);
                  setShowFABMenu(false);
                }}
                className="w-full bg-gradient-to-r from-emerald-700 to-green-900 text-white px-4 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-3 text-left"
              >
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-semibold text-lg">Start New Roast</div>
                  <div className="text-sm opacity-90">Begin a new roasting session</div>
                </div>
              </button>
            </>
          ) : (
            // Default Actions
            <>
              <button
                onClick={() => {
                  setShowStartRoastWizard(true);
                  setShowFABMenu(false);
                }}
                className="w-full bg-gradient-to-r from-emerald-700 to-green-900 text-white px-4 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-3 text-left"
              >
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-semibold text-lg">Start New Roast</div>
                  <div className="text-sm opacity-90">Begin a new roasting session</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setTriggerBeanProfileCreate(true);
                  setShowFABMenu(false);
                }}
                className="w-full bg-gradient-to-r from-purple-900 to-indigo-900 text-white px-4 py-4 rounded-lg hover:from-blue-950 hover:to-indigo-950 transition-colors flex items-center gap-3 text-left"
              >
                <span className="text-2xl">☕</span>
                <div>
                  <div className="font-semibold text-lg">Add Bean Profile</div>
                  <div className="text-sm opacity-90">Create a new coffee bean profile</div>
                </div>
              </button>
            </>
          )}
        </div>
      </BottomSheetModal>
      </div> {/* Close main content container */}
    </div>
  );
};

export default Dashboard;
