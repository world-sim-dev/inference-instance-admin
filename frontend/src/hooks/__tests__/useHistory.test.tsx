/**
 * useHistory Hook Tests
 * Tests for the history management hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useHistory, useHistoryRecord, useHistoryCount, HISTORY_QUERY_KEYS } from '../useHistory';
import { HistoryService } from '../../services/historyService';
import { 
  createTestQueryClient, 
  createMockHistoryRecord, 
  createMockHistoryRecords,
  mockApiResponses 
} from '../../test/utils';
import type { HistoryFilters } from '../../types/history';

// Mock dependencies
vi.mock('../../services/historyService');

const mockedHistoryService = vi.mocked(HistoryService);

describe('useHistory', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('data fetching', () => {
    it('should fetch history successfully', async () => {
      const mockResponse = mockApiResponses.history.getInstanceHistory;
      mockedHistoryService.getInstanceHistory.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toEqual(mockResponse.history_records);
      expect(result.current.error).toBeNull();
      expect(mockedHistoryService.getInstanceHistory).toHaveBeenCalledWith(
        1,
        undefined,
        { limit: 20, offset: 0 }
      );
    });

    it('should handle loading state', () => {
      mockedHistoryService.getInstanceHistory.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.history).toEqual([]);
    });

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch history');
      mockedHistoryService.getInstanceHistory.mockRejectedValue(error);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch history');
      expect(result.current.history).toEqual([]);
    });

    it('should be disabled when enabled is false', () => {
      const { result } = renderHook(() => useHistory({ instanceId: 1, enabled: false }), { wrapper });

      expect(result.current.loading).toBe(false);
      expect(mockedHistoryService.getInstanceHistory).not.toHaveBeenCalled();
    });

    it('should fetch all history when no instanceId provided', async () => {
      const mockResponse = mockApiResponses.history.getInstanceHistory;
      mockedHistoryService.getAllHistory.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useHistory({}), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedHistoryService.getAllHistory).toHaveBeenCalledWith(
        { instanceId: undefined },
        { limit: 20, offset: 0 }
      );
    });
  });

  describe('pagination', () => {
    it('should handle pagination correctly', async () => {
      const firstPageResponse = {
        history_records: createMockHistoryRecords(20),
        total_count: 40,
        limit: 20,
        offset: 0,
        has_more: true,
      };

      const secondPageResponse = {
        history_records: createMockHistoryRecords(20).map(r => ({ ...r, history_id: r.history_id + 20 })),
        total_count: 40,
        limit: 20,
        offset: 20,
        has_more: false,
      };

      mockedHistoryService.getInstanceHistory
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toHaveLength(20);
      expect(result.current.hasNextPage).toBe(true);

      // Fetch next page
      await act(async () => {
        await result.current.fetchNextPage();
      });

      expect(result.current.history).toHaveLength(40);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should handle custom page size', async () => {
      const mockResponse = mockApiResponses.history.getInstanceHistory;
      mockedHistoryService.getInstanceHistory.mockResolvedValue(mockResponse);

      renderHook(() => useHistory({ instanceId: 1, pageSize: 10 }), { wrapper });

      await waitFor(() => {
        expect(mockedHistoryService.getInstanceHistory).toHaveBeenCalledWith(
          1,
          undefined,
          { limit: 10, offset: 0 }
        );
      });
    });

    it('should determine hasNextPage correctly', async () => {
      const mockResponse = {
        history_records: createMockHistoryRecords(5), // Less than page size
        total_count: 5,
        limit: 20,
        offset: 0,
        has_more: false,
      };

      mockedHistoryService.getInstanceHistory.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('filters', () => {
    it('should apply filters to query', async () => {
      const filters: HistoryFilters = {
        operation_type: 'update',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };

      const mockResponse = mockApiResponses.history.getInstanceHistory;
      mockedHistoryService.getInstanceHistory.mockResolvedValue(mockResponse);

      renderHook(() => useHistory({ instanceId: 1, filters }), { wrapper });

      await waitFor(() => {
        expect(mockedHistoryService.getInstanceHistory).toHaveBeenCalledWith(
          1,
          filters,
          { limit: 20, offset: 0 }
        );
      });
    });
  });

  describe('utility functions', () => {
    beforeEach(async () => {
      const mockResponse = mockApiResponses.history.getInstanceHistory;
      mockedHistoryService.getInstanceHistory.mockResolvedValue(mockResponse);
    });

    it('should get history by ID', async () => {
      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const record = result.current.getHistoryById(1);
      expect(record?.history_id).toBe(1);
    });

    it('should compare records', async () => {
      const oldRecord = createMockHistoryRecord({ history_id: 1, name: 'old-name' });
      const newRecord = createMockHistoryRecord({ history_id: 2, name: 'new-name' });
      const mockComparison = [{ field: 'name', oldValue: 'old-name', newValue: 'new-name', changed: true }];

      mockedHistoryService.compareHistoryRecords.mockReturnValue(mockComparison);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      const comparison = result.current.compareRecords(oldRecord, newRecord);

      expect(comparison).toEqual(mockComparison);
      expect(mockedHistoryService.compareHistoryRecords).toHaveBeenCalledWith(oldRecord, newRecord);
    });

    it('should group comparisons', async () => {
      const comparisons = [
        { field: 'name', oldValue: 'old', newValue: 'new', changed: true },
        { field: 'status', oldValue: 'inactive', newValue: 'active', changed: true },
      ];
      const mockGroups = [{ category: 'Basic Info', comparisons }];

      mockedHistoryService.groupHistoryComparisons.mockReturnValue(mockGroups);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      const groups = result.current.groupComparisons(comparisons);

      expect(groups).toEqual(mockGroups);
      expect(mockedHistoryService.groupHistoryComparisons).toHaveBeenCalledWith(comparisons);
    });

    it('should format operation type', async () => {
      const mockFormat = { label: 'Update', icon: 'edit', color: 'blue' };
      mockedHistoryService.formatOperationType.mockReturnValue(mockFormat);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      const formatted = result.current.formatOperationType('update');

      expect(formatted).toEqual(mockFormat);
      expect(mockedHistoryService.formatOperationType).toHaveBeenCalledWith('update');
    });

    it('should format timestamp', async () => {
      const timestamp = '2024-01-01T12:00:00Z';
      const formatted = '2024-01-01 12:00:00';
      mockedHistoryService.formatTimestamp.mockReturnValue(formatted);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      const result_formatted = result.current.formatTimestamp(timestamp);

      expect(result_formatted).toBe(formatted);
      expect(mockedHistoryService.formatTimestamp).toHaveBeenCalledWith(timestamp);
    });

    it('should get relative time', async () => {
      const timestamp = '2024-01-01T12:00:00Z';
      const relative = '2 hours ago';
      mockedHistoryService.getRelativeTime.mockReturnValue(relative);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      const result_relative = result.current.getRelativeTime(timestamp);

      expect(result_relative).toBe(relative);
      expect(mockedHistoryService.getRelativeTime).toHaveBeenCalledWith(timestamp);
    });
  });

  describe('cache management', () => {
    it('should invalidate history cache', async () => {
      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      const spy = vi.spyOn(queryClient, 'invalidateQueries');

      await act(async () => {
        await result.current.invalidateHistory();
      });

      expect(spy).toHaveBeenCalledWith({ queryKey: HISTORY_QUERY_KEYS.lists() });
      expect(spy).toHaveBeenCalledWith({ queryKey: HISTORY_QUERY_KEYS.all });
    });

    it('should set history data in cache', async () => {
      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });
      const newHistory = createMockHistoryRecords(5);

      act(() => {
        result.current.setHistoryData(1, newHistory);
      });

      const cachedData = queryClient.getQueryData(HISTORY_QUERY_KEYS.infinite(1, undefined));
      expect(cachedData).toEqual({
        pages: [{
          history_records: newHistory,
          total_count: 5,
          limit: 5,
          offset: 0,
          has_more: false,
        }],
        pageParams: [0],
      });
    });
  });
});

describe('useHistoryRecord', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should fetch single history record', async () => {
    const mockRecord = mockApiResponses.history.getHistoryRecord;
    mockedHistoryService.getHistoryRecord.mockResolvedValue(mockRecord);

    const { result } = renderHook(() => useHistoryRecord(1), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.record).toEqual(mockRecord);
    expect(result.current.error).toBeNull();
    expect(mockedHistoryService.getHistoryRecord).toHaveBeenCalledWith(1);
  });

  it('should be disabled when historyId is 0', () => {
    const { result } = renderHook(() => useHistoryRecord(0), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(mockedHistoryService.getHistoryRecord).not.toHaveBeenCalled();
  });

  it('should be disabled when enabled is false', () => {
    const { result } = renderHook(() => useHistoryRecord(1, false), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(mockedHistoryService.getHistoryRecord).not.toHaveBeenCalled();
  });
});

describe('useHistoryCount', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should fetch history count', async () => {
    const mockCount = 10;
    mockedHistoryService.getHistoryCount.mockResolvedValue(mockCount);

    const { result } = renderHook(() => useHistoryCount(1), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.count).toBe(mockCount);
    expect(result.current.error).toBeNull();
    expect(mockedHistoryService.getHistoryCount).toHaveBeenCalledWith(1, undefined);
  });

  it('should apply filters to count query', async () => {
    const filters: HistoryFilters = { operation_type: 'update' };
    const mockCount = 5;
    mockedHistoryService.getHistoryCount.mockResolvedValue(mockCount);

    renderHook(() => useHistoryCount(1, filters), { wrapper });

    await waitFor(() => {
      expect(mockedHistoryService.getHistoryCount).toHaveBeenCalledWith(1, filters);
    });
  });

  it('should be disabled when instanceId is 0', () => {
    const { result } = renderHook(() => useHistoryCount(0), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(mockedHistoryService.getHistoryCount).not.toHaveBeenCalled();
  });
});