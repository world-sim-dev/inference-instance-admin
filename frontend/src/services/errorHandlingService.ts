/**
 * Enhanced Error Handling Service
 * Comprehensive error handling with classification, recovery, and user feedback
 */

import { message } from 'antd';
import { 
  classifyError, 
  shouldReportError, 
  formatErrorForLogging,
  createUserErrorMessage,
  getRetryConfig,
  type StructuredError,
  ErrorType,
  ErrorSeverity 
} from '../utils/errorUtils';
import { withSmartRetry, type RetryOptions } from '../utils/retryUtils';
import { NotificationSystem } from '../components/common/NotificationSystem';

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  showNotifications: boolean;
  showToasts: boolean;
  logErrors: boolean;
  reportErrors: boolean;
  enableRetry: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  enableRecovery: boolean;
}

/**
 * Error context for tracking
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'redirect' | 'refresh' | 'manual';
  action?: () => Promise<void> | void;
  message?: string;
  autoExecute?: boolean;
}

/**
 * Error statistics
 */
export interface ErrorStatistics {
  total: number;
  byType: Record<ErrorType, number>;
  bySeverity: Record<ErrorSeverity, number>;
  byComponent: Record<string, number>;
  retryAttempts: number;
  successfulRetries: number;
  recoveryAttempts: number;
  successfulRecoveries: number;
  lastError?: StructuredError;
  lastErrorTime?: Date;
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult {
  error: StructuredError;
  handled: boolean;
  recovered: boolean;
  retried: boolean;
  userNotified: boolean;
  recoveryStrategy?: ErrorRecoveryStrategy;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorHandlingConfig = {
  showNotifications: true,
  showToasts: false,
  logErrors: true,
  reportErrors: true,
  enableRetry: true,
  maxRetryAttempts: 3,
  retryDelay: 1000,
  enableRecovery: true
};

/**
 * Enhanced Error Handling Service
 */
export class ErrorHandlingService {
  private config: ErrorHandlingConfig;
  private statistics: ErrorStatistics;
  private errorHistory: StructuredError[] = [];
  private maxHistorySize = 100;
  private recoveryStrategies = new Map<string, ErrorRecoveryStrategy>();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.statistics = this.initializeStatistics();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Initialize error statistics
   */
  private initializeStatistics(): ErrorStatistics {
    return {
      total: 0,
      byType: Object.values(ErrorType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<ErrorType, number>),
      bySeverity: Object.values(ErrorSeverity).reduce((acc, severity) => ({ ...acc, [severity]: 0 }), {} as Record<ErrorSeverity, number>),
      byComponent: {},
      retryAttempts: 0,
      successfulRetries: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        component: 'global',
        action: 'unhandled_promise_rejection'
      });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  /**
   * Main error handling method
   */
  public handleError(
    error: any,
    context: ErrorContext = {},
    options: Partial<ErrorHandlingConfig> = {}
  ): ErrorHandlingResult {
    const mergedConfig = { ...this.config, ...options };
    const structuredError = classifyError(error);
    
    // Update statistics
    this.updateStatistics(structuredError, context);
    
    // Add to error history
    this.addToHistory(structuredError);
    
    // Log error
    if (mergedConfig.logErrors) {
      this.logError(structuredError, context);
    }
    
    // Report error if needed
    if (mergedConfig.reportErrors && shouldReportError(structuredError)) {
      this.reportError(structuredError, context);
    }
    
    // Show user notification
    const userNotified = this.showUserNotification(structuredError, mergedConfig);
    
    // Determine recovery strategy
    const recoveryStrategy = this.getRecoveryStrategy(structuredError, context);
    
    const result: ErrorHandlingResult = {
      error: structuredError,
      handled: true,
      recovered: false,
      retried: false,
      userNotified,
      recoveryStrategy
    };
    
    return result;
  }

  /**
   * Handle error with automatic retry
   */
  public async handleErrorWithRetry<T>(
    fn: () => Promise<T>,
    context: ErrorContext = {},
    options: Partial<ErrorHandlingConfig & RetryOptions> = {}
  ): Promise<T> {
    const mergedConfig = { ...this.config, ...options };
    
    if (!mergedConfig.enableRetry) {
      try {
        return await fn();
      } catch (error) {
        this.handleError(error, context, options);
        throw error;
      }
    }

    return withSmartRetry(fn, {
      maxRetries: mergedConfig.maxRetryAttempts,
      delay: mergedConfig.retryDelay,
      onRetry: (error, attempt) => {
        this.statistics.retryAttempts++;
        
        const structuredError = classifyError(error);
        console.log(`[ErrorHandlingService] Retrying operation (attempt ${attempt}):`, {
          error: structuredError.message,
          context,
          type: structuredError.type
        });

        // Show retry notification
        if (mergedConfig.showToasts) {
          message.loading(`重试中... (${attempt}/${mergedConfig.maxRetryAttempts})`, 1);
        }

        options.onRetry?.(error, attempt);
      },
      ...options
    }).then(result => {
      if (this.statistics.retryAttempts > 0) {
        this.statistics.successfulRetries++;
      }
      return result;
    }).catch(error => {
      const result = this.handleError(error, context, options);
      
      // Attempt recovery if enabled
      if (mergedConfig.enableRecovery && result.recoveryStrategy) {
        this.attemptRecovery(result.recoveryStrategy, context);
      }
      
      throw error;
    });
  }

  /**
   * Handle API errors specifically
   */
  public handleApiError(
    error: any,
    endpoint?: string,
    method?: string,
    options: Partial<ErrorHandlingConfig> = {}
  ): ErrorHandlingResult {
    return this.handleError(error, {
      component: 'api',
      action: `${method || 'unknown'} ${endpoint || 'unknown'}`,
      metadata: { endpoint, method }
    }, options);
  }

  /**
   * Handle form validation errors
   */
  public handleFormError(
    error: any,
    formName?: string,
    options: Partial<ErrorHandlingConfig> = {}
  ): { 
    result: ErrorHandlingResult; 
    fieldErrors: Record<string, string[]>; 
    generalErrors: string[] 
  } {
    const result = this.handleError(error, {
      component: 'form',
      action: 'validation',
      metadata: { formName }
    }, options);

    const fieldErrors: Record<string, string[]> = {};
    const generalErrors: string[] = [];

    // Extract field-specific errors if available
    if (result.error.details?.errors && typeof result.error.details.errors === 'object') {
      Object.assign(fieldErrors, result.error.details.errors);
    } else if (result.error.details?.fieldErrors) {
      Object.assign(fieldErrors, result.error.details.fieldErrors);
    } else {
      generalErrors.push(result.error.userMessage);
    }

    return { result, fieldErrors, generalErrors };
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(
    error: any,
    context: ErrorContext = {},
    options: Partial<ErrorHandlingConfig> = {}
  ): ErrorHandlingResult {
    const result = this.handleError(error, {
      ...context,
      component: context.component || 'network',
      action: context.action || 'request'
    }, options);

    // Additional handling for offline state
    if (result.error.type === ErrorType.NETWORK && !navigator.onLine) {
      NotificationSystem.warning('网络连接已断开', {
        description: '请检查网络连接后重试',
        duration: 0,
        key: 'offline-warning'
      });
    }

    return result;
  }

  /**
   * Register recovery strategy
   */
  public registerRecoveryStrategy(
    errorPattern: string,
    strategy: ErrorRecoveryStrategy
  ): void {
    this.recoveryStrategies.set(errorPattern, strategy);
  }

  /**
   * Get recovery strategy for error
   */
  private getRecoveryStrategy(
    error: StructuredError,
    context: ErrorContext
  ): ErrorRecoveryStrategy | undefined {
    // Check for registered strategies
    for (const [pattern, strategy] of this.recoveryStrategies) {
      if (error.message.includes(pattern) || error.type === pattern) {
        return strategy;
      }
    }

    // Default recovery strategies based on error type
    switch (error.type) {
      case ErrorType.NETWORK:
        return {
          type: 'retry',
          message: '网络连接失败，点击重试',
          autoExecute: false
        };
      
      case ErrorType.AUTHENTICATION:
        return {
          type: 'redirect',
          message: '身份验证失败，即将跳转到登录页面',
          autoExecute: true,
          action: () => {
            // Redirect to login page
            window.location.href = '/login';
          }
        };
      
      case ErrorType.SERVER:
        if (error.severity === ErrorSeverity.HIGH) {
          return {
            type: 'refresh',
            message: '服务器错误，建议刷新页面',
            autoExecute: false,
            action: () => {
              window.location.reload();
            }
          };
        }
        break;
      
      case ErrorType.VALIDATION:
        return {
          type: 'manual',
          message: '请检查输入内容并重新提交',
          autoExecute: false
        };
    }

    return undefined;
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(
    strategy: ErrorRecoveryStrategy,
    context: ErrorContext
  ): Promise<boolean> {
    this.statistics.recoveryAttempts++;
    
    try {
      if (strategy.autoExecute && strategy.action) {
        await strategy.action();
        this.statistics.successfulRecoveries++;
        return true;
      } else if (strategy.message) {
        // Show recovery option to user
        NotificationSystem.confirm({
          title: '错误恢复',
          content: strategy.message,
          onOk: async () => {
            if (strategy.action) {
              await strategy.action();
              this.statistics.successfulRecoveries++;
            }
          }
        });
      }
      
      return false;
    } catch (recoveryError) {
      console.error('[ErrorHandlingService] Recovery failed:', recoveryError);
      return false;
    }
  }

  /**
   * Update error statistics
   */
  private updateStatistics(error: StructuredError, context: ErrorContext): void {
    this.statistics.total++;
    this.statistics.byType[error.type]++;
    this.statistics.bySeverity[error.severity]++;
    
    if (context.component) {
      this.statistics.byComponent[context.component] = 
        (this.statistics.byComponent[context.component] || 0) + 1;
    }
    
    this.statistics.lastError = error;
    this.statistics.lastErrorTime = new Date();
  }

  /**
   * Add error to history
   */
  private addToHistory(error: StructuredError): void {
    this.errorHistory.unshift(error);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Log error
   */
  private logError(error: StructuredError, context: ErrorContext): void {
    const logData = {
      timestamp: error.timestamp.toISOString(),
      type: error.type,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      context,
      details: error.details,
      retryable: error.retryable
    };

    console.error('[ErrorHandlingService]', logData);
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: StructuredError, context: ErrorContext): void {
    // This would integrate with external monitoring services
    // For now, we'll just log high-priority errors
    const reportData = {
      error: formatErrorForLogging(error),
      context,
      statistics: this.getStatistics(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    console.error('[ErrorHandlingService] High-priority error reported:', reportData);
    
    // TODO: Integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { contexts: { errorContext: context } });
  }

  /**
   * Show user notification
   */
  private showUserNotification(
    error: StructuredError,
    config: ErrorHandlingConfig
  ): boolean {
    if (!config.showNotifications && !config.showToasts) {
      return false;
    }

    const userMessage = createUserErrorMessage(error);
    
    if (config.showToasts) {
      const toastType = error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL 
        ? 'error' : 'warning';
      
      NotificationSystem.toast(toastType, userMessage.message, {
        duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 4
      });
    } else {
      const notificationOptions = {
        description: userMessage.message,
        duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 4.5
      };

      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          NotificationSystem.error(userMessage.title, notificationOptions);
          break;
        case ErrorSeverity.MEDIUM:
          NotificationSystem.warning(userMessage.title, notificationOptions);
          break;
        case ErrorSeverity.LOW:
        default:
          NotificationSystem.info(userMessage.title, notificationOptions);
          break;
      }
    }

    return true;
  }

  /**
   * Get error statistics
   */
  public getStatistics(): ErrorStatistics {
    return { ...this.statistics };
  }

  /**
   * Get error history
   */
  public getErrorHistory(): StructuredError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.statistics = this.initializeStatistics();
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ErrorHandlingConfig {
    return { ...this.config };
  }
}

/**
 * Global error handling service instance
 */
export const globalErrorHandler = new ErrorHandlingService();

/**
 * Initialize error handling service with custom configuration
 */
export const initializeErrorHandling = (config: Partial<ErrorHandlingConfig> = {}): ErrorHandlingService => {
  const service = new ErrorHandlingService(config);
  
  // Register common recovery strategies
  service.registerRecoveryStrategy('ECONNREFUSED', {
    type: 'retry',
    message: '服务器连接失败，是否重试？',
    autoExecute: false
  });
  
  service.registerRecoveryStrategy('timeout', {
    type: 'retry',
    message: '请求超时，是否重试？',
    autoExecute: false
  });
  
  return service;
};

export default ErrorHandlingService;