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

      {/* Card-based layout */}
      <div className="p-4 sm:p-6">
        {data.length === 0 ? (
          <div className="text-center py-8 sm:py-8 px-4">
            <div className="text-4xl sm:text-6xl mb-4">📊</div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">
              No Bean Profiles Yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div 
                key={item.id || index}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border-primary transition-colors border dark:border-dark-border-primary ${
                  selectedItems.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                } ${
                  (onRowClick || (hideActionButtons && showSelection)) ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (hideActionButtons && showSelection) {
                    // On mobile with action buttons hidden, toggle selection
                    handleRowSelect(item.id, !selectedItems.has(item.id));
                  } else {
                    // Normal row click behavior
                    onRowClick?.(item);
                  }
                }}
              >
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  {showSelection && (
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleRowSelect(item.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {columns.map((column, colIndex) => (
                      <div key={colIndex} className="mb-2 last:mb-0">
                        {column.render ? column.render(item) : item[column.key]}
                      </div>
                    ))}
                  </div>
                </div>
                {!hideActionButtons && (
                  <div className="flex justify-end space-x-2 mt-3 sm:mt-0">
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
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandardTable;
