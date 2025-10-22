import { useState, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

/**
 * Hook for lazy loading roast details when they come into view
 * @param {Function} getAuthToken - Function to get auth token
 * @returns {Object} - { loadRoastDetails, roastDetails, loading, error }
 */
const useLazyRoastDetails = (getAuthToken) => {
  const [roastDetails, setRoastDetails] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  const loadRoastDetails = useCallback(async (roastId) => {
    // Don't load if already loaded or currently loading
    if (roastDetails[roastId] || loading[roastId]) {
      return roastDetails[roastId];
    }

    setLoading(prev => ({ ...prev, [roastId]: true }));
    setError(prev => ({ ...prev, [roastId]: null }));

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
        return events;
      } else {
        throw new Error(`Failed to load roast details for roast ${roastId}`);
      }
    } catch (err) {
      console.error(`Error loading roast details for roast ${roastId}:`, err);
      setError(prev => ({
        ...prev,
        [roastId]: err.message
      }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [roastId]: false }));
    }
  }, [getAuthToken, roastDetails, loading]);

  const clearRoastDetails = useCallback((roastId) => {
    setRoastDetails(prev => {
      const newDetails = { ...prev };
      delete newDetails[roastId];
      return newDetails;
    });
    setLoading(prev => {
      const newLoading = { ...prev };
      delete newLoading[roastId];
      return newLoading;
    });
    setError(prev => {
      const newError = { ...prev };
      delete newError[roastId];
      return newError;
    });
  }, []);

  const clearAllRoastDetails = useCallback(() => {
    setRoastDetails({});
    setLoading({});
    setError({});
  }, []);

  return {
    loadRoastDetails,
    roastDetails,
    loading,
    error,
    clearRoastDetails,
    clearAllRoastDetails
  };
};

export default useLazyRoastDetails;
