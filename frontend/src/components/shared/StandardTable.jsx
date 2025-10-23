import React from 'react';

const StandardTable = ({
  data = [],
  columns = [],
  onRowClick,
  onDelete,
  onBulkDelete,
  selectedItems = new Set(),
  onSelectionChange,
  onSelectAll,
  showSelection = true,
  showBulkDelete = true,
  loading = false,
  emptyMessage = "No data available",
  className = "",
  customActions = null,
  showHeader = true,
  customHeader = null,
  title = null,
  onView = null, // New prop for view action
  customHeaderActions = null, // Custom actions for the header
  hideActionButtons = false // New prop to hide action buttons
}) => {
  const allSelected = data.length > 0 && selectedItems.size === data.length;
  const someSelected = selectedItems.size > 0;

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectAll?.(data.map(item => item.id));
    } else {
      onSelectAll?.([]);
    }
  };

  const handleRowSelect = (itemId, checked) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    onSelectionChange?.(newSelection);
  };

  const handleDelete = (item, e) => {
    e.stopPropagation();
    onDelete?.(item);
  };

  const handleBulkDelete = () => {
    if (selectedItems.size > 0) {
      onBulkDelete?.(Array.from(selectedItems));
    }
  };

  if (loading) {
    return (
      <div className={`bg-transparent ${className}`}>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-transparent ${className}`}>
      {/* Header with bulk actions */}
      {showHeader && data.length > 0 && (
        <div className="px-4 sm:px-6 py-4">
          {customHeader ? (
            customHeader
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {title && (
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
                    {title}
                  </h3>
                )}
              </div>
              {showSelection && (
                <div className="flex gap-3">
                  {customHeaderActions && customHeaderActions}
                  <button
                    onClick={() => handleSelectAll(!allSelected)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {allSelected ? '✗ Deselect All' : '✓ Select All'}
                  </button>
                  {showBulkDelete && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedItems.size === 0}
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      🗑️ Delete Selected ({selectedItems.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Responsive Table Layout */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden">
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-dark-text-tertiary">
            <div className="text-6xl mb-4">☕</div>
            <p className="text-lg dark:text-dark-text-primary">No roasts found</p>
            <p className="text-sm dark:text-dark-text-secondary">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border-primary">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                  <tr>
                    {showSelection && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-dark-border-primary rounded"
                        />
                      </th>
                    )}
                    {columns.map((column, index) => (
                      <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        {column.header}
                      </th>
                    ))}
                    {!hideActionButtons && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border-primary">
                  {data.map((item, index) => (
                    <tr 
                      key={item.id || index}
                      className={`hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary ${
                        selectedItems.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      } ${
                        (onRowClick || (hideActionButtons && showSelection)) ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        if (hideActionButtons && showSelection) {
                          handleRowSelect(item.id, !selectedItems.has(item.id));
                        } else {
                          onRowClick?.(item);
                        }
                      }}
                    >
                      {showSelection && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => handleRowSelect(item.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-dark-border-primary rounded"
                          />
                        </td>
                      )}
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                          {column.render ? column.render(item) : item[column.key]}
                        </td>
                      ))}
                      {!hideActionButtons && (
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">
                          <div className="flex space-x-2">
                            {onView && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onView(item);
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                                title="View details"
                              >
                                👁️
                              </button>
                            )}
                            {customActions && customActions(item)}
                            <button
                              onClick={(e) => handleDelete(item, e)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                              title="Delete item"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Compact */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200 dark:divide-dark-border-primary">
                {data.map((item, index) => (
                  <div 
                    key={item.id || index}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary ${
                      selectedItems.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    } ${
                      (onRowClick || (hideActionButtons && showSelection)) ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (hideActionButtons && showSelection) {
                        handleRowSelect(item.id, !selectedItems.has(item.id));
                      } else {
                        onRowClick?.(item);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {showSelection && (
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={(e) => handleRowSelect(item.id, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-dark-border-primary rounded mr-2"
                            />
                          </div>
                        )}
                        
                        {/* Primary info - Coffee name and date */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 dark:text-dark-text-primary truncate">
                            {columns.find(col => col.key === 'coffee')?.render ? 
                              columns.find(col => col.key === 'coffee').render(item) : 
                              item.coffee || item.name || 'Unknown Coffee'
                            }
                          </div>
                          <div className="text-xs text-gray-500 dark:text-dark-text-secondary ml-2 flex-shrink-0">
                            {columns.find(col => col.key === 'created_at')?.render ? 
                              columns.find(col => col.key === 'created_at').render(item) : 
                              item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
                            }
                          </div>
                        </div>
                        
                        {/* Secondary info - Machine, Duration, Roast Level */}
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-dark-text-secondary">
                          <div className="flex items-center space-x-3">
                            <span>
                              {columns.find(col => col.key === 'machine_label')?.render ? 
                                columns.find(col => col.key === 'machine_label').render(item) : 
                                item.machine_label || 'Unknown'
                              }
                            </span>
                            <span>•</span>
                            <span>
                              {columns.find(col => col.key === 'duration')?.render ? 
                                columns.find(col => col.key === 'duration').render(item) : 
                                'N/A'
                              }
                            </span>
                          </div>
                          <div>
                            {columns.find(col => col.key === 'desired_roast_level')?.render ? 
                              columns.find(col => col.key === 'desired_roast_level').render(item) : 
                              item.desired_roast_level
                            }
                          </div>
                        </div>
                      </div>
                      
                      {!hideActionButtons && (
                        <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                          {onView && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onView(item);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                              title="View details"
                            >
                              👁️
                            </button>
                          )}
                          {customActions && customActions(item)}
                          <button
                            onClick={(e) => handleDelete(item, e)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                            title="Delete item"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StandardTable;
