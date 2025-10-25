/**
 * Context module exports
 * Centralized exports for all context-related functionality
 */

// Main context and provider
export { AppContext } from './AppContext';
export { AppProvider } from './AppProvider';

// Auth context and provider
export { AuthContext } from './AuthContext';
export { AuthProvider } from './AuthProvider';

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

export { useAuthContext } from './useAuthContext';

// Types and interfaces
export type { 
  AppState, 
  AppAction, 
  AppContextValue 
} from './types';

export type {
  AuthState,
  AuthCredentials,
  AuthContextValue
} from './AuthContext';

// Initial state for testing or other purposes
export { initialState } from './types';
export { initialAuthState } from './AuthContext';

// Reducer for testing or other purposes
export { appReducer } from './reducer';