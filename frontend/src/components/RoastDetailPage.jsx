import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoastCurveGraph from './shared/RoastCurveGraph';
import EnvironmentalConditions from './shared/EnvironmentalConditions';
import EventsTable from './during_roast/EventsTable';
import useSwipeGestures from '../hooks/useSwipeGestures';
import useClipboard from '../hooks/useClipboard';
import BottomSheetModal from './shared/BottomSheetModal';
import FloatingActionButton from './shared/FloatingActionButton';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const RoastDetailPage = ({ roast, onClose, userProfile }) => {
  const { getAuthToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [editFormData, setEditFormData] = useState({
    coffee_type: roast?.coffee_type || '',
    coffee_region: roast?.coffee_region || '',
    coffee_process: roast?.coffee_process || '',
    desired_roast_level: roast?.desired_roast_level || '',
    weight_before_g: roast?.weight_before_g || '',
    weight_after_g: roast?.weight_after_g || '',
    notes: roast?.notes || ''
  });
  
  // Hooks for mobile features
  const { copyRoastData, copyRoastEvents } = useClipboard();
  
  // Swipe gestures for navigation
  const swipeRef = useSwipeGestures(
    () => console.log('Swipe left - previous roast'), // onSwipeLeft
    () => console.log('Swipe right - next roast'), // onSwipeRight
    null, // onSwipeUp
    null  // onSwipeDown
  );
  
  // Tasting notes state
  const [tastingNotes, setTastingNotes] = useState(roast?.tasting_notes || '');
  const [savingTastingNotes, setSavingTastingNotes] = useState(false);
  const [tastingNotesSaved, setTastingNotesSaved] = useState(false);
  
  // Event editing state
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEventFormData, setEditingEventFormData] = useState({});

  useEffect(() => {
    if (roast && roast.id) {
      loadRoastEvents();
    }
  }, [roast]);

  const loadRoastEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Debug: Check if roast and roast.id exist
      console.log('DEBUG: Roast object:', roast);
      console.log('DEBUG: Roast ID:', roast?.id);
      
      if (!roast || !roast.id) {
        throw new Error('Roast ID is missing');
      }
      
      const token = await getAuthToken();
      
      // Load events for this roast
      const eventsResponse = await fetch(`${API_BASE}/roasts/${roast.id}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      } else {
        throw new Error('Failed to load roast events');
      }
    } catch (error) {
      console.error('Error loading roast events:', error);
      setError('Failed to load roast events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roast.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        onClose(); // Close the modal
        // You might want to refresh the roast list here
        window.location.reload(); // Simple refresh for now
      } else {
        throw new Error('Failed to delete roast');
      }
    } catch (error) {
      console.error('Error deleting roast:', error);
      setError('Failed to delete roast. Please try again.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const token = await getAuthToken();
      
      // Send all editable fields
      const updateData = {
        coffee_type: editFormData.coffee_type || null,
        coffee_region: editFormData.coffee_region || null,
        coffee_process: editFormData.coffee_process || null,
        desired_roast_level: editFormData.desired_roast_level || null,
        weight_before_g: editFormData.weight_before_g ? parseFloat(editFormData.weight_before_g) : null,
        weight_after_g: editFormData.weight_after_g ? parseFloat(editFormData.weight_after_g) : null,
        notes: editFormData.notes || null
      };
      
      const response = await fetch(`${API_BASE}/roasts/${roast.id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setIsEditing(false);
        // Update the roast object with new data
        Object.assign(roast, editFormData);
        window.location.reload(); // Simple refresh for now
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update roast');
      }
    } catch (error) {
      console.error('Error updating roast:', error);
      setError(`Failed to update roast: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      coffee_type: roast?.coffee_type || '',
      coffee_region: roast?.coffee_region || '',
      coffee_process: roast?.coffee_process || '',
      desired_roast_level: roast?.desired_roast_level || '',
      weight_before_g: roast?.weight_before_g || '',
      weight_after_g: roast?.weight_after_g || '',
      notes: roast?.notes || ''
    });
  };

  const handleSaveTastingNotes = async () => {
    try {
      setSavingTastingNotes(true);
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE}/roasts/${roast.id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tasting_notes: tastingNotes
        })
      });

      if (response.ok) {
        // Update the roast object with new tasting notes
        roast.tasting_notes = tastingNotes;
        setTastingNotesSaved(true);
        // Hide success message after 3 seconds
        setTimeout(() => setTastingNotesSaved(false), 3000);
        console.log('Tasting notes saved successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save tasting notes');
      }
    } catch (error) {
      console.error('Error saving tasting notes:', error);
      setError(`Failed to save tasting notes: ${error.message}`);
    } finally {
      setSavingTastingNotes(false);
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Clipboard functionality
  const handleCopyRoastData = async () => {
    const success = await copyRoastData(roast);
    if (success) {
      // Show success feedback
      console.log('Roast data copied to clipboard');
    }
  };

  const handleCopyEvents = async () => {
    const success = await copyRoastEvents(events, formatTime);
    if (success) {
      console.log('Roast events copied to clipboard');
    }
  };

  // Event editing functions
  const startEditEvent = (event) => {
    setEditingEventId(event.id);
    setEditingEventFormData({
      kind: event.kind,
      fan_level: event.fan_level || '',
      heat_level: event.heat_level || '',
      temp_f: event.temp_f || '',
      note: event.note || ''
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setEditingEventFormData({});
  };

  const saveEditedEvent = async (eventId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roast.id}/events/${eventId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kind: editingEventFormData.kind,
          fan_level: editingEventFormData.fan_level ? parseInt(editingEventFormData.fan_level) : null,
          heat_level: editingEventFormData.heat_level ? parseInt(editingEventFormData.heat_level) : null,
          temp_f: editingEventFormData.temp_f ? parseFloat(editingEventFormData.temp_f) : null,
          note: editingEventFormData.note || null
        })
      });

      if (response.ok) {
        setEditingEventId(null);
        setEditingEventFormData({});
        // Reload events to get updated data
        loadRoastEvents();
      } else {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setError(`Failed to update event: ${error.message}`);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roast.id}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Reload events to get updated data
        loadRoastEvents();
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(`Failed to delete event: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-dark-card rounded-lg p-8 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-dark-accent-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-dark-text-secondary">Loading roast details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-dark-card rounded-lg p-8 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Error</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 dark:bg-dark-bg-tertiary text-white dark:text-dark-text-primary px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-dark-bg-quaternary transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roast || !roast.id) {
    console.log('DEBUG: RoastDetailPage - Missing roast or roast.id:', { roast, hasId: roast?.id });
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div 
        ref={swipeRef}
        className="bg-white dark:bg-dark-card rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl dark:shadow-dark-glow"
        id="roast-detail"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-4 sm:px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0 mr-2">
              <h2 className="text-xl sm:text-2xl font-bold">☕ Roast Details</h2>
              <p className="opacity-90 text-sm sm:text-base truncate max-w-full">{roast.bean_profile_name || roast.coffee_type || 'Unknown Coffee'} • {formatDate(roast.created_at)}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-green-500/80 hover:bg-green-500 text-white px-1.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500/80 hover:bg-gray-500 text-white px-1.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    ❌ Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCopyRoastData}
                    className="bg-blue-500/80 hover:bg-blue-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
                    title="Copy roast data"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-green-500/80 hover:bg-green-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
                    title="Share roast"
                  >
                    📤 Share
                  </button>
                  <button
                    onClick={handleEdit}
                    className="bg-purple-500/80 hover:bg-purple-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
                    title="Edit roast"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-500/80 hover:bg-red-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline"
                    title="Delete roast"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-xl sm:text-2xl font-bold p-1"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Roast Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Roast Overview */}
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Roast Overview</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Coffee Type:</label>
                      <input
                        type="text"
                        value={editFormData.coffee_type}
                        onChange={(e) => setEditFormData({...editFormData, coffee_type: e.target.value})}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Coffee Region:</label>
                      <input
                        type="text"
                        value={editFormData.coffee_region}
                        onChange={(e) => setEditFormData({...editFormData, coffee_region: e.target.value})}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Process:</label>
                      <input
                        type="text"
                        value={editFormData.coffee_process}
                        onChange={(e) => setEditFormData({...editFormData, coffee_process: e.target.value})}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Target Roast:</label>
                      <input
                        type="text"
                        value={editFormData.desired_roast_level}
                        onChange={(e) => setEditFormData({...editFormData, desired_roast_level: e.target.value})}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Machine:</span>
                      <p className="text-gray-900 dark:text-dark-text-primary">{roast.machine_label || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-1">Machine cannot be changed after roast creation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Coffee:</span>
                      <p className="text-gray-900 dark:text-dark-text-primary">
                        {roast.bean_profile_name || roast.coffee_type || 'Not specified'}
                      </p>
                      {roast.coffee_region && (
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{roast.coffee_region}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Process:</span>
                      <p className="text-gray-900 dark:text-dark-text-primary">{roast.coffee_process || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Target Roast:</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-sm font-medium">
                        {roast.desired_roast_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Machine:</span>
                      <p className="text-gray-900 dark:text-dark-text-primary">{roast.machine_label || 'Unknown'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Weights */}
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Weights</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Weight Before (g):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.weight_before_g}
                        onChange={(e) => setEditFormData({...editFormData, weight_before_g: e.target.value})}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
                        placeholder="Enter initial weight..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">Weight After (g):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.weight_after_g}
                        onChange={(e) => setEditFormData({...editFormData, weight_after_g: e.target.value})}
                        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-secondary"
                        placeholder="Enter final weight..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Weight Before:</span>
                      <p className="text-gray-900 dark:text-dark-text-primary">{roast.weight_before_g ? `${roast.weight_before_g}g` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Weight After:</span>
                      <p className="text-gray-900 dark:text-dark-text-primary">{roast.weight_after_g ? `${roast.weight_after_g}g` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Weight Loss:</span>
                      <p className="text-gray-900 dark:text-dark-text-primary">
                        {roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Environmental Conditions */}
              {(roast.temperature_c || roast.temperature_f || roast.humidity_pct) && (
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Environmental Conditions</h3>
                  <EnvironmentalConditions 
                    conditions={{
                      temperature_c: roast.temperature_c,
                      temperature_f: roast.temperature_f,
                      humidity_pct: roast.humidity_pct,
                      elevation_m: roast.elevation_m,
                      elevation_ft: roast.elevation_ft,
                      pressure_hpa: roast.pressure_hpa,
                      as_of: roast.as_of,
                      timezone: roast.timezone,
                      timezone_abbreviation: roast.timezone_abbreviation
                    }}
                    units={userProfile?.units}
                    userProfile={userProfile}
                  />
                </div>
              )}

              {/* Notes */}
              {(roast.notes || isEditing) && (
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Roast Notes</h3>
                  {isEditing ? (
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                      className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      rows={4}
                      placeholder="Add notes about this roast..."
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-dark-text-primary whitespace-pre-wrap">{roast.notes}</p>
                  )}
                </div>
              )}

              {/* Tasting Notes */}
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Tasting Notes</h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
                  Add your tasting notes after trying this coffee
                </p>
                <textarea
                  value={tastingNotes}
                  onChange={(e) => setTastingNotes(e.target.value)}
                  placeholder="How did this roast taste? Any flavor notes, acidity, body, or other observations..."
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary"
                  rows={4}
                />
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSaveTastingNotes}
                    disabled={savingTastingNotes}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingTastingNotes ? 'Saving...' : 'Save Tasting Notes'}
                  </button>
                  {tastingNotesSaved && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1">
                      ✅ Saved!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Roast Curve and Events */}
            <div className="lg:col-span-2 space-y-6">
              {/* Roast Curve */}
              <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="px-4 py-3 border-b dark:border-dark-border-primary">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">Roast Curve</h3>
                </div>
                <div className="p-4">
                  <RoastCurveGraph
                    data={[{ id: roast?.id, name: roast?.bean_profile_name || 'Roast', events: events }]}
                    mode="historical"
                    showROR={true}
                    showMilestones={true}
                    height={300}
                    title=""
                    units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
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
              </div>

              {/* Events Log */}
              <div className="bg-white dark:bg-dark-card rounded-lg shadow">
                <div className="px-4 py-3 border-b dark:border-dark-border-primary">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">Roast Events</h3>
                </div>
                <EventsTable
                  events={events}
                  formatTime={formatTime}
                  editingEventId={isEditing ? editingEventId : null}
                  editingFormData={editingEventFormData}
                  setEditingFormData={setEditingEventFormData}
                  startEditEvent={startEditEvent}
                  saveEditedEvent={saveEditedEvent}
                  cancelEdit={cancelEditEvent}
                  deleteEvent={deleteEvent}
                  readOnly={!isEditing}
                  showActions={isEditing}
                  className=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🗑️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">Delete Roast</h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-dark-text-secondary mb-6">
              Are you sure you want to delete this roast? All roast data, events, and notes will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete Roast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <BottomSheetModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Roast"
      >
        <div className="space-y-4">
          <button
            onClick={handleCopyRoastData}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-3"
          >
            📋 Copy Roast Summary
          </button>
          <button
            onClick={handleCopyEvents}
            className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-3"
          >
            📊 Copy Roast Events
          </button>
          <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Use these options to share your roast data via text, email, or other apps.
          </div>
        </div>
      </BottomSheetModal>

      {/* Floating Action Button */}
      {!isEditing && (
        <FloatingActionButton
          onClick={() => setShowActionMenu(true)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          label="Roast Actions"
        />
      )}

      {/* Action Menu Modal */}
      <BottomSheetModal
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        title="Roast Actions"
      >
        <div className="space-y-4">
          <button
            onClick={() => {
              handleCopyRoastData();
              setShowActionMenu(false);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-3 text-left"
          >
            <span className="text-2xl">📋</span>
            <div>
              <div className="font-semibold text-lg">Copy Roast Data</div>
              <div className="text-sm opacity-90">Copy roast summary to clipboard</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              setShowShareModal(true);
              setShowActionMenu(false);
            }}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-3 text-left"
          >
            <span className="text-2xl">📤</span>
            <div>
              <div className="font-semibold text-lg">Share Roast</div>
              <div className="text-sm opacity-90">Share roast data with others</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              handleEdit();
              setShowActionMenu(false);
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center gap-3 text-left"
          >
            <span className="text-2xl">✏️</span>
            <div>
              <div className="font-semibold text-lg">Edit Roast</div>
              <div className="text-sm opacity-90">Modify roast details</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              setShowDeleteConfirm(true);
              setShowActionMenu(false);
            }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-colors flex items-center gap-3 text-left"
          >
            <span className="text-2xl">🗑️</span>
            <div>
              <div className="font-semibold text-lg">Delete Roast</div>
              <div className="text-sm opacity-90">Permanently remove this roast</div>
            </div>
          </button>
        </div>
      </BottomSheetModal>
    </div>
  );
};

export default RoastDetailPage;
