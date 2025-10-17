/**
 * Retry utilities for handling failed operations
 * Provides configurable retry mechanisms with exponential backoff
 */

import { classifyError, getRetryConfig, type StructuredError } from './errorUtils';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
  maxDelay?: number;
  onRetry?: (error: any, attempt: number) => void;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  backoff: true,
  maxDelay: 30000,
  onRetry: () => {},
  shouldRetry: () => true
};

/**
 * Sleep utility function
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (baseDelay: number, attempt: number, useBackoff: boolean, maxDelay: number): number => {
  if (!useBackoff) {
    return baseDelay;
  }
  
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
  
  return Math.min(jitteredDelay, maxDelay);
};

/**
 * Retry a function with configurable options
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt > config.maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!config.shouldRetry(error, attempt)) {
        break;
      }
      
      // Call retry callback
      config.onRetry(error, attempt);
      
      // Calculate and wait for delay
      const delay = calculateDelay(config.delay, attempt, config.backoff, config.maxDelay);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

/**
 * Retry with smart error-based configuration
 */
export const withSmartRetry = async <T>(
  fn: () => Promise<T>,
  customOptions: Partial<RetryOptions> = {}
): Promise<T> => {
  let structuredError: StructuredError | null = null;
  
  const smartShouldRetry = (error: any, attempt: number): boolean => {
    structuredError = classifyError(error);
    const retryConfig = getRetryConfig(structuredError);
    
    // Use error-specific retry configuration
    return structuredError.retryable && attempt <= retryConfig.maxRetries;
  };
  
  const smartOnRetry = (error: any, attempt: number): void => {
    if (structuredError) {
      console.warn(`Retrying operation (attempt ${attempt}/${getRetryConfig(structuredError).maxRetries}):`, {
        type: structuredError.type,
        message: structuredError.message,
        retryable: structuredError.retryable
      });
    }
    
    customOptions.onRetry?.(error, attempt);
  };
  
  // Get initial error classification for configuration
  try {
    return await fn();
  } catch (initialError) {
    structuredError = classifyError(initialError);
    const retryConfig = getRetryConfig(structuredError);
    
    if (!structuredError.retryable) {
      throw initialError;
    }
    
    const options: RetryOptions = {
      maxRetries: retryConfig.maxRetries,
      delay: retryConfig.delay,
      backoff: retryConfig.backoff,
      shouldRetry: smartShouldRetry,
      onRetry: smartOnRetry,
      ...customOptions
    };
    
    return await withRetry(fn, options);
  }
};

/**
 * Retry hook for React components
 */
export const useRetry = () => {
  const retry = async <T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> => {
    return withRetry(fn, options);
  };
  
  const smartRetry = async <T>(
    fn: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> => {
    return withSmartRetry(fn, options);
  };
  
  return { retry, smartRetry };
};

/**
 * Retry decorator for class methods
 */
export const retryable = (options: RetryOptions = {}) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
};

/**
 * Smart retry decorator that uses error-based configuration
 */
export const smartRetryable = (options: Partial<RetryOptions> = {}) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return withSmartRetry(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
};

/**
 * Retry queue for managing multiple retry operations
 */
export class RetryQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    options: RetryOptions;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private processing = false;
  
  /**
   * Add operation to retry queue
   */
  add<T>(
    id: string,
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, fn, options, resolve, reject });
      this.process();
    });
  }
  
  /**
   * Process retry queue
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        const result = await withRetry(item.fn, item.options);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
    
    this.processing = false;
  }
  
  /**
   * Clear retry queue
   */
  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Retry queue cleared'));
    });
    this.queue = [];
  }
  
  /**
   * Get queue status
   */
  getStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.queue.length,
      processing: this.processing
    };
  }
}

/**
 * Global retry queue instance
 */
export const globalRetryQueue = new RetryQueue();

/**
 * Utility functions for common retry scenarios
 */
export const RetryUtils = {
  /**
   * Retry API calls with network error handling
   */
  apiCall: <T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> => {
    return withSmartRetry(fn, {
      onRetry: (error, attempt) => {
        console.log(`API call failed, retrying (${attempt})...`, error.message);
      },
      ...options
    });
  },
  
  /**
   * Retry data loading operations
   */
  dataLoad: <T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> => {
    return withSmartRetry(fn, {
      maxRetries: 2,
      delay: 1500,
      onRetry: (error, attempt) => {
        console.log(`Data loading failed, retrying (${attempt})...`, error.message);
      },
      ...options
    });
  },
  
  /**
   * Retry form submissions
   */
  formSubmit: <T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> => {
    return withSmartRetry(fn, {
      maxRetries: 1,
      delay: 2000,
      shouldRetry: (error) => {
        const structured = classifyError(error);
        // Only retry network and server errors for form submissions
        return structured.type === 'network' || structured.type === 'server';
      },
      ...options
    });
  }
};

export default {
  withRetry,
  withSmartRetry,
  useRetry,
  retryable,
  smartRetryable,
  RetryQueue,
  globalRetryQueue,
  RetryUtils
};