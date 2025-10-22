import { useCallback } from 'react';
import useClipboard from './useClipboard';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useRoastActions = (roast, getAuthToken, onClose) => {
  const { copyRoastData, copyRoastEvents } = useClipboard();

  const handleDelete = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roast.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      } else {
        throw new Error('Failed to delete roast');
      }
    } catch (error) {
      console.error('Error deleting roast:', error);
      throw error;
    }
  }, [roast, getAuthToken, onClose]);

  const handleCopyRoastData = useCallback(async () => {
    const success = await copyRoastData(roast);
    if (success) {
      console.log('Roast data copied to clipboard');
    }
  }, [roast, copyRoastData]);

  const handleCopyEvents = useCallback(async (events, formatTime) => {
    const success = await copyRoastEvents(events, formatTime);
    if (success) {
      console.log('Roast events copied to clipboard');
    }
  }, [copyRoastEvents]);

  return {
    handleDelete,
    handleCopyRoastData,
    handleCopyEvents
  };
};

export default useRoastActions;

