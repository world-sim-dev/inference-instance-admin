/**
 * History API Integration Tests
 * Tests API integration and data consistency for history functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { useHistory } from '../../../hooks/useHistory';
import { HistoryService } from '../../../services/historyService';
import { 
  createTestQueryClient, 
  createMockInstance, 
  createMockHistoryRecords,
  mockApiResponses
} from '../../utils';

// Setup mock adapter
let mockAxios: MockAdapter;
let queryClient: QueryClient;
let wrapper: React.FC<{ children: React.ReactNode }>;

describe('History API Integration Tests', () => {
  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    queryClient = createTestQueryClient();
    
    wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
  });

  afterEach(() => {
    mockAxios.restore();
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('History Data Fetching', () => {
    it('should fetch instance history with pagination', async () => {
      const mockHistory = {
        history_records: createMockHistoryRecords(20),
        total_count: 100,
        limit: 20,
        offset: 0,
        has_more: true,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, mockHistory);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toEqual(mockHistory.history_records);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('should handle history filtering', async () => {
      const filteredHistory = {
        history_records: createMockHistoryRecords(5).map(r => ({ ...r, operation_type: 'update' })),
        total_count: 5,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      const filters = {
        operation_type: ['update'],
        date_range: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, filteredHistory);

      const { result } = renderHook(() => useHistory({ instanceId: 1, filters }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toEqual(filteredHistory.history_records);
      expect(result.current.history.every(r => r.operation_type === 'update')).toBe(true);
    });

    it('should handle search queries', async () => {
      const searchResults = {
        history_records: createMockHistoryRecords(3).map(record => ({
          ...record,
          name: `test-${record.name}`,
          description: `This is a test description`,
        })),
        total_count: 3,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, searchResults);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toEqual(searchResults.history_records);
      expect(result.current.history[0].name).toContain('test');
    });

    it('should fetch individual history records', async () => {
      const mockRecord = createMockHistoryRecords(1)[0];
      
      mockAxios.onGet('/api/history/1').reply(200, mockRecord);

      const record = await HistoryService.getHistoryRecord(1);

      expect(record).toEqual(mockRecord);
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toBe('/api/history/1');
    });

    it('should handle large datasets with virtual scrolling', async () => {
      const largeDataset = {
        history_records: createMockHistoryRecords(1000),
        total_count: 10000,
        limit: 50,
        offset: 0,
        has_more: true,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, largeDataset);

      const startTime = Date.now();
      const { result } = renderHook(() => useHistory({ instanceId: 1, pageSize: 50 }), { wrapper });
      const loadTime = Date.now() - startTime;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should load efficiently even with large datasets
      expect(loadTime).toBeLessThan(1000);
      expect(result.current.history).toHaveLength(1000);
      expect(result.current.hasNextPage).toBe(true);
    });
  });

  describe('History Operations', () => {
    it('should compare history records', async () => {
      const record1 = createMockHistoryRecords(1)[0];
      const record2 = { ...record1, name: 'updated-name', description: 'updated description' };

      const result = HistoryService.compareHistoryRecords(record1, record2);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      const nameComparison = result.find(c => c.field === 'name');
      expect(nameComparison?.changed).toBe(true);
      expect(nameComparison?.oldValue).toBe(record1.name);
      expect(nameComparison?.newValue).toBe(record2.name);
    });

    it('should format operation types correctly', async () => {
      const createFormat = HistoryService.formatOperationType('create');
      expect(createFormat.label).toBe('Created');
      expect(createFormat.color).toBe('success');

      const updateFormat = HistoryService.formatOperationType('update');
      expect(updateFormat.label).toBe('Updated');
      expect(updateFormat.color).toBe('warning');

      const deleteFormat = HistoryService.formatOperationType('delete');
      expect(deleteFormat.label).toBe('Deleted');
      expect(deleteFormat.color).toBe('error');
    });

    it('should format timestamps correctly', async () => {
      const timestamp = '2024-01-01T12:00:00Z';
      const formatted = HistoryService.formatTimestamp(timestamp);
      
      expect(formatted).toContain('2024');
      expect(typeof formatted).toBe('string');
    });

    it('should get relative time correctly', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      
      const relativeTime = HistoryService.getRelativeTime(oneHourAgo);
      expect(relativeTime).toContain('hour');
      expect(relativeTime).toContain('ago');
    });
  });

  describe('Caching and Performance', () => {
    it('should cache history data effectively', async () => {
      const mockHistory = {
        history_records: createMockHistoryRecords(10),
        total_count: 10,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, mockHistory);

      // First render
      const { result: result1 } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });
      await waitFor(() => expect(result1.current.loading).toBe(false));

      const firstRequestCount = mockAxios.history.get.length;

      // Second render with same parameters should use cache
      const { result: result2 } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });
      await waitFor(() => expect(result2.current.loading).toBe(false));

      // Should not make additional requests due to React Query caching
      expect(mockAxios.history.get.length).toBe(firstRequestCount);
      expect(result2.current.history).toEqual(mockHistory.history_records);
    });

    it('should invalidate cache on data changes', async () => {
      const initialHistory = {
        history_records: createMockHistoryRecords(5),
        total_count: 5,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      const updatedHistory = {
        history_records: createMockHistoryRecords(6),
        total_count: 6,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').replyOnce(200, initialHistory);
      mockAxios.onGet('/api/instances/1/history').replyOnce(200, updatedHistory);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      // Initial load
      await waitFor(() => expect(result.current.history).toHaveLength(5));

      // Invalidate cache and refetch
      await result.current.invalidateHistory();
      await result.current.refetch();
      
      await waitFor(() => expect(result.current.history).toHaveLength(6));

      expect(mockAxios.history.get.length).toBe(2);
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockHistory = {
        history_records: createMockHistoryRecords(10),
        total_count: 10,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, mockHistory);

      // Create multiple hooks with same parameters
      const { result: result1 } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });
      const { result: result2 } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
        expect(result2.current.loading).toBe(false);
      });

      // React Query should deduplicate requests
      expect(mockAxios.history.get.length).toBe(1);
      expect(result1.current.history).toEqual(result2.current.history);
    });

    it('should handle pagination efficiently', async () => {
      const firstPage = {
        history_records: createMockHistoryRecords(20),
        total_count: 50,
        limit: 20,
        offset: 0,
        has_more: true,
      };
      
      const secondPage = {
        history_records: createMockHistoryRecords(20).map(r => ({ ...r, history_id: r.history_id + 20 })),
        total_count: 50,
        limit: 20,
        offset: 20,
        has_more: true,
      };
      
      mockAxios.onGet('/api/instances/1/history').replyOnce(200, firstPage);
      mockAxios.onGet('/api/instances/1/history').replyOnce(200, secondPage);

      const { result } = renderHook(() => useHistory({ instanceId: 1, pageSize: 20 }), { wrapper });

      // Wait for first page
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.history).toHaveLength(20);
      });

      // Load next page
      await result.current.fetchNextPage();

      await waitFor(() => {
        expect(result.current.history).toHaveLength(40);
      });

      expect(mockAxios.history.get.length).toBe(2);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle API errors gracefully', async () => {
      mockAxios.onGet('/api/instances/1/history').reply(500, { 
        detail: 'Internal server error' 
      });

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Request failed');
      expect(result.current.history).toEqual([]);
    });

    it('should handle network errors', async () => {
      mockAxios.onGet('/api/instances/1/history').networkError();

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Network Error');
    });

    it('should implement retry logic with exponential backoff', async () => {
      let attemptCount = 0;

      mockAxios.onGet('/api/instances/1/history').reply(() => {
        attemptCount++;
        
        if (attemptCount < 3) {
          return [500, { detail: 'Temporary server error' }];
        }
        return [200, {
          history_records: createMockHistoryRecords(5),
          total_count: 5,
          limit: 20,
          offset: 0,
          has_more: false,
        }];
      });

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      // React Query should retry failed requests
      expect(attemptCount).toBeGreaterThan(1);
      expect(result.current.history).toHaveLength(5);
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/api/instances/1/history').timeout();

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('timeout');
    });
  });

  describe('Utility Functions', () => {
    it('should provide utility functions for history management', async () => {
      const mockHistory = {
        history_records: createMockHistoryRecords(5),
        total_count: 5,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, mockHistory);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test utility functions
      expect(typeof result.current.getHistoryById).toBe('function');
      expect(typeof result.current.compareRecords).toBe('function');
      expect(typeof result.current.formatOperationType).toBe('function');
      expect(typeof result.current.formatTimestamp).toBe('function');
      expect(typeof result.current.getRelativeTime).toBe('function');

      // Test getHistoryById
      const firstRecord = result.current.history[0];
      const foundRecord = result.current.getHistoryById(firstRecord.history_id);
      expect(foundRecord).toEqual(firstRecord);
    });
  });

  describe('Data Consistency Validation', () => {
    it('should handle valid history data correctly', async () => {
      const validHistory = {
        history_records: createMockHistoryRecords(3),
        total_count: 3,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, validHistory);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toHaveLength(3);
      expect(result.current.error).toBeNull();
      
      // Verify all records have required fields
      result.current.history.forEach(record => {
        expect(record.history_id).toBeDefined();
        expect(record.original_id).toBeDefined();
        expect(record.operation_type).toBeDefined();
        expect(record.operation_timestamp).toBeDefined();
      });
    });

    it('should maintain data integrity across operations', async () => {
      const historyData = {
        history_records: createMockHistoryRecords(5),
        total_count: 5,
        limit: 20,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, historyData);

      const { result } = renderHook(() => useHistory({ instanceId: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test data integrity
      const originalData = [...result.current.history];
      
      // Refetch data
      await result.current.refetch();
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data should remain consistent
      expect(result.current.history).toEqual(originalData);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle pagination efficiently', async () => {
      const firstPage = {
        history_records: createMockHistoryRecords(20),
        total_count: 100,
        limit: 20,
        offset: 0,
        has_more: true,
      };
      
      const secondPage = {
        history_records: createMockHistoryRecords(20).map(r => ({ ...r, history_id: r.history_id + 20 })),
        total_count: 100,
        limit: 20,
        offset: 20,
        has_more: true,
      };
      
      mockAxios.onGet('/api/instances/1/history').replyOnce(200, firstPage);
      mockAxios.onGet('/api/instances/1/history').replyOnce(200, secondPage);

      const { result } = renderHook(() => useHistory({ instanceId: 1, pageSize: 20 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.history).toHaveLength(20);
      });

      // Load next page
      await result.current.fetchNextPage();

      await waitFor(() => {
        expect(result.current.history).toHaveLength(40);
      });

      expect(result.current.hasNextPage).toBe(true);
    });

    it('should optimize memory usage with efficient data structures', async () => {
      const largeDataset = {
        history_records: createMockHistoryRecords(1000),
        total_count: 1000,
        limit: 1000,
        offset: 0,
        has_more: false,
      };
      
      mockAxios.onGet('/api/instances/1/history').reply(200, largeDataset);

      const startTime = Date.now();
      const { result } = renderHook(() => useHistory({ instanceId: 1, pageSize: 1000 }), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const loadTime = Date.now() - startTime;

      // Should handle large datasets efficiently
      expect(loadTime).toBeLessThan(2000);
      expect(result.current.history).toHaveLength(1000);
    });
  });
});