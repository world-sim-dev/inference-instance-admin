/**
 * TypeScript interfaces for global state management
 */

import type { Instance, InstanceFilters, PaginationState } from '../types/instance';

/**
 * Global application state structure
 */
export interface AppState {
  // Instance data state
  instances: {
    data: Instance[];
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
  };
  
  // UI state
  ui: {
    selectedInstanceId: number | null;
    searchTerm: string;
    filters: InstanceFilters;
    pagination: PaginationState;
  };
  
  // Modal states
  modals: {
    createInstance: boolean;
    editInstance: boolean;
    deleteConfirm: boolean;
    viewHistory: boolean;
    viewDetails: boolean;
  };
}

/**
 * Action types for state management
 */
export type AppAction = 
  // Instance loading actions
  | { type: 'LOAD_INSTANCES_START' }
  | { type: 'LOAD_INSTANCES_SUCCESS'; payload: Instance[] }
  | { type: 'LOAD_INSTANCES_ERROR'; payload: string }
  
  // Instance CRUD actions
  | { type: 'CREATE_INSTANCE_START' }
  | { type: 'CREATE_INSTANCE_SUCCESS'; payload: Instance }
  | { type: 'CREATE_INSTANCE_ERROR'; payload: string }
  | { type: 'UPDATE_INSTANCE_START' }
  | { type: 'UPDATE_INSTANCE_SUCCESS'; payload: Instance }
  | { type: 'UPDATE_INSTANCE_ERROR'; payload: string }
  | { type: 'DELETE_INSTANCE_START' }
  | { type: 'DELETE_INSTANCE_SUCCESS'; payload: number }
  | { type: 'DELETE_INSTANCE_ERROR'; payload: string }
  
  // UI state actions
  | { type: 'SET_SELECTED_INSTANCE'; payload: number | null }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_FILTERS'; payload: InstanceFilters }
  | { type: 'SET_PAGINATION'; payload: Partial<PaginationState> }
  | { type: 'RESET_FILTERS' }
  
  // Modal actions
  | { type: 'TOGGLE_MODAL'; payload: { modal: keyof AppState['modals']; visible: boolean } }
  | { type: 'CLOSE_ALL_MODALS' }
  
  // General actions
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_ERROR' };

/**
 * Context value interface
 */
export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * Initial state values
 */
export const initialState: AppState = {
  instances: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
  },
  ui: {
    selectedInstanceId: null,
    searchTerm: '',
    filters: {
      status: [],
      cluster_name: [],
      model_name: [],
      ephemeral: null,
      search: '',
    },
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  },
  modals: {
    createInstance: false,
    editInstance: false,
    deleteConfirm: false,
    viewHistory: false,
    viewDetails: false,
  },
};