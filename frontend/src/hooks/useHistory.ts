/**
 * useHistory Hook
 * Custom hook for managing history data with React Query integration
 * Provides caching, background sync, and optimized data fetching
 */

import { useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query';
import type { 
  UseQueryResult,
  UseInfiniteQueryResult
} from '@tanstack/react-query';
import { HistoryService } from '../services/historyService';
import type { 
  HistoryRecord, 
  HistoryListResponse,
  HistoryFilters,
  HistoryComparison,
  HistoryComparisonGroup
} from '../types/history';

/**
 * Query keys for React Query
 */
export const HISTORY_QUERY_KEYS = {
  all: ['history'] as const,
  lists: () => [...HISTORY_QUERY_KEYS.all, 'list'] as const,
  list: (instanceId?: number, filters?: HistoryFilters) => 
    [...HISTORY_QUERY_KEYS.lists(), instanceId, filters] as const,
  infinite: (instanceId?: number, filters?: HistoryFilters) => 
    [...HISTORY_QUERY_KEYS.all, 'infinite', instanceId, filters] as const,
  details: () => [...HISTORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (historyId: number) => [...HISTORY_QUERY_KEYS.details(), historyId] as const,
  latest: (instanceId: number, operationType?: string) => 
    [...HISTORY_QUERY_KEYS.all, 'latest', instanceId, operationType] as const,
  count: (instanceId: number, filters?: HistoryFilters) => 
    [...HISTORY_QUERY_KEYS.all, 'count', instanceId, filters] as const,
};

/**
 * Hook configuration options
 */
export interface UseHistoryOptions {
  instanceId?: number;
  filters?: HistoryFilters;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

/**
 * Return type for useHistory hook
 */
export interface UseHistoryReturn {
  // Data
  history: HistoryRecord[];
  loading: boolean;
  error: string | null;
  isRefetching: boolean;
  
  // Pagination
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<any>;
  
  // Query result
  queryResult: UseInfiniteQueryResult<any, Error>;
  
  // Actions
  refetch: () => Promise<any>;
  
  // Utility functions
  getHistoryById: (historyId: number) => HistoryRecord | undefined;
  compareRecords: (oldRecord: HistoryRecord, newRecord: HistoryRecord) => HistoryComparison[];
  groupComparisons: (comparisons: HistoryComparison[]) => HistoryComparisonGroup[];
  formatOperationType: (operationType: string) => { label: string; icon: string; color: string };
  formatTimestamp: (timestamp: string) => string;
  getRelativeTime: (timestamp: string) => string;
  
  // Cache management
  invalidateHistory: () => Promise<void>;
  setHistoryData: (instanceId: number, data: HistoryRecord[]) => void;
}

/**
 * Return type for single history record hook
 */
export interface UseHistoryRecordReturn {
  record: HistoryRecord | undefined;
  loading: boolean;
  error: string | null;
  queryResult: UseQueryResult<HistoryRecord, Error>;
  refetch: () => Promise<any>;
}

/**
 * Return type for history count hook
 */
export interface UseHistoryCountReturn {
  count: number;
  loading: boolean;
  error: string | null;
  queryResult: UseQueryResult<number, Error>;
  refetch: () => Promise<any>;
}

/**
 * useHistory Hook with infinite query for pagination
 */
export const useHistory = (options: UseHistoryOptions = {}): UseHistoryReturn => {
  const {
    instanceId,
    filters,
    pageSize = 20,
    enabled = true,
    staleTime = 60 * 1000, // 1 minute
    gcTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const queryClient = useQueryClient();

  // Infinite query for paginated history data
  const queryResult = useInfiniteQuery({
    queryKey: HISTORY_QUERY_KEYS.infinite(instanceId, filters),
    queryFn: async ({ pageParam = 0 }) => {
      if (instanceId) {
        return await HistoryService.getInstanceHistory(
          instanceId,
          filters,
          { limit: pageSize, offset: pageParam * pageSize }
        );
      } else {
        return await HistoryService.getAllHistory(
          { ...filters, instanceId },
          { limit: pageSize, offset: pageParam * pageSize }
        );
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more pages
      if (lastPage.history_records.length < pageSize) {
        return undefined; // No more pages
      }
      return allPages.length; // Next page number
    },
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
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

  /**
   * Get history record by ID from cache
   */
  const getHistoryById = useCallback((historyId: number): HistoryRecord | undefined => {
    return history.find(record => record.history_id === historyId);
  }, [history]);

  /**
   * Compare two history records
   */
  const compareRecords = useCallback((
    oldRecord: HistoryRecord, 
    newRecord: HistoryRecord
  ): HistoryComparison[] => {
    return HistoryService.compareHistoryRecords(oldRecord, newRecord);
  }, []);

  /**
   * Group history comparisons by category
   */
  const groupComparisons = useCallback((comparisons: HistoryComparison[]): HistoryComparisonGroup[] => {
    return HistoryService.groupHistoryComparisons(comparisons);
  }, []);

  /**
   * Format operation type for display
   */
  const formatOperationType = useCallback((operationType: string) => {
    return HistoryService.formatOperationType(operationType);
  }, []);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = useCallback((timestamp: string): string => {
    return HistoryService.formatTimestamp(timestamp);
  }, []);

  /**
   * Get relative time string
   */
  const getRelativeTime = useCallback((timestamp: string): string => {
    return HistoryService.getRelativeTime(timestamp);
  }, []);

  /**
   * Cache management functions
   */
  const invalidateHistory = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.lists() });
    await queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.all });
  }, [queryClient]);

  const setHistoryData = useCallback((instanceId: number, data: HistoryRecord[]) => {
    // Create a mock response structure
    const mockResponse: HistoryListResponse = {
      history_records: data,
      total_count: data.length,
      limit: data.length,
      offset: 0,
      has_more: false
    };

    queryClient.setQueryData(
      HISTORY_QUERY_KEYS.infinite(instanceId, filters),
      {
        pages: [mockResponse],
        pageParams: [0],
      }
    );
  }, [queryClient, filters]);

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
    
    // Query result
    queryResult,
    
    // Actions
    refetch,
    
    // Utility functions
    getHistoryById,
    compareRecords,
    groupComparisons,
    formatOperationType,
    formatTimestamp,
    getRelativeTime,
    
    // Cache management
    invalidateHistory,
    setHistoryData,
  };
};

/**
 * Hook for fetching a single history record
 */
export const useHistoryRecord = (historyId: number, enabled = true): UseHistoryRecordReturn => {
  const queryResult = useQuery({
    queryKey: HISTORY_QUERY_KEYS.detail(historyId),
    queryFn: () => HistoryService.getHistoryRecord(historyId),
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
    queryResult,
    refetch,
  };
};

/**
 * Hook for fetching history count
 */
export const useHistoryCount = (
  instanceId: number, 
  filters?: HistoryFilters,
  enabled = true
): UseHistoryCountReturn => {
  const queryResult = useQuery({
    queryKey: HISTORY_QUERY_KEYS.count(instanceId, filters),
    queryFn: () => HistoryService.getHistoryCount(instanceId, filters),
    enabled: enabled && instanceId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const { data: count = 0, isLoading: loading, error, refetch } = queryResult;

  return {
    count,
    loading,
    error: error?.message || null,
    queryResult,
    refetch,
  };
};

/**
 * Hook for fetching latest history record
 */
export const useLatestHistory = (
  instanceId: number,
  operationType?: string,
  enabled = true
): UseHistoryRecordReturn => {
  const queryResult = useQuery({
    queryKey: HISTORY_QUERY_KEYS.latest(instanceId, operationType),
    queryFn: () => HistoryService.getLatestHistory(instanceId, operationType as any),
    enabled: enabled && instanceId > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });

  const { data: record, isLoading: loading, error, refetch } = queryResult;

  return {
    record,
    loading,
    error: error?.message || null,
    queryResult,
    refetch,
  };
};

export default useHistory;