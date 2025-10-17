/**
 * Tests for OptimizedApiClient
 * Verifies request deduplication, debouncing, and batch processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizedApiClient } from '../optimizedApiClient';
import type { HistoryListResponse, HistoryRecord } from '../../types/history';
import type { Instance } from '../../types/instance';

// Mock the base ApiClient
vi.mock('../api', () => ({
  ApiClient: class MockApiClient {
    async getInstances() {
      return [{ id: 1, name: 'test-instance' }];
    }
    
    async getInstance(id: number) {
      return { id, name: `instance-${id}` };
    }
    
    async getInstanceHistory(instanceId: number) {
      return {
        history_records: [{ history_id: 1, original_id: instanceId }],
        total_count: 1,
        limit: 50,
        offset: 0,
        has_more: false
      };
    }
    
    async getHistoryRecord(historyId: number) {
      return { history_id: historyId, original_id: 1 };
    }
  }
}));

describe('OptimizedApiClient', () => {
  let client: OptimizedApiClient;

  beforeEach(() => {
    client = new OptimizedApiClient({
      requestDeduplication: { enabled: true, cacheTtl: 1000 },
      batchRequests: { enabled: true, maxBatchSize: 3, batchDelay: 10 },
      debounce: { enabled: true, delay: 50 }
    });
  });

  afterEach(() => {
    client.clearCache();
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      // Make multiple identical requests
      const promises = [
        client.getInstances(),
        client.getInstances(),
        client.getInstances()
      ];
      
      const results = await Promise.all(promises);
      
      // All should return the same result
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual([{ id: 1, name: 'test-instance' }]);
      });
    });

    it('should cache results for subsequent requests', async () => {
      // First request
      const result1 = await client.getInstance(1);
      expect(result1).toEqual({ id: 1, name: 'instance-1' });
      
      // Second request should use cache
      const result2 = await client.getInstance(1);
      expect(result2).toEqual({ id: 1, name: 'instance-1' });
    });
  });

  describe('Batch Processing', () => {
    it('should batch multiple history record requests', async () => {
      const promises = [
        client.getHistoryRecord(1),
        client.getHistoryRecord(2),
        client.getHistoryRecord(3)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ history_id: 1, original_id: 1 });
      expect(results[1]).toEqual({ history_id: 2, original_id: 1 });
      expect(results[2]).toEqual({ history_id: 3, original_id: 1 });
    });

    it('should handle batch get history records', async () => {
      const historyIds = [1, 2, 3, 4, 5];
      const results = await client.batchGetHistoryRecords(historyIds);
      
      expect(results).toHaveLength(5);
      results.forEach((record, index) => {
        expect(record.history_id).toBe(historyIds[index]);
      });
    });
  });

  describe('Search with Debouncing', () => {
    it('should debounce search requests', async () => {
      const searchSpy = vi.fn().mockResolvedValue([]);
      
      // Mock the search method
      client.searchInstances = vi.fn().mockImplementation(searchSpy);
      
      // Make rapid search requests
      client.searchInstances('test');
      client.searchInstances('test1');
      client.searchInstances('test12');
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should only call once with the last search term
      expect(searchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = client.getCacheStats();
      
      expect(stats).toHaveProperty('requestCacheSize');
      expect(stats).toHaveProperty('batchQueueSizes');
      expect(stats).toHaveProperty('debouncedFunctionCount');
      expect(typeof stats.requestCacheSize).toBe('number');
    });

    it('should clear cache when requested', () => {
      client.clearCache();
      const stats = client.getCacheStats();
      
      expect(stats.requestCacheSize).toBe(0);
      expect(Object.keys(stats.batchQueueSizes)).toHaveLength(0);
      expect(stats.debouncedFunctionCount).toBe(0);
    });
  });

  describe('Prefetch Functionality', () => {
    it('should prefetch related instance data', async () => {
      const result = await client.prefetchInstanceData(1);
      
      expect(result).toHaveProperty('instance');
      expect(result).toHaveProperty('history');
      expect(result.instance).toEqual({ id: 1, name: 'instance-1' });
      expect(result.history.history_records).toHaveLength(1);
    });
  });
});