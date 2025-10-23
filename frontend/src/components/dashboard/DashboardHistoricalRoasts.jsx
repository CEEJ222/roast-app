import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoastCurveGraph from '../shared/RoastCurveGraph';
import StandardTable from '../shared/StandardTable';

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
  hideCompareButton = false,
  onDataChange = null // Callback to refresh parent data
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
      }
    } catch (error) {
      console.error('Error loading historical roasts:', error);
    } finally {
      setLoading(false);
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
      // Check if we have details for all selected roasts
      const missingDetails = selectedRoasts.filter(roastId => !roastDetails[roastId]);
      
      if (missingDetails.length === 0) {
        // All details are already loaded
        setLoadingDetails(false);
      } else {
        // Some details are missing, but they should be loaded by the parent component
        // Just wait a moment for them to load
        setTimeout(() => {
          setLoadingDetails(false);
        }, 1000);
      }
    }
  }, [showGraph, selectedRoasts, roastDetails]);

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
      // Use COOL event as the end of roasting (not END event)
      const coolEvent = events.find(e => e.kind === 'COOL');
      if (coolEvent) {
        const duration = coolEvent.t_offset_sec;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Fallback to END event if no COOL event exists
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

  const columns = [
    {
      header: 'Date/Time',
      key: 'created_at',
      render: (roast) => formatDate(roast.created_at)
    },
    {
      header: 'Coffee',
      key: 'coffee',
      render: (roast) => (
        <div>
          <div className="font-medium">
            {roast.bean_profile_name || 
             (roast.coffee_region && roast.coffee_type 
              ? `${roast.coffee_region} ${roast.coffee_type}` 
              : roast.coffee_type || roast.coffee_region || 'Unknown Coffee')
            }
          </div>
        </div>
      )
    },
    {
      header: 'Machine',
      key: 'machine_label',
      render: (roast) => roast.machine_label || 'Unknown'
    },
    {
      header: 'Duration',
      key: 'duration',
      render: (roast) => formatDuration(roast)
    },
    {
      header: 'Weight Loss',
      key: 'weight_loss_pct',
      render: (roast) => roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'
    },
    {
      header: 'Roast Level',
      key: 'desired_roast_level',
      render: (roast) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          {roast.desired_roast_level}
        </span>
      )
    },
    {
      header: 'Rating',
      key: 'star_rating',
      render: (roast) => (
        roast.star_rating && roast.star_rating > 0 ? (
          <div className="flex items-center space-x-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${
                    star <= roast.star_rating
                      ? 'text-yellow-400'
                      : star <= Math.ceil(roast.star_rating) && roast.star_rating % 1 !== 0
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-600 dark:text-dark-text-secondary">
              {roast.star_rating}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 text-xs">Not rated</span>
        )
      )
    }
  ];

  const getSelectedRoastsData = () => {
    const result = selectedRoasts.map(roastId => {
      const roast = roasts.find(r => r.id === roastId);
      // Use the roast details from the parent component
      const events = roastDetails[roastId] || [];
      const coffeeName = roast?.bean_profile_name || 
                        (roast?.coffee_region && roast?.coffee_type 
                         ? `${roast.coffee_region} ${roast.coffee_type}` 
                         : roast?.coffee_type || roast?.coffee_region || 'Unknown Coffee');
      
      return {
        id: roastId,
        name: coffeeName,
        fullName: `${coffeeName} - ${formatDate(roast?.created_at)}`,
        events: events,
        created_at: roast?.created_at,
        coffee_region: roast?.coffee_region
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
        
        // Notify parent to refresh data
        if (onDataChange) {
          onDataChange();
        }
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
        
        // Notify parent to refresh data
        if (onDataChange) {
          onDataChange();
        }
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
      <div className="bg-white dark:bg-black rounded-lg shadow dark:shadow-dark-glow">
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
        <div className="bg-white dark:bg-black rounded-lg shadow dark:shadow-dark-glow">
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
                  height={500}
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
        <StandardTable
            data={roasts}
            columns={columns}
            onRowClick={(roast) => toggleRoastSelection(roast.id)}
            onDelete={(roast) => setShowDeleteConfirm(roast.id)}
            onBulkDelete={(roastIds) => {
              setSelectedRoasts(roastIds);
              setShowBulkDeleteConfirm(true);
            }}
            selectedItems={new Set(selectedRoasts)}
            onSelectionChange={(newSelection) => setSelectedRoasts(Array.from(newSelection))}
            onSelectAll={(allIds) => setSelectedRoasts(allIds)}
            showSelection={true}
            showBulkDelete={true}
            loading={loading}
            emptyMessage="No roasts found. Start roasting to see your history here!"
            className=""
            title={`All Roasts (${roasts.length} roasts)`}
            onView={(roast) => onRoastResume(roast)}
            customHeaderActions={
              !hideCompareButton && (
                <button
                  onClick={() => setShowGraph(true)}
                  disabled={selectedRoasts.length === 0}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  📊 Compare Selected ({selectedRoasts.length})
                </button>
              )
            }
          />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
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
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
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
