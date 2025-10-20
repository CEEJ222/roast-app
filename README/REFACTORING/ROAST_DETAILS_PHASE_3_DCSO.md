# RoastDetailPage Refactoring - Phase 3 DCSO
## Extract Data Visualization Components

### **Design Goals**
- Separate data visualization logic from main component
- Create reusable graph and table components
- Improve performance through component isolation
- Establish consistent data display patterns

### **Code Structure**

#### **1. RoastCurveSection Component**
```jsx
// components/roast-details/RoastCurveSection.jsx
const RoastCurveSection = ({ 
  roast, 
  events, 
  userProfile 
}) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow">
      <div className="px-4 py-3 border-b dark:border-dark-border-primary">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
          Roast Curve
        </h3>
      </div>
      <div className="p-4">
        <RoastCurveGraph
          data={[{ id: roast?.id, name: roast?.bean_profile_name || 'Roast', events: events }]}
          mode="historical"
          showROR={true}
          showMilestones={true}
          height={300}
          title=""
          units={{ 
            temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', 
            time: 'min' 
          }}
          showLegend={true}
          showGrid={true}
          showTooltip={true}
          enableZoom={true}
          enablePan={true}
          compact={false}
          interactive={true}
          showRoastLabels={true}
        />
      </div>
    </div>
  );
};
```

#### **2. RoastEventsSection Component**
```jsx
// components/roast-details/RoastEventsSection.jsx
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
```

#### **3. EnvironmentalConditionsCard Component**
```jsx
// components/roast-details/EnvironmentalConditionsCard.jsx
const EnvironmentalConditionsCard = ({ 
  roast, 
  userProfile 
}) => {
  if (!roast.temperature_c && !roast.temperature_f && !roast.humidity_pct) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">
        Environmental Conditions
      </h3>
      <EnvironmentalConditions 
        conditions={{
          temperature_c: roast.temperature_c,
          temperature_f: roast.temperature_f,
          humidity_pct: roast.humidity_pct,
          elevation_m: roast.elevation_m,
          elevation_ft: roast.elevation_ft,
          pressure_hpa: roast.pressure_hpa,
          as_of: roast.as_of,
          timezone: roast.timezone,
          timezone_abbreviation: roast.timezone_abbreviation
        }}
        units={userProfile?.units}
        userProfile={userProfile}
      />
    </div>
  );
};
```

### **Implementation Steps**

1. **Create visualization components**
   ```
   frontend/src/components/roast-details/
   ├── RoastCurveSection.jsx
   ├── RoastEventsSection.jsx
   └── EnvironmentalConditionsCard.jsx
   ```

2. **Extract visualization logic** - Move graph and table logic
3. **Update main component** - Replace visualization JSX
4. **Test data display** - Ensure all charts and tables work

### **Benefits**
- **Performance**: Components can be optimized independently
- **Reusability**: Graph components can be used elsewhere
- **Maintainability**: Easier to modify visualization logic
- **Testing**: Data components can be tested in isolation

### **Success Criteria**
- [ ] Roast curve section extracted
- [ ] Events table section extracted
- [ ] Environmental conditions card extracted
- [ ] All data visualizations work correctly
- [ ] Performance is maintained or improved

### **Estimated Effort**
- **Time**: 4-5 hours
- **Complexity**: Medium
- **Risk**: Medium (data visualization can be complex)
