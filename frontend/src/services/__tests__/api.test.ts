/**
 * API Client Tests
 * Tests for the main API client functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { ApiClient, apiClient } from '../api';
import { createMockInstance, createMockCreateInstanceData, mockApiResponses } from '../../test/utils';
import type { Instance, CreateInstanceData } from '../../types/instance';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('ApiClient', () => {
  let client: ApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      defaults: {
        headers: {
          common: {},
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Create new client instance
    client = new ApiClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with default config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should create axios instance with custom config', () => {
      const customConfig = {
        baseURL: '/custom-api',
        timeout: 5000,
        headers: {
          'Custom-Header': 'value',
        },
      };

      new ApiClient(customConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith(customConfig);
    });

    it('should setup interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('authentication methods', () => {
    it('should set auth token', () => {
      const token = 'test-token';
      client.setAuthToken(token);

      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should clear auth token', () => {
      client.setAuthToken('test-token');
      client.clearAuthToken();

      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle server error responses', async () => {
      const errorResponse = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Validation failed' },
          headers: {},
        },
        config: {
          url: '/test',
          method: 'get',
          headers: {},
        },
        message: 'Request failed',
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(errorResponse);

      await expect(client.getInstances()).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'Validation failed',
        status: 400,
      });
    });

    it('should handle network errors', async () => {
      const networkError = {
        request: {},
        code: 'ECONNREFUSED',
        message: 'Network Error',
        config: {
          url: '/test',
          method: 'get',
        },
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(client.getInstances()).rejects.toMatchObject({
        error: 'NetworkError',
        message: '无法连接到服务器，请检查服务器状态',
      });
    });

    it('should handle request configuration errors', async () => {
      const configError = {
        message: 'Invalid config',
        config: {},
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(configError);

      await expect(client.getInstances()).rejects.toMatchObject({
        error: 'RequestError',
        message: 'Invalid config',
      });
    });
  });

  describe('instance API methods', () => {
    describe('getInstances', () => {
      it('should fetch instances successfully', async () => {
        const mockInstances = mockApiResponses.instances.getInstances;
        mockAxiosInstance.get.mockResolvedValue({ data: mockInstances });

        const result = await client.getInstances();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances', {
          params: {},
        });
        expect(result).toEqual(mockInstances);
      });

      it('should handle query parameters', async () => {
        const mockInstances = mockApiResponses.instances.getInstances;
        mockAxiosInstance.get.mockResolvedValue({ data: mockInstances });

        const params = {
          model_name: 'test-model',
          cluster_name: 'test-cluster',
          active_only: true,
          limit: 10,
          offset: 20,
          search: 'test',
        };

        await client.getInstances(params);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances', {
          params: {
            model_name: 'test-model',
            cluster_name: 'test-cluster',
            status: 'active',
            limit: 10,
            skip: 20,
            name: 'test',
          },
        });
      });
    });

    describe('getInstance', () => {
      it('should fetch single instance successfully', async () => {
        const mockInstance = mockApiResponses.instances.getInstance;
        mockAxiosInstance.get.mockResolvedValue({ data: mockInstance });

        const result = await client.getInstance(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/1');
        expect(result).toEqual(mockInstance);
      });
    });

    describe('createInstance', () => {
      it('should create instance successfully', async () => {
        const createData = createMockCreateInstanceData();
        const mockResponse = mockApiResponses.instances.createInstance;
        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await client.createInstance(createData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/instances', {
          ...createData,
          desc: createData.description,
          priorities: createData.priorities,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should handle priorities as string', async () => {
        const createData = { ...createMockCreateInstanceData(), priorities: 'high' as any };
        const mockResponse = mockApiResponses.instances.createInstance;
        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        await client.createInstance(createData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/instances', {
          ...createData,
          desc: createData.description,
          priorities: ['high'],
        });
      });
    });

    describe('updateInstance', () => {
      it('should update instance successfully', async () => {
        const updateData = { name: 'updated-name', description: 'updated-desc' };
        const mockResponse = mockApiResponses.instances.updateInstance;
        mockAxiosInstance.put.mockResolvedValue({ data: mockResponse });

        const result = await client.updateInstance(1, updateData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/instances/1', {
          name: 'updated-name',
          desc: 'updated-desc',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should filter out undefined values', async () => {
        const updateData = { name: 'updated-name', description: undefined };
        const mockResponse = mockApiResponses.instances.updateInstance;
        mockAxiosInstance.put.mockResolvedValue({ data: mockResponse });

        await client.updateInstance(1, updateData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/instances/1', {
          name: 'updated-name',
        });
      });
    });

    describe('deleteInstance', () => {
      it('should delete instance successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({});

        await client.deleteInstance(1);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/instances/1');
      });
    });

    describe('getInstanceByName', () => {
      it('should fetch instance by name successfully', async () => {
        const mockInstance = mockApiResponses.instances.getInstance;
        mockAxiosInstance.get.mockResolvedValue({ data: mockInstance });

        const result = await client.getInstanceByName('test-instance');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/name/test-instance');
        expect(result).toEqual(mockInstance);
      });

      it('should encode special characters in name', async () => {
        const mockInstance = mockApiResponses.instances.getInstance;
        mockAxiosInstance.get.mockResolvedValue({ data: mockInstance });

        await client.getInstanceByName('test instance with spaces');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/name/test%20instance%20with%20spaces');
      });
    });
  });

  describe('history API methods', () => {
    describe('getInstanceHistory', () => {
      it('should fetch instance history successfully', async () => {
        const mockHistory = mockApiResponses.history.getInstanceHistory;
        mockAxiosInstance.get.mockResolvedValue({ data: mockHistory });

        const result = await client.getInstanceHistory(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/1/history', {
          params: {},
        });
        expect(result).toEqual(mockHistory);
      });

      it('should handle query parameters', async () => {
        const mockHistory = mockApiResponses.history.getInstanceHistory;
        mockAxiosInstance.get.mockResolvedValue({ data: mockHistory });

        const params = {
          limit: 10,
          offset: 20,
          operation_type: 'update',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        };

        await client.getInstanceHistory(1, params);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/1/history', {
          params,
        });
      });
    });

    describe('getHistoryRecord', () => {
      it('should fetch history record successfully', async () => {
        const mockRecord = mockApiResponses.history.getHistoryRecord;
        mockAxiosInstance.get.mockResolvedValue({ data: mockRecord });

        const result = await client.getHistoryRecord(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/history/1');
        expect(result).toEqual(mockRecord);
      });
    });

    describe('getAllHistory', () => {
      it('should fetch all history successfully', async () => {
        const mockHistory = mockApiResponses.history.getInstanceHistory;
        mockAxiosInstance.get.mockResolvedValue({ data: mockHistory });

        const result = await client.getAllHistory();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/history', {
          params: {},
        });
        expect(result).toEqual(mockHistory);
      });
    });

    describe('getLatestHistory', () => {
      it('should fetch latest history successfully', async () => {
        const mockRecord = mockApiResponses.history.getHistoryRecord;
        mockAxiosInstance.get.mockResolvedValue({ data: mockRecord });

        const result = await client.getLatestHistory(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/1/history/latest', {
          params: {},
        });
        expect(result).toEqual(mockRecord);
      });

      it('should handle operation type parameter', async () => {
        const mockRecord = mockApiResponses.history.getHistoryRecord;
        mockAxiosInstance.get.mockResolvedValue({ data: mockRecord });

        await client.getLatestHistory(1, 'update');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/1/history/latest', {
          params: { operation_type: 'update' },
        });
      });
    });

    describe('getInstanceHistoryCount', () => {
      it('should fetch history count successfully', async () => {
        const mockCount = { instance_id: 1, count: 5 };
        mockAxiosInstance.get.mockResolvedValue({ data: mockCount });

        const result = await client.getInstanceHistoryCount(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/instances/1/history/count', {
          params: {},
        });
        expect(result).toEqual(mockCount);
      });
    });
  });

  describe('default export', () => {
    it('should export default api client instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });
  });
});