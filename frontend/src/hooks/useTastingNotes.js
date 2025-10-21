import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useTastingNotes = (roast, getAuthToken) => {
  const [tastingNotes, setTastingNotes] = useState(roast?.tasting_notes || '');
  const [savingTastingNotes, setSavingTastingNotes] = useState(false);
  const [tastingNotesSaved, setTastingNotesSaved] = useState(false);

  const handleSaveTastingNotes = useCallback(async () => {
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
        roast.tasting_notes = tastingNotes;
        setTastingNotesSaved(true);
        setTimeout(() => setTastingNotesSaved(false), 3000);
        console.log('Tasting notes saved successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save tasting notes');
      }
    } catch (error) {
      console.error('Error saving tasting notes:', error);
      throw error;
    } finally {
      setSavingTastingNotes(false);
    }
  }, [roast, tastingNotes, getAuthToken]);

  return {
    tastingNotes,
    setTastingNotes,
    savingTastingNotes,
    tastingNotesSaved,
    handleSaveTastingNotes
  };
};

export default useTastingNotes;
