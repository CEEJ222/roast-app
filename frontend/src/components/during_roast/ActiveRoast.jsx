import React, { useState } from 'react';
import RoastTimer from './RoastTimer';
import RoastControls from './RoastControls';
import EventsTable from './EventsTable';
import AfterRoast from './AfterRoast';
import RoastCurveGraph from '../shared/RoastCurveGraph';
import EnvironmentalConditions from '../shared/EnvironmentalConditions';
import RoastChat from './RoastChat';

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
  developmentTime,
  coolingTime,
  milestonesMarked,
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
      firstCrack: false,
      secondCrack: false,
      cool: false
    });
  };

  return (
    <>
      {/* Active Roast - During */}
      {roastId && !roastEnded && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <button
              onClick={handleBackToDashboard}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2 w-full sm:w-auto"
            >
              ← Back to Dashboard
            </button>
            <div className="text-center flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Active Roast Session</h2>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-32">
              <button
                onClick={() => setShowChat(!showChat)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
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
                developmentTime={developmentTime}
                coolingTime={coolingTime}
                milestonesMarked={milestonesMarked}
                isPaused={isPaused}
                pauseRoast={pauseRoast}
                resumeRoast={resumeRoast}
                loading={loading}
              />

              {/* Roaster Controls - Improved layout */}
              <RoastControls 
                formData={formData}
                handleInputChange={handleInputChange}
                logChange={logChange}
                loading={loading}
              />
            </div>
          </div>

          {/* Milestone Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
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

          {/* Live Roast Curve Graph */}
          <RoastCurveGraph
            data={events}
            mode="live"
            showROR={true}
            showMilestones={true}
            height={300}
            title="Live Roast Curve"
            units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
            className="mb-6"
            showLegend={true}
            showGrid={true}
            showTooltip={true}
            enableZoom={false}
            enablePan={false}
            compact={false}
            interactive={true}
          />

          {/* Events Table and Weather Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Events Table - Reduced Width */}
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
            
            {/* Weather Component - Bottom Right */}
            <div className="flex-shrink-0">
              <div className="w-80">
                {/* Environmental Conditions - Compact */}
                {environmentalConditions && (
                  <div>
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
      <RoastChat
        roastId={roastId}
        formData={formData}
        events={events}
        elapsedTime={elapsedTime}
        currentPhase={currentPhase}
        environmentalConditions={environmentalConditions}
        getAuthToken={getAuthToken}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </>
  );
};

export default ActiveRoast;
