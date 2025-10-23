import React, { useState } from 'react';
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
    <div className="min-h-screen bg-light-gradient-blue dark:bg-dark-gradient">
      <div className="space-y-6 p-4 sm:p-6 mt-8 mx-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2 w-full sm:w-auto"
          >
            ← Back to Dashboard
          </button>
          <div className="text-center flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Complete Your Roast</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">Record final measurements and notes</p>
          </div>
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={loading}
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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
        
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Weight After Roast (g) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weightAfter}
                  onChange={(e) => handleInputChange('weightAfter', e.target.value)}
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent text-center text-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                  style={{
                    '--tw-ring-color': 'rgb(99 102 241)',
                    '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
                    '--tw-ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
                  }}
                  required
                />
                {!formData.weightAfter && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">Weight is required to complete the roast</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Any special notes about this roast..."
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary resize-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={finishRoast}
            disabled={loading || !formData.weightAfter}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            ✅ Complete Roast Session
          </button>
        </div>

        {/* Delete Roast Confirmation Modal */}
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => {
            setShowCancelModal(false);
            if (cancelRoast) {
              cancelRoast();
            }
          }}
          title="Delete Roast"
          message="Are you sure you want to delete this roast? This will permanently delete the roast and all its data. This action cannot be undone."
          confirmText="Yes, Delete Roast"
          cancelText="Keep Roast"
          confirmButtonColor="bg-red-600 hover:bg-red-700"
          icon="⚠️"
        />
      </div>
    </div>
  );
};

export default AfterRoast;