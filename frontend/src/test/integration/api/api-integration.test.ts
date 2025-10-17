/**
 * API Integration Tests
 * Tests API client integration and data flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { useInstances } from '../../../hooks/useInstances';
import { useHistory } from '../../../hooks/useHistory';
import { InstanceService } from '../../../services/instanceService';
import { HistoryService } from '../../../services/historyService';
import { ApiClient } from '../../../services/api';
import { 
  createTestQueryClient, 
  createMockInstance, 
  createMockInstances,
  createMockCreateInstanceData,
  createMockHistoryRecords 
} from '../../utils';

// Setup mock adapter
let mockAxios: MockAdapter;
let queryClient: QueryClient;
let wrapper: React.FC<{ children: React.ReactNode }>;

describe('API Integration Tests', () => {
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

  describe('Instance API Integration', () => {
    describe('GET /api/instances', () => {
      it('should fetch instances successfully', async () => {
        const mockInstances = createMockInstances(3);
        mockAxios.onGet('/api/instances').reply(200, mockInstances);

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.instances).toEqual(mockInstances);
        expect(result.current.error).toBeNull();
      });

      it('should handle query parameters', async () => {
        const mockInstances = createMockInstances(2);
        const queryParams = { model_name: 'test-model', active_only: true };
        
        mockAxios.onGet('/api/instances', { params: queryParams }).reply(200, mockInstances);

        const { result } = renderHook(() => useInstances(queryParams), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.instances).toEqual(mockInstances);
      });

      it('should handle API errors', async () => {
        mockAxios.onGet('/api/instances').reply(500, { detail: 'Internal server error' });

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Internal server error');
        expect(result.current.instances).toEqual([]);
      });

      it('should handle network errors', async () => {
        mockAxios.onGet('/api/instances').networkError();

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toContain('Network Error');
      });

      it('should handle timeout errors', async () => {
        mockAxios.onGet('/api/instances').timeout();

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toContain('timeout');
      });
    });

    describe('POST /api/instances', () => {
      it('should create instance successfully', async () => {
        const createData = createMockCreateInstanceData();
        const createdInstance = createMockInstance({ id: 999, ...createData });
        
        mockAxios.onGet('/api/instances').reply(200, []);
        mockAxios.onPost('/api/instances').reply(201, createdInstance);

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await result.current.createInstance.mutateAsync(createData);

        expect(result.current.createInstance.isSuccess).toBe(true);
        expect(mockAxios.history.post).toHaveLength(1);
        expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(createData);
      });

      it('should handle validation errors', async () => {
        const createData = createMockCreateInstanceData();
        const validationError = {
          detail: [
            {
              loc: ['body', 'name'],
              msg: 'Instance name already exists',
              type: 'value_error',
            },
          ],
        };
        
        mockAxios.onGet('/api/instances').reply(200, []);
        mockAxios.onPost('/api/instances').reply(422, validationError);

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        try {
          await result.current.createInstance.mutateAsync(createData);
        } catch (error: any) {
          expect(error.response.status).toBe(422);
          expect(error.response.data).toEqual(validationError);
        }
      });

      it('should handle server errors', async () => {
        const createData = createMockCreateInstanceData();
        
        mockAxios.onGet('/api/instances').reply(200, []);
        mockAxios.onPost('/api/instances').reply(500, { detail: 'Database connection failed' });

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        try {
          await result.current.createInstance.mutateAsync(createData);
        } catch (error: any) {
          expect(error.response.status).toBe(500);
        }
      });
    });

    describe('PUT /api/instances/:id', () => {
      it('should update instance successfully', async () => {
        const existingInstance = createMockInstance({ id: 1 });
        const updateData = { name: 'updated-name', description: 'Updated description' };
        const updatedInstance = { ...existingInstance, ...updateData };
        
        mockAxios.onGet('/api/instances').reply(200, [existingInstance]);
        mockAxios.onPut('/api/instances/1').reply(200, updatedInstance);

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await result.current.updateInstance.mutateAsync({ id: 1, data: updateData });

        expect(result.current.updateInstance.isSuccess).toBe(true);
        expect(mockAxios.history.put).toHaveLength(1);
        expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(updateData);
      });

      it('should handle not found errors', async () => {
        const updateData = { name: 'updated-name' };
        
        mockAxios.onGet('/api/instances').reply(200, []);
        mockAxios.onPut('/api/instances/999').reply(404, { detail: 'Instance not found' });

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        try {
          await result.current.updateInstance.mutateAsync({ id: 999, data: updateData });
        } catch (error: any) {
          expect(error.response.status).toBe(404);
        }
      });
    });

    describe('DELETE /api/instances/:id', () => {
      it('should delete instance successfully', async () => {
        const existingInstance = createMockInstance({ id: 1 });
        
        mockAxios.onGet('/api/instances').reply(200, [existingInstance]);
        mockAxios.onDelete('/api/instances/1').reply(204);

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await result.current.deleteInstance.mutateAsync(1);

        expect(result.current.deleteInstance.isSuccess).toBe(true);
        expect(mockAxios.history.delete).toHaveLength(1);
      });

      it('should handle delete conflicts', async () => {
        mockAxios.onGet('/api/instances').reply(200, []);
        mockAxios.onDelete('/api/instances/1').reply(409, { 
          detail: 'Cannot delete instance with active tasks' 
        });

        const { result } = renderHook(() => useInstances(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        try {
          await result.current.deleteInstance.mutateAsync(1);
        } catch (error: any) {
          expect(error.response.status).toBe(409);
        }
      });
    });
  });

  describe('History API Integration', () => {
    describe('GET /api/instances/:id/history', () => {
      it('should fetch history successfully', async () => {
        const mockHistory = {
          history_records: createMockHistoryRecords(3),
          total_count: 3,
          limit: 20,
          offset: 0,
          has_more: false,
        };
        
        mockAxios.onGet('/api/instances/1/history').reply(200, mockHistory);

        const { result } = renderHook(() => useHistory(), { wrapper });

        await result.current.loadHistory(1);

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.history).toEqual(mockHistory.history_records);
        expect(result.current.error).toBeNull();
      });

      it('should handle pagination parameters', async () => {
        const mockHistory = {
          history_records: createMockHistoryRecords(2),
          total_count: 10,
          limit: 2,
          offset: 4,
          has_more: true,
        };
        
        const params = { limit: 2, offset: 4 };
        mockAxios.onGet('/api/instances/1/history', { params }).reply(200, mockHistory);

        const { result } = renderHook(() => useHistory(), { wrapper });

        await result.current.loadHistory(1, params);

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.history).toEqual(mockHistory.history_records);
        expect(result.current.pagination).toEqual({
          total: 10,
          limit: 2,
          offset: 4,
          hasMore: true,
        });
      });

      it('should handle empty history', async () => {
        const mockHistory = {
          history_records: [],
          total_count: 0,
          limit: 20,
          offset: 0,
          has_more: false,
        };
        
        mockAxios.onGet('/api/instances/1/history').reply(200, mockHistory);

        const { result } = renderHook(() => useHistory(), { wrapper });

        await result.current.loadHistory(1);

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.history).toEqual([]);
        expect(result.current.error).toBeNull();
      });
    });

    describe('GET /api/history/:historyId', () => {
      it('should fetch specific history record', async () => {
        const mockRecord = createMockHistoryRecords(1)[0];
        
        mockAxios.onGet('/api/history/1').reply(200, mockRecord);

        const historyService = new HistoryService();
        const record = await historyService.getHistoryRecord(1);

        expect(record).toEqual(mockRecord);
        expect(mockAxios.history.get).toHaveLength(1);
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across operations', async () => {
      const initialInstances = createMockInstances(2);
      const newInstanceData = createMockCreateInstanceData({ name: 'new-instance' });
      const newInstance = createMockInstance({ id: 3, ...newInstanceData });
      
      // Setup initial data
      mockAxios.onGet('/api/instances').reply(200, initialInstances);
      
      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(2);
      });

      // Create new instance
      mockAxios.onPost('/api/instances').reply(201, newInstance);
      mockAxios.onGet('/api/instances').reply(200, [...initialInstances, newInstance]);

      await result.current.createInstance.mutateAsync(newInstanceData);

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(3);
        expect(result.current.instances.find(i => i.name === 'new-instance')).toBeDefined();
      });

      // Update the new instance
      const updateData = { description: 'Updated description' };
      const updatedInstance = { ...newInstance, ...updateData };
      
      mockAxios.onPut('/api/instances/3').reply(200, updatedInstance);
      mockAxios.onGet('/api/instances').reply(200, [
        ...initialInstances, 
        updatedInstance
      ]);

      await result.current.updateInstance.mutateAsync({ id: 3, data: updateData });

      await waitFor(() => {
        const instance = result.current.instances.find(i => i.id === 3);
        expect(instance?.description).toBe('Updated description');
      });

      // Delete the instance
      mockAxios.onDelete('/api/instances/3').reply(204);
      mockAxios.onGet('/api/instances').reply(200, initialInstances);

      await result.current.deleteInstance.mutateAsync(3);

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(2);
        expect(result.current.instances.find(i => i.id === 3)).toBeUndefined();
      });
    });

    it('should handle optimistic updates correctly', async () => {
      const initialInstances = createMockInstances(1);
      const newInstanceData = createMockCreateInstanceData({ name: 'optimistic-instance' });
      
      mockAxios.onGet('/api/instances').reply(200, initialInstances);
      
      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(1);
      });

      // Setup delayed response to test optimistic update
      mockAxios.onPost('/api/instances').reply(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve([201, createMockInstance({ id: 2, ...newInstanceData })]);
          }, 100);
        });
      });

      // Start mutation
      const mutationPromise = result.current.createInstance.mutateAsync(newInstanceData);

      // Should show optimistic update immediately
      await waitFor(() => {
        expect(result.current.instances.some(i => i.name === 'optimistic-instance')).toBe(true);
      });

      // Wait for actual response
      await mutationPromise;

      // Should still have the instance
      expect(result.current.instances.some(i => i.name === 'optimistic-instance')).toBe(true);
    });

    it('should rollback optimistic updates on error', async () => {
      const initialInstances = createMockInstances(1);
      const newInstanceData = createMockCreateInstanceData({ name: 'failing-instance' });
      
      mockAxios.onGet('/api/instances').reply(200, initialInstances);
      
      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(1);
      });

      // Setup error response
      mockAxios.onPost('/api/instances').reply(500, { detail: 'Server error' });

      try {
        await result.current.createInstance.mutateAsync(newInstanceData);
      } catch (error) {
        // Expected error
      }

      // Should rollback to original state
      await waitFor(() => {
        expect(result.current.instances).toHaveLength(1);
        expect(result.current.instances.some(i => i.name === 'failing-instance')).toBe(false);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed requests', async () => {
      let callCount = 0;
      mockAxios.onGet('/api/instances').reply(() => {
        callCount++;
        if (callCount < 3) {
          return [500, { detail: 'Temporary error' }];
        }
        return [200, createMockInstances(1)];
      });

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should eventually succeed after retries
      expect(result.current.instances).toHaveLength(1);
      expect(callCount).toBe(3);
    });

    it('should handle concurrent requests correctly', async () => {
      const instances = createMockInstances(3);
      mockAxios.onGet('/api/instances').reply(200, instances);

      // Create multiple hooks simultaneously
      const { result: result1 } = renderHook(() => useInstances(), { wrapper });
      const { result: result2 } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
        expect(result2.current.loading).toBe(false);
      });

      // Both should have the same data
      expect(result1.current.instances).toEqual(instances);
      expect(result2.current.instances).toEqual(instances);
      
      // Should only make one request due to React Query deduplication
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache responses appropriately', async () => {
      const instances = createMockInstances(2);
      mockAxios.onGet('/api/instances').reply(200, instances);

      const { result, rerender } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.instances).toEqual(instances);

      // Rerender should use cached data
      rerender();

      expect(result.current.instances).toEqual(instances);
      expect(mockAxios.history.get).toHaveLength(1); // Still only one request
    });

    it('should invalidate cache on mutations', async () => {
      const initialInstances = createMockInstances(1);
      const newInstanceData = createMockCreateInstanceData();
      const newInstance = createMockInstance({ id: 2, ...newInstanceData });
      
      mockAxios.onGet('/api/instances').reply(200, initialInstances);
      
      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(1);
      });

      // Setup responses for mutation and refetch
      mockAxios.onPost('/api/instances').reply(201, newInstance);
      mockAxios.onGet('/api/instances').reply(200, [...initialInstances, newInstance]);

      await result.current.createInstance.mutateAsync(newInstanceData);

      // Should refetch and update cache
      await waitFor(() => {
        expect(result.current.instances).toHaveLength(2);
      });

      expect(mockAxios.history.get).toHaveLength(2); // Initial + refetch
    });
  });

  describe('Real-time Data Synchronization', () => {
    it('should handle WebSocket updates', async () => {
      const initialInstances = createMockInstances(2);
      mockAxios.onGet('/api/instances').reply(200, initialInstances);

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(2);
      });

      // Simulate WebSocket update
      const updatedInstance = { ...initialInstances[0], status: 'inactive' };
      
      // This would typically be handled by a WebSocket connection
      // For testing, we'll simulate the update through the hook
      await result.current.updateInstanceFromWebSocket(updatedInstance);

      await waitFor(() => {
        const instance = result.current.instances.find(i => i.id === updatedInstance.id);
        expect(instance?.status).toBe('inactive');
      });
    });

    it('should handle server-sent events', async () => {
      const instances = createMockInstances(1);
      mockAxios.onGet('/api/instances').reply(200, instances);

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(1);
      });

      // Simulate SSE event for new instance
      const newInstance = createMockInstance({ id: 999, name: 'sse-instance' });
      
      await result.current.handleServerSentEvent({
        type: 'instance_created',
        data: newInstance,
      });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(2);
        expect(result.current.instances.find(i => i.name === 'sse-instance')).toBeDefined();
      });
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch updates correctly', async () => {
      const instances = createMockInstances(5);
      const updateData = { status: 'inactive' };
      const instanceIds = [1, 2, 3];
      
      mockAxios.onGet('/api/instances').reply(200, instances);
      mockAxios.onPatch('/api/instances/batch').reply(200, {
        updated: instanceIds.length,
        instances: instances.map(i => 
          instanceIds.includes(i.id) ? { ...i, ...updateData } : i
        ),
      });

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(5);
      });

      await result.current.batchUpdateInstances.mutateAsync({
        instanceIds,
        updateData,
      });

      await waitFor(() => {
        const updatedInstances = result.current.instances.filter(i => 
          instanceIds.includes(i.id) && i.status === 'inactive'
        );
        expect(updatedInstances).toHaveLength(3);
      });
    });

    it('should handle partial batch failures', async () => {
      const instances = createMockInstances(3);
      const instanceIds = [1, 2, 3];
      
      mockAxios.onGet('/api/instances').reply(200, instances);
      mockAxios.onDelete('/api/instances/batch').reply(207, {
        results: [
          { id: 1, success: true },
          { id: 2, success: false, error: 'Instance has active tasks' },
          { id: 3, success: true },
        ],
      });

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toHaveLength(3);
      });

      const batchResult = await result.current.batchDeleteInstances.mutateAsync(instanceIds);

      expect(batchResult.successful).toEqual([1, 3]);
      expect(batchResult.failed).toEqual([{ id: 2, error: 'Instance has active tasks' }]);
    });
  });

  describe('Advanced Query Scenarios', () => {
    it('should handle complex filtering queries', async () => {
      const complexQuery = {
        filters: {
          status: ['active', 'pending'],
          cluster_name: ['prod-cluster'],
          created_after: '2024-01-01T00:00:00Z',
          has_description: true,
        },
        sort: [
          { field: 'created_at', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
        pagination: { limit: 20, offset: 0 },
      };

      const filteredInstances = createMockInstances(3);
      mockAxios.onGet('/api/instances').reply(config => {
        // Verify query parameters are correctly sent
        expect(config.params).toMatchObject(complexQuery);
        return [200, {
          instances: filteredInstances,
          total: 3,
          limit: 20,
          offset: 0,
          has_more: false,
        }];
      });

      const { result } = renderHook(() => useInstances(complexQuery), { wrapper });

      await waitFor(() => {
        expect(result.current.instances).toEqual(filteredInstances);
        expect(result.current.pagination.total).toBe(3);
      });
    });

    it('should handle search with highlighting', async () => {
      const searchQuery = { search: 'test-instance', highlight: true };
      const searchResults = createMockInstances(2).map(instance => ({
        ...instance,
        _highlights: {
          name: `<mark>test</mark>-${instance.name}`,
          description: `This is a <mark>test</mark> description`,
        },
      }));

      mockAxios.onGet('/api/instances/search').reply(200, {
        results: searchResults,
        total: 2,
        query: searchQuery.search,
      });

      const { result } = renderHook(() => useInstances(searchQuery), { wrapper });

      await waitFor(() => {
        expect(result.current.searchResults).toEqual(searchResults);
        expect(result.current.searchResults[0]._highlights.name).toContain('<mark>');
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should implement exponential backoff for retries', async () => {
      let attemptCount = 0;
      const timestamps: number[] = [];

      mockAxios.onGet('/api/instances').reply(() => {
        timestamps.push(Date.now());
        attemptCount++;
        
        if (attemptCount < 4) {
          return [500, { detail: 'Temporary server error' }];
        }
        return [200, createMockInstances(1)];
      });

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(attemptCount).toBe(4);
      expect(result.current.instances).toHaveLength(1);

      // Verify exponential backoff timing
      for (let i = 1; i < timestamps.length; i++) {
        const delay = timestamps[i] - timestamps[i - 1];
        const expectedMinDelay = Math.pow(2, i - 1) * 1000; // 1s, 2s, 4s...
        expect(delay).toBeGreaterThanOrEqual(expectedMinDelay * 0.8); // Allow some variance
      }
    });

    it('should handle circuit breaker pattern', async () => {
      // Simulate multiple failures to trigger circuit breaker
      mockAxios.onGet('/api/instances').reply(500, { detail: 'Service unavailable' });

      const { result } = renderHook(() => useInstances(), { wrapper });

      // Make multiple failed requests
      for (let i = 0; i < 5; i++) {
        try {
          await result.current.refetch();
        } catch (error) {
          // Expected failures
        }
      }

      // Circuit breaker should be open, preventing further requests
      const requestCountBefore = mockAxios.history.get.length;
      
      try {
        await result.current.refetch();
      } catch (error) {
        // Should fail fast without making HTTP request
      }

      const requestCountAfter = mockAxios.history.get.length;
      expect(requestCountAfter).toBe(requestCountBefore); // No new request made
    });
  });
});