/**
 * useErrorHandler Hook
 * Global error handling hook with retry mechanisms and user notifications
 */

import { useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { useNotification } from '../components/common/NotificationSystem';
import { 
  classifyError, 
  shouldReportError, 
  formatErrorForLogging,
  createUserErrorMessage,
  type StructuredError,
  ErrorType,
  ErrorSeverity 
} from '../utils/errorUtils';
import { withSmartRetry, type RetryOptions } from '../utils/retryUtils';

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  showNotification?: boolean;
  showToast?: boolean;
  logError?: boolean;
  reportError?: boolean;
  autoRetry?: boolean;
  retryOptions?: Partial<RetryOptions>;
}

/**
 * Default error handler configuration
 */
const DEFAULT_CONFIG: Required<ErrorHandlerConfig> = {
  showNotification: true,
  showToast: false,
  logError: true,
  reportError: true,
  autoRetry: false,
  retryOptions: {}
};

/**
 * Error context for tracking error patterns
 */
interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Error statistics for monitoring
 */
interface ErrorStats {
  total: number;
  byType: Record<ErrorType, number>;
  bySeverity: Record<ErrorSeverity, number>;
  retryAttempts: number;
  successfulRetries: number;
}

/**
 * useErrorHandler hook
 */
export const useErrorHandler = (
  context: ErrorContext = {},
  defaultConfig: Partial<ErrorHandlerConfig> = {}
) => {
  const { showError, showWarning, showInfo, showToast } = useNotification();
  const errorStatsRef = useRef<ErrorStats>({
    total: 0,
    byType: Object.values(ErrorType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<ErrorType, number>),
    bySeverity: Object.values(ErrorSeverity).reduce((acc, severity) => ({ ...acc, [severity]: 0 }), {} as Record<ErrorSeverity, number>),
    retryAttempts: 0,
    successfulRetries: 0
  });

  const config = { ...DEFAULT_CONFIG, ...defaultConfig };

  /**
   * Log error to console and external services
   */
  const logError = useCallback((structuredError: StructuredError, context: ErrorContext) => {
    if (!config.logError) return;

    const logData = {
      ...formatErrorForLogging(structuredError),
      context,
      stats: errorStatsRef.current
    };

    console.error('[ErrorHandler]', logData);

    // Report to external monitoring service if needed
    if (config.reportError && shouldReportError(structuredError)) {
      // This would integrate with services like Sentry, LogRocket, etc.
      // For now, we'll just log to console
      console.error('[ErrorHandler] High-priority error reported:', logData);
    }
  }, [config.logError, config.reportError]);

  /**
   * Update error statistics
   */
  const updateStats = useCallback((structuredError: StructuredError, isRetry: boolean = false) => {
    const stats = errorStatsRef.current;
    
    if (!isRetry) {
      stats.total++;
      stats.byType[structuredError.type]++;
      stats.bySeverity[structuredError.severity]++;
    } else {
      stats.retryAttempts++;
    }
  }, []);

  /**
   * Show user notification based on error severity
   */
  const showUserNotification = useCallback((structuredError: StructuredError) => {
    if (!config.showNotification && !config.showToast) return;

    const userMessage = createUserErrorMessage(structuredError);
    const notificationOptions = {
      description: userMessage.message,
      duration: structuredError.severity === ErrorSeverity.HIGH ? 0 : 4.5, // Don't auto-close high severity errors
    };

    if (config.showToast) {
      const toastType = structuredError.severity === ErrorSeverity.HIGH ? 'error' : 'warning';
      showToast(toastType, userMessage.message);
      return;
    }

    switch (structuredError.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        showError(userMessage.title, notificationOptions);
        break;
      case ErrorSeverity.MEDIUM:
        showWarning(userMessage.title, notificationOptions);
        break;
      case ErrorSeverity.LOW:
      default:
        showInfo(userMessage.title, notificationOptions);
        break;
    }
  }, [config.showNotification, config.showToast, showError, showWarning, showInfo, showToast]);

  /**
   * Handle error with full processing pipeline
   */
  const handleError = useCallback((
    error: any,
    errorContext: Partial<ErrorContext> = {},
    handlerConfig: Partial<ErrorHandlerConfig> = {}
  ): StructuredError => {
    const mergedConfig = { ...config, ...handlerConfig };
    const mergedContext = { ...context, ...errorContext };
    const structuredError = classifyError(error);

    // Update statistics
    updateStats(structuredError);

    // Log error
    logError(structuredError, mergedContext);

    // Show user notification
    if (mergedConfig.showNotification || mergedConfig.showToast) {
      showUserNotification(structuredError);
    }

    return structuredError;
  }, [config, context, updateStats, logError, showUserNotification]);

  /**
   * Handle error with automatic retry
   */
  const handleErrorWithRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    errorContext: Partial<ErrorContext> = {},
    handlerConfig: Partial<ErrorHandlerConfig> = {}
  ): Promise<T> => {
    const mergedConfig = { ...config, ...handlerConfig };
    const mergedContext = { ...context, ...errorContext };

    if (!mergedConfig.autoRetry) {
      try {
        return await fn();
      } catch (error) {
        handleError(error, mergedContext, mergedConfig);
        throw error;
      }
    }

    return withSmartRetry(fn, {
      ...mergedConfig.retryOptions,
      onRetry: (error, attempt) => {
        const structuredError = classifyError(error);
        updateStats(structuredError, true);
        
        console.log(`[ErrorHandler] Retrying operation (attempt ${attempt}):`, {
          error: structuredError.message,
          context: mergedContext
        });

        mergedConfig.retryOptions?.onRetry?.(error, attempt);
      }
    }).catch(error => {
      handleError(error, mergedContext, mergedConfig);
      throw error;
    });
  }, [config, context, handleError, updateStats]);

  /**
   * Handle form validation errors
   */
  const handleFormError = useCallback((
    error: any,
    formName?: string
  ): { hasErrors: boolean; fieldErrors: Record<string, string[]>; generalErrors: string[] } => {
    const structuredError = handleError(error, { 
      component: 'form', 
      action: 'validation',
      metadata: { formName }
    });

    const result = {
      hasErrors: true,
      fieldErrors: {} as Record<string, string[]>,
      generalErrors: [structuredError.userMessage]
    };

    // Extract field-specific errors if available
    if (structuredError.details?.errors && typeof structuredError.details.errors === 'object') {
      result.fieldErrors = structuredError.details.errors;
      result.generalErrors = [];
    } else if (structuredError.details?.fieldErrors) {
      result.fieldErrors = structuredError.details.fieldErrors;
      result.generalErrors = [];
    }

    return result;
  }, [handleError]);

  /**
   * Handle API errors with specific context
   */
  const handleApiError = useCallback((
    error: any,
    endpoint?: string,
    method?: string
  ): StructuredError => {
    return handleError(error, {
      component: 'api',
      action: `${method || 'unknown'} ${endpoint || 'unknown'}`,
      metadata: { endpoint, method }
    });
  }, [handleError]);

  /**
   * Handle network errors with connectivity checks
   */
  const handleNetworkError = useCallback((
    error: any,
    showOfflineMessage: boolean = true
  ): StructuredError => {
    const structuredError = handleError(error, {
      component: 'network',
      action: 'request'
    });

    // Additional handling for network errors
    if (structuredError.type === ErrorType.NETWORK && showOfflineMessage && !navigator.onLine) {
      message.warning('您当前处于离线状态，请检查网络连接');
    }

    return structuredError;
  }, [handleError]);

  /**
   * Get error statistics
   */
  const getErrorStats = useCallback((): ErrorStats => {
    return { ...errorStatsRef.current };
  }, []);

  /**
   * Reset error statistics
   */
  const resetErrorStats = useCallback(() => {
    errorStatsRef.current = {
      total: 0,
      byType: Object.values(ErrorType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<ErrorType, number>),
      bySeverity: Object.values(ErrorSeverity).reduce((acc, severity) => ({ ...acc, [severity]: 0 }), {} as Record<ErrorSeverity, number>),
      retryAttempts: 0,
      successfulRetries: 0
    };
  }, []);

  /**
   * Create error boundary handler
   */
  const createErrorBoundaryHandler = useCallback((componentName: string) => {
    return (error: Error, errorInfo: any) => {
      handleError(error, {
        component: componentName,
        action: 'render',
        metadata: { errorInfo }
      });
    };
  }, [handleError]);

  // Set up global error handlers
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason, {
        component: 'global',
        action: 'unhandled_promise_rejection'
      });
    };

    const handleGlobalError = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [handleError]);

  return {
    handleError,
    handleErrorWithRetry,
    handleFormError,
    handleApiError,
    handleNetworkError,
    getErrorStats,
    resetErrorStats,
    createErrorBoundaryHandler
  };
};

/**
 * Global error handler instance
 */
let globalErrorHandler: ReturnType<typeof useErrorHandler> | null = null;

/**
 * Initialize global error handler
 */
export const initializeGlobalErrorHandler = (
  context: ErrorContext = {},
  config: Partial<ErrorHandlerConfig> = {}
) => {
  // This would typically be called in the app root
  // For now, we'll create a simple version
  const handler = {
    handleError: (error: any) => {
      const structuredError = classifyError(error);
      console.error('[GlobalErrorHandler]', structuredError);
      return structuredError;
    }
  };
  
  globalErrorHandler = handler as any;
  return handler;
};

/**
 * Get global error handler
 */
export const getGlobalErrorHandler = () => {
  if (!globalErrorHandler) {
    return initializeGlobalErrorHandler();
  }
  return globalErrorHandler;
};

export default useErrorHandler;