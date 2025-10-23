import React, { useState, memo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useSwipeGestures from '../../hooks/useSwipeGestures';
import useRoastData from '../../hooks/useRoastData';
import useRoastEditing from '../../hooks/useRoastEditing';
import useRoastActions from '../../hooks/useRoastActions';
import useTastingNotes from '../../hooks/useTastingNotes';
import useStarRating from '../../hooks/useStarRating';
import useEventEditing from '../../hooks/useEventEditing';
import MobileModal from '../shared/MobileModal';
import RoastOverviewCard from './components/RoastOverviewCard';
import RoastWeightsCard from './components/RoastWeightsCard';
import RoastNotesCard from './components/RoastNotesCard';
import TastingNotesCard from './components/TastingNotesCard';
import StarRatingCard from './components/StarRatingCard';
import RoastDetailsSection from './components/RoastDetailsSection';
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
  const { starRating, setStarRating, savingRating, ratingSaved, handleRatingChange, handleClearRating } = useStarRating(roast, getAuthToken);
  const { editingEventId, editingEventFormData, setEditingEventFormData, startEditEvent, cancelEditEvent, saveEditedEvent, deleteEvent } = useEventEditing(roast, getAuthToken, loadRoastEvents);
  
  // Swipe gestures for navigation
  const swipeRef = useSwipeGestures(
    () => console.log('Swipe left - previous roast'), // onSwipeLeft
    () => console.log('Swipe right - next roast'), // onSwipeRight
    null, // onSwipeUp
    null  // onSwipeDown
  );



  const formatDuration = (roast) => {
    // Try to get duration from roast events if available
    if (events && events.length > 0) {
      // Use COOL event as the end of roasting (not END event)
      const coolEvent = events.find(e => e.kind === 'COOL');
      if (coolEvent) {
        const duration = coolEvent.t_offset_sec;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Fallback to END event if no COOL event exists
      const endEvent = events.find(e => e.kind === 'END');
      if (endEvent) {
        const duration = endEvent.t_offset_sec;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    // Fallback to created_at vs updated_at if no events
    if (roast.created_at && roast.updated_at) {
      const duration = Math.floor((new Date(roast.updated_at) - new Date(roast.created_at)) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return 'N/A';
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

  // Create action buttons for the modal footer
  const renderActionButtons = (showOnMobile = true) => (
    <RoastActionButtons 
      isEditing={isEditing}
      onEdit={handleEdit}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onCopyRoastData={handleCopyRoastData}
      onShare={() => setShowShareModal(true)}
      onExport={handleExport}
      onDelete={() => setShowDeleteConfirm(true)}
      onClose={onClose}
      showOnMobile={showOnMobile}
    />
  );

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title={roast.bean_name || roast.bean_profile_name || 'Roast Details'}
      subtitle={roast.roast_name || `Roasted on ${formatDate(roast.created_at)}`}
      className="max-w-6xl"
      headerClassName="border-b border-gray-200 dark:border-gray-700"
      showCloseButton={true}
      headerActions={renderActionButtons(false)}
    >
      <div 
        ref={swipeRef}
        id="roast-detail"
      >
        {/* Header - Hidden since MobileModal provides its own header */}
        <div className="hidden">
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
        </div>

        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Roast Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Roast Overview */}
            <RoastOverviewCard 
              roast={roast}
              isEditing={isEditing}
              editFormData={editFormData}
              onEditFormChange={setEditFormData}
              events={events}
              formatDuration={formatDuration}
            />

            {/* Weights */}
            <RoastWeightsCard 
              roast={roast}
              isEditing={isEditing}
              editFormData={editFormData}
              onEditFormChange={setEditFormData}
            />

            {/* Star Rating */}
            <StarRatingCard 
              roast={roast}
              starRating={starRating}
              onRatingChange={handleRatingChange}
              onClearRating={handleClearRating}
              savingRating={savingRating}
              ratingSaved={ratingSaved}
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
    </MobileModal>
  );
};

export default memo(RoastDetailPage);

