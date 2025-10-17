/**
 * Context module exports
 * Centralized exports for all context-related functionality
 */

// Main context and provider
export { AppContext } from './AppContext';
export { AppProvider } from './AppProvider';

// Custom hooks
export { 
  useAppContext, 
  useInstancesState, 
  useUIState, 
  useModalState, 
  useAppDispatch,
  useSelectedInstance,
  useAppActions
} from './useAppContext';

// Types and interfaces
export type { 
  AppState, 
  AppAction, 
  AppContextValue 
} from './types';

// Initial state for testing or other purposes
export { initialState } from './types';

// Reducer for testing or other purposes
export { appReducer } from './reducer';