/**
 * HistoryService Tests
 * 
 * Comprehensive tests for the basic HistoryService functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryService } from '../historyService';
import type { HistoryRecord, HistoryListResponse, HistoryFilters } from '../../types/history';
import { OperationType } from '../../types/enums';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    getInstanceHistory: vi.fn(),
    getHistoryRecord: vi.fn(),
    getAllHistory: vi.fn(),
    getLatestHistory: vi.fn(),
    getInstanceHistoryCount: vi.fn()
  }
}));

import { apiClient } from '../api';
import { afterEach } from 'node:test';

describe('HistoryService', () => {
  const mockHistoryRecord: HistoryRecord = {
    history_id: 1,
    original_id: 1,
    operation_type: OperationType.UPDATE,
    operation_timestamp: '2024-01-15T10:30:00Z',
    name: 'test-instance',
    model_name: 'test-model',
    model_version: '1.0.0',
    cluster_name: 'test-cluster',
    image_tag: 'test:latest',
    pipeline_mode: 'inference',
    quant_mode: true,
    distill_mode: false,
    m405_mode: false,
    fps: 30,
    checkpoint_path: '/test/path',
    nonce: 'test-nonce',
    pp: 2,
    cp: 1,
    tp: 4,
    n_workers: 8,
    replicas: 3,
    priorities: ['high'],
    envs: [{ name: 'TEST_ENV', value: 'test_value' }],
    description: 'Test description',
    separate_video_encode: true,
    separate_video_decode: false,
    separate_t5_encode: false,
    ephemeral: false,
    ephemeral_min_period_seconds: null,
    ephemeral_to: null,
    ephemeral_from: null,
    vae_store_type: 'memory',
    t5_store_type: 'disk',
    enable_cuda_graph: true,
    task_concurrency: 4,
    celery_task_concurrency: 2,
    status: 'running'
  };

  const mockHistoryResponse: HistoryListResponse = {
    history_records: [mockHistoryRecord],
    total_count: 1,
    limit: 50,
    offset: 0,
    has_more: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstanceHistory', () => {
    it('should fetch instance history with default parameters', async () => {
      (apiClient.getInstanceHistory as any).mockResolvedValue(mockHistoryResponse);

      const result = await HistoryService.getInstanceHistory(1);

      expect(result).toEqual(mockHistoryResponse);
      expect(apiClient.getInstanceHistory).toHaveBeenCalledWith(1, {
        limit: 50,
        offset: 0
      });
    });

    it('should fetch instance history with custom pagination', async () => {
      (apiClient.getInstanceHistory as any).mockResolvedValue(mockHistoryResponse);

      const result = await HistoryService.getInstanceHistory(
        1,
        undefined,
        { limit: 20, offset: 10 }
      );

      expect(result).toEqual(mockHistoryResponse);
      expect(apiClient.getInstanceHistory).toHaveBeenCalledWith(1, {
        limit: 20,
        offset: 10
      });
    });

    it('should fetch instance history with operation type filter', async () => {
      (apiClient.getInstanceHistory as any).mockResolvedValue(mockHistoryResponse);

      const filters: HistoryFilters = {
        operation_type: [OperationType.UPDATE]
      };

      const result = await HistoryService.getInstanceHistory(1, filters);

      expect(result).toEqual(mockHistoryResponse);
      expect(apiClient.getInstanceHistory).toHaveBeenCalledWith(1, {
        limit: 50,
        offset: 0,
        operation_type: OperationType.UPDATE
      });
    });

    it('should fetch instance history with date range filter', async () => {
      (apiClient.getInstanceHistory as any).mockResolvedValue(mockHistoryResponse);

      const filters: HistoryFilters = {
        date_range: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const result = await HistoryService.getInstanceHistory(1, filters);

      expect(result).toEqual(mockHistoryResponse);
      expect(apiClient.getInstanceHistory).toHaveBeenCalledWith(1, {
        limit: 50,
        offset: 0,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z'
      });
    });

    it('should handle multiple operation types by using the first one', async () => {
      (apiClient.getInstanceHistory as any).mockResolvedValue(mockHistoryResponse);

      const filters: HistoryFilters = {
        operation_type: [OperationType.UPDATE, OperationType.CREATE]
      };

      const result = await HistoryService.getInstanceHistory(1, filters);

      expect(apiClient.getInstanceHistory).toHaveBeenCalledWith(1, {
        limit: 50,
        offset: 0,
        operation_type: OperationType.UPDATE
      });
    });

    it('should propagate API errors', async () => {
      const error = new Error('API Error');
      (apiClient.getInstanceHistory as any).mockRejectedValue(error);

      await expect(HistoryService.getInstanceHistory(1)).rejects.toThrow('API Error');
    });
  });

  describe('getHistoryRecord', () => {
    it('should fetch a specific history record', async () => {
      (apiClient.getHistoryRecord as any).mockResolvedValue(mockHistoryRecord);

      const result = await HistoryService.getHistoryRecord(1);

      expect(result).toEqual(mockHistoryRecord);
      expect(apiClient.getHistoryRecord).toHaveBeenCalledWith(1);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Record not found');
      (apiClient.getHistoryRecord as any).mockRejectedValue(error);

      await expect(HistoryService.getHistoryRecord(999)).rejects.toThrow('Record not found');
    });
  });

  describe('getAllHistory', () => {
    it('should fetch all history with default parameters', async () => {
      (apiClient.getAllHistory as any).mockResolvedValue(mockHistoryResponse);

      const result = await HistoryService.getAllHistory();

      expect(result).toEqual(mockHistoryResponse);
      expect(apiClient.getAllHistory).toHaveBeenCalledWith({
        limit: 50,
        offset: 0
      });
    });

    it('should fetch all history with instance filter', async () => {
      (apiClient.getAllHistory as any).mockResolvedValue(mockHistoryResponse);

      const filters = { instanceId: 1 };
      const result = await HistoryService.getAllHistory(filters);

      expect(result).toEqual(mockHistoryResponse);
      expect(apiClient.getAllHistory).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        original_id: 1
      });
    });

    it('should fetch all history with combined filters', async () => {
      (apiClient.getAllHistory as any).mockResolvedValue(mockHistoryResponse);

      const filters = {
        instanceId: 1,
        operation_type: [OperationType.CREATE],
        date_range: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const result = await HistoryService.getAllHistory(filters);

      expect(apiClient.getAllHistory).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        original_id: 1,
        operation_type: OperationType.CREATE,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z'
      });
    });
  });

  describe('getLatestHistory', () => {
    it('should fetch latest history record', async () => {
      (apiClient.getLatestHistory as any).mockResolvedValue(mockHistoryRecord);

      const result = await HistoryService.getLatestHistory(1);

      expect(result).toEqual(mockHistoryRecord);
      expect(apiClient.getLatestHistory).toHaveBeenCalledWith(1, undefined);
    });

    it('should fetch latest history record with operation type', async () => {
      (apiClient.getLatestHistory as any).mockResolvedValue(mockHistoryRecord);

      const result = await HistoryService.getLatestHistory(1, OperationType.UPDATE);

      expect(result).toEqual(mockHistoryRecord);
      expect(apiClient.getLatestHistory).toHaveBeenCalledWith(1, OperationType.UPDATE);
    });
  });

  describe('getHistoryCount', () => {
    it('should fetch history count', async () => {
      (apiClient.getInstanceHistoryCount as any).mockResolvedValue({ count: 5 });

      const result = await HistoryService.getHistoryCount(1);

      expect(result).toBe(5);
      expect(apiClient.getInstanceHistoryCount).toHaveBeenCalledWith(1, {});
    });

    it('should fetch history count with filters', async () => {
      (apiClient.getInstanceHistoryCount as any).mockResolvedValue({ count: 3 });

      const filters: HistoryFilters = {
        operation_type: [OperationType.UPDATE],
        date_range: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const result = await HistoryService.getHistoryCount(1, filters);

      expect(result).toBe(3);
      expect(apiClient.getInstanceHistoryCount).toHaveBeenCalledWith(1, {
        operation_type: OperationType.UPDATE,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z'
      });
    });
  });

  describe('compareHistoryRecords', () => {
    const oldRecord: HistoryRecord = {
      ...mockHistoryRecord,
      history_id: 1,
      name: 'old-instance',
      model_version: '1.0.0',
      replicas: 1,
      quant_mode: false,
      priorities: ['low'],
      envs: []
    };

    const newRecord: HistoryRecord = {
      ...mockHistoryRecord,
      history_id: 2,
      name: 'new-instance',
      model_version: '1.1.0',
      replicas: 2,
      quant_mode: true,
      priorities: ['high'],
      envs: [{ name: 'ENV', value: 'prod' }]
    };

    it('should compare two history records and identify changes', () => {
      const comparisons = HistoryService.compareHistoryRecords(oldRecord, newRecord);

      expect(comparisons).toHaveLength(33); // Number of fields being compared

      // Check specific field comparisons
      const nameComparison = comparisons.find(c => c.field === 'name');
      expect(nameComparison).toEqual({
        field: 'name',
        oldValue: 'old-instance',
        newValue: 'new-instance',
        changed: true
      });

      const modelVersionComparison = comparisons.find(c => c.field === 'model_version');
      expect(modelVersionComparison).toEqual({
        field: 'model_version',
        oldValue: '1.0.0',
        newValue: '1.1.0',
        changed: true
      });

      const unchangedComparison = comparisons.find(c => c.field === 'model_name');
      expect(unchangedComparison?.changed).toBe(false);
    });

    it('should handle array and object comparisons', () => {
      const comparisons = HistoryService.compareHistoryRecords(oldRecord, newRecord);

      const prioritiesComparison = comparisons.find(c => c.field === 'priorities');
      expect(prioritiesComparison?.changed).toBe(true);
      expect(prioritiesComparison?.oldValue).toEqual(['low']);
      expect(prioritiesComparison?.newValue).toEqual(['high']);

      const envsComparison = comparisons.find(c => c.field === 'envs');
      expect(envsComparison?.changed).toBe(true);
      expect(envsComparison?.oldValue).toEqual([]);
      expect(envsComparison?.newValue).toEqual([{ name: 'ENV', value: 'prod' }]);
    });

    it('should identify unchanged fields', () => {
      const comparisons = HistoryService.compareHistoryRecords(oldRecord, oldRecord);

      const changedFields = comparisons.filter(c => c.changed);
      expect(changedFields).toHaveLength(0);

      const unchangedFields = comparisons.filter(c => !c.changed);
      expect(unchangedFields).toHaveLength(33);
    });
  });

  describe('groupHistoryComparisons', () => {
    it('should group comparisons by category', () => {
      const comparisons = HistoryService.compareHistoryRecords(mockHistoryRecord, mockHistoryRecord);
      const groups = HistoryService.groupHistoryComparisons(comparisons);

      expect(groups).toHaveLength(8); // Number of categories

      const basicInfoGroup = groups.find(g => g.category === 'Basic Information');
      expect(basicInfoGroup?.fields).toHaveLength(7);
      expect(basicInfoGroup?.fields.some(f => f.field === 'name')).toBe(true);
      expect(basicInfoGroup?.fields.some(f => f.field === 'model_name')).toBe(true);

      const pipelineGroup = groups.find(g => g.category === 'Pipeline Configuration');
      expect(pipelineGroup?.fields).toHaveLength(7);
      expect(pipelineGroup?.fields.some(f => f.field === 'pipeline_mode')).toBe(true);

      const resourceGroup = groups.find(g => g.category === 'Resource Allocation');
      expect(resourceGroup?.fields).toHaveLength(5);
      expect(resourceGroup?.fields.some(f => f.field === 'replicas')).toBe(true);
    });

    it('should filter out empty groups', () => {
      // Create comparisons with only basic info fields
      const limitedComparisons = [
        { field: 'name', oldValue: 'old', newValue: 'new', changed: true },
        { field: 'model_name', oldValue: 'model1', newValue: 'model2', changed: true }
      ];

      const groups = HistoryService.groupHistoryComparisons(limitedComparisons);
      
      // Should only have the Basic Information group
      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBe('Basic Information');
    });
  });

  describe('formatOperationType', () => {
    it('should format CREATE operation type', () => {
      const formatted = HistoryService.formatOperationType(OperationType.CREATE);
      
      expect(formatted).toEqual({
        label: 'Created',
        icon: 'plus-circle',
        color: 'success'
      });
    });

    it('should format UPDATE operation type', () => {
      const formatted = HistoryService.formatOperationType(OperationType.UPDATE);
      
      expect(formatted).toEqual({
        label: 'Updated',
        icon: 'edit',
        color: 'warning'
      });
    });

    it('should format DELETE operation type', () => {
      const formatted = HistoryService.formatOperationType(OperationType.DELETE);
      
      expect(formatted).toEqual({
        label: 'Deleted',
        icon: 'delete',
        color: 'error'
      });
    });

    it('should format ROLLBACK operation type', () => {
      const formatted = HistoryService.formatOperationType(OperationType.ROLLBACK);
      
      expect(formatted).toEqual({
        label: 'Rolled Back',
        icon: 'undo',
        color: 'info'
      });
    });

    it('should handle unknown operation types', () => {
      const formatted = HistoryService.formatOperationType('unknown');
      
      expect(formatted).toEqual({
        label: 'unknown',
        icon: 'info-circle',
        color: 'default'
      });
    });

    it('should handle case insensitive operation types', () => {
      const formatted = HistoryService.formatOperationType('CREATE');
      
      expect(formatted).toEqual({
        label: 'Created',
        icon: 'plus-circle',
        color: 'success'
      });
    });
  });

  describe('formatTimestamp', () => {
    it('should format valid timestamp', () => {
      const timestamp = '2024-01-15T10:30:00Z';
      const formatted = HistoryService.formatTimestamp(timestamp);
      
      // Should return a locale string representation
      expect(formatted).toBe(new Date(timestamp).toLocaleString());
    });

    it('should handle invalid timestamp', () => {
      const invalidTimestamp = 'invalid-date';
      const formatted = HistoryService.formatTimestamp(invalidTimestamp);
      
      // Should return "Invalid Date" for invalid dates
      expect(formatted).toBe('Invalid Date');
    });

    it('should handle empty timestamp', () => {
      const formatted = HistoryService.formatTimestamp('');
      expect(formatted).toBe('Invalid Date');
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed time
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for recent timestamps', () => {
      const timestamp = '2024-01-15T11:59:30Z'; // 30 seconds ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe('Just now');
    });

    it('should return minutes for timestamps within an hour', () => {
      const timestamp = '2024-01-15T11:45:00Z'; // 15 minutes ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe('15 minutes ago');
    });

    it('should return singular minute for 1 minute ago', () => {
      const timestamp = '2024-01-15T11:59:00Z'; // 1 minute ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe('1 minute ago');
    });

    it('should return hours for timestamps within a day', () => {
      const timestamp = '2024-01-15T09:00:00Z'; // 3 hours ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe('3 hours ago');
    });

    it('should return singular hour for 1 hour ago', () => {
      const timestamp = '2024-01-15T11:00:00Z'; // 1 hour ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe('1 hour ago');
    });

    it('should return days for timestamps within a week', () => {
      const timestamp = '2024-01-13T12:00:00Z'; // 2 days ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe('2 days ago');
    });

    it('should return singular day for 1 day ago', () => {
      const timestamp = '2024-01-14T12:00:00Z'; // 1 day ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe('1 day ago');
    });

    it('should return formatted date for timestamps older than a week', () => {
      const timestamp = '2024-01-01T12:00:00Z'; // 2 weeks ago
      const relative = HistoryService.getRelativeTime(timestamp);
      expect(relative).toBe(new Date(timestamp).toLocaleDateString());
    });

    it('should handle invalid timestamps', () => {
      const invalidTimestamp = 'invalid-date';
      const relative = HistoryService.getRelativeTime(invalidTimestamp);
      expect(relative).toBe('Invalid Date');
    });
  });

  describe('getFilterOptions', () => {
    it('should return available filter options', () => {
      const options = HistoryService.getFilterOptions();
      
      expect(options.operationTypes).toHaveLength(4);
      expect(options.operationTypes).toEqual([
        { value: OperationType.CREATE, label: 'Created' },
        { value: OperationType.UPDATE, label: 'Updated' },
        { value: OperationType.DELETE, label: 'Deleted' },
        { value: OperationType.ROLLBACK, label: 'Rolled Back' }
      ]);
    });

    it('should return consistent filter options', () => {
      const options1 = HistoryService.getFilterOptions();
      const options2 = HistoryService.getFilterOptions();
      
      expect(options1).toEqual(options2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in getInstanceHistory', async () => {
      const networkError = new Error('Network error');
      (apiClient.getInstanceHistory as any).mockRejectedValue(networkError);

      await expect(HistoryService.getInstanceHistory(1)).rejects.toThrow('Network error');
    });

    it('should handle API errors in getHistoryRecord', async () => {
      const apiError = new Error('404 Not Found');
      (apiClient.getHistoryRecord as any).mockRejectedValue(apiError);

      await expect(HistoryService.getHistoryRecord(999)).rejects.toThrow('404 Not Found');
    });

    it('should handle timeout errors in getAllHistory', async () => {
      const timeoutError = new Error('Request timeout');
      (apiClient.getAllHistory as any).mockRejectedValue(timeoutError);

      await expect(HistoryService.getAllHistory()).rejects.toThrow('Request timeout');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty history response', async () => {
      const emptyResponse: HistoryListResponse = {
        history_records: [],
        total_count: 0,
        limit: 50,
        offset: 0,
        has_more: false
      };
      (apiClient.getInstanceHistory as any).mockResolvedValue(emptyResponse);

      const result = await HistoryService.getInstanceHistory(1);
      expect(result).toEqual(emptyResponse);
    });

    it('should handle null values in record comparison', () => {
      const recordWithNulls: HistoryRecord = {
        ...mockHistoryRecord,
        fps: null,
        checkpoint_path: null,
        ephemeral_min_period_seconds: null
      };

      const comparisons = HistoryService.compareHistoryRecords(recordWithNulls, mockHistoryRecord);
      
      const fpsComparison = comparisons.find(c => c.field === 'fps');
      expect(fpsComparison?.changed).toBe(true);
      expect(fpsComparison?.oldValue).toBe(null);
      expect(fpsComparison?.newValue).toBe(30);
    });

    it('should handle empty arrays in record comparison', () => {
      const recordWithEmptyArrays: HistoryRecord = {
        ...mockHistoryRecord,
        priorities: [],
        envs: []
      };

      const comparisons = HistoryService.compareHistoryRecords(recordWithEmptyArrays, mockHistoryRecord);
      
      const prioritiesComparison = comparisons.find(c => c.field === 'priorities');
      expect(prioritiesComparison?.changed).toBe(true);
      expect(prioritiesComparison?.oldValue).toEqual([]);
      expect(prioritiesComparison?.newValue).toEqual(['high']);
    });
  });
});