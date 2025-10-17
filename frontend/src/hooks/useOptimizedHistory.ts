/**
 * useOptimizedHistory Hook
 * Enhanced history hook with optimized API requests, caching, and performance improvements
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  useQuery, 
  useInfiniteQuery,
  useQueryClient,
  useMutation
} from '@tanstack/react-query';
import type { 
  UseQueryResult,
  UseInfiniteQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import { EnhancedHistoryService } from '../services/enhancedHistoryService';
import { HISTORY_QUERY_KEYS } from './useHistory';
import type { 
  HistoryRecord, 
  HistoryListResponse,
  HistoryFilters,
  HistoryComparison,
  HistoryComparisonGroup
} from '../types/history';

/**
 * Optimized hook configuration options
 */
export interface UseOptimizedHistoryOptions {
  instanceId?: number;
  filters?: HistoryFilters;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  prefetchNext?: boolean;
  enableSearch?: boolean;
  searchTerm?: string;
  enableBatching?: boolean;
}

/**
 * Search options
 */
export interface SearchOptions {
  debounceDelay?: number;
  minLength?: number;
  maxResults?: number;
}

/**
 * Batch operation options
 */
export interface BatchOptions {
  batchSize?: number;
  parallel?: boolean;
}

/**
 * Enhanced return type for optimized history hook
 */
export interface UseOptimizedHistoryReturn {
  // Data
  history: HistoryRecord[];
  loading: boolean;
  error: string | null;
  isRefetching: boolean;
  
  // Pagination
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<any>;
  
  // Search
  searchResults: HistoryRecord[];
  isSearching: boolean;
  searchError: string | null;
  search: (term: string) => Promise<void>;
  clearSearch: () => void;
  
  // Batch operations
  batchGetRecords: (historyIds: number[]) => Promise<HistoryRecord[]>;
  batchMutation: UseMutationResult<HistoryRecord[], Error, number[]>;
  
  // Query results
  queryResult: UseInfiniteQueryResult<any, Error>;
  searchQueryResult?: UseQueryResult<HistoryListResponse, Error>;
  
  // Actions
  refetch: () => Promise<any>;
  prefetchNext: () => Promise<void>;
  
  // Utility functions
  getHistoryById: (historyId: number) => HistoryRecord | undefined;
  compareRecords: (oldRecord: HistoryRecord, newRecord: HistoryRecord) => HistoryComparison[];
  groupComparisons: (comparisons: HistoryComparison[]) => HistoryComparisonGroup[];
  formatOperationType: (operationType: string) => { label: string; icon: string; color: string };
  formatTimestamp: (timestamp: string) => string;
  getRelativeTime: (timestamp: string) => string;
  
  // Cache management
  invalidateHistory: () => Promise<void>;
  clearCache: () => void;
  getCacheStats: () => any;
  
  // Performance metrics
  metrics: {
    totalRequests: number;
    cacheHits: number;
    averageResponseTime: number;
  };
}

/**
 * Performance metrics tracking
 */
interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  responseTimes: number[];
}

/**
 * useOptimizedHistory Hook with enhanced performance features
 */
export const useOptimizedHistory = (options: UseOptimizedHistoryOptions = {}): UseOptimizedHistoryReturn => {
  const {
    instanceId,
    filters,
    pageSize = 20,
    enabled = true,
    staleTime = 60 * 1000, // 1 minute
    gcTime = 10 * 60 * 1000, // 10 minutes
    prefetchNext = true,
    enableSearch = false,
    searchTerm = '',
    enableBatching = true,
  } = options;

  const queryClient = useQueryClient();
  const metricsRef = useRef<PerformanceMetrics>({
    totalRequests: 0,
    cacheHits: 0,
    responseTimes: []
  });

  // Track performance metrics
  const trackRequest = useCallback((responseTime: number, fromCache = false) => {
    metricsRef.current.totalRequests++;
    metricsRef.current.responseTimes.push(responseTime);
    
    if (fromCache) {
      metricsRef.current.cacheHits++;
    }
    
    // Keep only last 100 response times
    if (metricsRef.current.responseTimes.length > 100) {
      metricsRef.current.responseTimes = metricsRef.current.responseTimes.slice(-100);
    }
  }, []);

  // Enhanced infinite query with optimizations
  const queryResult = useInfiniteQuery({
    queryKey: HISTORY_QUERY_KEYS.infinite(instanceId, filters),
    queryFn: async ({ pageParam = 0 }) => {
      const startTime = Date.now();
      
      try {
        let result: HistoryListResponse;
        
        if (instanceId) {
          result = await EnhancedHistoryService.getInstanceHistory(
            instanceId,
            filters,
            { limit: pageSize, offset: pageParam * pageSize }
          );
        } else {
          result = await EnhancedHistoryService.getAllHistory(
            { ...filters, instanceId },
            { limit: pageSize, offset: pageParam * pageSize }
          );
        }
        
        const responseTime = Date.now() - startTime;
        trackRequest(responseTime);
        
        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        trackRequest(responseTime);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.history_records.length < pageSize) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Search query with debouncing
  const searchQueryResult = useQuery({
    queryKey: ['history-search', instanceId, searchTerm, filters],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return {
          history_records: [],
          total_count: 0,
          limit: pageSize,
          offset: 0,
          has_more: false
        };
      }

      const startTime = Date.now();
      
      try {
        const result = await EnhancedHistoryService.searchHistoryRecords(
          instanceId || 0,
          searchTerm,
          filters,
          { limit: pageSize, offset: 0 }
        );
        
        const responseTime = Date.now() - startTime;
        trackRequest(responseTime);
        
        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        trackRequest(responseTime);
        throw error;
      }
    },
    enabled: enableSearch && !!searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds for search results
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Batch mutation for fetching multiple records
  const batchMutation = useMutation({
    mutationFn: async (historyIds: number[]) => {
      const startTime = Date.now();
      
      try {
        const result = await EnhancedHistoryService.batchGetHistoryRecords(historyIds);
        
        const responseTime = Date.now() - startTime;
        trackRequest(responseTime);
        
        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        trackRequest(responseTime);
        throw error;
      }
    },
  });

  const {
    data,
    isLoading: loading,
    error,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = queryResult;

  // Flatten all pages into a single array
  const history = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.history_records);
  }, [data]);

  // Search results
  const searchResults = useMemo(() => {
    return searchQueryResult?.data?.history_records || [];
  }, [searchQueryResult?.data]);

  // Prefetch next page automatically
  useEffect(() => {
    if (prefetchNext && hasNextPage && !isFetchingNextPage && !loading) {
      const timer = setTimeout(() => {
        fetchNextPage();
      }, 1000); // Prefetch after 1 second of inactivity

      return () => clearTimeout(timer);
    }
  }, [prefetchNext, hasNextPage, isFetchingNextPage, loading, fetchNextPage]);

  /**
   * Search function with debouncing
   */
  const search = useCallback(async (term: string) => {
    if (!enableSearch) return;
    
    // The search is handled by the query, so we just need to trigger a refetch
    // if the search term has changed
    if (term !== searchTerm) {
      await searchQueryResult?.refetch();
    }
  }, [enableSearch, searchTerm, searchQueryResult]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['history-search', instanceId] });
  }, [queryClient, instanceId]);

  /**
   * Batch get records function
   */
  const batchGetRecords = useCallback(async (historyIds: number[]): Promise<HistoryRecord[]> => {
    if (!enableBatching || historyIds.length === 0) {
      return [];
    }

    return batchMutation.mutateAsync(historyIds);
  }, [enableBatching, batchMutation]);

  /**
   * Prefetch next page function
   */
  const prefetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * Get history record by ID from cache
   */
  const getHistoryById = useCallback((historyId: number): HistoryRecord | undefined => {
    // First check in current history
    let record = history.find(record => record.history_id === historyId);
    
    // If not found, check in search results
    if (!record && enableSearch) {
      record = searchResults.find(record => record.history_id === historyId);
    }
    
    return record;
  }, [history, searchResults, enableSearch]);

  /**
   * Compare two history records
   */
  const compareRecords = useCallback((
    oldRecord: HistoryRecord, 
    newRecord: HistoryRecord
  ): HistoryComparison[] => {
    return EnhancedHistoryService.compareHistoryRecords(oldRecord, newRecord);
  }, []);

  /**
   * Group history comparisons by category
   */
  const groupComparisons = useCallback((comparisons: HistoryComparison[]): HistoryComparisonGroup[] => {
    return EnhancedHistoryService.groupHistoryComparisons(comparisons);
  }, []);

  /**
   * Format operation type for display
   */
  const formatOperationType = useCallback((operationType: string) => {
    return EnhancedHistoryService.formatOperationType(operationType);
  }, []);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = useCallback((timestamp: string): string => {
    return EnhancedHistoryService.formatTimestamp(timestamp);
  }, []);

  /**
   * Get relative time string
   */
  const getRelativeTime = useCallback((timestamp: string): string => {
    return EnhancedHistoryService.getRelativeTime(timestamp);
  }, []);

  /**
   * Cache management functions
   */
  const invalidateHistory = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.lists() });
    await queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.all });
    
    if (instanceId) {
      EnhancedHistoryService.invalidateInstanceCache(instanceId);
    }
  }, [queryClient, instanceId]);

  const clearCache = useCallback(() => {
    EnhancedHistoryService.clearCache();
    queryClient.clear();
  }, [queryClient]);

  const getCacheStats = useCallback(() => {
    return EnhancedHistoryService.getCacheStats();
  }, []);

  // Calculate performance metrics
  const metrics = useMemo(() => {
    const { totalRequests, cacheHits, responseTimes } = metricsRef.current;
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      totalRequests,
      cacheHits,
      averageResponseTime: Math.round(averageResponseTime)
    };
  }, [metricsRef.current.totalRequests, metricsRef.current.cacheHits]);

  return {
    // Data
    history,
    loading,
    error: error?.message || null,
    isRefetching,
    
    // Pagination
    hasNextPage: hasNextPage || false,
    isFetchingNextPage,
    fetchNextPage,
    
    // Search
    searchResults,
    isSearching: searchQueryResult?.isLoading || false,
    searchError: searchQueryResult?.error?.message || null,
    search,
    clearSearch,
    
    // Batch operations
    batchGetRecords,
    batchMutation,
    
    // Query results
    queryResult,
    searchQueryResult,
    
    // Actions
    refetch,
    prefetchNext: prefetchNextPage,
    
    // Utility functions
    getHistoryById,
    compareRecords,
    groupComparisons,
    formatOperationType,
    formatTimestamp,
    getRelativeTime,
    
    // Cache management
    invalidateHistory,
    clearCache,
    getCacheStats,
    
    // Performance metrics
    metrics,
  };
};

/**
 * Hook for optimized single history record fetching
 */
export const useOptimizedHistoryRecord = (
  historyId: number, 
  enabled = true
): {
  record: HistoryRecord | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<any>;
} => {
  const queryResult = useQuery({
    queryKey: HISTORY_QUERY_KEYS.detail(historyId),
    queryFn: () => EnhancedHistoryService.getHistoryRecord(historyId),
    enabled: enabled && historyId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const { data: record, isLoading: loading, error, refetch } = queryResult;

  return {
    record,
    loading,
    error: error?.message || null,
    refetch,
  };
};

export default useOptimizedHistory;