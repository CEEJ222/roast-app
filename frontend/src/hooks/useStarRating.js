import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useStarRating = (roast, getAuthToken) => {
  const [starRating, setStarRating] = useState(roast?.star_rating || 0);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);

  // Update local state when roast changes
  useEffect(() => {
    if (roast?.star_rating !== undefined) {
      setStarRating(roast.star_rating);
    }
  }, [roast?.star_rating]);

  const handleSaveRating = async (newRating) => {
    if (!roast?.id || !getAuthToken) return;

    setSavingRating(true);
    setRatingSaved(false);

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/roasts/${roast.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          star_rating: newRating
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setStarRating(newRating);
      setRatingSaved(true);
      
      // Clear the saved indicator after 2 seconds
      setTimeout(() => setRatingSaved(false), 2000);
      
    } catch (error) {
      console.error('Error saving star rating:', error);
      // You could add a toast notification here
      alert('Failed to save rating. Please try again.');
    } finally {
      setSavingRating(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setStarRating(newRating);
    handleSaveRating(newRating);
  };

  return {
    starRating,
    setStarRating,
    savingRating,
    ratingSaved,
    handleRatingChange,
    handleSaveRating
  };
};

export default useStarRating;
