# RoastDetailPage Refactoring - Phase 5 DCSO
## Extract Custom Hooks and Business Logic

### **Design Goals**
- Separate business logic from UI components
- Create reusable custom hooks
- Improve testability of business logic
- Establish consistent data management patterns

### **Code Structure**

#### **1. useRoastData Hook**
```jsx
// hooks/useRoastData.js
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
```

#### **2. useRoastEditing Hook**
```jsx
// hooks/useRoastEditing.js
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
```

#### **3. useRoastActions Hook**
```jsx
// hooks/useRoastActions.js
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
```

#### **4. useTastingNotes Hook**
```jsx
// hooks/useTastingNotes.js
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
```

### **Implementation Steps**

1. **Create hooks directory structure**
   ```
   frontend/src/hooks/
   ├── useRoastData.js
   ├── useRoastEditing.js
   ├── useRoastActions.js
   └── useTastingNotes.js
   ```

2. **Extract business logic** - Move API calls and state management to hooks
3. **Update main component** - Use hooks instead of inline logic
4. **Test hook functionality** - Ensure all business logic works

### **Benefits**
- **Separation of Concerns**: Business logic separated from UI
- **Reusability**: Hooks can be used in other components
- **Testability**: Business logic can be tested independently
- **Maintainability**: Easier to modify business logic

### **Success Criteria**
- [ ] Data loading logic extracted to hook
- [ ] Editing logic extracted to hook
- [ ] Action logic extracted to hook
- [ ] Tasting notes logic extracted to hook
- [ ] All business logic works correctly

### **Estimated Effort**
- **Time**: 6-8 hours
- **Complexity**: High
- **Risk**: High (business logic is complex)
