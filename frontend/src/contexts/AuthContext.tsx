/**
 * React Context for authentication state management
 */

import { createContext } from 'react';

/**
 * Authentication credentials interface
 */
export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  credentials: AuthCredentials | null;
  lastAuthTime: number | null;
  authError: string | null;
  loading: boolean;
}

/**
 * Authentication context value interface
 */
export interface AuthContextValue {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
  clearError: () => void;
}

/**
 * Initial authentication state
 */
export const initialAuthState: AuthState = {
  isAuthenticated: false,
  credentials: null,
  lastAuthTime: null,
  authError: null,
  loading: false,
};

/**
 * Create the Auth Context
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);