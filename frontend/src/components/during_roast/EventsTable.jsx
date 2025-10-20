import React from 'react';
import CustomDropdown from '../ux_ui/CustomDropdown';

const EventsTable = ({ 
  events,
  formatTime,
  editingEventId,
  editingFormData,
  setEditingFormData,
  startEditEvent,
  saveEditedEvent,
  cancelEdit,
  deleteEvent,
  readOnly = false,
  showActions = true,
  className = ""
}) => {
  // Helper function to get event type styling
  const getEventTypeStyle = (kind) => {
    switch (kind) {
      case 'SET': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'FIRST_CRACK': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'SECOND_CRACK': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'COOL': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      case 'END': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'PAUSE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'RESUME': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  // Mobile card component for individual events - Compact version
  const EventCard = ({ event, index }) => {
    const isEditing = editingEventId === event.id;
    
    return (
      <div className={`px-3 py-2 border-b border-gray-200 dark:border-dark-border-primary ${
        index % 2 === 0 
          ? 'bg-white dark:bg-dark-bg-secondary' 
          : 'bg-gray-50 dark:bg-dark-bg-tertiary'
      }`}>
        {/* Compact horizontal layout */}
        <div className="flex items-center justify-between gap-2">
          {/* Left side - Time and Event Type */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="font-mono text-xs font-medium text-gray-900 dark:text-dark-text-primary whitespace-nowrap">
              {formatTime(event.t_offset_sec)}
            </div>
            {!readOnly && isEditing ? (
              <CustomDropdown
                options={['SET', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'PAUSE', 'RESUME', 'END']}
                value={editingFormData.kind}
                onChange={(value) => setEditingFormData(prev => ({ ...prev, kind: value }))}
                placeholder="Select event type..."
                className="text-xs min-w-0"
              />
            ) : (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getEventTypeStyle(event.kind)}`}>
                {event.kind.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Center - Data in compact format */}
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-dark-text-secondary">
            <span>F:{event.fan_level ?? '—'}</span>
            <span>H:{event.heat_level ?? '—'}</span>
            <span>T:{event.temp_f ?? '—'}</span>
          </div>

          {/* Right side - Actions or Note preview */}
          <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
            {showActions && !readOnly ? (
              isEditing ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => saveEditedEvent(event.id)}
                    className="px-2 py-1 text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 rounded transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditEvent(event)}
                    className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 rounded transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              )
            ) : (
              <div className="text-xs text-gray-500 dark:text-dark-text-tertiary truncate max-w-20">
                {event.note || ''}
              </div>
            )}
          </div>
        </div>

        {/* Expanded editing mode - Only show when editing */}
        {!readOnly && isEditing && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-border-primary">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">Fan</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={editingFormData.fan_level}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, fan_level: e.target.value }))}
                  className="w-full text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">Heat</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={editingFormData.heat_level}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, heat_level: e.target.value }))}
                  className="w-full text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">Temp °F</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingFormData.temp_f}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, temp_f: e.target.value }))}
                  className="w-full text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">Note</label>
                <input
                  type="text"
                  value={editingFormData.note}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                  placeholder="Note"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${className} ${readOnly ? 'bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden' : 'flex-1 max-w-4xl bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-dark-glow overflow-hidden'}`}>
      {!readOnly && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-b dark:border-dark-border-primary">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">Roast Event Log</h3>
        </div>
      )}
      
      {/* Mobile view - Compact Cards */}
      <div className="block md:hidden">
        {events.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-dark-text-tertiary">
            {readOnly ? 'No events recorded for this roast.' : 'No events logged yet. Start making adjustments!'}
          </div>
        ) : (
          events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))
        )}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden md:block overflow-x-auto text-sm sm:text-base">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
            <tr>
              <th className={`px-4 py-2 text-left ${readOnly ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-dark-text-primary ${readOnly ? 'uppercase tracking-wider' : ''}`}>Time</th>
              <th className={`px-4 py-2 text-left ${readOnly ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-dark-text-primary ${readOnly ? 'uppercase tracking-wider' : ''}`}>Event</th>
              <th className={`px-4 py-2 text-left ${readOnly ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-dark-text-primary ${readOnly ? 'uppercase tracking-wider' : ''}`}>Fan</th>
              <th className={`px-4 py-2 text-left ${readOnly ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-dark-text-primary ${readOnly ? 'uppercase tracking-wider' : ''}`}>Heat</th>
              <th className={`px-4 py-2 text-left ${readOnly ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-dark-text-primary ${readOnly ? 'uppercase tracking-wider' : ''}`}>{readOnly ? 'Temp' : 'Temp °F'}</th>
              <th className={`px-4 py-2 text-left ${readOnly ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-dark-text-primary ${readOnly ? 'uppercase tracking-wider' : ''}`}>Note</th>
              {showActions && !readOnly && (
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text-primary">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border-primary">
            {events.length === 0 ? (
              <tr>
                <td colSpan={showActions && !readOnly ? 7 : 6} className="px-4 py-8 text-center text-gray-500 dark:text-dark-text-tertiary">
                  {readOnly ? 'No events recorded for this roast.' : 'No events logged yet. Start making adjustments!'}
                </td>
              </tr>
            ) : (
              events.map((event, index) => (
                <tr key={event.id} className={index % 2 === 0 ? 'bg-white dark:bg-dark-bg-secondary' : 'bg-gray-50 dark:bg-dark-bg-tertiary'}>
                  <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-dark-text-primary">{formatTime(event.t_offset_sec)}</td>
                  <td className="px-4 py-2 text-sm">
                    {!readOnly && editingEventId === event.id ? (
                      <CustomDropdown
                        options={['SET', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'PAUSE', 'RESUME', 'END']}
                        value={editingFormData.kind}
                        onChange={(value) => setEditingFormData(prev => ({ ...prev, kind: value }))}
                        placeholder="Select event type..."
                        className="text-xs"
                      />
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeStyle(event.kind)}`}>
                        {event.kind.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                    {!readOnly && editingEventId === event.id ? (
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={editingFormData.fan_level}
                        onChange={(e) => setEditingFormData(prev => ({ ...prev, fan_level: e.target.value }))}
                        className="w-16 text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                    ) : (
                      event.fan_level ?? '—'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                    {!readOnly && editingEventId === event.id ? (
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={editingFormData.heat_level}
                        onChange={(e) => setEditingFormData(prev => ({ ...prev, heat_level: e.target.value }))}
                        className="w-16 text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                    ) : (
                      event.heat_level ?? '—'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                    {!readOnly && editingEventId === event.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editingFormData.temp_f}
                        onChange={(e) => setEditingFormData(prev => ({ ...prev, temp_f: e.target.value }))}
                        className="w-20 text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                      />
                    ) : (
                      readOnly && event.temp_f ? `${event.temp_f}°F` : (event.temp_f ?? '—')
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-text-primary">
                    {!readOnly && editingEventId === event.id ? (
                      <input
                        type="text"
                        value={editingFormData.note}
                        onChange={(e) => setEditingFormData(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full text-xs border border-gray-300 dark:border-dark-border-primary rounded px-2 py-1 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                        placeholder="Note"
                      />
                    ) : (
                      event.note || '—'
                    )}
                  </td>
                  {showActions && !readOnly && (
                    <td className="px-4 py-2 text-sm">
                      {editingEventId === event.id ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => saveEditedEvent(event.id)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-xs font-medium"
                          >
                            ✅ Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 text-xs font-medium"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditEvent(event)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsTable;
