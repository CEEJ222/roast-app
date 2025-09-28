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
  return (
    <div className={`${className} ${readOnly ? 'bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden' : 'flex-1 max-w-4xl bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-dark-glow overflow-hidden'}`}>
      {!readOnly && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-b dark:border-dark-border-primary">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">Roast Event Log</h3>
        </div>
      )}
      <div className="overflow-x-auto text-sm sm:text-base">
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.kind === 'SET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' :
                        event.kind === 'END' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        event.kind === 'PAUSE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        event.kind === 'RESUME' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'
                      }`}>
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
