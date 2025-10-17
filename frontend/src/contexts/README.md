# Global State Management

This directory contains the global state management system for the React application using React Context API and useReducer.

## Architecture

The state management system follows these principles:
- **Single source of truth**: All global state is managed in one place
- **Predictable state updates**: All state changes go through the reducer
- **Type safety**: Full TypeScript support for state and actions
- **Separation of concerns**: Clear separation between state, actions, and UI

## Files Structure

```
contexts/
├── types.ts          # TypeScript interfaces and types
├── reducer.ts        # Reducer function for state updates
├── AppContext.tsx    # React Context and Provider component
├── useAppContext.ts  # Custom hooks for accessing context
├── index.ts          # Centralized exports
└── README.md         # This documentation
```

## State Structure

```typescript
interface AppState {
  instances: {
    data: Instance[];           // Array of instances
    loading: boolean;           // Loading state for API calls
    error: string | null;       // Error message if any
    lastUpdated: Date | null;   // Last update timestamp
  };
  
  ui: {
    selectedInstanceId: number | null;  // Currently selected instance
    searchTerm: string;                 // Search input value
    filters: InstanceFilters;           // Applied filters
    pagination: PaginationState;        // Pagination state
  };
  
  modals: {
    createInstance: boolean;    // Create instance modal state
    editInstance: boolean;      // Edit instance modal state
    deleteConfirm: boolean;     // Delete confirmation modal state
    viewHistory: boolean;       // History view modal state
    viewDetails: boolean;       // Details view modal state
  };
}
```

## Usage

### 1. Wrap your app with AppProvider

```tsx
import { AppProvider } from './contexts';

function App() {
  return (
    <AppProvider>
      {/* Your app components */}
    </AppProvider>
  );
}
```

### 2. Use hooks in components

```tsx
import { useAppContext, useAppActions, useInstancesState } from './contexts';

function MyComponent() {
  // Access full context
  const { state, dispatch } = useAppContext();
  
  // Access specific state slices
  const instancesState = useInstancesState();
  const uiState = useUIState();
  const modalState = useModalState();
  
  // Use action helpers
  const actions = useAppActions();
  
  // Example: Load instances
  const handleLoadInstances = async () => {
    actions.loadInstancesStart();
    try {
      const instances = await api.getInstances();
      actions.loadInstancesSuccess(instances);
    } catch (error) {
      actions.loadInstancesError(error.message);
    }
  };
  
  return (
    <div>
      {instancesState.loading ? 'Loading...' : `${instancesState.data.length} instances`}
    </div>
  );
}
```

### 3. Available Actions

#### Instance Actions
- `loadInstancesStart()` - Start loading instances
- `loadInstancesSuccess(instances)` - Set loaded instances
- `loadInstancesError(error)` - Set loading error
- `createInstanceStart()` - Start creating instance
- `createInstanceSuccess(instance)` - Add created instance
- `createInstanceError(error)` - Set creation error
- `updateInstanceStart()` - Start updating instance
- `updateInstanceSuccess(instance)` - Update instance in state
- `updateInstanceError(error)` - Set update error
- `deleteInstanceStart()` - Start deleting instance
- `deleteInstanceSuccess(instanceId)` - Remove instance from state
- `deleteInstanceError(error)` - Set deletion error

#### UI Actions
- `setSelectedInstance(instanceId)` - Select an instance
- `setSearchTerm(term)` - Set search term
- `setFilters(filters)` - Set filters
- `setPagination(pagination)` - Update pagination
- `resetFilters()` - Reset all filters

#### Modal Actions
- `toggleModal(modalName, visible)` - Toggle specific modal
- `closeAllModals()` - Close all modals

#### General Actions
- `resetState()` - Reset entire state to initial values
- `clearError()` - Clear error messages

### 4. Custom Hooks

#### useSelectedInstance
Returns the currently selected instance object:

```tsx
const selectedInstance = useSelectedInstance();
if (selectedInstance) {
  console.log('Selected:', selectedInstance.name);
}
```

#### useAppActions
Returns an object with all action creators:

```tsx
const actions = useAppActions();
actions.setSearchTerm('my search');
actions.toggleModal('createInstance', true);
```

## Best Practices

1. **Use specific hooks**: Prefer `useInstancesState()` over `useAppContext().state.instances`
2. **Use action helpers**: Use `useAppActions()` instead of dispatching actions directly
3. **Handle loading states**: Always check loading state before rendering data
4. **Handle errors**: Display error messages to users when operations fail
5. **Optimize re-renders**: Use React.memo for components that don't need frequent updates

## Integration with React Query

The context system works well with React Query for server state management:

```tsx
import { useQuery } from '@tanstack/react-query';
import { useAppActions } from './contexts';

function useInstances() {
  const actions = useAppActions();
  
  return useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      actions.loadInstancesStart();
      try {
        const instances = await api.getInstances();
        actions.loadInstancesSuccess(instances);
        return instances;
      } catch (error) {
        actions.loadInstancesError(error.message);
        throw error;
      }
    }
  });
}
```

## Testing

The context system is designed to be easily testable:

```tsx
import { render } from '@testing-library/react';
import { AppProvider } from './contexts';

function renderWithContext(component) {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
}
```

## Error Handling

The context includes built-in error handling:
- API errors are stored in `state.instances.error`
- Use `actions.clearError()` to clear errors
- Display errors in UI components using the error state