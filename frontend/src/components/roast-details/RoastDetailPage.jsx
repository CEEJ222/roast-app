import React, { useState, memo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useSwipeGestures from '../../hooks/useSwipeGestures';
import useRoastData from '../../hooks/useRoastData';
import useRoastEditing from '../../hooks/useRoastEditing';
import useRoastActions from '../../hooks/useRoastActions';
import useTastingNotes from '../../hooks/useTastingNotes';
import useEventEditing from '../../hooks/useEventEditing';
import RoastOverviewCard from './components/RoastOverviewCard';
import RoastWeightsCard from './components/RoastWeightsCard';
import RoastNotesCard from './components/RoastNotesCard';
import TastingNotesCard from './components/TastingNotesCard';
import RoastDetailHeader from './components/RoastDetailHeader';
import RoastActionButtons from './components/RoastActionButtons';
import RoastCurveSection from './components/RoastCurveSection';
import RoastEventsSection from './components/RoastEventsSection';
import EnvironmentalConditionsCard from './components/EnvironmentalConditionsCard';
import RoastActionMenu from './components/RoastActionMenu';
import RoastFloatingActionButton from './components/RoastFloatingActionButton';
import RoastDeleteModal from './components/RoastDeleteModal';
import RoastShareModal from './components/RoastShareModal';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { formatDate } from '../../utils/dateUtils';
import { exportRoastDetails } from '../../utils/csvExport';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const RoastDetailPage = ({ roast, onClose, userProfile }) => {
  const { getAuthToken } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom hooks for business logic
  const { events, loading, error, loadRoastEvents } = useRoastData(roast, getAuthToken);
  const { isEditing, editFormData, setEditFormData, handleEdit, handleSaveEdit, handleCancelEdit } = useRoastEditing(roast, getAuthToken);
  const { handleDelete, handleCopyRoastData, handleCopyEvents } = useRoastActions(roast, getAuthToken, onClose);
  const { tastingNotes, setTastingNotes, savingTastingNotes, tastingNotesSaved, handleSaveTastingNotes } = useTastingNotes(roast, getAuthToken);
  const { editingEventId, editingEventFormData, setEditingEventFormData, startEditEvent, cancelEditEvent, saveEditedEvent, deleteEvent } = useEventEditing(roast, getAuthToken, loadRoastEvents);
  
  // Swipe gestures for navigation
  const swipeRef = useSwipeGestures(
    () => console.log('Swipe left - previous roast'), // onSwipeLeft
    () => console.log('Swipe right - next roast'), // onSwipeRight
    null, // onSwipeUp
    null  // onSwipeDown
  );



  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // CSV Export functionality
  const handleExport = () => {
    try {
      exportRoastDetails(roast, events, userProfile);
    } catch (error) {
      console.error('Error exporting roast:', error);
      // You could add a toast notification here if you have one
      alert('Failed to export roast data. Please try again.');
    }
  };



  // Loading and error states
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onClose={onClose} />;
  }

  if (!roast || !roast.id) {
    console.log('DEBUG: RoastDetailPage - Missing roast or roast.id:', { roast, hasId: roast?.id });
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

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Roast Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Roast Overview */}
            <RoastOverviewCard 
              roast={roast}
              isEditing={isEditing}
              editFormData={editFormData}
              onEditFormChange={setEditFormData}
            />

            {/* Weights */}
            <RoastWeightsCard 
              roast={roast}
              isEditing={isEditing}
              editFormData={editFormData}
              onEditFormChange={setEditFormData}
            />

            {/* Environmental Conditions */}
            <EnvironmentalConditionsCard 
              roast={roast}
              userProfile={userProfile}
            />

            {/* Notes */}
            <RoastNotesCard 
              roast={roast}
              isEditing={isEditing}
              editFormData={editFormData}
              onEditFormChange={setEditFormData}
            />

            {/* Tasting Notes */}
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
            {/* Roast Curve */}
            <RoastCurveSection 
              roast={roast}
              events={events}
              userProfile={userProfile}
            />

            {/* Events Log */}
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

      {/* Delete Confirmation Modal */}
      <RoastDeleteModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      {/* Share Modal */}
      <RoastShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCopyRoastData={handleCopyRoastData}
        onCopyEvents={() => handleCopyEvents(events, formatTime)}
      />

      {/* Floating Action Button */}
      <RoastFloatingActionButton 
        isEditing={isEditing}
        onActionMenuOpen={() => setShowActionMenu(true)}
      />

      {/* Action Menu Modal */}
      <RoastActionMenu 
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        onCopyRoastData={handleCopyRoastData}
        onShare={() => setShowShareModal(true)}
        onExport={handleExport}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteConfirm(true)}
        onEditBeanProfile={() => {
          // Navigate to bean profile edit
          console.log('Edit bean profile clicked for roast:', roast);
          // TODO: Implement bean profile editing
        }}
        roast={roast}
      />
    </div>
  );
};

export default memo(RoastDetailPage);

