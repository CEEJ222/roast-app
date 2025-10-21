import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const useRoastEditing = (roast, getAuthToken) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    coffee_type: roast?.coffee_type || '',
    coffee_region: roast?.coffee_region || '',
    coffee_process: roast?.coffee_process || '',
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
        Object.assign(roast, editFormData);
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update roast');
      }
    } catch (error) {
      console.error('Error updating roast:', error);
      throw error;
    }
  }, [roast, editFormData, getAuthToken]);

  const handleCancelEdit = useCallback(() => {
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
