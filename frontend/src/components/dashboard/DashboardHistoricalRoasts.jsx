import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoastCurveGraph from '../shared/RoastCurveGraph';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const DashboardHistoricalRoasts = ({ 
  selectedRoasts, 
  setSelectedRoasts, 
  roastDetails, 
  setRoastDetails,
  onRoastResume,
  currentActiveRoastId,
  hideCompareButton = false
}) => {
  const { getAuthToken } = useAuth();
  const [roasts, setRoasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deletingRoast, setDeletingRoast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    loadHistoricalRoasts();
  }, []);

  const loadHistoricalRoasts = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Sort by created_at descending (newest first)
        const sortedRoasts = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRoasts(sortedRoasts);
        
        // Don't load details automatically - only load when needed for comparison
      }
    } catch (error) {
      console.error('Error loading historical roasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoastDetails = async (roastId) => {
    if (roastDetails[roastId]) return; // Already loaded

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roastId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const events = await response.json();
        setRoastDetails(prev => ({
          ...prev,
          [roastId]: events
        }));
      } else {
        console.error('Failed to load roast details:', response.status);
      }
    } catch (error) {
      console.error('Error loading roast details:', error);
    }
  };

  const toggleRoastSelection = (roastId) => {
    // Simple, direct toggle without complex state management
    setSelectedRoasts(prev => {
      if (prev.includes(roastId)) {
        // If this roast is selected, deselect it
        return prev.filter(id => id !== roastId);
      } else {
        // If this roast is not selected, select it
        return [...prev, roastId];
      }
    });
  };

  // Load details for selected roasts only when the graph view is shown
  useEffect(() => {
    if (showGraph && selectedRoasts.length > 0) {
      setLoadingDetails(true);
      // Load details for all selected roasts that don't have them yet
      const promises = selectedRoasts
        .filter(roastId => !roastDetails[roastId])
        .map(roastId => loadRoastDetails(roastId));
      
      Promise.all(promises).finally(() => {
        setLoadingDetails(false);
      });
    }
  }, [showGraph, selectedRoasts]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (roast) => {
    // Try to get duration from roast events if available
    if (roastDetails[roast.id] && roastDetails[roast.id].length > 0) {
      const events = roastDetails[roast.id];
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

  const getSelectedRoastsData = () => {
    const result = selectedRoasts.map(roastId => {
      const roast = roasts.find(r => r.id === roastId);
      const events = roastDetails[roastId] || [];
      return {
        id: roastId,
        name: roast?.coffee_region && roast?.coffee_type 
          ? `${roast.coffee_region} ${roast.coffee_type}` 
          : roast?.coffee_type || roast?.coffee_region || 'Unknown Coffee',
        fullName: roast?.coffee_region && roast?.coffee_type 
          ? `${roast.coffee_region} ${roast.coffee_type} - ${formatDate(roast?.created_at)}`
          : `${roast?.coffee_type || roast?.coffee_region || 'Unknown Coffee'} - ${formatDate(roast?.created_at)}`,
        events: events
      };
    });
    return result;
  };

  const deleteRoast = async (roastId) => {
    try {
      setDeletingRoast(roastId);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roastId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from local state
        setRoasts(prev => prev.filter(r => r.id !== roastId));
        setSelectedRoasts(prev => prev.filter(id => id !== roastId));
        setRoastDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[roastId];
          return newDetails;
        });
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        console.error('Error deleting roast:', errorData);
        alert('Failed to delete roast. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting roast:', error);
      alert('Failed to delete roast. Please try again.');
    } finally {
      setDeletingRoast(null);
    }
  };

  const deleteSelectedRoasts = async () => {
    if (selectedRoasts.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setDeletingRoast('bulk');
      const token = await getAuthToken();
      
      // Delete all selected roasts
      const deletePromises = selectedRoasts.map(roastId => 
        fetch(`${API_BASE}/roasts/${roastId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(r => !r.ok);
      
      if (failedDeletes.length > 0) {
        console.error('Some roasts failed to delete');
        alert(`Failed to delete ${failedDeletes.length} roast(s). Please try again.`);
      } else {
        // Remove all selected roasts from local state
        setRoasts(prev => prev.filter(r => !selectedRoasts.includes(r.id)));
        setSelectedRoasts([]);
        setRoastDetails(prev => {
          const newDetails = { ...prev };
          selectedRoasts.forEach(id => delete newDetails[id]);
          return newDetails;
        });
      }
    } catch (error) {
      console.error('Error deleting roasts:', error);
      alert('Failed to delete roasts. Please try again.');
    } finally {
      setDeletingRoast(null);
      setShowBulkDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-dark-glow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">All Roasts</h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text-secondary">Loading roast history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showGraph ? (
        /* Graph View */
        <div className="bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-dark-glow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                Roast Curve Comparison ({selectedRoasts.length} roasts selected)
              </h3>
              <button
                onClick={() => setShowGraph(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                ← Back to List
              </button>
            </div>
          </div>
          <div className="p-6">
            {selectedRoasts.length > 0 ? (
              loadingDetails ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Loading roast details...</p>
                </div>
              ) : (
                <RoastCurveGraph
                  data={getSelectedRoastsData()}
                  mode="historical"
                  showROR={false}
                  showMilestones={false}
                  height={400}
                  title="Historical Roast Comparison"
                  units={{ temperature: 'F', time: 'min' }}
                  showLegend={true}
                  showGrid={true}
                  showTooltip={true}
                  enableZoom={true}
                  enablePan={true}
                  selectedRoasts={selectedRoasts}
                  onRoastToggle={(action) => {
                    if (action === 'all') {
                      setSelectedRoasts(roasts.map(r => r.id));
                    } else if (action === 'none') {
                      setSelectedRoasts([]);
                    }
                  }}
                  showRoastLabels={true}
                  compact={false}
                  interactive={true}
                />
              )
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-dark-text-tertiary">
                <p>Select roasts from the list to compare their curves</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-dark-glow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                All Roasts ({roasts.length} roasts)
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (selectedRoasts.length === roasts.length) {
                      // If all are selected, deselect all
                      setSelectedRoasts([]);
                    } else {
                      // If not all are selected, select all
                      setSelectedRoasts(roasts.map(r => r.id));
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {selectedRoasts.length === roasts.length ? '✗ Deselect All' : '✓ Select All'}
                </button>
                {!hideCompareButton && (
                  <button
                    onClick={() => setShowGraph(true)}
                    disabled={selectedRoasts.length === 0}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    📊 Compare Selected ({selectedRoasts.length})
                  </button>
                )}
                <button
                  onClick={deleteSelectedRoasts}
                  disabled={selectedRoasts.length === 0 || deletingRoast === 'bulk'}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {deletingRoast === 'bulk' ? '🗑️ Deleting...' : `🗑️ Delete Selected (${selectedRoasts.length})`}
                </button>
                <button
                  onClick={() => setSelectedRoasts([])}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {roasts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-dark-text-tertiary">
                <div className="text-6xl mb-4">☕</div>
                <p className="text-lg dark:text-dark-text-primary">No roasts found</p>
                <p className="text-sm dark:text-dark-text-secondary">Start roasting to see your history here!</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border-primary">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Coffee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Machine
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Weight Loss
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Roast Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border-primary">
                  {roasts.map((roast) => (
                    <tr 
                      key={roast.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary cursor-pointer ${
                        selectedRoasts.includes(roast.id) ? 'bg-orange-50 dark:bg-dark-accent-primary/20' : ''
                      }`}
                      onClick={() => toggleRoastSelection(roast.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRoasts.includes(roast.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleRoastSelection(roast.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-dark-border-primary rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                        {formatDate(roast.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                        <div>
                          <div className="font-medium">
                            {roast.coffee_region && roast.coffee_type 
                              ? `${roast.coffee_region} ${roast.coffee_type}` 
                              : roast.coffee_type || roast.coffee_region || 'Unknown Coffee'
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                        {roast.machine_label || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                        {formatDuration(roast)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                        {roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          {roast.desired_roast_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRoastResume(roast);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                            title="Resume or view roast"
                          >
                            👁️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(roast.id);
                            }}
                            disabled={deletingRoast === roast.id}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                            title="Delete roast"
                          >
                            {deletingRoast === roast.id ? '🗑️' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                Delete Roast
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Are you sure you want to delete this roast? This action cannot be undone and will also delete all associated temperature readings and events.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteRoast(showDeleteConfirm)}
                  disabled={deletingRoast === showDeleteConfirm}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingRoast === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                Delete Multiple Roasts
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Are you sure you want to delete <strong>{selectedRoasts.length}</strong> roast(s)? This action cannot be undone and will also delete all associated temperature readings and events for each roast.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={deletingRoast === 'bulk'}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingRoast === 'bulk' ? 'Deleting...' : `Delete ${selectedRoasts.length} Roasts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHistoricalRoasts;
