import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useStarRating = (roast, getAuthToken) => {
  const [starRating, setStarRating] = useState(roast?.star_rating && roast?.star_rating !== null ? roast.star_rating : 0);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);

  // Update local state when roast changes
  useEffect(() => {
    console.log('useStarRating: roast changed, star_rating:', roast?.star_rating);
    if (roast?.star_rating !== undefined && roast?.star_rating !== null) {
      setStarRating(roast.star_rating);
    } else {
      setStarRating(0);
    }
  }, [roast?.star_rating]);

  const handleSaveRating = async (newRating) => {
    if (!roast?.id || !getAuthToken) return;

    console.log('Saving star rating:', newRating, 'for roast:', roast.id);
    setSavingRating(true);
    setRatingSaved(false);

    try {
      const token = await getAuthToken();
      const requestBody = {
        star_rating: newRating
      };
      
      console.log('Sending request body:', requestBody);
      
      const response = await fetch(`${API_BASE}/roasts/${roast.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);

      // Update the roast object with the new star_rating
      if (roast) {
        roast.star_rating = newRating;
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

  const handleClearRating = async () => {
    if (!roast?.id || !getAuthToken) return;

    console.log('Clearing star rating for roast:', roast.id);
    setSavingRating(true);
    setRatingSaved(false);

    try {
      const token = await getAuthToken();
      const requestBody = {
        star_rating: null
      };
      
      console.log('Sending clear request body:', requestBody);
      
      const response = await fetch(`${API_BASE}/roasts/${roast.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Clear response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Clear success response:', result);

      // Update the roast object with null star_rating
      if (roast) {
        roast.star_rating = null;
        console.log('Updated roast.star_rating to null:', roast.star_rating);
      }

      setStarRating(0);
      setRatingSaved(true);
      
      // Clear the saved indicator after 2 seconds
      setTimeout(() => setRatingSaved(false), 2000);
      
    } catch (error) {
      console.error('Error clearing star rating:', error);
      alert('Failed to clear rating. Please try again.');
    } finally {
      setSavingRating(false);
    }
  };

  return {
    starRating,
    setStarRating,
    savingRating,
    ratingSaved,
    handleRatingChange,
    handleSaveRating,
    handleClearRating
  };
};

export default useStarRating;
