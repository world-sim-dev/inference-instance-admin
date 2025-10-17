/**
 * API Client for Inference Instance Management
 * Provides HTTP client with Axios for backend communication
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  Instance,
  CreateInstanceData,
  UpdateInstanceData,
  InstanceQueryParams
} from '../types/instance';
import type {
  HistoryRecord,
  HistoryQueryParams,
  HistoryListResponse
} from '../types/history';
import type {
  ApiError,
  ApiClientInterface,
  ApiClientConfig,
  RequestInterceptor,
  ResponseInterceptor
} from '../types/api';

/**
 * Default configuration for API client
 */
const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api`,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  }
};

/**
 * API Client class for managing HTTP requests to the backend
 */
export class ApiClient implements ApiClientInterface {
  private client: AxiosInstance;
  public baseURL: string;
  public timeout: number;

  constructor(config: ApiClientConfig = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    this.baseURL = finalConfig.baseURL!;
    this.timeout = finalConfig.timeout!;

    // Create Axios instance
    this.client = axios.create({
      baseURL: finalConfig.baseURL,
      timeout: finalConfig.timeout,
      headers: finalConfig.headers
    });

    // Setup interceptors
    this.setupInterceptors();

    // Apply custom interceptors if provided
    if (finalConfig.requestInterceptors) {
      finalConfig.requestInterceptors.forEach(interceptor => {
        this.addRequestInterceptor(interceptor);
      });
    }

    if (finalConfig.responseInterceptors) {
      finalConfig.responseInterceptors.forEach(interceptor => {
        this.addResponseInterceptor(interceptor);
      });
    }
  }

  /**
   * Setup default request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          };
        }

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] Response ${response.status}:`, response.data);
        return response;
      },
      (error) => {
        console.error('[API] Response error:', error);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Add custom request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.client.interceptors.request.use(
      interceptor.onRequest,
      interceptor.onRequestError
    );
  }

  /**
   * Add custom response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.client.interceptors.response.use(
      interceptor.onResponse,
      interceptor.onResponseError
    );
  }

  /**
   * Handle and transform API errors with enhanced error information
   */
  private handleError(error: AxiosError): ApiError {
    const timestamp = new Date().toISOString();
    const requestId = error.config?.headers?.['X-Request-ID'] || `req_${Date.now()}`;

    if (error.response) {
      // Server responded with error status
      const { status, data, headers } = error.response;
      const responseData = data as any;

      // Extract detailed error information
      const errorDetails = {
        status,
        statusText: error.response.statusText,
        headers: headers,
        requestId,
        timestamp,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        responseData
      };

      return {
        error: responseData?.error || this.getErrorTypeFromStatus(status),
        message: this.getErrorMessageFromResponse(responseData, error.message, status),
        details: errorDetails,
        status
      };
    } else if (error.request) {
      // Request was made but no response received (network error)
      const errorDetails = {
        requestId,
        timestamp,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        timeout: error.config?.timeout,
        networkError: true,
        code: error.code,
        errno: (error as any).errno,
        syscall: (error as any).syscall
      };

      return {
        error: 'NetworkError',
        message: this.getNetworkErrorMessage(error),
        details: errorDetails
      };
    } else {
      // Request configuration error
      const errorDetails = {
        requestId,
        timestamp,
        configError: true,
        originalError: error.toJSON()
      };

      return {
        error: 'RequestError',
        message: error.message || 'Request configuration error',
        details: errorDetails
      };
    }
  }

  /**
   * Get error type based on HTTP status code
   */
  private getErrorTypeFromStatus(status: number): string {
    if (status >= 400 && status < 500) {
      switch (status) {
        case 400: return 'ValidationError';
        case 401: return 'AuthenticationError';
        case 403: return 'AuthorizationError';
        case 404: return 'NotFoundError';
        case 409: return 'ConflictError';
        case 422: return 'ValidationError';
        case 429: return 'RateLimitError';
        default: return 'ClientError';
      }
    } else if (status >= 500) {
      switch (status) {
        case 500: return 'InternalServerError';
        case 502: return 'BadGatewayError';
        case 503: return 'ServiceUnavailableError';
        case 504: return 'GatewayTimeoutError';
        default: return 'ServerError';
      }
    }
    return 'UnknownError';
  }

  /**
   * Get user-friendly error message from response
   */
  private getErrorMessageFromResponse(responseData: any, fallbackMessage: string, status: number): string {
    // Try to extract message from various response formats
    if (responseData?.message) return responseData.message;
    if (responseData?.detail) return responseData.detail;
    if (responseData?.error_description) return responseData.error_description;
    if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      return responseData.errors[0].message || responseData.errors[0];
    }

    // Fallback to status-based messages
    const statusMessages: Record<number, string> = {
      400: '请求参数有误',
      401: '身份验证失败',
      403: '权限不足',
      404: '请求的资源不存在',
      409: '数据冲突',
      422: '数据验证失败',
      429: '请求过于频繁',
      500: '服务器内部错误',
      502: '服务器网关错误',
      503: '服务暂时不可用',
      504: '服务器响应超时'
    };

    return statusMessages[status] || fallbackMessage || `HTTP ${status} 错误`;
  }

  /**
   * Get network error message with specific details
   */
  private getNetworkErrorMessage(error: AxiosError): string {
    const code = error.code;
    const message = error.message;

    // Network-specific error messages
    if (code === 'ECONNREFUSED') return '无法连接到服务器，请检查服务器状态';
    if (code === 'ETIMEDOUT' || message.includes('timeout')) return '请求超时，请检查网络连接';
    if (code === 'ENOTFOUND') return 'DNS解析失败，请检查网络配置';
    if (code === 'ECONNRESET') return '连接被重置，请稍后重试';
    if (message.includes('Network Error')) return '网络连接失败，请检查网络设置';

    return '网络请求失败，请检查网络连接后重试';
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Instance API Methods

  /**
   * Get list of instances with optional filtering
   */
  public async getInstances(params?: InstanceQueryParams): Promise<Instance[]> {
    try {
      const queryParams: any = {};

      if (params) {
        if (params.model_name) queryParams.model_name = params.model_name;
        if (params.cluster_name) queryParams.cluster_name = params.cluster_name;
        if (params.active_only) queryParams.status = 'active';
        if (params.inactive_only) queryParams.status = 'inactive';
        if (params.limit) queryParams.limit = params.limit;
        if (params.offset) queryParams.skip = params.offset; // Backend uses 'skip' instead of 'offset'
        if (params.search) queryParams.name = params.search; // Backend uses 'name' for search
      }

      const response: AxiosResponse<Instance[]> = await this.client.get('/instances/', {
        params: queryParams
      });

      return response.data;
    } catch (error) {
      throw error; // Error is already handled by interceptor
    }
  }

  /**
   * Get a specific instance by ID
   */
  public async getInstance(id: number): Promise<Instance> {
    try {
      const response: AxiosResponse<Instance> = await this.client.get(`/instances/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new instance
   */
  public async createInstance(data: CreateInstanceData): Promise<Instance> {
    try {
      // Transform data to match backend expectations
      const payload = {
        ...data,
        // Map description to desc for backend compatibility
        desc: data.description,
        // Ensure priorities is an array
        priorities: Array.isArray(data.priorities) ? data.priorities : [data.priorities || 'normal']
      };

      const response: AxiosResponse<Instance> = await this.client.post('/instances/', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing instance
   */
  public async updateInstance(id: number, data: UpdateInstanceData): Promise<Instance> {
    try {
      // Filter out undefined values and transform data
      const payload: any = {};

      Object.keys(data).forEach(key => {
        const value = (data as any)[key];
        if (value !== undefined) {
          // Map description to desc for backend compatibility
          if (key === 'description') {
            payload.desc = value;
          } else {
            payload[key] = value;
          }
        }
      });

      const response: AxiosResponse<Instance> = await this.client.put(`/instances/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an instance
   */
  public async deleteInstance(id: number): Promise<void> {
    try {
      await this.client.delete(`/instances/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get instance by name
   */
  public async getInstanceByName(name: string): Promise<Instance> {
    try {
      const response: AxiosResponse<Instance> = await this.client.get(`/instances/name/${encodeURIComponent(name)}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // History API Methods

  /**
   * Get history records for a specific instance
   */
  public async getInstanceHistory(instanceId: number, params?: HistoryQueryParams): Promise<HistoryListResponse> {
    try {
      const queryParams: any = {};

      if (params) {
        if (params.limit) queryParams.limit = params.limit;
        if (params.offset) queryParams.offset = params.offset;
        if (params.operation_type) queryParams.operation_type = params.operation_type;
        if (params.start_date) queryParams.start_date = params.start_date;
        if (params.end_date) queryParams.end_date = params.end_date;
      }

      const response: AxiosResponse<HistoryListResponse> = await this.client.get(
        `/instances/${instanceId}/history`,
        { params: queryParams }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific history record by ID
   */
  public async getHistoryRecord(historyId: number): Promise<HistoryRecord> {
    try {
      const response: AxiosResponse<HistoryRecord> = await this.client.get(`/history/${historyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all history records with optional filtering
   */
  public async getAllHistory(params?: HistoryQueryParams & { original_id?: number }): Promise<HistoryListResponse> {
    try {
      const queryParams: any = {};

      if (params) {
        if (params.limit) queryParams.limit = params.limit;
        if (params.offset) queryParams.offset = params.offset;
        if (params.operation_type) queryParams.operation_type = params.operation_type;
        if (params.start_date) queryParams.start_date = params.start_date;
        if (params.end_date) queryParams.end_date = params.end_date;
        if (params.original_id) queryParams.original_id = params.original_id;
      }

      const response: AxiosResponse<HistoryListResponse> = await this.client.get('/history/', {
        params: queryParams
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the latest history record for an instance
   */
  public async getLatestHistory(instanceId: number, operationType?: string): Promise<HistoryRecord> {
    try {
      const params: any = {};
      if (operationType) params.operation_type = operationType;

      const response: AxiosResponse<HistoryRecord> = await this.client.get(
        `/instances/${instanceId}/history/latest`,
        { params }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get history count for an instance
   */
  public async getInstanceHistoryCount(instanceId: number, params?: Omit<HistoryQueryParams, 'limit' | 'offset'>): Promise<{ instance_id: number; count: number }> {
    try {
      const queryParams: any = {};

      if (params) {
        if (params.operation_type) queryParams.operation_type = params.operation_type;
        if (params.start_date) queryParams.start_date = params.start_date;
        if (params.end_date) queryParams.end_date = params.end_date;
      }

      const response: AxiosResponse<{ instance_id: number; count: number }> = await this.client.get(
        `/instances/${instanceId}/history/count`,
        { params: queryParams }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * Create a new API client with custom configuration
 */
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};

export default apiClient;