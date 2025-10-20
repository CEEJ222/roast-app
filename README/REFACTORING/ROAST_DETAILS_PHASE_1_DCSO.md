# RoastDetailPage Refactoring - Phase 1 DCSO
## Extract Information Cards

### **Design Goals**
- Break down the monolithic RoastDetailPage into smaller, focused components
- Create reusable card components for roast information display
- Maintain existing functionality while improving code organization
- Establish patterns for future component extraction

### **Code Structure**

#### **1. RoastOverviewCard Component**
```jsx
// components/roast-details/RoastOverviewCard.jsx
const RoastOverviewCard = ({ 
  roast, 
  isEditing, 
  editFormData, 
  onEditFormChange 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Roast Overview
      </h3>
      {/* Coffee info display/edit logic */}
    </div>
  );
};
```

#### **2. RoastWeightsCard Component**
```jsx
// components/roast-details/RoastWeightsCard.jsx
const RoastWeightsCard = ({ 
  roast, 
  isEditing, 
  editFormData, 
  onEditFormChange 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Weights
      </h3>
      {/* Weight display/edit logic */}
    </div>
  );
};
```

#### **3. RoastNotesCard Component**
```jsx
// components/roast-details/RoastNotesCard.jsx
const RoastNotesCard = ({ 
  roast, 
  isEditing, 
  editFormData, 
  onEditFormChange 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Roast Notes
      </h3>
      {/* Notes display/edit logic */}
    </div>
  );
};
```

#### **4. TastingNotesCard Component**
```jsx
// components/roast-details/TastingNotesCard.jsx
const TastingNotesCard = ({ 
  roast, 
  tastingNotes, 
  onTastingNotesChange, 
  onSaveTastingNotes,
  savingTastingNotes,
  tastingNotesSaved 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Tasting Notes
      </h3>
      {/* Tasting notes logic */}
    </div>
  );
};
```

### **Implementation Steps**

1. **Create component directory structure**
   ```
   frontend/src/components/roast-details/
   ├── RoastOverviewCard.jsx
   ├── RoastWeightsCard.jsx
   ├── RoastNotesCard.jsx
   └── TastingNotesCard.jsx
   ```

2. **Extract card components** - Move existing JSX to new components
3. **Update main component** - Replace inline JSX with component imports
4. **Test functionality** - Ensure all editing and display works correctly

### **Success Criteria**
- [ ] All information cards extracted to separate components
- [ ] Editing functionality preserved
- [ ] No visual changes to user interface
- [ ] Code is more maintainable and testable
- [ ] Components are reusable

### **Estimated Effort**
- **Time**: 4-6 hours
- **Complexity**: Low-Medium
- **Risk**: Low (mostly moving existing code)
