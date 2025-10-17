/**
 * Enhanced Loading State Hook
 * Comprehensive loading state management with user feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { useNotification } from '../components/common/NotificationSystem';
import { globalErrorHandler } from '../services/errorHandlingService';
import { classifyError, type StructuredError } from '../utils/errorUtils';

/**
 * Loading state types
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'retrying';

/**
 * Loading configuration
 */
export interface LoadingConfig {
  showNotifications?: boolean;
  showProgress?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
}

/**
 * Loading state data
 */
export interface LoadingStateData<T = any> {
  state: LoadingState;
  data: T | null;
  error: StructuredError | null;
  progress: number;
  retryCount: number;
  elapsedTime: number;
  isTimeout: boolean;
}

/**
 * Loading operation result
 */
export interface LoadingOperationResult<T> {
  success: boolean;
  data?: T;
  error?: StructuredError;
  retryCount: number;
  elapsedTime: number;
}

/**
 * Default loading configuration
 */
const DEFAULT_CONFIG: Required<LoadingConfig> = {
  showNotifications: true,
  showProgress: false,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  successMessage: '操作成功',
  errorMessage: '操作失败',
  loadingMessage: '加载中...'
};

/**
 * Enhanced loading state hook
 */
export const useLoadingState = <T = any>(
  initialConfig: Partial<LoadingConfig> = {}
) => {
  const config = { ...DEFAULT_CONFIG, ...initialConfig };
  const { showSuccess, showError, showLoading, updateLoadingSuccess, updateLoadingError } = useNotification();
  
  const [state, setState] = useState<LoadingState>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<StructuredError | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);
  
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingKeyRef = useRef<string | null>(null);

  /**
   * Start timing
   */
  const startTiming = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setIsTimeout(false);

    // Update elapsed time every second
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    // Set timeout
    if (config.timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsTimeout(true);
        if (config.showNotifications) {
          message.warning('操作超时，请检查网络连接或稍后重试');
        }
      }, config.timeout);
    }
  }, [config.timeout, config.showNotifications]);

  /**
   * Stop timing
   */
  const stopTiming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState('idle');
    setData(null);
    setError(null);
    setProgress(0);
    setRetryCount(0);
    setElapsedTime(0);
    setIsTimeout(false);
    stopTiming();
    
    if (loadingKeyRef.current) {
      updateLoadingSuccess(loadingKeyRef.current, '操作已取消');
      loadingKeyRef.current = null;
    }
  }, [stopTiming, updateLoadingSuccess]);

  /**
   * Execute async operation with loading state management
   */
  const execute = useCallback(async <R = T>(
    operation: () => Promise<R>,
    operationConfig?: Partial<LoadingConfig>
  ): Promise<LoadingOperationResult<R>> => {
    const mergedConfig = { ...config, ...operationConfig };
    
    setState('loading');
    setError(null);
    setProgress(0);
    startTiming();

    // Show loading notification
    if (mergedConfig.showNotifications) {
      const key = showLoading(mergedConfig.loadingMessage, {
        duration: 0
      });
      loadingKeyRef.current = key;
    }

    try {
      const result = await operation();
      
      setState('success');
      setData(result as any);
      setProgress(100);
      stopTiming();

      // Show success notification
      if (mergedConfig.showNotifications && loadingKeyRef.current) {
        updateLoadingSuccess(
          loadingKeyRef.current,
          mergedConfig.successMessage,
          { duration: 3 }
        );
        loadingKeyRef.current = null;
      }

      return {
        success: true,
        data: result,
        retryCount,
        elapsedTime
      };

    } catch (err) {
      const structuredError = classifyError(err);
      setError(structuredError);
      stopTiming();

      // Handle error through global error handler
      globalErrorHandler.handleError(err, {
        component: 'useLoadingState',
        action: 'execute',
        metadata: { retryCount, elapsedTime }
      });

      // Attempt retry if enabled and error is retryable
      if (mergedConfig.enableRetry && 
          structuredError.retryable && 
          retryCount < mergedConfig.maxRetries) {
        
        setState('retrying');
        setRetryCount(prev => prev + 1);

        // Wait for retry delay
        await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelay));

        // Recursive retry
        return execute(operation, operationConfig);
      }

      setState('error');

      // Show error notification
      if (mergedConfig.showNotifications && loadingKeyRef.current) {
        updateLoadingError(
          loadingKeyRef.current,
          mergedConfig.errorMessage,
          {
            description: structuredError.userMessage,
            duration: 0
          }
        );
        loadingKeyRef.current = null;
      }

      return {
        success: false,
        error: structuredError,
        retryCount,
        elapsedTime
      };
    }
  }, [
    config, 
    retryCount, 
    elapsedTime, 
    startTiming, 
    stopTiming, 
    showLoading, 
    updateLoadingSuccess, 
    updateLoadingError
  ]);

  /**
   * Manual retry
   */
  const retry = useCallback(async <R = T>(
    operation: () => Promise<R>,
    operationConfig?: Partial<LoadingConfig>
  ): Promise<LoadingOperationResult<R>> => {
    setRetryCount(0); // Reset retry count for manual retry
    return execute(operation, operationConfig);
  }, [execute]);

  /**
   * Update progress manually
   */
  const updateProgress = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  /**
   * Set loading state manually
   */
  const setLoading = useCallback((loading: boolean, message?: string) => {
    if (loading) {
      setState('loading');
      startTiming();
      
      if (config.showNotifications && message) {
        const key = showLoading(message, { duration: 0 });
        loadingKeyRef.current = key;
      }
    } else {
      setState('idle');
      stopTiming();
      
      if (loadingKeyRef.current) {
        updateLoadingSuccess(loadingKeyRef.current, '操作完成');
        loadingKeyRef.current = null;
      }
    }
  }, [config.showNotifications, startTiming, stopTiming, showLoading, updateLoadingSuccess]);

  /**
   * Get current loading state data
   */
  const getStateData = useCallback((): LoadingStateData<T> => ({
    state,
    data,
    error,
    progress,
    retryCount,
    elapsedTime,
    isTimeout
  }), [state, data, error, progress, retryCount, elapsedTime, isTimeout]);

  /**
   * Check if currently loading
   */
  const isLoading = state === 'loading' || state === 'retrying';

  /**
   * Check if operation was successful
   */
  const isSuccess = state === 'success';

  /**
   * Check if operation failed
   */
  const isError = state === 'error';

  /**
   * Check if can retry
   */
  const canRetry = config.enableRetry && 
                   error?.retryable && 
                   retryCount < config.maxRetries;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTiming();
      if (loadingKeyRef.current) {
        updateLoadingSuccess(loadingKeyRef.current, '组件已卸载');
      }
    };
  }, [stopTiming, updateLoadingSuccess]);

  return {
    // State
    state,
    data,
    error,
    progress,
    retryCount,
    elapsedTime,
    isTimeout,
    
    // Computed state
    isLoading,
    isSuccess,
    isError,
    canRetry,
    
    // Actions
    execute,
    retry,
    reset,
    updateProgress,
    setLoading,
    
    // Utilities
    getStateData
  };
};

/**
 * Batch loading state hook for managing multiple operations
 */
export const useBatchLoadingState = () => {
  const [operations, setOperations] = useState<Map<string, LoadingStateData>>(new Map());
  
  const addOperation = useCallback((id: string, initialData?: Partial<LoadingStateData>) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.set(id, {
        state: 'idle',
        data: null,
        error: null,
        progress: 0,
        retryCount: 0,
        elapsedTime: 0,
        isTimeout: false,
        ...initialData
      });
      return newMap;
    });
  }, []);

  const updateOperation = useCallback((id: string, updates: Partial<LoadingStateData>) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(id);
      if (existing) {
        newMap.set(id, { ...existing, ...updates });
      }
      return newMap;
    });
  }, []);

  const removeOperation = useCallback((id: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getOperation = useCallback((id: string): LoadingStateData | undefined => {
    return operations.get(id);
  }, [operations]);

  const getAllOperations = useCallback((): LoadingStateData[] => {
    return Array.from(operations.values());
  }, [operations]);

  const getOperationsByState = useCallback((state: LoadingState): LoadingStateData[] => {
    return Array.from(operations.values()).filter(op => op.state === state);
  }, [operations]);

  const isAnyLoading = useCallback((): boolean => {
    return Array.from(operations.values()).some(op => 
      op.state === 'loading' || op.state === 'retrying'
    );
  }, [operations]);

  const getOverallProgress = useCallback((): number => {
    const ops = Array.from(operations.values());
    if (ops.length === 0) return 0;
    
    const totalProgress = ops.reduce((sum, op) => sum + op.progress, 0);
    return Math.round(totalProgress / ops.length);
  }, [operations]);

  const clearAll = useCallback(() => {
    setOperations(new Map());
  }, []);

  return {
    operations: Array.from(operations.entries()).map(([id, data]) => ({ id, ...data })),
    addOperation,
    updateOperation,
    removeOperation,
    getOperation,
    getAllOperations,
    getOperationsByState,
    isAnyLoading,
    getOverallProgress,
    clearAll
  };
};

export default useLoadingState;