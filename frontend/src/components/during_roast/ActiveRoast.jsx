import React, { useState, useEffect } from 'react';
import RoastTimer from './RoastTimer';
import RoastControls from './RoastControls';
import EventsTable from './EventsTable';
import AfterRoast from './AfterRoast';
import RoastCurveGraph from '../shared/RoastCurveGraph';
import PhaseTimeline from '../shared/PhaseTimeline';
import EnvironmentalConditions from '../shared/EnvironmentalConditions';
import GatedRoastChat from './GatedRoastChat';
import { useDevMessageSeen } from '../../hooks/useDevMessageSeen';
import { useAuth } from '../../contexts/AuthContext';
// LocalNotifications removed for web compatibility
import useShakeDetection from '../../hooks/useShakeDetection';
import useDeviceSensors from '../../hooks/useDeviceSensors';

const ActiveRoast = ({
  roastId,
  roastEnded,
  formData,
  handleInputChange,
  logChange,
  loading,
  elapsedTime,
  formatTime,
  currentPhase,
  dryingTime,
  maillardTime,
  developmentTime,
  coolingTime,
  milestonesMarked,
  roastDuration,
  isPaused,
  pauseRoast,
  resumeRoast,
  markMilestone,
  events,
  editingEventId,
  editingFormData,
  setEditingFormData,
  startEditEvent,
  saveEditedEvent,
  cancelEdit,
  deleteEvent,
  environmentalConditions,
  userProfile,
  finishRoast,
  cancelRoast = () => {},
  endRoastSession,
  getAuthToken,
  // Reset function props
  setRoastId,
  setStartTs,
  setRoastEnded,
  setEvents,
  setEnvironmentalConditions,
  setIsPaused,
  setPauseStartTime,
  setTotalPausedTime,
  setMilestonesMarked,
  // Modal state
  showEndRoastConfirm,
  setShowEndRoastConfirm
}) => {
  const [showChat, setShowChat] = useState(false);
  const { hasSeenDevMessage } = useDevMessageSeen();
  const { user } = useAuth();
  
  // Device sensors and shake detection
  const { isMobileDevice, lockOrientation, unlockOrientation } = useDeviceSensors();
  
  // Shake-to-log functionality
  const handleShakeGesture = async () => {
    if (roastId && !roastEnded) {
      // Log a quick event when device is shaken
      await logChange('SHAKE_LOG', '', '', '', 'Device shaken to log event');
    }
  };
  
  useShakeDetection(handleShakeGesture);

  // Lock orientation for mobile devices during roasting
  useEffect(() => {
    if (isMobileDevice && roastId && !roastEnded) {
      lockOrientation('portrait');
      
      return () => {
        unlockOrientation();
      };
    }
  }, [isMobileDevice, roastId, roastEnded, lockOrientation, unlockOrientation]);

  // Note: Background notifications removed for web compatibility
  // Notifications are not needed for roast events in web browsers
  
  const handleBackToDashboard = () => {
    setRoastId(null);
    setStartTs(null);
    setRoastEnded(false);
    setEvents([]);
    setEnvironmentalConditions(null);
    setIsPaused(false);
    setPauseStartTime(null);
    setTotalPausedTime(0);
    setMilestonesMarked({
      dryEnd: false,
      firstCrack: false,
      secondCrack: false,
      cool: false
    });
  };

  return (
    <>
      {/* Active Roast - During */}
      {roastId && !roastEnded && (
        <div className="space-y-6 mt-8 mx-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative">
            {/* Mobile: Simple X button in top right, Desktop: Full button */}
            <button
              onClick={handleBackToDashboard}
              className="hidden sm:flex bg-transparent border bottom-0 rounded-lg text-white px-4 py-2 hover:bg-gray-500 transition items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            
            {/* Mobile: Simple X button in top right */}
            <button
              onClick={handleBackToDashboard}
              className="sm:hidden absolute top-0 right-0 bg-gray-500 text-white w-8 h-8 rounded-full hover:bg-gray-600 transition flex items-center justify-center z-10"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2 ml-4">Active Roast Session</h2>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-32 ml-4">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  hasSeenDevMessage && user?.user_metadata?.role !== 'admin' && user?.user_metadata?.subscription_status !== 'premium'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white opacity-50' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-105'
                }`}
                disabled={hasSeenDevMessage && user?.user_metadata?.role !== 'admin' && user?.user_metadata?.subscription_status !== 'premium'}
                title={hasSeenDevMessage ? 'AI Copilot coming soon!' : 'Open AI Copilot'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI Copilot
              </button>
            </div>
          </div>

          {/* Clean Header Layout */}
          <div className="mb-8">
            {/* Responsive Layout - Stack on mobile, side-by-side on larger screens */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 mb-6">
              {/* Timer with Circular Progress Chart and Phase Indicators */}
              <RoastTimer
                elapsedTime={elapsedTime}
                formatTime={formatTime}
                currentPhase={currentPhase}
                dryingTime={dryingTime}
                maillardTime={maillardTime}
                developmentTime={developmentTime}
                coolingTime={coolingTime}
                milestonesMarked={milestonesMarked}
                isPaused={isPaused}
                pauseRoast={pauseRoast}
                resumeRoast={resumeRoast}
                loading={loading}
                roastLevel={formData.roastLevel}
              />

              {/* Roaster Controls - Improved layout */}
              <RoastControls 
                formData={formData}
                handleInputChange={handleInputChange}
                logChange={logChange}
                loading={loading}
                machineSensorType={formData.selectedMachine?.temp_sensor_type || 'builtin'}
                elapsedTime={elapsedTime}
              />
            </div>
          </div>

          {/* Milestone Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 ml-2 mr-2">
            <button
              onClick={() => markMilestone('DRY_END')}
              disabled={loading || milestonesMarked.dryEnd || isPaused}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                milestonesMarked.dryEnd 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700 shadow-lg'
              } ${loading || isPaused ? 'opacity-50' : ''}`}
            >
              {milestonesMarked.dryEnd ? '✅ Dry End' : '🌾 Dry End'}
            </button>
            <button
              onClick={() => markMilestone('FIRST_CRACK')}
              disabled={loading || milestonesMarked.firstCrack || isPaused}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                milestonesMarked.firstCrack 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
              } ${loading || isPaused ? 'opacity-50' : ''}`}
            >
              {milestonesMarked.firstCrack ? '✅ First Crack' : '🔥 First Crack'}
            </button>
            <button
              onClick={() => markMilestone('SECOND_CRACK')}
              disabled={loading || milestonesMarked.secondCrack || isPaused}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                milestonesMarked.secondCrack 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg'
              } ${loading || isPaused ? 'opacity-50' : ''}`}
            >
              {milestonesMarked.secondCrack ? '✅ Second Crack' : '🔥🔥 Second Crack'}
            </button>
            <button
              onClick={() => markMilestone('COOL')}
              disabled={loading || milestonesMarked.cool || isPaused}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                milestonesMarked.cool 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-lg'
              } ${loading || isPaused ? 'opacity-50' : ''}`}
            >
              {milestonesMarked.cool ? '✅ Cool' : '🧊 Cool'}
            </button>
            <button
              onClick={() => setShowEndRoastConfirm(true)}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition disabled:opacity-50 text-sm sm:text-base"
            >
              🛑 End Roast
            </button>
          </div>

          {/* Phase Timeline - Above the roast curve */}
          <PhaseTimeline
            elapsedTime={elapsedTime}
            currentPhase={currentPhase}
            dryingTime={dryingTime}
            maillardTime={maillardTime}
            developmentTime={developmentTime}
            coolingTime={coolingTime}
            milestonesMarked={milestonesMarked}
            roastDuration={roastDuration}
            height={80}
            className="mb-4"
          />

          {/* Live Roast Curve Graph */}
          <RoastCurveGraph
            data={events}
            mode="live"
            showROR={true}
            showMilestones={true}
            height={300}
            title="Live Roast Curve"
            units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
            className="mb-6 mx-2"
            showLegend={false}
            showGrid={true}
            showTooltip={true}
            enableZoom={false}
            enablePan={false}
            compact={false}
            interactive={true}
          />

          {/* Events Table and Weather Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Events Table - Takes full width on mobile, flexible on desktop */}
            <div className="flex-1 min-w-0">
              <EventsTable
                events={events}
                formatTime={formatTime}
                editingEventId={editingEventId}
                editingFormData={editingFormData}
                setEditingFormData={setEditingFormData}
                startEditEvent={startEditEvent}
                saveEditedEvent={saveEditedEvent}
                cancelEdit={cancelEdit}
                deleteEvent={deleteEvent}
              />
            </div>
            
             {/* Weather Component - Responsive width */}
             <div className="flex-shrink-0 lg:ml-5 w-full lg:w-80">
               {/* Environmental Conditions - Compact */}
               {environmentalConditions && (
                 <div className="mx-4">
                   <EnvironmentalConditions 
                     conditions={environmentalConditions} 
                     units={userProfile?.units}
                     userProfile={userProfile}
                   />
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Active Roast - After */}
      {roastId && roastEnded && (
        <AfterRoast
          roastEnded={roastEnded}
          formData={formData}
          handleInputChange={handleInputChange}
          finishRoast={finishRoast}
          cancelRoast={cancelRoast || (() => {})}
          endRoastSession={endRoastSession}
          loading={loading}
          events={events}
          formatTime={formatTime}
          userProfile={userProfile}
          setRoastId={setRoastId}
          setStartTs={setStartTs}
          setRoastEnded={setRoastEnded}
          setEvents={setEvents}
          setEnvironmentalConditions={setEnvironmentalConditions}
          setIsPaused={setIsPaused}
          setPauseStartTime={setPauseStartTime}
          setTotalPausedTime={setTotalPausedTime}
          setMilestonesMarked={setMilestonesMarked}
        />
      )}

      {/* AI Roasting Copilot Chat */}
      <GatedRoastChat
        roastId={roastId}
        formData={formData}
        events={events}
        elapsedTime={elapsedTime}
        currentPhase={currentPhase}
        environmentalConditions={environmentalConditions}
        userProfile={userProfile}
        getAuthToken={getAuthToken}
        isOpen={showChat}
        onClose={() => {
          setShowChat(false);
        }}
      />
    </>
  );
};

export default ActiveRoast;
