import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useRoastData = (roast, getAuthToken) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRoastEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!roast || !roast.id) {
        throw new Error('Roast ID is missing');
      }
      
      const token = await getAuthToken();
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
  }, [roast, getAuthToken]);

  useEffect(() => {
    if (roast && roast.id) {
      loadRoastEvents();
    }
  }, [roast, loadRoastEvents]);

  return {
    events,
    loading,
    error,
    loadRoastEvents
  };
};

export default useRoastData;
