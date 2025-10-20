# RoastDetailPage Refactoring - Phase 4 DCSO
## Extract Modal and Action Components

### **Design Goals**
- Separate modal logic from main component
- Create reusable modal components
- Improve mobile action menu experience
- Establish consistent modal patterns

### **Code Structure**

#### **1. RoastActionMenu Component**
```jsx
// components/roast-details/RoastActionMenu.jsx
const RoastActionMenu = ({ 
  isOpen, 
  onClose, 
  onCopyRoastData,
  onShare,
  onEdit,
  onDelete 
}) => {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Roast Actions"
    >
      <div className="space-y-4">
        <button
          onClick={() => {
            onCopyRoastData();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">📋</span>
          <div>
            <div className="font-semibold text-lg">Copy Roast Data</div>
            <div className="text-sm opacity-90">Copy roast summary to clipboard</div>
          </div>
        </button>
        
        <button
          onClick={() => {
            onShare();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">📤</span>
          <div>
            <div className="font-semibold text-lg">Share Roast</div>
            <div className="text-sm opacity-90">Share roast data with others</div>
          </div>
        </button>
        
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">✏️</span>
          <div>
            <div className="font-semibold text-lg">Edit Roast</div>
            <div className="text-sm opacity-90">Modify roast details</div>
          </div>
        </button>
        
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-colors flex items-center gap-3 text-left"
        >
          <span className="text-2xl">🗑️</span>
          <div>
            <div className="font-semibold text-lg">Delete Roast</div>
            <div className="text-sm opacity-90">Permanently remove this roast</div>
          </div>
        </button>
      </div>
    </BottomSheetModal>
  );
};
```

#### **2. RoastDeleteModal Component**
```jsx
// components/roast-details/RoastDeleteModal.jsx
const RoastDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🗑️</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
              Delete Roast
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-gray-700 dark:text-dark-text-secondary mb-6">
          Are you sure you want to delete this roast? All roast data, events, and notes will be permanently removed.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            Delete Roast
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### **3. RoastShareModal Component**
```jsx
// components/roast-details/RoastShareModal.jsx
const RoastShareModal = ({ 
  isOpen, 
  onClose, 
  onCopyRoastData,
  onCopyEvents 
}) => {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Roast"
    >
      <div className="space-y-4">
        <button
          onClick={onCopyRoastData}
          className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-3"
        >
          📋 Copy Roast Summary
        </button>
        <button
          onClick={onCopyEvents}
          className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-3"
        >
          📊 Copy Roast Events
        </button>
        <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
          Use these options to share your roast data via text, email, or other apps.
        </div>
      </div>
    </BottomSheetModal>
  );
};
```

#### **4. RoastFloatingActionButton Component**
```jsx
// components/roast-details/RoastFloatingActionButton.jsx
const RoastFloatingActionButton = ({ 
  isEditing, 
  onActionMenuOpen 
}) => {
  if (isEditing) return null;

  return (
    <FloatingActionButton
      onClick={onActionMenuOpen}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      label="Roast Actions"
    />
  );
};
```

### **Implementation Steps**

1. **Create modal components**
   ```
   frontend/src/components/roast-details/
   ├── RoastActionMenu.jsx
   ├── RoastDeleteModal.jsx
   ├── RoastShareModal.jsx
   └── RoastFloatingActionButton.jsx
   ```

2. **Extract modal logic** - Move modal JSX to components
3. **Update main component** - Replace modal JSX with components
4. **Test modal functionality** - Ensure all modals work correctly

### **Benefits**
- **Separation of Concerns**: Modal logic isolated
- **Reusability**: Modal components can be used elsewhere
- **Maintainability**: Easier to modify modal behavior
- **Testing**: Modal components can be tested independently

### **Success Criteria**
- [ ] Action menu extracted to component
- [ ] Delete modal extracted to component
- [ ] Share modal extracted to component
- [ ] Floating action button extracted
- [ ] All modal functionality works correctly

### **Estimated Effort**
- **Time**: 3-4 hours
- **Complexity**: Low-Medium
- **Risk**: Low (mostly moving existing code)
