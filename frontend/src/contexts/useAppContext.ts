/**
 * Custom hook for accessing the App Context
 */

import { useContext } from 'react';
import { AppContext } from './AppContext';
import type { AppContextValue, AppState } from './types';

/**
 * Custom hook to use the App Context
 * Provides type-safe access to global state and dispatch function
 * 
 * @throws Error if used outside of AppProvider
 * @returns AppContextValue containing state and dispatch
 */
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};

/**
 * Convenience hooks for specific parts of the state
 */

/**
 * Hook to access instances state
 */
export const useInstancesState = () => {
  const { state } = useAppContext();
  return state.instances;
};

/**
 * Hook to access UI state
 */
export const useUIState = () => {
  const { state } = useAppContext();
  return state.ui;
};

/**
 * Hook to access modal states
 */
export const useModalState = () => {
  const { state } = useAppContext();
  return state.modals;
};

/**
 * Hook to access dispatch function
 */
export const useAppDispatch = () => {
  const { dispatch } = useAppContext();
  return dispatch;
};

/**
 * Hook to get selected instance
 */
export const useSelectedInstance = () => {
  const { state } = useAppContext();
  const { selectedInstanceId } = state.ui;
  const { data: instances } = state.instances;
  
  return selectedInstanceId 
    ? instances.find(instance => instance.id === selectedInstanceId) || null
    : null;
};

/**
 * Action creator helpers for common operations
 */
export const useAppActions = () => {
  const dispatch = useAppDispatch();
  
  return {
    // Instance actions
    loadInstancesStart: () => dispatch({ type: 'LOAD_INSTANCES_START' }),
    loadInstancesSuccess: (instances: AppState['instances']['data']) => 
      dispatch({ type: 'LOAD_INSTANCES_SUCCESS', payload: instances }),
    loadInstancesError: (error: string) => 
      dispatch({ type: 'LOAD_INSTANCES_ERROR', payload: error }),
    
    createInstanceStart: () => dispatch({ type: 'CREATE_INSTANCE_START' }),
    createInstanceSuccess: (instance: AppState['instances']['data'][0]) => 
      dispatch({ type: 'CREATE_INSTANCE_SUCCESS', payload: instance }),
    createInstanceError: (error: string) => 
      dispatch({ type: 'CREATE_INSTANCE_ERROR', payload: error }),
    
    updateInstanceStart: () => dispatch({ type: 'UPDATE_INSTANCE_START' }),
    updateInstanceSuccess: (instance: AppState['instances']['data'][0]) => 
      dispatch({ type: 'UPDATE_INSTANCE_SUCCESS', payload: instance }),
    updateInstanceError: (error: string) => 
      dispatch({ type: 'UPDATE_INSTANCE_ERROR', payload: error }),
    
    deleteInstanceStart: () => dispatch({ type: 'DELETE_INSTANCE_START' }),
    deleteInstanceSuccess: (instanceId: number) => 
      dispatch({ type: 'DELETE_INSTANCE_SUCCESS', payload: instanceId }),
    deleteInstanceError: (error: string) => 
      dispatch({ type: 'DELETE_INSTANCE_ERROR', payload: error }),
    
    // UI actions
    setSelectedInstance: (instanceId: number | null) => 
      dispatch({ type: 'SET_SELECTED_INSTANCE', payload: instanceId }),
    setSearchTerm: (term: string) => 
      dispatch({ type: 'SET_SEARCH_TERM', payload: term }),
    setFilters: (filters: AppState['ui']['filters']) => 
      dispatch({ type: 'SET_FILTERS', payload: filters }),
    setPagination: (pagination: Partial<AppState['ui']['pagination']>) => 
      dispatch({ type: 'SET_PAGINATION', payload: pagination }),
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
    
    // Modal actions
    toggleModal: (modal: keyof AppState['modals'], visible: boolean) => 
      dispatch({ type: 'TOGGLE_MODAL', payload: { modal, visible } }),
    closeAllModals: () => dispatch({ type: 'CLOSE_ALL_MODALS' }),
    
    // General actions
    resetState: () => dispatch({ type: 'RESET_STATE' }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };
};