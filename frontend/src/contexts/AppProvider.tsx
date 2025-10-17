/**
 * App Context Provider component
 */

import React, { useReducer } from 'react';
import type { ReactNode } from 'react';
import { AppContext } from './AppContext';
import { appReducer } from './reducer';
import { initialState, type AppContextValue } from './types';

/**
 * Props for AppProvider component
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * App Context Provider component
 * Provides global state management to the entire application
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue: AppContextValue = {
    state,
    dispatch,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Display name for debugging
 */
AppProvider.displayName = 'AppProvider';