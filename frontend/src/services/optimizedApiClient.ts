/**
 * Optimized API Client with Request Deduplication, Debouncing, and Batch Processing
 * Enhances the base API client with performance optimizations
 */

import { ApiClient } from './api';
import type { ApiClientConfig } from '../types/api';
import type {
  Instance,
  CreateInstanceData,
  UpdateInstanceData,
  InstanceQueryParams
} from '../types/instance';
import type {
  HistoryRecord,
  HistoryQueryParams,
  HistoryListResponse
} from '../types/history';

/**
 * Request cache entry interface
 */
interface CacheEntry<T = any> {
  promise: Promise<T>;
  timestamp: number;
  key: string;
}

/**
 * Batch request configuration
 */
interface BatchRequestConfig {
  maxBatchSize?: number;
  batchDelay?: number;
  enabled?: boolean;
}

/**
 * Debounce configuration
 */
interface DebounceConfig {
  delay?: number;
  maxWait?: number;
  enabled?: boolean;
}

/**
 * Optimized API client configuration
 */
interface OptimizedApiClientConfig extends ApiClientConfig {
  requestDeduplication?: {
    enabled?: boolean;
    cacheTtl?: number;
  };
  batchRequests?: BatchRequestConfig;
  debounce?: DebounceConfig;
}

/**
 * Batch request item
 */
interface BatchRequestItem<T = any> {
  key: string;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

/**
 * Debounced function map
 */
type DebouncedFunction<T extends (...args: any[]) => any> = T & {
  cancel: () => void;
  flush: () => ReturnType<T>;
};

/**
 * Enhanced API Client with performance optimizations
 */
export class OptimizedApiClient extends ApiClient {
  private requestCache = new Map<string, CacheEntry>();
  private batchQueue = new Map<string, BatchRequestItem[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private debouncedFunctions = new Map<string, DebouncedFunction<any>>();
  
  private config: Required<OptimizedApiClientConfig>;

  constructor(config: OptimizedApiClientConfig = {}) {
    super(config);
    
    // Set default configuration
    this.config = {
      ...config,
      requestDeduplication: {
        enabled: true,
        cacheTtl: 5000, // 5 seconds
        ...config.requestDeduplication
      },
      batchRequests: {
        maxBatchSize: 10,
        batchDelay: 50, // 50ms
        enabled: true,
        ...config.batchRequests
      },
      debounce: {
        delay: 300, // 300ms
        maxWait: 1000, // 1 second
        enabled: true,
        ...config.debounce
      }
    };
  }

  /**
   * Generate cache key for request deduplication
   */
  private generateCacheKey(method: string, url: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsStr}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.config.requestDeduplication.cacheTtl;
  }

  /**
   * Get cached request or create new one
   */
  private async getOrCreateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.requestDeduplication.enabled) {
      return requestFn();
    }

    // Check if request is already in progress
    const cached = this.requestCache.get(key);
    if (cached && this.isCacheValid(cached)) {
      console.log(`[OptimizedAPI] Using cached request: ${key}`);
      return cached.promise as Promise<T>;
    }

    // Create new request
    const promise = requestFn();
    const entry: CacheEntry<T> = {
      promise,
      timestamp: Date.now(),
      key
    };

    this.requestCache.set(key, entry);

    // Clean up cache entry after completion
    promise.finally(() => {
      setTimeout(() => {
        if (this.requestCache.get(key) === entry) {
          this.requestCache.delete(key);
        }
      }, this.config.requestDeduplication.cacheTtl);
    });

    return promise;
  }

  /**
   * Create debounced function
   */
  private createDebouncedFunction<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ): DebouncedFunction<T> {
    if (!this.config.debounce.enabled) {
      return fn as DebouncedFunction<T>;
    }

    const existingDebounced = this.debouncedFunctions.get(key);
    if (existingDebounced) {
      return existingDebounced;
    }

    const actualDelay = delay ?? this.config.debounce.delay;
    const maxWait = this.config.debounce.maxWait;
    
    let timeoutId: NodeJS.Timeout | null = null;
    let maxTimeoutId: NodeJS.Timeout | null = null;
    let lastCallTime = 0;
    let lastArgs: Parameters<T>;
    let result: ReturnType<T>;

    const debounced = ((...args: Parameters<T>) => {
      lastArgs = args;
      lastCallTime = Date.now();

      const invoke = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
          maxTimeoutId = null;
        }
        result = fn(...lastArgs);
        return result;
      };

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(invoke, actualDelay);

      // Set max wait timeout if not already set
      if (maxWait && !maxTimeoutId) {
        maxTimeoutId = setTimeout(invoke, maxWait);
      }

      return result;
    }) as DebouncedFunction<T>;

    debounced.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
        maxTimeoutId = null;
      }
    };

    debounced.flush = () => {
      if (timeoutId || maxTimeoutId) {
        debounced.cancel();
        return fn(...lastArgs);
      }
      return result;
    };

    this.debouncedFunctions.set(key, debounced);
    return debounced;
  }

  /**
   * Add request to batch queue
   */
  private async addToBatch<T>(
    batchKey: string,
    requestKey: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.batchRequests.enabled) {
      return requestFn();
    }

    return new Promise<T>((resolve, reject) => {
      const batchItem: BatchRequestItem<T> = {
        key: requestKey,
        request: requestFn,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Get or create batch queue
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
      }

      const queue = this.batchQueue.get(batchKey)!;
      queue.push(batchItem);

      // Process batch if it reaches max size
      if (queue.length >= this.config.batchRequests.maxBatchSize) {
        this.processBatch(batchKey);
      } else {
        // Set timer to process batch after delay
        if (!this.batchTimers.has(batchKey)) {
          const timer = setTimeout(() => {
            this.processBatch(batchKey);
          }, this.config.batchRequests.batchDelay);
          
          this.batchTimers.set(batchKey, timer);
        }
      }
    });
  }

  /**
   * Process batch requests
   */
  private async processBatch(batchKey: string): Promise<void> {
    const queue = this.batchQueue.get(batchKey);
    if (!queue || queue.length === 0) {
      return;
    }

    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Remove items from queue
    const items = queue.splice(0);
    
    console.log(`[OptimizedAPI] Processing batch: ${batchKey} (${items.length} items)`);

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      items.map(item => item.request())
    );

    // Resolve/reject individual promises
    results.forEach((result, index) => {
      const item = items[index];
      if (result.status === 'fulfilled') {
        item.resolve(result.value);
      } else {
        item.reject(result.reason);
      }
    });
  }

  /**
   * Clear all caches and queues
   */
  public clearCache(): void {
    this.requestCache.clear();
    
    // Clear batch queues and timers
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();
    this.batchQueue.clear();
    
    // Clear debounced functions
    this.debouncedFunctions.forEach(fn => fn.cancel());
    this.debouncedFunctions.clear();
  }

  // Enhanced Instance API Methods with optimizations

  /**
   * Get instances with request deduplication and batching
   */
  public async getInstances(params?: InstanceQueryParams): Promise<Instance[]> {
    const cacheKey = this.generateCacheKey('GET', '/instances', params);
    
    return this.getOrCreateRequest(cacheKey, () => {
      return this.addToBatch(
        'instances',
        cacheKey,
        () => super.getInstances(params)
      );
    });
  }

  /**
   * Get instance with request deduplication
   */
  public async getInstance(id: number): Promise<Instance> {
    const cacheKey = this.generateCacheKey('GET', `/instances/${id}`);
    
    return this.getOrCreateRequest(cacheKey, () => {
      return this.addToBatch(
        'instance-details',
        cacheKey,
        () => super.getInstance(id)
      );
    });
  }

  /**
   * Search instances with debouncing
   */
  public async searchInstances(searchTerm: string, params?: InstanceQueryParams): Promise<Instance[]> {
    const debouncedSearch = this.createDebouncedFunction(
      'searchInstances',
      (term: string, searchParams?: InstanceQueryParams) => {
        const searchParams_with_term = {
          ...searchParams,
          search: term
        };
        return this.getInstances(searchParams_with_term);
      }
    );

    return debouncedSearch(searchTerm, params);
  }

  // Enhanced History API Methods with optimizations

  /**
   * Get instance history with request deduplication and batching
   */
  public async getInstanceHistory(
    instanceId: number, 
    params?: HistoryQueryParams
  ): Promise<HistoryListResponse> {
    const cacheKey = this.generateCacheKey('GET', `/instances/${instanceId}/history`, params);
    
    return this.getOrCreateRequest(cacheKey, () => {
      return this.addToBatch(
        'history',
        cacheKey,
        () => super.getInstanceHistory(instanceId, params)
      );
    });
  }

  /**
   * Get history record with request deduplication
   */
  public async getHistoryRecord(historyId: number): Promise<HistoryRecord> {
    const cacheKey = this.generateCacheKey('GET', `/history/${historyId}`);
    
    return this.getOrCreateRequest(cacheKey, () => {
      return this.addToBatch(
        'history-details',
        cacheKey,
        () => super.getHistoryRecord(historyId)
      );
    });
  }

  /**
   * Search history records with debouncing
   */
  public async searchHistory(
    instanceId: number,
    searchTerm: string,
    params?: HistoryQueryParams
  ): Promise<HistoryListResponse> {
    const debouncedSearch = this.createDebouncedFunction(
      `searchHistory-${instanceId}`,
      (term: string, searchParams?: HistoryQueryParams) => {
        // Note: Backend doesn't support text search in history yet
        // This is a placeholder for future implementation
        return this.getInstanceHistory(instanceId, searchParams);
      }
    );

    return debouncedSearch(searchTerm, params);
  }

  /**
   * Batch fetch multiple history records
   */
  public async batchGetHistoryRecords(historyIds: number[]): Promise<HistoryRecord[]> {
    if (!this.config.batchRequests.enabled) {
      // Fallback to individual requests
      const results = await Promise.allSettled(
        historyIds.map(id => this.getHistoryRecord(id))
      );
      
      return results
        .filter((result): result is PromiseFulfilledResult<HistoryRecord> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    }

    // Use batch processing
    const batchKey = 'batch-history-records';
    const promises = historyIds.map(id => 
      this.addToBatch(
        batchKey,
        `history-${id}`,
        () => super.getHistoryRecord(id)
      )
    );

    const results = await Promise.allSettled(promises);
    return results
      .filter((result): result is PromiseFulfilledResult<HistoryRecord> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Batch fetch multiple instances
   */
  public async batchGetInstances(instanceIds: number[]): Promise<Instance[]> {
    if (!this.config.batchRequests.enabled) {
      // Fallback to individual requests
      const results = await Promise.allSettled(
        instanceIds.map(id => this.getInstance(id))
      );
      
      return results
        .filter((result): result is PromiseFulfilledResult<Instance> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    }

    // Use batch processing
    const batchKey = 'batch-instances';
    const promises = instanceIds.map(id => 
      this.addToBatch(
        batchKey,
        `instance-${id}`,
        () => super.getInstance(id)
      )
    );

    const results = await Promise.allSettled(promises);
    return results
      .filter((result): result is PromiseFulfilledResult<Instance> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Prefetch related data for better performance
   */
  public async prefetchInstanceData(instanceId: number): Promise<{
    instance: Instance;
    history: HistoryListResponse;
  }> {
    // Fetch instance and its history in parallel
    const [instance, history] = await Promise.all([
      this.getInstance(instanceId),
      this.getInstanceHistory(instanceId, { limit: 10, offset: 0 })
    ]);

    return { instance, history };
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    requestCacheSize: number;
    batchQueueSizes: Record<string, number>;
    debouncedFunctionCount: number;
  } {
    const batchQueueSizes: Record<string, number> = {};
    this.batchQueue.forEach((queue, key) => {
      batchQueueSizes[key] = queue.length;
    });

    return {
      requestCacheSize: this.requestCache.size,
      batchQueueSizes,
      debouncedFunctionCount: this.debouncedFunctions.size
    };
  }
}

/**
 * Create optimized API client instance
 */
export const createOptimizedApiClient = (config?: OptimizedApiClientConfig): OptimizedApiClient => {
  return new OptimizedApiClient(config);
};

/**
 * Default optimized API client instance
 */
export const optimizedApiClient = new OptimizedApiClient();

export default OptimizedApiClient;