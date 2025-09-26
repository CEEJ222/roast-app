import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoastCurveGraph from './RoastCurveGraph';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const HistoricalRoasts = ({ onClose }) => {
  const { getAuthToken } = useAuth();
  const [roasts, setRoasts] = useState([]);
  const [selectedRoasts, setSelectedRoasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roastDetails, setRoastDetails] = useState({});
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
      const response = await fetch(`${API_BASE}/roasts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoasts(data);
      }
    } catch (error) {
      console.error('Error loading historical roasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoastDetails = async (roastId) => {
    if (roastDetails[roastId]) return; // Already loaded

    setLoadingDetails(true);
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
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleRoastSelection = (roastId) => {
    setSelectedRoasts(prev => {
      if (prev.includes(roastId)) {
        return prev.filter(id => id !== roastId);
      } else {
        // Load details if not already loaded
        loadRoastDetails(roastId);
        return [...prev, roastId];
      }
    });
  };

  // Load details for all selected roasts when selection changes
  useEffect(() => {
    selectedRoasts.forEach(roastId => {
      if (!roastDetails[roastId]) {
        loadRoastDetails(roastId);
      }
    });
  }, [selectedRoasts]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSelectedRoastsData = () => {
    const result = selectedRoasts.map(roastId => {
      const roast = roasts.find(r => r.id === roastId);
      const events = roastDetails[roastId] || [];
      console.log(`Roast ${roastId}:`, { roast, events: events.length });
      return {
        id: roastId,
        name: `${roast?.coffee_type || 'Unknown'}`,
        fullName: `${roast?.coffee_type || 'Unknown'} - ${formatDate(roast?.created_at)}`,
        events: events
      };
    });
    console.log('Selected roasts data:', result);
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading historical roasts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📊 Historical Roast Analysis</h2>
              <p className="opacity-90">Compare roast curves and analyze patterns</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {showGraph ? (
            /* Graph View */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  Roast Curve Comparison ({selectedRoasts.length} roasts selected)
                </h3>
                <button
                  onClick={() => setShowGraph(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  ← Back to List
                </button>
              </div>

              {selectedRoasts.length > 0 ? (
                loadingDetails ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading roast details...</p>
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
                <div className="text-center py-12 text-gray-500">
                  <p>Select roasts from the list to compare their curves</p>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  Your Roast History ({roasts.length} roasts)
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedRoasts(roasts.map(r => r.id))}
                    disabled={selectedRoasts.length === roasts.length}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Select All
                  </button>
                  <button
                    onClick={() => setShowGraph(true)}
                    disabled={selectedRoasts.length === 0}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📊 Compare Selected ({selectedRoasts.length})
                  </button>
                  <button
                    onClick={deleteSelectedRoasts}
                    disabled={selectedRoasts.length === 0 || deletingRoast === 'bulk'}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

              {roasts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">☕</div>
                  <p className="text-lg">No roasts found</p>
                  <p className="text-sm">Start roasting to see your history here!</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date/Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Coffee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Machine
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Weight Loss
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Roast Level
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roasts.map((roast) => (
                          <tr 
                            key={roast.id} 
                            className={`hover:bg-gray-50 cursor-pointer ${
                              selectedRoasts.includes(roast.id) ? 'bg-orange-50' : ''
                            }`}
                            onClick={() => toggleRoastSelection(roast.id)}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRoasts.includes(roast.id)}
                                onChange={() => toggleRoastSelection(roast.id)}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(roast.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{roast.coffee_type}</div>
                                {roast.coffee_region && (
                                  <div className="text-gray-500 text-xs">{roast.coffee_region}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {roast.machine_label || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDuration(roast.created_at, roast.updated_at)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {roast.desired_roast_level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(roast.id);
                                }}
                                disabled={deletingRoast === roast.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete roast"
                              >
                                {deletingRoast === roast.id ? '🗑️' : '🗑️'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Roast
              </h3>
              <p className="text-gray-600 mb-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Multiple Roasts
              </h3>
              <p className="text-gray-600 mb-6">
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

export default HistoricalRoasts;
