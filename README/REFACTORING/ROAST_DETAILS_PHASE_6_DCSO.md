# RoastDetailPage Refactoring - Phase 6 DCSO
## Refactor Main Component and Final Integration

### **Design Goals**
- Simplify main component to orchestrate other components
- Reduce main component from 815 lines to ~200 lines
- Improve readability and maintainability
- Establish clean component composition patterns

### **Code Structure**

#### **1. Refactored Main Component**
```jsx
// components/RoastDetailPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useSwipeGestures from '../hooks/useSwipeGestures';
import useRoastData from '../hooks/useRoastData';
import useRoastEditing from '../hooks/useRoastEditing';
import useRoastActions from '../hooks/useRoastActions';
import useTastingNotes from '../hooks/useTastingNotes';

// Import all the new components
import RoastDetailHeader from './roast-details/RoastDetailHeader';
import RoastOverviewCard from './roast-details/RoastOverviewCard';
import RoastWeightsCard from './roast-details/RoastWeightsCard';
import RoastNotesCard from './roast-details/RoastNotesCard';
import TastingNotesCard from './roast-details/TastingNotesCard';
import EnvironmentalConditionsCard from './roast-details/EnvironmentalConditionsCard';
import RoastCurveSection from './roast-details/RoastCurveSection';
import RoastEventsSection from './roast-details/RoastEventsSection';
import RoastActionMenu from './roast-details/RoastActionMenu';
import RoastDeleteModal from './roast-details/RoastDeleteModal';
import RoastShareModal from './roast-details/RoastShareModal';
import RoastFloatingActionButton from './roast-details/RoastFloatingActionButton';

const RoastDetailPage = ({ roast, onClose, userProfile }) => {
  const { getAuthToken } = useAuth();
  
  // State for modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Event editing state
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEventFormData, setEditingEventFormData] = useState({});

  // Custom hooks
  const { events, loading, error, loadRoastEvents } = useRoastData(roast, getAuthToken);
  const { 
    isEditing, 
    editFormData, 
    setEditFormData, 
    handleEdit, 
    handleSaveEdit, 
    handleCancelEdit 
  } = useRoastEditing(roast, getAuthToken);
  const { handleDelete, handleCopyRoastData, handleCopyEvents } = useRoastActions(roast, getAuthToken, onClose);
  const { 
    tastingNotes, 
    setTastingNotes, 
    savingTastingNotes, 
    tastingNotesSaved, 
    handleSaveTastingNotes 
  } = useTastingNotes(roast, getAuthToken);

  // Swipe gestures for navigation
  const swipeRef = useSwipeGestures(
    () => console.log('Swipe left - previous roast'),
    () => console.log('Swipe right - next roast'),
    null,
    null
  );

  // Utility functions
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Event editing functions
  const startEditEvent = (event) => {
    setEditingEventId(event.id);
    setEditingEventFormData({
      kind: event.kind,
      fan_level: event.fan_level || '',
      heat_level: event.heat_level || '',
      temp_f: event.temp_f || '',
      note: event.note || ''
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setEditingEventFormData({});
  };

  const saveEditedEvent = async (eventId) => {
    // Implementation moved to hook or service
  };

  const deleteEvent = async (eventId) => {
    // Implementation moved to hook or service
  };

  // Loading and error states
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onClose={onClose} />;
  }

  if (!roast || !roast.id) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div 
        ref={swipeRef}
        className="bg-white dark:bg-dark-card rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl dark:shadow-dark-glow"
        id="roast-detail"
      >
        {/* Header */}
        <RoastDetailHeader
          roast={roast}
          isEditing={isEditing}
          onEdit={handleEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onCopyRoastData={handleCopyRoastData}
          onShare={() => setShowShareModal(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onClose={onClose}
        />

        {/* Main Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Roast Info */}
            <div className="lg:col-span-1 space-y-6">
              <RoastOverviewCard
                roast={roast}
                isEditing={isEditing}
                editFormData={editFormData}
                onEditFormChange={setEditFormData}
              />
              
              <RoastWeightsCard
                roast={roast}
                isEditing={isEditing}
                editFormData={editFormData}
                onEditFormChange={setEditFormData}
              />
              
              <EnvironmentalConditionsCard
                roast={roast}
                userProfile={userProfile}
              />
              
              <RoastNotesCard
                roast={roast}
                isEditing={isEditing}
                editFormData={editFormData}
                onEditFormChange={setEditFormData}
              />
              
              <TastingNotesCard
                roast={roast}
                tastingNotes={tastingNotes}
                onTastingNotesChange={setTastingNotes}
                onSaveTastingNotes={handleSaveTastingNotes}
                savingTastingNotes={savingTastingNotes}
                tastingNotesSaved={tastingNotesSaved}
              />
            </div>

            {/* Right Column - Roast Curve and Events */}
            <div className="lg:col-span-2 space-y-6">
              <RoastCurveSection
                roast={roast}
                events={events}
                userProfile={userProfile}
              />
              
              <RoastEventsSection
                events={events}
                isEditing={isEditing}
                editingEventId={editingEventId}
                editingEventFormData={editingEventFormData}
                setEditingEventFormData={setEditingEventFormData}
                startEditEvent={startEditEvent}
                saveEditedEvent={saveEditedEvent}
                cancelEditEvent={cancelEditEvent}
                deleteEvent={deleteEvent}
                formatTime={formatTime}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RoastDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      <RoastShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCopyRoastData={handleCopyRoastData}
        onCopyEvents={() => handleCopyEvents(events, formatTime)}
      />

      <RoastActionMenu
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        onCopyRoastData={handleCopyRoastData}
        onShare={() => setShowShareModal(true)}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <RoastFloatingActionButton
        isEditing={isEditing}
        onActionMenuOpen={() => setShowActionMenu(true)}
      />
    </div>
  );
};

export default RoastDetailPage;
```

#### **2. Loading and Error State Components**
```jsx
// components/roast-details/LoadingState.jsx
const LoadingState = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-dark-card rounded-lg p-8 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-dark-accent-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-dark-text-secondary">Loading roast details...</p>
      </div>
    </div>
  </div>
);

// components/roast-details/ErrorState.jsx
const ErrorState = ({ error, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-dark-card rounded-lg p-8 max-w-md mx-4 shadow-2xl dark:shadow-dark-glow">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Error</h3>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{error}</p>
        <button
          onClick={onClose}
          className="bg-gray-500 dark:bg-dark-bg-tertiary text-white dark:text-dark-text-primary px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-dark-bg-quaternary transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);
```

### **Implementation Steps**

1. **Create final component structure**
   ```
   frontend/src/components/roast-details/
   ├── LoadingState.jsx
   └── ErrorState.jsx
   ```

2. **Refactor main component** - Replace all inline JSX with component imports
3. **Test integration** - Ensure all components work together
4. **Performance optimization** - Add React.memo where appropriate

### **Benefits**
- **Maintainability**: Main component is now ~200 lines vs 815
- **Readability**: Clear component composition
- **Testability**: Each component can be tested independently
- **Reusability**: Components can be used in other parts of the app

### **Success Criteria**
- [ ] Main component reduced to ~200 lines
- [ ] All functionality preserved
- [ ] Components are properly integrated
- [ ] Performance is maintained or improved
- [ ] Code is more maintainable

### **Estimated Effort**
- **Time**: 4-6 hours
- **Complexity**: Medium
- **Risk**: Medium (integration can be complex)
