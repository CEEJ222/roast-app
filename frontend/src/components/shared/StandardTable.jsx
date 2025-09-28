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
  customHeaderActions = null // Custom actions for the header
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
      <div className={`bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary ${className}`}>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-dark-bg-tertiary rounded-lg shadow dark:shadow-dark-lg border dark:border-dark-border-primary ${className}`}>
      {/* Header with bulk actions */}
      {showHeader && data.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary">
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

      {/* Table */}
      <div className="overflow-x-auto">
        {data.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-dark-text-tertiary">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg dark:text-dark-text-primary">{emptyMessage}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border-primary">
            <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
              <tr>
                {showSelection && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    Select
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border-primary">
              {data.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`${
                    index % 2 === 0 ? 'bg-white dark:bg-dark-bg-secondary' : 'bg-gray-50 dark:bg-dark-bg-tertiary'
                  } ${
                    selectedItems.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  } ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border-primary' : ''
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {showSelection && (
                    <td className="px-4 py-3 text-sm text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleRowSelect(item.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text-primary">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex justify-center space-x-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StandardTable;
