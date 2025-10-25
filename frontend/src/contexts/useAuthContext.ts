/**
 * Custom hook for using the Auth Context
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * Custom hook to access the Auth Context
 * Throws an error if used outside of AuthProvider
 */
export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};