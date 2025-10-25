/**
 * AuthGuard Component
 * 
 * A wrapper component that enforces authentication before rendering child components.
 * Shows the AuthModal when user is not authenticated and handles re-authentication
 * when authentication state changes.
 */

import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthContext } from '../../contexts/useAuthContext';
import { AuthModal } from '../modals/AuthModal';
import { EnhancedSpin } from './LoadingStates';

/**
 * Props for AuthGuard component
 */
export interface AuthGuardProps {
  /** Child components to render after successful authentication */
  children: ReactNode;
  /** Optional fallback component to show while checking authentication */
  fallback?: ReactNode;
  /** Optional callback when authentication succeeds */
  onAuthSuccess?: () => void;
  /** Optional callback when authentication fails */
  onAuthFailure?: (error: Error) => void;
}

/**
 * AuthGuard Component
 * 
 * Enforces authentication by:
 * - Checking authentication status on mount
 * - Showing AuthModal when user is not authenticated
 * - Rendering children only after successful authentication
 * - Handling authentication state changes and re-authentication
 * - Providing loading states during authentication checks
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  onAuthSuccess,
  onAuthFailure
}) => {
  const { state, login, clearError } = useAuthContext();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = async (username: string, password: string) => {
    try {
      await login(username, password);
      setShowAuthModal(false);
      onAuthSuccess?.();
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Authentication failed');
      onAuthFailure?.(authError);
      throw authError; // Re-throw to let AuthModal handle the error display
    }
  };

  /**
   * Handle authentication errors
   */
  const handleAuthError = (error: Error) => {
    console.error('Authentication error:', error);
    onAuthFailure?.(error);
  };

  /**
   * Initialize authentication state and determine if modal should be shown
   */
  useEffect(() => {
    const initializeAuth = () => {
      setIsInitializing(true);
      
      // If user is not authenticated, show the auth modal
      if (!state.isAuthenticated) {
        setShowAuthModal(true);
      } else {
        setShowAuthModal(false);
      }
      
      setIsInitializing(false);
    };

    initializeAuth();
  }, [state.isAuthenticated]);

  /**
   * Handle authentication state changes
   * Show modal again if authentication is lost (e.g., session expired)
   */
  useEffect(() => {
    if (!isInitializing && !state.isAuthenticated && !state.loading) {
      setShowAuthModal(true);
    }
  }, [state.isAuthenticated, state.loading, isInitializing]);

  /**
   * Show loading fallback during initialization
   */
  if (isInitializing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {fallback || (
          <EnhancedSpin 
            spinning={true}
            tip="正在检查身份验证状态..."
          />
        )}
      </div>
    );
  }

  /**
   * Show AuthModal if user is not authenticated
   */
  if (!state.isAuthenticated || showAuthModal) {
    return (
      <>
        <AuthModal
          visible={showAuthModal}
          loading={state.loading}
          error={state.authError}
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
          onClearError={clearError}
        />
        {/* Render a minimal background while modal is shown */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f5f5f5',
          zIndex: -1
        }} />
      </>
    );
  }

  /**
   * Render children only after successful authentication
   */
  return <>{children}</>;
};

/**
 * Display name for debugging
 */
AuthGuard.displayName = 'AuthGuard';

export default AuthGuard;