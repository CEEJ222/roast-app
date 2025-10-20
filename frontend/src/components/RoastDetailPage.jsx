import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useSwipeGestures from '../hooks/useSwipeGestures';
import useClipboard from '../hooks/useClipboard';
import RoastOverviewCard from './roast-details/RoastOverviewCard';
import RoastWeightsCard from './roast-details/RoastWeightsCard';
import RoastNotesCard from './roast-details/RoastNotesCard';
import TastingNotesCard from './roast-details/TastingNotesCard';
import RoastDetailHeader from './roast-details/RoastDetailHeader';
import RoastCurveSection from './roast-details/RoastCurveSection';
import RoastEventsSection from './roast-details/RoastEventsSection';
import EnvironmentalConditionsCard from './roast-details/EnvironmentalConditionsCard';
import RoastActionMenu from './roast-details/RoastActionMenu';
import RoastDeleteModal from './roast-details/RoastDeleteModal';
import RoastShareModal from './roast-details/RoastShareModal';
import RoastFloatingActionButton from './roast-details/RoastFloatingActionButton';
import { formatDate } from '../utils/dateUtils';

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
        <RoastDetailHeader 
          roast={roast}
          isEditing={isEditing}
          onEdit={handleEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onCopyRoastData={handleCopyRoastData}
          onShare={() => setShowShareModal(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onClose={onClose}
        />

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Roast Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Roast Overview */}
              <RoastOverviewCard 
                roast={roast}
                isEditing={isEditing}
                editFormData={editFormData}
                onEditFormChange={setEditFormData}
              />

              {/* Weights */}
              <RoastWeightsCard 
                roast={roast}
                isEditing={isEditing}
                editFormData={editFormData}
                onEditFormChange={setEditFormData}
              />

              {/* Environmental Conditions */}
              <EnvironmentalConditionsCard 
                roast={roast}
                userProfile={userProfile}
              />

              {/* Notes */}
              <RoastNotesCard 
                roast={roast}
                isEditing={isEditing}
                editFormData={editFormData}
                onEditFormChange={setEditFormData}
              />

              {/* Tasting Notes */}
              <TastingNotesCard 
                roast={roast}
                tastingNotes={tastingNotes}
                onTastingNotesChange={setTastingNotes}
                onSaveTastingNotes={handleSaveTastingNotes}
                savingTastingNotes={savingTastingNotes}
                tastingNotesSaved={tastingNotesSaved}
              />
            </div>

            {/* Right Column - Roast Curve and Events */}
            <div className="lg:col-span-2 space-y-6">
              {/* Roast Curve */}
              <RoastCurveSection 
                roast={roast}
                events={events}
                userProfile={userProfile}
              />

              {/* Events Log */}
              <RoastEventsSection 
                events={events}
                isEditing={isEditing}
                editingEventId={editingEventId}
                editingEventFormData={editingEventFormData}
                setEditingEventFormData={setEditingEventFormData}
                startEditEvent={startEditEvent}
                saveEditedEvent={saveEditedEvent}
                cancelEditEvent={cancelEditEvent}
                deleteEvent={deleteEvent}
                formatTime={formatTime}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <RoastDeleteModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      {/* Share Modal */}
      <RoastShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCopyRoastData={handleCopyRoastData}
        onCopyEvents={handleCopyEvents}
      />

      {/* Floating Action Button */}
      <RoastFloatingActionButton 
        isEditing={isEditing}
        onActionMenuOpen={() => setShowActionMenu(true)}
      />

      {/* Action Menu Modal */}
      <RoastActionMenu 
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        onCopyRoastData={handleCopyRoastData}
        onShare={() => setShowShareModal(true)}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteConfirm(true)}
      />
    </div>
  );
};

export default RoastDetailPage;
