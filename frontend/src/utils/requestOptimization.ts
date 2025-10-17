/**
 * Request Optimization Utilities
 * Helper functions for optimizing API requests and data loading
 */

/**
 * Debounce function implementation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> } {
  const { leading = false, trailing = true, maxWait } = options;
  
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T>;
  let result: ReturnType<T>;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs;
    lastInvokeTime = time;
    result = func(...args);
    return result;
  }

  function leadingEdge(time: number): ReturnType<T> {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): ReturnType<T> | undefined {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
    return undefined;
  }

  function trailingEdge(time: number): ReturnType<T> {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined as any;
    return result;
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
    lastInvokeTime = 0;
    lastCallTime = 0;
    lastArgs = undefined as any;
  }

  function flush(): ReturnType<T> {
    return timeoutId === null ? result : trailingEdge(Date.now());
  }

  const debounced = ((...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  }) as T & { cancel: () => void; flush: () => ReturnType<T> };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}

/**
 * Throttle function implementation
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> } {
  return debounce(func, delay, {
    ...options,
    maxWait: delay
  });
}

/**
 * Request deduplication utility
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(private defaultTtl: number = 5000) {}

  /**
   * Generate cache key from request parameters
   */
  generateKey(method: string, url: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsStr}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get or create request with deduplication
   */
  async getOrCreate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const promise = requestFn();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      
      // Cache the result
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTtl
      });

      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear pending requests
   */
  clearPending(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    pendingRequests: number;
    hitRate: number;
  } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

/**
 * Batch request processor
 */
export class BatchProcessor<T = any> {
  private queue: Array<{
    key: string;
    request: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
    timestamp: number;
  }> = [];
  
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private maxBatchSize: number = 10,
    private batchDelay: number = 50
  ) {}

  /**
   * Add request to batch
   */
  add(key: string, request: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        key,
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Process batch if it reaches max size
      if (this.queue.length >= this.maxBatchSize) {
        this.processBatch();
      } else {
        // Set timer to process batch after delay
        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.processBatch();
          }, this.batchDelay);
        }
      }
    });
  }

  /**
   * Process current batch
   */
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Get items to process
    const items = this.queue.splice(0);
    
    console.log(`[BatchProcessor] Processing batch of ${items.length} items`);

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
   * Clear queue
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // Reject all pending requests
    this.queue.forEach(item => {
      item.reject(new Error('Batch processor cleared'));
    });
    
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number;
    hasTimer: boolean;
  } {
    return {
      queueSize: this.queue.length,
      hasTimer: this.timer !== null
    };
  }
}

/**
 * Smart cache with LRU eviction
 */
export class SmartCache<T = any> {
  private cache = new Map<string, {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
  }>();

  constructor(
    private maxSize: number = 100,
    private defaultTtl: number = 5 * 60 * 1000 // 5 minutes
  ) {}

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Check if we need to evict items
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  /**
   * Evict least recently used items
   */
  private evictLRU(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(this.maxSize * 0.2);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    averageAccessCount: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
      averageAccessCount: entries.length > 0 ? totalAccess / entries.length : 0
    };
  }
}

/**
 * Performance monitor for request optimization
 */
export class RequestPerformanceMonitor {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    responseTimes: [] as number[],
    errorTypes: new Map<string, number>()
  };

  /**
   * Record request start
   */
  recordRequestStart(): () => void {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    return () => {
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
    };
  }

  /**
   * Record successful request
   */
  recordSuccess(fromCache = false): void {
    this.metrics.successfulRequests++;
    if (fromCache) {
      this.metrics.cacheHits++;
    }
  }

  /**
   * Record failed request
   */
  recordFailure(errorType: string): void {
    this.metrics.failedRequests++;
    const count = this.metrics.errorTypes.get(errorType) || 0;
    this.metrics.errorTypes.set(errorType, count + 1);
  }

  /**
   * Record response time
   */
  private recordResponseTime(time: number): void {
    this.metrics.responseTimes.push(time);
    
    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-100);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    totalRequests: number;
    successRate: number;
    cacheHitRate: number;
    averageResponseTime: number;
    errorBreakdown: Record<string, number>;
  } {
    const { totalRequests, successfulRequests, cacheHits, responseTimes } = this.metrics;
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const errorBreakdown: Record<string, number> = {};
    this.metrics.errorTypes.forEach((count, type) => {
      errorBreakdown[type] = count;
    });

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime),
      errorBreakdown
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      responseTimes: [],
      errorTypes: new Map()
    };
  }
}

// Export default instances
export const globalDeduplicator = new RequestDeduplicator();
export const globalBatchProcessor = new BatchProcessor();
export const globalCache = new SmartCache();
export const globalPerformanceMonitor = new RequestPerformanceMonitor();