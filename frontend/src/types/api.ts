/**
 * TypeScript interfaces for API requests and responses
 * Maps to backend schemas.py and API endpoints
 */

import type { Instance, CreateInstanceData, UpdateInstanceData, InstanceQueryParams } from './instance';
import type { HistoryRecord, HistoryQueryParams, HistoryListResponse } from './history';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Error response interface matching backend ErrorResponse schema
 */
export interface ApiError {
  error: string;
  message: string;
  details?: any;
  status?: number;
}

/**
 * Instance API response interfaces
 */
export interface InstanceListResponse {
  instances: Instance[];
  total_count?: number;
}

export interface InstanceResponse {
  instance: Instance;
}

export interface InstanceCreateResponse {
  instance: Instance;
  message?: string;
}

export interface InstanceUpdateResponse {
  instance: Instance;
  message?: string;
}

export interface InstanceDeleteResponse {
  message: string;
  deleted_instance_id: number;
}

/**
 * History API response interfaces
 */
export interface HistoryResponse {
  history_records: HistoryRecord[];
  total_count: number;
}

export interface HistoryRecordResponse {
  history_record: HistoryRecord;
}

/**
 * Request configuration interface
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * API client method interfaces
 */
export interface InstanceApiMethods {
  getInstances(params?: InstanceQueryParams): Promise<Instance[]>;
  getInstance(id: number): Promise<Instance>;
  createInstance(data: CreateInstanceData): Promise<Instance>;
  updateInstance(id: number, data: UpdateInstanceData): Promise<Instance>;
  deleteInstance(id: number): Promise<void>;
}

export interface HistoryApiMethods {
  getInstanceHistory(instanceId: number, params?: HistoryQueryParams): Promise<HistoryListResponse>;
  getHistoryRecord(historyId: number): Promise<HistoryRecord>;
}

/**
 * Combined API client interface
 */
export interface ApiClientInterface extends InstanceApiMethods, HistoryApiMethods {
  // Base configuration
  baseURL: string;
  timeout: number;
  
  // Utility methods
  setAuthToken(token: string): void;
  setBasicAuth(username: string, password: string): void;
  clearAuthToken(): void;
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request interceptor interface
 */
export interface RequestInterceptor {
  onRequest?: (config: any) => any;
  onRequestError?: (error: any) => Promise<any>;
}

/**
 * Response interceptor interface
 */
export interface ResponseInterceptor {
  onResponse?: (response: any) => any;
  onResponseError?: (error: any) => Promise<any>;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

/**
 * Loading state interface
 */
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

/**
 * Async operation state
 */
export interface AsyncOperationState<T = any> extends LoadingState {
  data: T | null;
  lastUpdated: Date | null;
}

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Search parameters
 */
export interface SearchParams {
  query?: string;
  fields?: string[];
}

/**
 * Combined query parameters
 */
export interface QueryParams extends PaginationParams, SearchParams {
  sort?: SortParams;
  filters?: Record<string, any>;
}