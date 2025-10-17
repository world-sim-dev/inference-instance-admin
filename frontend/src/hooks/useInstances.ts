/**
 * useInstances Hook
 * Custom hook for managing instances data with React Query integration
 * Provides caching, optimistic updates, error retry, and background sync
 */

import { useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { 
  useQuery, 
  useMutation, 
  useQueryClient
} from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';
import { RetryUtils } from '../utils/retryUtils';
import type { 
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import { InstanceService } from '../services/instanceService';
import { useAppContext, useAppActions } from '../contexts/useAppContext';
import type { 
  Instance, 
  CreateInstanceData, 
  UpdateInstanceData, 
  InstanceFilters
} from '../types/instance';

/**
 * Query keys for React Query
 */
export const INSTANCES_QUERY_KEYS = {
  all: ['instances'] as const,
  lists: () => [...INSTANCES_QUERY_KEYS.all, 'list'] as const,
  list: (params?: InstanceFilters) => [...INSTANCES_QUERY_KEYS.lists(), params] as const,
  details: () => [...INSTANCES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...INSTANCES_QUERY_KEYS.details(), id] as const,
  nameCheck: (name: string, excludeId?: number) => [...INSTANCES_QUERY_KEYS.all, 'nameCheck', name, excludeId] as const,
};

/**
 * Return type for useInstances hook
 */
export interface UseInstancesReturn {
  // Data
  instances: Instance[];
  filteredInstances: Instance[];
  loading: boolean;
  error: string | null;
  isRefetching: boolean;
  
  // Filter options
  filterOptions: {
    modelNames: string[];
    clusterNames: string[];
    statuses: string[];
  };
  
  // Query result
  queryResult: UseQueryResult<Instance[], Error>;
  
  // Actions
  refetch: () => Promise<any>;
  createInstance: UseMutationResult<Instance, Error, CreateInstanceData>;
  updateInstance: UseMutationResult<Instance, Error, { id: number; data: UpdateInstanceData }>;
  deleteInstance: UseMutationResult<void, Error, number>;
  
  // Utility functions
  getInstanceById: (id: number) => Instance | undefined;
  getInstanceByName: (name: string) => Instance | undefined;
  isNameAvailable: (name: string, excludeId?: number) => Promise<boolean>;
  
  // Cache management
  invalidateInstances: () => Promise<void>;
  setInstanceData: (instances: Instance[]) => void;
  updateInstanceInCache: (id: number, updater: (old: Instance) => Instance) => void;
}

/**
 * Filter instances based on current filters
 */
const filterInstances = (instances: Instance[], filters: InstanceFilters): Instance[] => {
  return instances.filter(instance => {
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        instance.name,
        instance.model_name,
        instance.cluster_name,
        instance.description,
        instance.status,
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(instance.status)) {
        return false;
      }
    }
    
    // Cluster filter
    if (filters.cluster_name && filters.cluster_name.length > 0) {
      if (!filters.cluster_name.includes(instance.cluster_name)) {
        return false;
      }
    }
    
    // Model filter
    if (filters.model_name && filters.model_name.length > 0) {
      if (!filters.model_name.includes(instance.model_name)) {
        return false;
      }
    }
    
    // Ephemeral filter
    if (filters.ephemeral !== null && filters.ephemeral !== undefined) {
      if (instance.ephemeral !== filters.ephemeral) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * useInstances Hook with React Query integration
 */
export const useInstances = (queryParams?: InstanceFilters): UseInstancesReturn => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const queryClient = useQueryClient();
  const { handleApiError, handleErrorWithRetry } = useErrorHandler({
    component: 'useInstances',
    action: 'data_management'
  });

  const { ui } = state;
  const { filters } = ui;

  // React Query for instances data with enhanced error handling
  const queryResult = useQuery({
    queryKey: INSTANCES_QUERY_KEYS.list(queryParams),
    queryFn: () => RetryUtils.dataLoad(() => InstanceService.getInstances(queryParams)),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      const structuredError = handleApiError(error, '/instances', 'GET');
      return structuredError.retryable && failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      handleApiError(error, '/instances', 'GET');
    }
  });

  const { 
    data: instances = [], 
    isLoading: loading, 
    error, 
    isRefetching,
    refetch 
  } = queryResult;

  /**
   * Filter options derived from current instances
   */
  const filterOptions = useMemo(() => {
    const modelNames = [...new Set(instances.map(i => i.model_name))].sort();
    const clusterNames = [...new Set(instances.map(i => i.cluster_name))].sort();
    const statuses = [...new Set(instances.map(i => i.status))].sort();
    
    return { modelNames, clusterNames, statuses };
  }, [instances]);

  /**
   * Filtered instances based on current filters
   */
  const filteredInstances = useMemo(() => {
    return filterInstances(instances, filters);
  }, [instances, filters]);

  // Create instance mutation with optimistic updates
  const createInstance = useMutation({
    mutationFn: (data: CreateInstanceData) => InstanceService.createInstance(data),
    onMutate: async (newInstanceData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: INSTANCES_QUERY_KEYS.lists() });

      // Snapshot previous value
      const previousInstances = queryClient.getQueryData<Instance[]>(INSTANCES_QUERY_KEYS.list(queryParams));

      // Optimistically update cache with temporary instance
      const tempInstance: Instance = {
        id: Date.now(), // Temporary ID
        ...newInstanceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Instance[]>(
        INSTANCES_QUERY_KEYS.list(queryParams),
        (old = []) => [...old, tempInstance]
      );

      return { previousInstances };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousInstances) {
        queryClient.setQueryData(INSTANCES_QUERY_KEYS.list(queryParams), context.previousInstances);
      }
      const structuredError = handleApiError(error, '/instances', 'POST');
      message.error(structuredError.userMessage || 'Failed to create instance');
    },
    onSuccess: (newInstance) => {
      // Update cache with real instance data
      queryClient.setQueryData<Instance[]>(
        INSTANCES_QUERY_KEYS.list(queryParams),
        (old = []) => {
          // Replace temporary instance with real one
          const filtered = old.filter(instance => instance.id !== Date.now());
          return [...filtered, newInstance];
        }
      );
      message.success(`Instance "${newInstance.name}" created successfully`);
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEYS.lists() });
    },
  });

  // Update instance mutation with optimistic updates
  const updateInstance = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInstanceData }) => 
      InstanceService.updateInstance(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: INSTANCES_QUERY_KEYS.lists() });

      const previousInstances = queryClient.getQueryData<Instance[]>(INSTANCES_QUERY_KEYS.list(queryParams));

      // Optimistically update cache
      queryClient.setQueryData<Instance[]>(
        INSTANCES_QUERY_KEYS.list(queryParams),
        (old = []) => old.map(instance => 
          instance.id === id 
            ? { ...instance, ...data, updated_at: new Date().toISOString() }
            : instance
        )
      );

      return { previousInstances };
    },
    onError: (error, _variables, context) => {
      if (context?.previousInstances) {
        queryClient.setQueryData(INSTANCES_QUERY_KEYS.list(queryParams), context.previousInstances);
      }
      const structuredError = handleApiError(error, `/instances/${_variables.id}`, 'PUT');
      message.error(structuredError.userMessage || 'Failed to update instance');
    },
    onSuccess: (updatedInstance) => {
      // Update cache with server response
      queryClient.setQueryData<Instance[]>(
        INSTANCES_QUERY_KEYS.list(queryParams),
        (old = []) => old.map(instance => 
          instance.id === updatedInstance.id ? updatedInstance : instance
        )
      );
      message.success(`Instance "${updatedInstance.name}" updated successfully`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEYS.lists() });
    },
  });

  // Delete instance mutation with optimistic updates
  const deleteInstance = useMutation({
    mutationFn: (id: number) => InstanceService.deleteInstance(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: INSTANCES_QUERY_KEYS.lists() });

      const previousInstances = queryClient.getQueryData<Instance[]>(INSTANCES_QUERY_KEYS.list(queryParams));

      // Optimistically remove from cache
      queryClient.setQueryData<Instance[]>(
        INSTANCES_QUERY_KEYS.list(queryParams),
        (old = []) => old.filter(instance => instance.id !== id)
      );

      return { previousInstances };
    },
    onError: (error, _variables, context) => {
      if (context?.previousInstances) {
        queryClient.setQueryData(INSTANCES_QUERY_KEYS.list(queryParams), context.previousInstances);
      }
      const structuredError = handleApiError(error, `/instances/${_variables}`, 'DELETE');
      message.error(structuredError.userMessage || 'Failed to delete instance');
    },
    onSuccess: () => {
      message.success('Instance deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEYS.lists() });
    },
  });

  /**
   * Get instance by ID
   */
  const getInstanceById = useCallback((id: number): Instance | undefined => {
    return instances.find(instance => instance.id === id);
  }, [instances]);

  /**
   * Get instance by name
   */
  const getInstanceByName = useCallback((name: string): Instance | undefined => {
    return instances.find(instance => 
      instance.name.toLowerCase() === name.toLowerCase()
    );
  }, [instances]);

  /**
   * Check if instance name is available
   */
  const isNameAvailable = useCallback(async (
    name: string, 
    excludeId?: number
  ): Promise<boolean> => {
    try {
      return await InstanceService.isNameAvailable(name, excludeId);
    } catch (err) {
      console.error('Error checking name availability:', err);
      return false;
    }
  }, []);

  /**
   * Cache management functions
   */
  const invalidateInstances = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEYS.lists() });
  }, [queryClient]);

  const setInstanceData = useCallback((newInstances: Instance[]) => {
    queryClient.setQueryData(INSTANCES_QUERY_KEYS.list(queryParams), newInstances);
  }, [queryClient, queryParams]);

  const updateInstanceInCache = useCallback((id: number, updater: (old: Instance) => Instance) => {
    queryClient.setQueryData<Instance[]>(
      INSTANCES_QUERY_KEYS.list(queryParams),
      (old = []) => old.map(instance => 
        instance.id === id ? updater(instance) : instance
      )
    );
  }, [queryClient, queryParams]);

  // Sync with global state for backward compatibility
  useEffect(() => {
    if (instances.length > 0) {
      actions.loadInstancesSuccess(instances);
    }
    if (error) {
      actions.loadInstancesError(error.message);
    }
  }, [instances, error, actions]);

  return {
    // Data
    instances,
    filteredInstances,
    loading,
    error: error?.message || null,
    isRefetching,
    
    // Filter options
    filterOptions,
    
    // Query result
    queryResult,
    
    // Actions
    refetch,
    createInstance,
    updateInstance,
    deleteInstance,
    
    // Utility functions
    getInstanceById,
    getInstanceByName,
    isNameAvailable,
    
    // Cache management
    invalidateInstances,
    setInstanceData,
    updateInstanceInCache,
  };
};

export default useInstances;