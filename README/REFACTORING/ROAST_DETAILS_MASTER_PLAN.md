# RoastDetailPage Refactoring - Master Plan
## Comprehensive Multi-Phase Refactoring Strategy

### **Overview**
The RoastDetailPage component is currently a monolithic 815-line component that handles multiple responsibilities. This master plan outlines a comprehensive 6-phase refactoring strategy to break it down into smaller, maintainable, and reusable components.

### **Current State Analysis**
- **Lines of Code**: 815 lines in a single file
- **Responsibilities**: UI rendering, state management, API calls, editing, sharing, modals
- **Maintainability**: Low (hard to find and modify specific functionality)
- **Testability**: Low (difficult to test individual features)
- **Reusability**: None (tightly coupled components)

### **Target State**
- **Main Component**: ~200 lines (orchestration only)
- **Component Count**: 15+ focused components
- **Hook Count**: 4+ custom hooks
- **Maintainability**: High (single responsibility components)
- **Testability**: High (isolated components and hooks)
- **Reusability**: High (components can be used elsewhere)

---

## **Phase 1: Extract Information Cards** ⭐ *Start Here*
**Goal**: Break down the information display sections into reusable card components

**Components Created**:
- `RoastOverviewCard` - Coffee type, region, process, target roast
- `RoastWeightsCard` - Before/after weights and loss calculation
- `RoastNotesCard` - Roast notes with editing
- `TastingNotesCard` - Tasting notes with save functionality

**Benefits**: 
- Immediate code reduction (~200 lines)
- Easy to implement (mostly moving existing JSX)
- Low risk
- High visual impact

**Estimated Time**: 4-6 hours

---

## **Phase 2: Extract Header and Action Components** 
**Goal**: Separate header logic and action buttons from main component

**Components Created**:
- `RoastDetailHeader` - Header with title and actions
- `RoastActionButtons` - Copy, share, edit, delete buttons
- `formatDate` utility function

**Benefits**:
- Header logic isolated
- Action buttons reusable
- Responsive behavior improved

**Estimated Time**: 3-4 hours

---

## **Phase 3: Extract Data Visualization Components**
**Goal**: Separate data visualization logic from main component

**Components Created**:
- `RoastCurveSection` - Roast curve graph wrapper
- `RoastEventsSection` - Events table wrapper  
- `EnvironmentalConditionsCard` - Environmental data display

**Benefits**:
- Performance improvements through component isolation
- Reusable visualization components
- Easier to modify data display logic

**Estimated Time**: 4-5 hours

---

## **Phase 4: Extract Modal and Action Components**
**Goal**: Separate modal logic and mobile action menus

**Components Created**:
- `RoastActionMenu` - Floating action button and bottom sheet
- `RoastDeleteModal` - Delete confirmation modal
- `RoastShareModal` - Share functionality modal
- `RoastFloatingActionButton` - Mobile floating action button

**Benefits**:
- Modal logic isolated
- Mobile experience improved
- Reusable modal components

**Estimated Time**: 3-4 hours

---

## **Phase 5: Extract Custom Hooks and Business Logic** ⚠️ *Most Complex*
**Goal**: Separate business logic from UI components

**Hooks Created**:
- `useRoastData` - API calls and data management
- `useRoastEditing` - Edit state and form handling
- `useRoastActions` - Copy, share, delete actions
- `useTastingNotes` - Tasting notes functionality

**Benefits**:
- Business logic separated from UI
- Hooks can be reused in other components
- Business logic can be tested independently
- Easier to modify business logic

**Estimated Time**: 6-8 hours

---

## **Phase 6: Refactor Main Component and Final Integration**
**Goal**: Simplify main component to orchestrate other components

**Final Structure**:
- Main component reduced to ~200 lines
- Clean component composition
- Proper error and loading states
- Performance optimizations

**Benefits**:
- Dramatic code reduction (815 → 200 lines)
- Clear component composition
- High maintainability
- Easy to understand and modify

**Estimated Time**: 4-6 hours

---

## **Implementation Strategy**

### **Recommended Order**
1. **Phase 1** - Start with information cards (easiest wins)
2. **Phase 2** - Extract header components
3. **Phase 3** - Extract data visualization
4. **Phase 4** - Extract modals and actions
5. **Phase 5** - Extract business logic (most complex)
6. **Phase 6** - Final integration and cleanup

### **Risk Mitigation**
- **Phase 1-4**: Low risk (mostly moving existing code)
- **Phase 5**: High risk (business logic is complex)
- **Phase 6**: Medium risk (integration can be complex)

### **Testing Strategy**
- Test each phase thoroughly before moving to the next
- Use existing functionality as regression tests
- Add unit tests for new components and hooks
- Integration tests for the final refactored component

### **Success Metrics**
- **Code Reduction**: 815 → 200 lines (75% reduction)
- **Component Count**: 15+ focused components
- **Maintainability**: High (single responsibility)
- **Testability**: High (isolated components)
- **Reusability**: High (components can be reused)

### **Total Estimated Time**
- **Total**: 24-33 hours
- **Phases 1-4**: 14-19 hours (low-medium risk)
- **Phases 5-6**: 10-14 hours (high complexity)

### **Benefits Summary**
- **Maintainability**: Dramatically improved
- **Testability**: Each component can be tested independently
- **Reusability**: Components can be used in other parts of the app
- **Performance**: Better code splitting and lazy loading opportunities
- **Developer Experience**: Much easier to find and modify specific functionality
- **Code Quality**: Follows React best practices and component composition patterns

This refactoring will transform the RoastDetailPage from a monolithic component into a well-structured, maintainable, and reusable component system.
