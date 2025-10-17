/**
 * Enhanced History Service with Optimized API Requests
 * Extends the base HistoryService with performance optimizations
 */

import { HistoryService } from './historyService';
import { optimizedApiClient } from './optimizedApiClient';
import type {
  HistoryRecord,
  HistoryQueryParams,
  HistoryListResponse,
  HistoryFilters
} from '../types/history';
import { OperationType } from '../types/enums';

/**
 * Cache configuration for history service
 */
interface HistoryCacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

/**
 * Cached data entry
 */
interface CachedEntry<T = any> {
  data: T;
  timestamp: number;
  key: string;
  ttl: number;
}

/**
 * Search configuration
 */
interface SearchConfig {
  debounceDelay: number;
  minSearchLength: number;
  maxResults: number;
}

/**
 * Enhanced History Service with caching and optimizations
 */
export class EnhancedHistoryService extends HistoryService {
  private static cache = new Map<string, CachedEntry>();
  private static searchCache = new Map<string, CachedEntry<HistoryListResponse>>();
  
  private static config: {
    cache: HistoryCacheConfig;
    search: SearchConfig;
  } = {
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100
    },
    search: {
      debounceDelay: 300,
      minSearchLength: 2,
      maxResults: 50
    }
  };

  /**
   * Generate cache key
   */
  private static generateCacheKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.map(p => JSON.stringify(p)).join(':')}`;
  }

  /**
   * Check if cache entry is valid
   */
  private static isCacheValid(entry: CachedEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache
   */
  private static getFromCache<T>(key: string): T | null {
    if (!this.config.cache.enabled) {
      return null;
    }

    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      console.log(`[EnhancedHistoryService] Cache hit: ${key}`);
      return entry.data as T;
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Set data in cache
   */
  private static setCache<T>(key: string, data: T, ttl?: number): void {
    if (!this.config.cache.enabled) {
      return;
    }

    // Check cache size limit
    if (this.cache.size >= this.config.cache.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(this.config.cache.maxSize * 0.2); // Remove 20%
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    const entry: CachedEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
      ttl: ttl || this.config.cache.ttl
    };

    this.cache.set(key, entry);
    console.log(`[EnhancedHistoryService] Cache set: ${key}`);
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.searchCache.clear();
    console.log('[EnhancedHistoryService] Cache cleared');
  }

  /**
   * Invalidate cache for specific instance
   */
  static invalidateInstanceCache(instanceId: number): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (key.includes(`instance:${instanceId}`) || key.includes(`instanceId:${instanceId}`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`[EnhancedHistoryService] Cache invalidated: ${key}`);
    });

    // Also clear search cache
    this.searchCache.clear();
  }

  /**
   * Get instance history with caching and optimization
   */
  static async getInstanceHistory(
    instanceId: number,
    filters?: HistoryFilters,
    pagination?: { limit?: number; offset?: number }
  ): Promise<HistoryListResponse> {
    const cacheKey = this.generateCacheKey(
      'instance-history',
      instanceId,
      filters,
      pagination
    );

    // Try cache first
    const cached = this.getFromCache<HistoryListResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use optimized API client
      const params: HistoryQueryParams = {
        limit: pagination?.limit || 50,
        offset: pagination?.offset || 0
      };

      if (filters) {
        if (filters.operation_type && filters.operation_type.length > 0) {
          params.operation_type = filters.operation_type[0];
        }
        if (filters.date_range) {
          params.start_date = filters.date_range.start;
          params.end_date = filters.date_range.end;
        }
      }

      const result = await optimizedApiClient.getInstanceHistory(instanceId, params);
      
      // Cache the result
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get history record with caching
   */
  static async getHistoryRecord(historyId: number): Promise<HistoryRecord> {
    const cacheKey = this.generateCacheKey('history-record', historyId);

    // Try cache first
    const cached = this.getFromCache<HistoryRecord>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await optimizedApiClient.getHistoryRecord(historyId);
      
      // Cache the result with longer TTL for individual records
      this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch get multiple history records
   */
  static async batchGetHistoryRecords(historyIds: number[]): Promise<HistoryRecord[]> {
    if (historyIds.length === 0) {
      return [];
    }

    // Check cache for each record
    const cachedRecords: HistoryRecord[] = [];
    const uncachedIds: number[] = [];

    historyIds.forEach(id => {
      const cacheKey = this.generateCacheKey('history-record', id);
      const cached = this.getFromCache<HistoryRecord>(cacheKey);
      
      if (cached) {
        cachedRecords.push(cached);
      } else {
        uncachedIds.push(id);
      }
    });

    // Fetch uncached records in batch
    let fetchedRecords: HistoryRecord[] = [];
    if (uncachedIds.length > 0) {
      try {
        fetchedRecords = await optimizedApiClient.batchGetHistoryRecords(uncachedIds);
        
        // Cache the fetched records
        fetchedRecords.forEach(record => {
          const cacheKey = this.generateCacheKey('history-record', record.history_id);
          this.setCache(cacheKey, record, 10 * 60 * 1000);
        });
      } catch (error) {
        console.error('[EnhancedHistoryService] Batch fetch failed:', error);
        // Fallback to individual requests
        const results = await Promise.allSettled(
          uncachedIds.map(id => this.getHistoryRecord(id))
        );
        
        fetchedRecords = results
          .filter((result): result is PromiseFulfilledResult<HistoryRecord> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);
      }
    }

    // Combine cached and fetched records, maintaining original order
    const allRecords = [...cachedRecords, ...fetchedRecords];
    return historyIds
      .map(id => allRecords.find(record => record.history_id === id))
      .filter((record): record is HistoryRecord => record !== undefined);
  }

  /**
   * Search history records with debouncing and caching
   */
  static async searchHistoryRecords(
    instanceId: number,
    searchTerm: string,
    filters?: HistoryFilters,
    pagination?: { limit?: number; offset?: number }
  ): Promise<HistoryListResponse> {
    // Validate search term
    if (searchTerm.length < this.config.search.minSearchLength) {
      return {
        history_records: [],
        total_count: 0,
        limit: pagination?.limit || 50,
        offset: pagination?.offset || 0,
        has_more: false
      };
    }

    const cacheKey = this.generateCacheKey(
      'search-history',
      instanceId,
      searchTerm.toLowerCase(),
      filters,
      pagination
    );

    // Try search cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log(`[EnhancedHistoryService] Search cache hit: ${searchTerm}`);
      return cached.data;
    }

    try {
      // Use debounced search from optimized API client
      const result = await optimizedApiClient.searchHistory(instanceId, searchTerm, {
        limit: Math.min(pagination?.limit || 50, this.config.search.maxResults),
        offset: pagination?.offset || 0,
        ...(filters?.operation_type && { operation_type: filters.operation_type[0] }),
        ...(filters?.date_range && {
          start_date: filters.date_range.start,
          end_date: filters.date_range.end
        })
      });

      // Cache search results with shorter TTL
      const searchEntry: CachedEntry<HistoryListResponse> = {
        data: result,
        timestamp: Date.now(),
        key: cacheKey,
        ttl: 2 * 60 * 1000 // 2 minutes for search results
      };
      
      this.searchCache.set(cacheKey, searchEntry);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Prefetch related history data
   */
  static async prefetchHistoryData(instanceId: number): Promise<{
    recent: HistoryListResponse;
    count: number;
    latest: HistoryRecord | null;
  }> {
    try {
      // Fetch recent history, count, and latest record in parallel
      const [recent, count, latest] = await Promise.allSettled([
        this.getInstanceHistory(instanceId, undefined, { limit: 10, offset: 0 }),
        this.getHistoryCount(instanceId),
        this.getLatestHistory(instanceId).catch(() => null)
      ]);

      return {
        recent: recent.status === 'fulfilled' ? recent.value : {
          history_records: [],
          total_count: 0,
          limit: 10,
          offset: 0,
          has_more: false
        },
        count: count.status === 'fulfilled' ? count.value : 0,
        latest: latest.status === 'fulfilled' ? latest.value : null
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get history count with caching
   */
  static async getHistoryCount(instanceId: number, filters?: HistoryFilters): Promise<number> {
    const cacheKey = this.generateCacheKey('history-count', instanceId, filters);

    // Try cache first
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const result = await super.getHistoryCount(instanceId, filters);
      
      // Cache count with shorter TTL
      this.setCache(cacheKey, result, 2 * 60 * 1000); // 2 minutes
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get latest history with caching
   */
  static async getLatestHistory(instanceId: number, operationType?: OperationType): Promise<HistoryRecord> {
    const cacheKey = this.generateCacheKey('latest-history', instanceId, operationType);

    // Try cache first
    const cached = this.getFromCache<HistoryRecord>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await super.getLatestHistory(instanceId, operationType);
      
      // Cache latest with shorter TTL
      this.setCache(cacheKey, result, 1 * 60 * 1000); // 1 minute
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    cacheSize: number;
    searchCacheSize: number;
    hitRate: number;
    apiClientStats: any;
  } {
    const apiClientStats = optimizedApiClient.getCacheStats();
    
    return {
      cacheSize: this.cache.size,
      searchCacheSize: this.searchCache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
      apiClientStats
    };
  }

  /**
   * Configure cache settings
   */
  static configureCaching(config: Partial<HistoryCacheConfig>): void {
    this.config.cache = { ...this.config.cache, ...config };
    console.log('[EnhancedHistoryService] Cache configuration updated:', this.config.cache);
  }

  /**
   * Configure search settings
   */
  static configureSearch(config: Partial<SearchConfig>): void {
    this.config.search = { ...this.config.search, ...config };
    console.log('[EnhancedHistoryService] Search configuration updated:', this.config.search);
  }
}

export default EnhancedHistoryService;