import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useEventEditing = (roast, getAuthToken, loadRoastEvents) => {
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEventFormData, setEditingEventFormData] = useState({});

  const startEditEvent = useCallback((event) => {
    setEditingEventId(event.id);
    setEditingEventFormData({
      kind: event.kind,
      fan_level: event.fan_level || '',
      heat_level: event.heat_level || '',
      temp_f: event.temp_f || '',
      note: event.note || ''
    });
  }, []);

  const cancelEditEvent = useCallback(() => {
    setEditingEventId(null);
    setEditingEventFormData({});
  }, []);

  const saveEditedEvent = useCallback(async (eventId) => {
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
        loadRoastEvents();
      } else {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }, [roast, editingEventFormData, getAuthToken, loadRoastEvents]);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roast.id}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadRoastEvents();
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }, [roast, getAuthToken, loadRoastEvents]);

  return {
    editingEventId,
    editingEventFormData,
    setEditingEventFormData,
    startEditEvent,
    cancelEditEvent,
    saveEditedEvent,
    deleteEvent
  };
};

export default useEventEditing;
