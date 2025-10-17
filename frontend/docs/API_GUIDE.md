# API Integration Guide

## Overview

This document provides comprehensive guidance for integrating with the Inference Instance Management API from the React frontend. It covers API client setup, authentication, error handling, and best practices for data fetching.

## Table of Contents

1. [API Client Setup](#api-client-setup)
2. [Authentication](#authentication)
3. [Instance Management](#instance-management)
4. [History Management](#history-management)
5. [Enhanced History Features](#enhanced-history-features)
6. [Error Handling](#error-handling)
7. [Data Types](#data-types)
8. [Best Practices](#best-practices)
9. [Testing API Integration](#testing-api-integration)

## API Client Setup

### Base Configuration

The API client is configured using Axios with interceptors for request/response handling:

```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
}

export const apiClient = new ApiClient();
```

### Environment Configuration

Configure API endpoints in environment files:

```env
# .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=10000
VITE_ENABLE_API_LOGGING=true

# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=15000
VITE_ENABLE_API_LOGGING=false
```

## Authentication

### Token Management

```typescript
// services/auth.ts
export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
}
```

### Login Implementation

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    AuthService.isAuthenticated()
  );
  
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token } = response.data;
      
      AuthService.setToken(token);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const logout = () => {
    AuthService.removeToken();
    setIsAuthenticated(false);
  };
  
  return { isAuthenticated, login, logout };
};
```

## Instance Management

### Instance CRUD Operations

```typescript
// services/instanceApi.ts
export class InstanceApi {
  // Get all instances
  static async getInstances(params?: InstanceQueryParams): Promise<Instance[]> {
    const response = await apiClient.get('/instances', { params });
    return response.data;
  }
  
  // Get single instance
  static async getInstance(id: number): Promise<Instance> {
    const response = await apiClient.get(`/instances/${id}`);
    return response.data;
  }
  
  // Create instance
  static async createInstance(data: CreateInstanceData): Promise<Instance> {
    const response = await apiClient.post('/instances', data);
    return response.data;
  }
  
  // Update instance
  static async updateInstance(
    id: number, 
    data: UpdateInstanceData
  ): Promise<Instance> {
    const response = await apiClient.put(`/instances/${id}`, data);
    return response.data;
  }
  
  // Delete instance
  static async deleteInstance(id: number): Promise<void> {
    await apiClient.delete(`/instances/${id}`);
  }
  
  // Batch operations
  static async batchDelete(ids: number[]): Promise<void> {
    await apiClient.post('/instances/batch-delete', { ids });
  }
  
  static async batchUpdate(
    updates: Array<{ id: number; data: Partial<UpdateInstanceData> }>
  ): Promise<Instance[]> {
    const response = await apiClient.post('/instances/batch-update', { updates });
    return response.data;
  }
}
```

### Query Parameters

```typescript
interface InstanceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InstanceStatus[];
  model_name?: string;
  cluster?: string;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'status';
  sort_order?: 'asc' | 'desc';
  created_after?: string;
  created_before?: string;
}

// Usage example
const instances = await InstanceApi.getInstances({
  page: 1,
  limit: 20,
  search: 'test',
  status: ['active', 'pending'],
  sort_by: 'created_at',
  sort_order: 'desc'
});
```

### Custom Hook for Instance Management

```typescript
// hooks/useInstances.ts
export const useInstances = (params?: InstanceQueryParams) => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await InstanceApi.getInstances(params);
      setInstances(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [params]);
  
  const createInstance = async (data: CreateInstanceData) => {
    try {
      const newInstance = await InstanceApi.createInstance(data);
      setInstances(prev => [newInstance, ...prev]);
      return { success: true, data: newInstance };
    } catch (err) {
      const error = handleApiError(err);
      return { success: false, error };
    }
  };
  
  const updateInstance = async (id: number, data: UpdateInstanceData) => {
    try {
      const updatedInstance = await InstanceApi.updateInstance(id, data);
      setInstances(prev => 
        prev.map(instance => 
          instance.id === id ? updatedInstance : instance
        )
      );
      return { success: true, data: updatedInstance };
    } catch (err) {
      const error = handleApiError(err);
      return { success: false, error };
    }
  };
  
  const deleteInstance = async (id: number) => {
    try {
      await InstanceApi.deleteInstance(id);
      setInstances(prev => prev.filter(instance => instance.id !== id));
      return { success: true };
    } catch (err) {
      const error = handleApiError(err);
      return { success: false, error };
    }
  };
  
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);
  
  return {
    instances,
    loading,
    error,
    pagination,
    refetch: fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance
  };
};
```

## History Management

### History API Operations

```typescript
// services/historyApi.ts
export class HistoryApi {
  // Get instance history
  static async getInstanceHistory(instanceId: number): Promise<HistoryRecord[]> {
    const response = await apiClient.get(`/instances/${instanceId}/history`);
    return response.data;
  }
  
  // Get specific history record
  static async getHistoryRecord(recordId: number): Promise<HistoryRecord> {
    const response = await apiClient.get(`/history/${recordId}`);
    return response.data;
  }
  
  // Compare history records
  static async compareHistoryRecords(
    id1: number, 
    id2: number
  ): Promise<HistoryComparison> {
    const response = await apiClient.get(`/history/compare/${id1}/${id2}`);
    return response.data;
  }
  
  // Restore from history
  static async restoreFromHistory(
    instanceId: number, 
    historyId: number
  ): Promise<Instance> {
    const response = await apiClient.post(
      `/instances/${instanceId}/restore/${historyId}`
    );
    return response.data;
  }
}
```

### History Hook

```typescript
// hooks/useHistory.ts
export const useHistory = (instanceId?: number) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadHistory = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await HistoryApi.getInstanceHistory(id);
      setHistory(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);
  
  const compareVersions = async (id1: number, id2: number) => {
    try {
      const comparison = await HistoryApi.compareHistoryRecords(id1, id2);
      return { success: true, data: comparison };
    } catch (err) {
      const error = handleApiError(err);
      return { success: false, error };
    }
  };
  
  const restoreVersion = async (historyId: number) => {
    if (!instanceId) {
      return { success: false, error: 'No instance ID provided' };
    }
    
    try {
      const restoredInstance = await HistoryApi.restoreFromHistory(
        instanceId, 
        historyId
      );
      return { success: true, data: restoredInstance };
    } catch (err) {
      const error = handleApiError(err);
      return { success: false, error };
    }
  };
  
  useEffect(() => {
    if (instanceId) {
      loadHistory(instanceId);
    }
  }, [instanceId, loadHistory]);
  
  return {
    history,
    loading,
    error,
    loadHistory,
    compareVersions,
    restoreVersion
  };
};
```

## Enhanced History Features

### Advanced History Queries

The enhanced history API provides advanced querying capabilities:

```typescript
// services/enhancedHistoryApi.ts
export class EnhancedHistoryApi extends HistoryApi {
  // Get paginated history with advanced filters
  static async getHistoryWithFilters(
    instanceId: number,
    options: HistoryQueryOptions
  ): Promise<HistoryListResponse> {
    const params = {
      limit: options.limit || 50,
      offset: options.offset || 0,
      operation_type: options.operationType,
      start_date: options.startDate,
      end_date: options.endDate,
      search: options.search,
      fields: options.fields?.join(','),
      sort_by: options.sortBy || 'operation_timestamp',
      sort_order: options.sortOrder || 'desc'
    };

    const response = await apiClient.get(`/instances/${instanceId}/history`, { params });
    return response.data;
  }

  // Search across multiple instances
  static async searchHistory(
    searchTerm: string,
    options?: GlobalHistorySearchOptions
  ): Promise<HistorySearchResponse> {
    const params = {
      q: searchTerm,
      instance_ids: options?.instanceIds?.join(','),
      operation_type: options?.operationType,
      limit: options?.limit || 100,
      ...options
    };

    const response = await apiClient.get('/history/search', { params });
    return response.data;
  }

  // Get history statistics
  static async getHistoryStats(
    instanceId: number,
    timeRange?: string
  ): Promise<HistoryStats> {
    const params = timeRange ? { time_range: timeRange } : {};
    const response = await apiClient.get(`/instances/${instanceId}/history/stats`, { params });
    return response.data;
  }

  // Export history data
  static async exportHistory(
    instanceId: number,
    format: 'json' | 'csv' | 'xlsx',
    options?: ExportOptions
  ): Promise<Blob> {
    const params = {
      format,
      ...options
    };

    const response = await apiClient.get(
      `/instances/${instanceId}/history/export`,
      { 
        params,
        responseType: 'blob'
      }
    );
    
    return response.data;
  }

  // Batch compare multiple records
  static async batchCompare(
    recordIds: number[]
  ): Promise<BatchComparisonResult> {
    const response = await apiClient.post('/history/batch-compare', {
      record_ids: recordIds
    });
    return response.data;
  }
}
```

### Enhanced History Hook

```typescript
// hooks/useEnhancedHistory.ts
export const useEnhancedHistory = (instanceId?: number) => {
  const [state, setState] = useState<HistoryState>({
    records: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 50,
      total: 0,
      hasMore: false
    },
    filters: {},
    selectedRecords: [],
    comparisonMode: false,
    stats: null
  });

  // Load history with caching
  const loadHistory = useCallback(async (
    id: number,
    options: HistoryQueryOptions = {}
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const cacheKey = `history_${id}_${JSON.stringify(options)}`;
      const cached = HistoryCache.get(cacheKey);

      if (cached && !options.forceRefresh) {
        setState(prev => ({
          ...prev,
          records: cached.records,
          pagination: cached.pagination,
          loading: false
        }));
        return;
      }

      const response = await EnhancedHistoryApi.getHistoryWithFilters(id, options);
      
      const newState = {
        records: response.history_records,
        pagination: {
          current: Math.floor(response.offset / response.limit) + 1,
          pageSize: response.limit,
          total: response.total_count,
          hasMore: response.has_more
        },
        loading: false
      };

      setState(prev => ({ ...prev, ...newState }));

      // Cache the result
      HistoryCache.set(cacheKey, {
        records: response.history_records,
        pagination: newState.pagination,
        timestamp: Date.now()
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error)
      }));
    }
  }, []);

  // Load more records (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!instanceId || !state.pagination.hasMore || state.loading) return;

    const nextOffset = state.pagination.current * state.pagination.pageSize;
    
    try {
      const response = await EnhancedHistoryApi.getHistoryWithFilters(instanceId, {
        ...state.filters,
        offset: nextOffset,
        limit: state.pagination.pageSize
      });

      setState(prev => ({
        ...prev,
        records: [...prev.records, ...response.history_records],
        pagination: {
          ...prev.pagination,
          current: prev.pagination.current + 1,
          hasMore: response.has_more
        }
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: handleApiError(error)
      }));
    }
  }, [instanceId, state.filters, state.pagination, state.loading]);

  // Apply filters
  const setFilters = useCallback((filters: HistoryFilters) => {
    setState(prev => ({ ...prev, filters }));
    
    if (instanceId) {
      loadHistory(instanceId, {
        ...filters,
        offset: 0,
        limit: state.pagination.pageSize
      });
    }
  }, [instanceId, loadHistory, state.pagination.pageSize]);

  // Record selection for comparison
  const selectRecord = useCallback((record: HistoryRecord) => {
    setState(prev => {
      const isSelected = prev.selectedRecords.some(r => r.id === record.id);
      
      if (isSelected) {
        return {
          ...prev,
          selectedRecords: prev.selectedRecords.filter(r => r.id !== record.id)
        };
      } else if (prev.selectedRecords.length < 2) {
        return {
          ...prev,
          selectedRecords: [...prev.selectedRecords, record]
        };
      }
      
      return prev;
    });
  }, []);

  // Compare selected records
  const compareSelected = useCallback(async () => {
    if (state.selectedRecords.length !== 2) {
      throw new Error('Exactly 2 records must be selected for comparison');
    }

    try {
      const comparison = await EnhancedHistoryApi.compareHistoryRecords(
        state.selectedRecords[0].id,
        state.selectedRecords[1].id
      );

      return { success: true, data: comparison };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  }, [state.selectedRecords]);

  // Export history
  const exportHistory = useCallback(async (
    format: 'json' | 'csv' | 'xlsx',
    options?: ExportOptions
  ) => {
    if (!instanceId) return;

    try {
      const blob = await EnhancedHistoryApi.exportHistory(instanceId, format, options);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `history_${instanceId}_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  }, [instanceId]);

  // Load statistics
  const loadStats = useCallback(async (timeRange?: string) => {
    if (!instanceId) return;

    try {
      const stats = await EnhancedHistoryApi.getHistoryStats(instanceId, timeRange);
      setState(prev => ({ ...prev, stats }));
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  }, [instanceId]);

  // Initialize
  useEffect(() => {
    if (instanceId) {
      loadHistory(instanceId);
      loadStats();
    }
  }, [instanceId, loadHistory, loadStats]);

  return {
    // State
    ...state,
    
    // Actions
    loadHistory,
    loadMore,
    setFilters,
    selectRecord,
    clearSelection: () => setState(prev => ({ ...prev, selectedRecords: [] })),
    compareSelected,
    exportHistory,
    loadStats,
    refetch: () => instanceId && loadHistory(instanceId, { forceRefresh: true })
  };
};
```

### History Caching System

```typescript
// utils/historyCache.ts
class HistoryCache {
  private static cache = new Map<string, CachedHistoryData>();
  private static maxSize = 100;
  private static ttl = 5 * 60 * 1000; // 5 minutes

  static get(key: string): CachedHistoryData | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  static set(key: string, data: CachedHistoryData): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      ...data,
      timestamp: Date.now()
    });
  }

  static invalidate(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys())
        .filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  static getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Implement hit rate tracking
      memoryUsage: 0 // Implement memory usage calculation
    };
  }
}
```

### Real-time History Updates

```typescript
// hooks/useHistoryUpdates.ts
export const useHistoryUpdates = (instanceId: number) => {
  const [updates, setUpdates] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    if (!instanceId) return;

    // WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://localhost:8000/ws/history/${instanceId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data) as HistoryRecord;
      setUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
      
      // Invalidate cache for this instance
      HistoryCache.invalidate(`history_${instanceId}`);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [instanceId]);

  return updates;
};
```

## Error Handling

### Error Types and Handling

```typescript
// utils/errorUtils.ts
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    // Network error
    if (!axiosError.response) {
      return 'Network error. Please check your connection.';
    }
    
    const { status, data } = axiosError.response;
    
    switch (status) {
      case 400:
        return data?.message || 'Invalid request data';
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 409:
        return 'Resource conflict';
      case 422:
        return data?.message || 'Validation error';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return data?.message || 'An unexpected error occurred';
    }
  }
  
  return error?.message || 'An unexpected error occurred';
};

// Retry utility
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) break;
      
      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) && error.response?.status < 500) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
};
```

### Global Error Handler

```typescript
// hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const showError = useCallback((error: string | Error) => {
    const message = typeof error === 'string' ? error : error.message;
    
    notification.error({
      message: 'Error',
      description: message,
      duration: 5,
    });
    
    // Log error for debugging
    console.error('Application error:', error);
  }, []);
  
  const showSuccess = useCallback((message: string) => {
    notification.success({
      message: 'Success',
      description: message,
      duration: 3,
    });
  }, []);
  
  return { showError, showSuccess };
};
```

## Data Types

### Instance Types

```typescript
// types/instance.ts
export interface Instance {
  id: number;
  name: string;
  model_name: string;
  model_version?: string;
  cluster: string;
  status: InstanceStatus;
  pp: number;
  cp: number;
  tp: number;
  workers: number;
  replicas: number;
  pipeline_mode: boolean;
  quantization?: string;
  priority: number;
  vae_store_type?: string;
  t5_store_type?: string;
  cuda_graph: boolean;
  task_concurrency: number;
  envs?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type InstanceStatus = 
  | 'pending' 
  | 'active' 
  | 'inactive' 
  | 'error' 
  | 'terminated';

export interface CreateInstanceData {
  name: string;
  model_name: string;
  model_version?: string;
  cluster: string;
  pp?: number;
  cp?: number;
  tp?: number;
  workers?: number;
  replicas?: number;
  pipeline_mode?: boolean;
  quantization?: string;
  priority?: number;
  vae_store_type?: string;
  t5_store_type?: string;
  cuda_graph?: boolean;
  task_concurrency?: number;
  envs?: Record<string, any>;
}

export interface UpdateInstanceData extends Partial<CreateInstanceData> {}
```

### History Types

```typescript
// types/history.ts
export interface HistoryRecord {
  id: number;
  instance_id: number;
  change_type: 'create' | 'update' | 'delete';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields: string[];
  created_at: string;
  created_by?: string;
}

export interface HistoryComparison {
  record1: HistoryRecord;
  record2: HistoryRecord;
  differences: Array<{
    field: string;
    value1: any;
    value2: any;
    type: 'added' | 'removed' | 'modified';
  }>;
}
```

## Best Practices

### 1. Request Optimization

```typescript
// Use AbortController for cancellable requests
const useAbortableRequest = () => {
  const abortControllerRef = useRef<AbortController>();
  
  const makeRequest = useCallback(async (url: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new controller
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await apiClient.get(url, {
        signal: abortControllerRef.current.signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled');
        return null;
      }
      throw error;
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return makeRequest;
};
```

### 2. Caching Strategy

```typescript
// Simple cache implementation
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new ApiCache();

// Usage in API calls
export const getCachedInstances = async (params: InstanceQueryParams) => {
  const cacheKey = JSON.stringify(params);
  const cached = apiCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const data = await InstanceApi.getInstances(params);
  apiCache.set(cacheKey, data);
  
  return data;
};
```

### 3. Optimistic Updates

```typescript
// Optimistic update pattern
const useOptimisticUpdate = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  
  const updateInstanceOptimistic = async (
    id: number, 
    updates: Partial<Instance>
  ) => {
    // Optimistic update
    setInstances(prev => 
      prev.map(instance => 
        instance.id === id ? { ...instance, ...updates } : instance
      )
    );
    
    try {
      const updatedInstance = await InstanceApi.updateInstance(id, updates);
      
      // Confirm update with server response
      setInstances(prev => 
        prev.map(instance => 
          instance.id === id ? updatedInstance : instance
        )
      );
      
      return { success: true };
    } catch (error) {
      // Revert optimistic update
      setInstances(prev => 
        prev.map(instance => 
          instance.id === id 
            ? { ...instance, ...Object.fromEntries(
                Object.keys(updates).map(key => [key, instance[key]])
              )}
            : instance
        )
      );
      
      return { success: false, error: handleApiError(error) };
    }
  };
  
  return { instances, updateInstanceOptimistic };
};
```

### 4. Request Debouncing

```typescript
// Debounced search hook
export const useDebouncedSearch = (
  searchFn: (term: string) => Promise<any[]>,
  delay: number = 300
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true);
      searchFn(debouncedSearchTerm)
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm, searchFn]);
  
  return {
    searchTerm,
    setSearchTerm,
    results,
    loading
  };
};
```

## Testing API Integration

### Mock API for Testing

```typescript
// test/mocks/apiMocks.ts
export const mockInstances: Instance[] = [
  {
    id: 1,
    name: 'test-instance-1',
    model_name: 'test-model',
    cluster: 'test-cluster',
    status: 'active',
    pp: 1,
    cp: 1,
    tp: 1,
    workers: 1,
    replicas: 1,
    pipeline_mode: false,
    priority: 1,
    cuda_graph: false,
    task_concurrency: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// Mock implementation
mockApiClient.get.mockImplementation((url: string) => {
  if (url === '/instances') {
    return Promise.resolve({ data: mockInstances });
  }
  return Promise.reject(new Error('Not found'));
});
```

### Integration Tests

```typescript
// test/integration/api-integration.test.ts
describe('API Integration', () => {
  beforeEach(() => {
    // Setup test server or mocks
  });
  
  it('should fetch instances successfully', async () => {
    const instances = await InstanceApi.getInstances();
    
    expect(instances).toBeInstanceOf(Array);
    expect(instances.length).toBeGreaterThan(0);
    expect(instances[0]).toHaveProperty('id');
    expect(instances[0]).toHaveProperty('name');
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock error response
    mockApiClient.get.mockRejectedValueOnce(
      new Error('Network error')
    );
    
    await expect(InstanceApi.getInstances()).rejects.toThrow('Network error');
  });
  
  it('should create instance with valid data', async () => {
    const instanceData: CreateInstanceData = {
      name: 'test-instance',
      model_name: 'test-model',
      cluster: 'test-cluster'
    };
    
    const createdInstance = await InstanceApi.createInstance(instanceData);
    
    expect(createdInstance).toHaveProperty('id');
    expect(createdInstance.name).toBe(instanceData.name);
  });
});
```

### Component Testing with API

```typescript
// test/components/InstanceTable.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { InstanceTable } from '@/components/tables/InstanceTable';
import * as InstanceApi from '@/services/instanceApi';

jest.mock('@/services/instanceApi');

describe('InstanceTable', () => {
  it('should display instances from API', async () => {
    const mockGetInstances = InstanceApi.getInstances as jest.MockedFunction<
      typeof InstanceApi.getInstances
    >;
    
    mockGetInstances.mockResolvedValue(mockInstances);
    
    render(<InstanceTable />);
    
    await waitFor(() => {
      expect(screen.getByText('test-instance-1')).toBeInTheDocument();
    });
  });
  
  it('should handle API errors', async () => {
    const mockGetInstances = InstanceApi.getInstances as jest.MockedFunction<
      typeof InstanceApi.getInstances
    >;
    
    mockGetInstances.mockRejectedValue(new Error('API Error'));
    
    render(<InstanceTable />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## Performance Considerations

1. **Request Batching**: Combine multiple requests when possible
2. **Pagination**: Implement proper pagination for large datasets
3. **Caching**: Cache frequently accessed data
4. **Debouncing**: Debounce search and filter operations
5. **Abort Requests**: Cancel unnecessary requests
6. **Optimistic Updates**: Improve perceived performance
7. **Error Recovery**: Implement retry mechanisms for transient errors

## Security Considerations

1. **Token Management**: Secure token storage and refresh
2. **Input Validation**: Validate all user inputs
3. **HTTPS**: Use HTTPS in production
4. **CORS**: Configure CORS properly
5. **Rate Limiting**: Respect API rate limits
6. **Error Messages**: Don't expose sensitive information in errors