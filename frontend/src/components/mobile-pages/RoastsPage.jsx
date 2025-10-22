import React, { useState, useRef, useEffect } from 'react';
import RoastCurveGraph from '../shared/RoastCurveGraph';
import RecentRoasts from '../dashboard/RecentRoasts';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import FloatingActionButton from '../shared/FloatingActionButton';
import BottomSheetModal from '../shared/BottomSheetModal';

const RoastsPage = ({
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
  setActiveTab,
  showStartRoastWizard = false,
  showRoastDetail = false,
}) => {
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    if (onDataChange) {
      await onDataChange();
    }
  };

  const { elementRef: pullToRefreshRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh(handleRefresh);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  return (
    <div ref={pullToRefreshRef} className={`bg-transparent ${isMobile ? 'pb-24' : ''}`}>
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

      {/* Header */}
      <div className={`bg-white dark:bg-black px-4 py-6 ${isMobile ? '' : 'border-b border-gray-200 dark:border-dark-border-primary'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">Roast Curves</h1>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Track and analyze temperature curves</p>
            </div>
            {historicalRoasts?.length > 0 && !isMobile && (
              <button
                onClick={() => setShowHistoricalRoasts(true)}
                className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-lg"
              >
                Compare
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Roast Curve Visualization */}
      {historicalRoasts?.length > 0 && (
        <>
          {isMobile ? (
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
                height={isMobile ? 250 : 350}
                title=""
                units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
                showLegend={false}
                showGrid={true}
                showTooltip={true}
                enableZoom={true}
                enablePan={true}
                compact={true}
                interactive={true}
                showRoastLabels={false}
                noContainer={true}
              />
          ) : (
            <div className="bg-black dark:bg-black w-full">
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
              height={400}
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
        </>
      )}

      {/* Recent Roasts Cards */}
      <div className="bg-gray-100 dark:bg-black py-2" style={{ width: '100vw', marginLeft: '-50vw', left: '50%', position: 'relative' }}>
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
      </div>

      {/* Floating Action Button - only show on mobile and when Start New Roast modal or roast details modal is not open */}
      {isMobile && !showStartRoastWizard && !showRoastDetail && (
        <FloatingActionButton
          onClick={() => {
            console.log('FAB clicked, setting showFABMenu to true');
            setShowFABMenu(true);
          }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          label="Quick Actions"
          position="bottom-right"
          className="mb-20 mr-4"
        />
      )}

      {/* Mobile FAB Menu */}
      <BottomSheetModal
        isOpen={showFABMenu}
        onClose={() => {
          console.log('BottomSheetModal onClose called');
          setShowFABMenu(false);
        }}
        title="Quick Actions"
      >
        <div className="space-y-4">
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
              setShowHistoricalRoasts(true);
              setShowFABMenu(false);
            }}
            className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center gap-3 text-left"
          >
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-semibold text-lg">Compare Roasts</div>
              <div className="text-sm opacity-90">Analyze and compare roast curves</div>
            </div>
          </button>
        </div>
      </BottomSheetModal>
    </div>
  );
};

export default RoastsPage;
