import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useRoastEditing = (roast, getAuthToken) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    desired_roast_level: roast?.desired_roast_level || '',
    weight_before_g: roast?.weight_before_g || '',
    weight_after_g: roast?.weight_after_g || '',
    notes: roast?.notes || ''
  });

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    try {
      const token = await getAuthToken();
      
      const updateData = {};
      
      // Only include fields that exist in roast_entries table and have actual values
      if (editFormData.desired_roast_level && editFormData.desired_roast_level.trim()) {
        updateData.desired_roast_level = editFormData.desired_roast_level.trim();
      }
      if (editFormData.weight_before_g && editFormData.weight_before_g.toString().trim()) {
        updateData.weight_before_g = parseFloat(editFormData.weight_before_g);
      }
      if (editFormData.weight_after_g && editFormData.weight_after_g.toString().trim()) {
        updateData.weight_after_g = parseFloat(editFormData.weight_after_g);
      }
      if (editFormData.notes && editFormData.notes.trim()) {
        updateData.notes = editFormData.notes.trim();
      }
      
      console.log('DEBUG: Sending update data:', updateData);
      console.log('DEBUG: Roast ID:', roast.id);
      
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
        Object.assign(roast, editFormData);
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('DEBUG: Save failed with response:', response.status, errorData);
        throw new Error(errorData.detail || `Failed to update roast (${response.status})`);
      }
    } catch (error) {
      console.error('Error updating roast:', error);
      throw error;
    }
  }, [roast, editFormData, getAuthToken]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditFormData({
      desired_roast_level: roast?.desired_roast_level || '',
      weight_before_g: roast?.weight_before_g || '',
      weight_after_g: roast?.weight_after_g || '',
      notes: roast?.notes || ''
    });
  }, [roast]);

  return {
    isEditing,
    editFormData,
    setEditFormData,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit
  };
};

export default useRoastEditing;

