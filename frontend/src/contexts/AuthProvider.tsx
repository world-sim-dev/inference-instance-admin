/**
 * Auth Context Provider component
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext, type AuthState, type AuthCredentials, initialAuthState } from './AuthContext';
import { apiClient } from '../services/api';

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Session storage key for authentication data
 */
const AUTH_STORAGE_KEY = 'auth_session';

/**
 * Session timeout in milliseconds (1 hour)
 */
const SESSION_TIMEOUT = 60 * 60 * 1000;

/**
 * Auth Context Provider component
 * Provides authentication state management to the entire application
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialAuthState);

  /**
   * Load authentication state from session storage
   */
  const loadAuthFromStorage = useCallback((): AuthState | null => {
    try {
      const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!storedAuth) return null;

      const parsedAuth = JSON.parse(storedAuth);
      
      // Check if session has expired
      if (parsedAuth.lastAuthTime && Date.now() - parsedAuth.lastAuthTime > SESSION_TIMEOUT) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      return parsedAuth;
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }, []);

  /**
   * Save authentication state to session storage
   */
  const saveAuthToStorage = useCallback((authState: AuthState) => {
    try {
      if (authState.isAuthenticated && authState.credentials) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }, []);

  /**
   * Login method - authenticate user with provided credentials
   */
  const login = useCallback(async (username: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, authError: null }));

    try {
      // Verify credentials with backend
      const isValid = await apiClient.verifyCredentials(username, password);
      
      if (isValid) {
        const credentials: AuthCredentials = { username, password };
        const newState: AuthState = {
          isAuthenticated: true,
          credentials,
          lastAuthTime: Date.now(),
          authError: null,
          loading: false,
        };

        setState(newState);
        saveAuthToStorage(newState);
        
        // Set credentials in API client for future requests
        apiClient.setAuthCredentials(username, password);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setState(prev => ({
        ...prev,
        loading: false,
        authError: errorMessage,
        isAuthenticated: false,
        credentials: null,
      }));
      throw error;
    }
  }, [saveAuthToStorage]);

  /**
   * Logout method - clear authentication state
   */
  const logout = useCallback(() => {
    setState(initialAuthState);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    apiClient.clearAuthCredentials();
  }, []);

  /**
   * Check authentication status
   */
  const checkAuth = useCallback((): boolean => {
    const storedAuth = loadAuthFromStorage();
    
    if (storedAuth && storedAuth.isAuthenticated) {
      setState(storedAuth);
      
      // Restore credentials in API client
      if (storedAuth.credentials) {
        apiClient.setAuthCredentials(
          storedAuth.credentials.username,
          storedAuth.credentials.password
        );
      }
      
      return true;
    }
    
    return false;
  }, [loadAuthFromStorage]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, authError: null }));
  }, []);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Save state to storage whenever it changes
   */
  useEffect(() => {
    saveAuthToStorage(state);
  }, [state, saveAuthToStorage]);

  const contextValue = {
    state,
    login,
    logout,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Display name for debugging
 */
AuthProvider.displayName = 'AuthProvider';