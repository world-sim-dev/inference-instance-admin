/**
 * useInstances Hook Tests
 * Tests for the instances management hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useInstances, INSTANCES_QUERY_KEYS } from '../useInstances';
import { InstanceService } from '../../services/instanceService';
import { useAppContext } from '../../contexts/useAppContext';
import { 
  createTestQueryClient, 
  createMockInstance, 
  createMockInstances, 
  createMockCreateInstanceData 
} from '../../test/utils';
import type { Instance, InstanceFilters } from '../../types/instance';

// Mock dependencies
vi.mock('../../services/instanceService');
vi.mock('../../contexts/useAppContext');
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedInstanceService = vi.mocked(InstanceService);
const mockedUseAppContext = vi.mocked(useAppContext);

describe('useInstances', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let mockActions: any;
  let mockState: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    mockActions = {
      loadInstancesSuccess: vi.fn(),
      loadInstancesError: vi.fn(),
    };

    mockState = {
      ui: {
        filters: {
          search: '',
          status: [],
          cluster_name: [],
          model_name: [],
          ephemeral: null,
        } as InstanceFilters,
      },
    };

    mockedUseAppContext.mockReturnValue({
      state: mockState,
      dispatch: vi.fn(),
    });

    // Mock useAppActions
    vi.doMock('../../contexts/useAppContext', () => ({
      useAppContext: () => ({ state: mockState }),
      useAppActions: () => mockActions,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('data fetching', () => {
    it('should fetch instances successfully', async () => {
      const mockInstances = createMockInstances(3);
      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.instances).toEqual(mockInstances);
      expect(result.current.error).toBeNull();
      expect(mockedInstanceService.getInstances).toHaveBeenCalledWith(undefined);
    });

    it('should handle loading state', () => {
      mockedInstanceService.getInstances.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useInstances(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.instances).toEqual([]);
    });

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch instances');
      mockedInstanceService.getInstances.mockRejectedValue(error);

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch instances');
      expect(result.current.instances).toEqual([]);
    });

    it('should pass query parameters to service', async () => {
      const mockInstances = createMockInstances(2);
      const queryParams = { model_name: 'test-model', active_only: true };
      
      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      renderHook(() => useInstances(queryParams), { wrapper });

      await waitFor(() => {
        expect(mockedInstanceService.getInstances).toHaveBeenCalledWith(queryParams);
      });
    });
  });

  describe('filtering', () => {
    it('should filter instances by search term', async () => {
      const mockInstances = [
        createMockInstance({ id: 1, name: 'test-instance-1', model_name: 'model-a' }),
        createMockInstance({ id: 2, name: 'prod-instance-2', model_name: 'model-b' }),
        createMockInstance({ id: 3, name: 'test-instance-3', model_name: 'model-a' }),
      ];

      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      // Update mock state with search filter
      mockState.ui.filters.search = 'test';

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filteredInstances).toHaveLength(2);
      expect(result.current.filteredInstances.every(i => i.name.includes('test'))).toBe(true);
    });

    it('should filter instances by status', async () => {
      const mockInstances = [
        createMockInstance({ id: 1, status: 'active' }),
        createMockInstance({ id: 2, status: 'inactive' }),
        createMockInstance({ id: 3, status: 'active' }),
      ];

      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      // Update mock state with status filter
      mockState.ui.filters.status = ['active'];

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filteredInstances).toHaveLength(2);
      expect(result.current.filteredInstances.every(i => i.status === 'active')).toBe(true);
    });

    it('should filter instances by cluster', async () => {
      const mockInstances = [
        createMockInstance({ id: 1, cluster_name: 'cluster-a' }),
        createMockInstance({ id: 2, cluster_name: 'cluster-b' }),
        createMockInstance({ id: 3, cluster_name: 'cluster-a' }),
      ];

      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      // Update mock state with cluster filter
      mockState.ui.filters.cluster_name = ['cluster-a'];

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filteredInstances).toHaveLength(2);
      expect(result.current.filteredInstances.every(i => i.cluster_name === 'cluster-a')).toBe(true);
    });

    it('should filter instances by ephemeral flag', async () => {
      const mockInstances = [
        createMockInstance({ id: 1, ephemeral: true }),
        createMockInstance({ id: 2, ephemeral: false }),
        createMockInstance({ id: 3, ephemeral: true }),
      ];

      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      // Update mock state with ephemeral filter
      mockState.ui.filters.ephemeral = true;

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filteredInstances).toHaveLength(2);
      expect(result.current.filteredInstances.every(i => i.ephemeral === true)).toBe(true);
    });
  });

  describe('filter options', () => {
    it('should generate filter options from instances', async () => {
      const mockInstances = [
        createMockInstance({ id: 1, model_name: 'model-a', cluster_name: 'cluster-1', status: 'active' }),
        createMockInstance({ id: 2, model_name: 'model-b', cluster_name: 'cluster-2', status: 'inactive' }),
        createMockInstance({ id: 3, model_name: 'model-a', cluster_name: 'cluster-1', status: 'active' }),
      ];

      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filterOptions.modelNames).toEqual(['model-a', 'model-b']);
      expect(result.current.filterOptions.clusterNames).toEqual(['cluster-1', 'cluster-2']);
      expect(result.current.filterOptions.statuses).toEqual(['active', 'inactive']);
    });
  });

  describe('mutations', () => {
    beforeEach(() => {
      // Setup initial instances data
      const mockInstances = createMockInstances(2);
      queryClient.setQueryData(INSTANCES_QUERY_KEYS.list(), mockInstances);
    });

    describe('createInstance', () => {
      it('should create instance successfully', async () => {
        const createData = createMockCreateInstanceData();
        const newInstance = createMockInstance({ id: 999, name: createData.name });
        
        mockedInstanceService.createInstance.mockResolvedValue(newInstance);

        const { result } = renderHook(() => useInstances(), { wrapper });

        await act(async () => {
          await result.current.createInstance.mutateAsync(createData);
        });

        expect(mockedInstanceService.createInstance).toHaveBeenCalledWith(createData);
        expect(result.current.createInstance.isSuccess).toBe(true);
      });

      it('should handle optimistic updates', async () => {
        const createData = createMockCreateInstanceData();
        const newInstance = createMockInstance({ id: 999, name: createData.name });
        
        // Delay the service call to test optimistic update
        mockedInstanceService.createInstance.mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(newInstance), 100))
        );

        const { result } = renderHook(() => useInstances(), { wrapper });

        act(() => {
          result.current.createInstance.mutate(createData);
        });

        // Should show optimistic update immediately
        await waitFor(() => {
          expect(result.current.instances.some(i => i.name === createData.name)).toBe(true);
        });
      });

      it('should rollback on error', async () => {
        const createData = createMockCreateInstanceData();
        const error = new Error('Creation failed');
        
        mockedInstanceService.createInstance.mockRejectedValue(error);

        const { result } = renderHook(() => useInstances(), { wrapper });
        const initialInstancesCount = result.current.instances.length;

        await act(async () => {
          try {
            await result.current.createInstance.mutateAsync(createData);
          } catch (e) {
            // Expected error
          }
        });

        expect(result.current.instances).toHaveLength(initialInstancesCount);
        expect(result.current.createInstance.isError).toBe(true);
      });
    });

    describe('updateInstance', () => {
      it('should update instance successfully', async () => {
        const updateData = { name: 'updated-name' };
        const updatedInstance = createMockInstance({ id: 1, name: 'updated-name' });
        
        mockedInstanceService.updateInstance.mockResolvedValue(updatedInstance);

        const { result } = renderHook(() => useInstances(), { wrapper });

        await act(async () => {
          await result.current.updateInstance.mutateAsync({ id: 1, data: updateData });
        });

        expect(mockedInstanceService.updateInstance).toHaveBeenCalledWith(1, updateData);
        expect(result.current.updateInstance.isSuccess).toBe(true);
      });
    });

    describe('deleteInstance', () => {
      it('should delete instance successfully', async () => {
        mockedInstanceService.deleteInstance.mockResolvedValue();

        const { result } = renderHook(() => useInstances(), { wrapper });

        await act(async () => {
          await result.current.deleteInstance.mutateAsync(1);
        });

        expect(mockedInstanceService.deleteInstance).toHaveBeenCalledWith(1);
        expect(result.current.deleteInstance.isSuccess).toBe(true);
      });
    });
  });

  describe('utility functions', () => {
    beforeEach(async () => {
      const mockInstances = createMockInstances(3);
      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);
    });

    it('should get instance by ID', async () => {
      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const instance = result.current.getInstanceById(2);
      expect(instance?.id).toBe(2);
      expect(instance?.name).toBe('test-instance-2');
    });

    it('should get instance by name', async () => {
      const { result } = renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const instance = result.current.getInstanceByName('test-instance-2');
      expect(instance?.id).toBe(2);
      expect(instance?.name).toBe('test-instance-2');
    });

    it('should check name availability', async () => {
      mockedInstanceService.isNameAvailable.mockResolvedValue(true);

      const { result } = renderHook(() => useInstances(), { wrapper });

      const isAvailable = await result.current.isNameAvailable('new-name');
      
      expect(isAvailable).toBe(true);
      expect(mockedInstanceService.isNameAvailable).toHaveBeenCalledWith('new-name', undefined);
    });

    it('should handle name availability check error', async () => {
      mockedInstanceService.isNameAvailable.mockRejectedValue(new Error('Check failed'));

      const { result } = renderHook(() => useInstances(), { wrapper });

      const isAvailable = await result.current.isNameAvailable('new-name');
      
      expect(isAvailable).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should invalidate instances cache', async () => {
      const { result } = renderHook(() => useInstances(), { wrapper });

      const spy = vi.spyOn(queryClient, 'invalidateQueries');

      await act(async () => {
        await result.current.invalidateInstances();
      });

      expect(spy).toHaveBeenCalledWith({ queryKey: INSTANCES_QUERY_KEYS.lists() });
    });

    it('should set instance data in cache', async () => {
      const { result } = renderHook(() => useInstances(), { wrapper });
      const newInstances = createMockInstances(5);

      act(() => {
        result.current.setInstanceData(newInstances);
      });

      const cachedData = queryClient.getQueryData(INSTANCES_QUERY_KEYS.list());
      expect(cachedData).toEqual(newInstances);
    });

    it('should update instance in cache', async () => {
      const mockInstances = createMockInstances(3);
      queryClient.setQueryData(INSTANCES_QUERY_KEYS.list(), mockInstances);

      const { result } = renderHook(() => useInstances(), { wrapper });

      act(() => {
        result.current.updateInstanceInCache(2, (old) => ({ ...old, name: 'updated-name' }));
      });

      const cachedData = queryClient.getQueryData<Instance[]>(INSTANCES_QUERY_KEYS.list());
      const updatedInstance = cachedData?.find(i => i.id === 2);
      
      expect(updatedInstance?.name).toBe('updated-name');
    });
  });

  describe('global state sync', () => {
    it('should sync instances with global state', async () => {
      const mockInstances = createMockInstances(2);
      mockedInstanceService.getInstances.mockResolvedValue(mockInstances);

      renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(mockActions.loadInstancesSuccess).toHaveBeenCalledWith(mockInstances);
      });
    });

    it('should sync errors with global state', async () => {
      const error = new Error('Fetch failed');
      mockedInstanceService.getInstances.mockRejectedValue(error);

      renderHook(() => useInstances(), { wrapper });

      await waitFor(() => {
        expect(mockActions.loadInstancesError).toHaveBeenCalledWith('Fetch failed');
      });
    });
  });
});