import React from 'react';
import EventsTable from '../../during_roast/EventsTable';

const RoastEventsSection = ({ 
  events, 
  isEditing, 
  editingEventId, 
  editingEventFormData, 
  setEditingEventFormData,
  startEditEvent,
  saveEditedEvent,
  cancelEditEvent,
  deleteEvent,
  formatTime 
}) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow">
      <div className="px-4 py-3 border-b dark:border-dark-border-primary">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
          Roast Events
        </h3>
      </div>
      <EventsTable
        events={events}
        formatTime={formatTime}
        editingEventId={isEditing ? editingEventId : null}
        editingFormData={editingEventFormData}
        setEditingFormData={setEditingEventFormData}
        startEditEvent={startEditEvent}
        saveEditedEvent={saveEditedEvent}
        cancelEdit={cancelEditEvent}
        deleteEvent={deleteEvent}
        readOnly={!isEditing}
        showActions={isEditing}
        className=""
      />
    </div>
  );
};

export default RoastEventsSection;
