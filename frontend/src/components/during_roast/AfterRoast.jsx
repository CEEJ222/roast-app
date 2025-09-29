import React, { useState } from 'react';
import RoastCurveGraph from '../shared/RoastCurveGraph';
import ConfirmationModal from '../modals/ConfirmationModal';

const AfterRoast = ({
  roastEnded,
  formData,
  handleInputChange,
  finishRoast,
  cancelRoast,
  endRoastSession,
  loading,
  events,
  formatTime,
  userProfile,
  // Reset function props
  setRoastId,
  setStartTs,
  setRoastEnded,
  setEvents,
  setEnvironmentalConditions,
  setIsPaused,
  setPauseStartTime,
  setTotalPausedTime,
  setMilestonesMarked
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackToDashboard}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Complete Your Roast</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary">Record final measurements and notes</p>
        </div>
        <button
          onClick={() => setShowCancelModal(true)}
          disabled={loading}
          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🗑️ Delete
        </button>
      </div>
      
      {!roastEnded && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Roast Session Not Ended
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>It looks like you haven't ended the roast session yet. If you're weighing your beans, the roast is complete!</p>
                <div className="mt-3">
                  <button
                    onClick={endRoastSession}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium"
                  >
                    🛑 End Roast Session Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Weight After Roast (g) <span className="text-red-500">*</span></label>
          <input
            type="number"
            step="0.1"
            value={formData.weightAfter}
            onChange={(e) => handleInputChange('weightAfter', e.target.value)}
            className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent text-center text-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
            style={{
              '--tw-ring-color': 'rgb(99 102 241)',
              '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
              '--tw-ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
            }}
            required
          />
          {!formData.weightAfter && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">Weight is required to complete the roast</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            placeholder="Any special notes about this roast..."
            className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary"
          />
        </div>

        <button
          onClick={finishRoast}
          disabled={loading || !formData.weightAfter}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          ✅ Complete Roast Session
        </button>
      </div>

      {/* Completed Roast Curve */}
      {events.length > 0 && (
        <RoastCurveGraph
          data={events}
          mode="live"
          showROR={true}
          showMilestones={true}
          height={250}
          title="Completed Roast Curve"
          units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
          className="mb-6"
          showLegend={true}
          showGrid={true}
          showTooltip={true}
          enableZoom={true}
          enablePan={true}
          compact={true}
          interactive={true}
        />
      )}

      {/* Events Log - Show complete event history */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-b dark:border-dark-border-primary">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">Complete Roast Event Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border-primary">
            <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Event</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Fan</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Heat</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Temp °F</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border-primary">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-dark-text-tertiary">
                    No events logged yet.
                  </td>
                </tr>
              ) : (
                events.map((event, index) => (
                  <tr key={event.id} className={index % 2 === 0 ? 'bg-white dark:bg-dark-bg-secondary' : 'bg-gray-50 dark:bg-dark-bg-tertiary'}>
                    <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-dark-text-primary">{formatTime(event.t_offset_sec)}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.kind === 'SET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' :
                        event.kind === 'END' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        event.kind === 'PAUSE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        event.kind === 'RESUME' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'
                      }`}>
                        {event.kind.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.fan_level || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.heat_level || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.temp_f || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">{event.note || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Roast Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          cancelRoast();
        }}
        title="Delete Roast"
        message="Are you sure you want to delete this roast? This will permanently delete the roast and all its data. This action cannot be undone."
        confirmText="Yes, Delete Roast"
        cancelText="Keep Roast"
        confirmButtonColor="bg-red-600 hover:bg-red-700"
        icon="⚠️"
      />
    </div>
  );
};

export default AfterRoast;
