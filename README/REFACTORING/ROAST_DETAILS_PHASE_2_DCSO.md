# RoastDetailPage Refactoring - Phase 2 DCSO
## Extract Header and Action Components

### **Design Goals**
- Separate header logic from main component
- Create reusable action button components
- Improve mobile/desktop responsive behavior
- Establish consistent action patterns

### **Code Structure**

#### **1. RoastDetailHeader Component**
```jsx
// components/roast-details/RoastDetailHeader.jsx
const RoastDetailHeader = ({ 
  roast, 
  isEditing, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit,
  onCopyRoastData,
  onShare,
  onDelete,
  onClose 
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-4 sm:px-6 py-4 text-white">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0 mr-2">
          <h2 className="text-xl sm:text-2xl font-bold">☕ Roast Details</h2>
          <p className="opacity-90 text-sm sm:text-base truncate max-w-full">
            {roast.bean_profile_name || roast.coffee_type || 'Unknown Coffee'} • {formatDate(roast.created_at)}
          </p>
        </div>
        <RoastActionButtons 
          isEditing={isEditing}
          onEdit={onEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onCopyRoastData={onCopyRoastData}
          onShare={onShare}
          onDelete={onDelete}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
```

#### **2. RoastActionButtons Component**
```jsx
// components/roast-details/RoastActionButtons.jsx
const RoastActionButtons = ({ 
  isEditing, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit,
  onCopyRoastData,
  onShare,
  onDelete,
  onClose 
}) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button onClick={onSaveEdit} className="bg-green-500/80 hover:bg-green-500 text-white px-1.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          💾 Save
        </button>
        <button onClick={onCancelEdit} className="bg-gray-500/80 hover:bg-gray-500 text-white px-1.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          ❌ Cancel
        </button>
        <button onClick={onClose} className="text-white hover:text-gray-200 text-xl sm:text-2xl font-bold p-1">
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      <button onClick={onCopyRoastData} className="bg-blue-500/80 hover:bg-blue-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline">
        📋 Copy
      </button>
      <button onClick={onShare} className="bg-green-500/80 hover:bg-green-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline">
        📤 Share
      </button>
      <button onClick={onEdit} className="bg-purple-500/80 hover:bg-purple-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline">
        ✏️ Edit
      </button>
      <button onClick={onDelete} className="bg-red-500/80 hover:bg-red-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:inline">
        🗑️ Delete
      </button>
      <button onClick={onClose} className="text-white hover:text-gray-200 text-xl sm:text-2xl font-bold p-1">
        ×
      </button>
    </div>
  );
};
```

#### **3. Utility Functions**
```jsx
// utils/dateUtils.js
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### **Implementation Steps**

1. **Create header components**
   ```
   frontend/src/components/roast-details/
   ├── RoastDetailHeader.jsx
   └── RoastActionButtons.jsx
   ```

2. **Extract utility functions** - Move date formatting to utils
3. **Update main component** - Replace header JSX with components
4. **Test responsive behavior** - Ensure mobile/desktop actions work

### **Benefits**
- **Separation of Concerns**: Header logic isolated
- **Reusability**: Action buttons can be used elsewhere
- **Maintainability**: Easier to modify header behavior
- **Testing**: Header components can be tested independently

### **Success Criteria**
- [ ] Header extracted to separate component
- [ ] Action buttons componentized
- [ ] Responsive behavior preserved
- [ ] All header functionality works
- [ ] Code is more modular

### **Estimated Effort**
- **Time**: 3-4 hours
- **Complexity**: Low-Medium
- **Risk**: Low (mostly moving existing code)
