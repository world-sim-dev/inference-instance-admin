/**
 * Tests for HistorySearchService
 */

import { HistorySearchService } from '../historySearchService';
import type { HistoryRecord } from '../../types/history';
import type { ExtendedHistoryFilters } from '../../components/history/HistoryFilters';
import { OperationType } from '../../types/enums';

// Mock history records for testing
const mockHistoryRecords: HistoryRecord[] = [
  {
    history_id: 1,
    original_id: 1,
    operation_type: OperationType.CREATE,
    operation_timestamp: '2024-01-01T10:00:00Z',
    name: 'test-instance-1',
    model_name: 'gpt-4',
    model_version: '1.0',
    cluster_name: 'production-cluster',
    image_tag: 'v1.0.0',
    description: 'Test instance for production deployment',
    status: 'active',
    ephemeral: false,
    quant_mode: true,
    distill_mode: false,
    m405_mode: false,
    replicas: 3,
    fps: 30,
    priorities: ['high'],
    envs: [{ key: 'ENV', value: 'prod' }],
    pipeline_mode: 'standard',
    checkpoint_path: '/models/gpt4/checkpoint.pt'
  },
  {
    history_id: 2,
    original_id: 1,
    operation_type: OperationType.UPDATE,
    operation_timestamp: '2024-01-02T10:00:00Z',
    name: 'test-instance-1-updated',
    model_name: 'gpt-4',
    model_version: '1.1',
    cluster_name: 'production-cluster',
    image_tag: 'v1.1.0',
    description: 'Updated test instance with new features',
    status: 'active',
    ephemeral: false,
    quant_mode: true,
    distill_mode: true,
    m405_mode: false,
    replicas: 5,
    fps: 60,
    priorities: ['high', 'critical'],
    envs: [{ key: 'ENV', value: 'prod' }, { key: 'DEBUG', value: 'false' }],
    pipeline_mode: 'advanced',
    checkpoint_path: '/models/gpt4/checkpoint-v1.1.pt'
  },
  {
    history_id: 3,
    original_id: 2,
    operation_type: OperationType.CREATE,
    operation_timestamp: '2024-01-03T10:00:00Z',
    name: 'dev-instance',
    model_name: 'llama-2',
    model_version: '7b',
    cluster_name: 'development-cluster',
    image_tag: 'v2.0.0',
    description: 'Development instance for testing',
    status: 'inactive',
    ephemeral: true,
    quant_mode: false,
    distill_mode: false,
    m405_mode: true,
    replicas: 1,
    fps: 15,
    priorities: ['low'],
    envs: [],
    pipeline_mode: 'debug',
    checkpoint_path: '/models/llama2/checkpoint.pt'
  }
];

describe('HistorySearchService', () => {
  describe('searchRecords', () => {
    it('should return all records when no search term is provided', () => {
      const results = HistorySearchService.searchRecords(mockHistoryRecords, '');
      expect(results).toHaveLength(3);
      expect(results.every(r => r.matches.length === 0)).toBe(true);
    });

    it('should find records by name', () => {
      const results = HistorySearchService.searchRecords(mockHistoryRecords, 'test-instance');
      expect(results).toHaveLength(2);
      expect(results[0].matches.some(m => m.field === 'name')).toBe(true);
    });

    it('should find records by model name', () => {
      const results = HistorySearchService.searchRecords(mockHistoryRecords, 'gpt-4');
      expect(results).toHaveLength(2);
      expect(results.every(r => r.record.model_name === 'gpt-4')).toBe(true);
    });

    it('should find records by description', () => {
      const results = HistorySearchService.searchRecords(mockHistoryRecords, 'production');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.matches.some(m => m.field === 'description'))).toBe(true);
    });

    it('should respect case sensitivity', () => {
      const caseSensitiveResults = HistorySearchService.searchRecords(
        mockHistoryRecords, 
        'Test', 
        { caseSensitive: true }
      );
      expect(caseSensitiveResults.length).toBeLessThanOrEqual(3);

      const caseInsensitiveResults = HistorySearchService.searchRecords(
        mockHistoryRecords, 
        'test', 
        { caseSensitive: false }
      );
      expect(caseInsensitiveResults.length).toBeGreaterThanOrEqual(2);
    });

    it('should support exact match mode', () => {
      const results = HistorySearchService.searchRecords(
        mockHistoryRecords, 
        'gpt-4', 
        { mode: 'exact' }
      );
      expect(results.length).toBeGreaterThan(0);
      
      const partialResults = HistorySearchService.searchRecords(
        mockHistoryRecords, 
        'gpt', 
        { mode: 'exact' }
      );
      expect(partialResults.length).toBeLessThanOrEqual(results.length);
    });

    it('should limit search to specified fields', () => {
      const results = HistorySearchService.searchRecords(
        mockHistoryRecords, 
        'production', 
        { fields: ['name'] }
      );
      expect(results).toHaveLength(0); // 'production' is not in name field

      const descriptionResults = HistorySearchService.searchRecords(
        mockHistoryRecords, 
        'production', 
        { fields: ['description'] }
      );
      expect(descriptionResults).toHaveLength(1);
    });

    it('should calculate relevance scores correctly', () => {
      const results = HistorySearchService.searchRecords(mockHistoryRecords, 'test');
      expect(results).toHaveLength(3);
      
      // Results should be sorted by score (descending)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });
  });

  describe('filterRecords', () => {
    it('should filter by operation type', () => {
      const filters: ExtendedHistoryFilters = {
        operation_type: [OperationType.CREATE]
      };
      
      const filtered = HistorySearchService.filterRecords(mockHistoryRecords, filters);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.operation_type === OperationType.CREATE)).toBe(true);
    });

    it('should filter by model name', () => {
      const filters: ExtendedHistoryFilters = {
        model_name: ['gpt-4']
      };
      
      const filtered = HistorySearchService.filterRecords(mockHistoryRecords, filters);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.model_name === 'gpt-4')).toBe(true);
    });

    it('should filter by cluster name', () => {
      const filters: ExtendedHistoryFilters = {
        cluster_name: ['development-cluster']
      };
      
      const filtered = HistorySearchService.filterRecords(mockHistoryRecords, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].cluster_name).toBe('development-cluster');
    });

    it('should filter by boolean fields', () => {
      const ephemeralFilters: ExtendedHistoryFilters = {
        ephemeral: true
      };
      
      const ephemeralFiltered = HistorySearchService.filterRecords(mockHistoryRecords, ephemeralFilters);
      expect(ephemeralFiltered).toHaveLength(1);
      expect(ephemeralFiltered[0].ephemeral).toBe(true);

      const quantFilters: ExtendedHistoryFilters = {
        quant_mode: true
      };
      
      const quantFiltered = HistorySearchService.filterRecords(mockHistoryRecords, quantFilters);
      expect(quantFiltered).toHaveLength(2);
      expect(quantFiltered.every(r => r.quant_mode === true)).toBe(true);
    });

    it('should filter by numeric ranges', () => {
      const filters: ExtendedHistoryFilters = {
        replicas_range: [2, 4]
      };
      
      const filtered = HistorySearchService.filterRecords(mockHistoryRecords, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].replicas).toBe(3);
    });

    it('should filter by content existence', () => {
      const hasDescriptionFilters: ExtendedHistoryFilters = {
        has_description: true
      };
      
      const filtered = HistorySearchService.filterRecords(mockHistoryRecords, hasDescriptionFilters);
      expect(filtered).toHaveLength(3); // All records have descriptions

      const hasPrioritiesFilters: ExtendedHistoryFilters = {
        has_priorities: true
      };
      
      const prioritiesFiltered = HistorySearchService.filterRecords(mockHistoryRecords, hasPrioritiesFilters);
      expect(prioritiesFiltered).toHaveLength(3); // All records have priorities

      const hasEnvsFilters: ExtendedHistoryFilters = {
        has_envs: true
      };
      
      const envsFiltered = HistorySearchService.filterRecords(mockHistoryRecords, hasEnvsFilters);
      expect(envsFiltered).toHaveLength(2); // Only first two records have envs
    });

    it('should combine multiple filters', () => {
      const filters: ExtendedHistoryFilters = {
        operation_type: [OperationType.CREATE],
        ephemeral: false,
        quant_mode: true
      };
      
      const filtered = HistorySearchService.filterRecords(mockHistoryRecords, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('test-instance-1');
    });

    it('should filter by search term', () => {
      const filters: ExtendedHistoryFilters = {
        search: 'gpt-4',
        searchFields: ['model_name'],
        searchMode: 'contains',
        caseSensitive: false
      };
      
      const filtered = HistorySearchService.filterRecords(mockHistoryRecords, filters);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.model_name === 'gpt-4')).toBe(true);
    });
  });

  describe('highlightText', () => {
    it('should highlight search terms in text', () => {
      const text = 'This is a test string with test words';
      const highlighted = HistorySearchService.highlightText(text, 'test');
      
      expect(highlighted).toContain('<mark>test</mark>');
      expect(highlighted.split('<mark>').length - 1).toBe(2); // Two occurrences
    });

    it('should respect case sensitivity in highlighting', () => {
      const text = 'Test and test';
      
      const caseSensitive = HistorySearchService.highlightText(text, 'test', { caseSensitive: true });
      expect(caseSensitive.split('<mark>').length - 1).toBe(1); // Only lowercase 'test'
      
      const caseInsensitive = HistorySearchService.highlightText(text, 'test', { caseSensitive: false });
      expect(caseInsensitive.split('<mark>').length - 1).toBe(2); // Both 'Test' and 'test'
    });

    it('should support custom highlight tags', () => {
      const text = 'test string';
      const highlighted = HistorySearchService.highlightText(text, 'test', {
        highlightTags: { pre: '<span class="highlight">', post: '</span>' }
      });
      
      expect(highlighted).toContain('<span class="highlight">test</span>');
    });

    it('should handle exact match mode', () => {
      const text = 'testing test tested';
      const highlighted = HistorySearchService.highlightText(text, 'test', { mode: 'exact' });
      
      expect(highlighted.split('<mark>').length - 1).toBe(1); // Only exact 'test'
    });
  });

  describe('getSearchSuggestions', () => {
    it('should generate suggestions based on record content', () => {
      const suggestions = HistorySearchService.getSearchSuggestions(mockHistoryRecords, 'test');
      
      expect(suggestions).toContain('test-instance-1');
      expect(suggestions).toContain('testing');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should limit number of suggestions', () => {
      const suggestions = HistorySearchService.getSearchSuggestions(mockHistoryRecords, 'e', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should prioritize suggestions that start with search term', () => {
      const suggestions = HistorySearchService.getSearchSuggestions(mockHistoryRecords, 'dev');
      
      // Suggestions starting with 'dev' should come first
      const devSuggestions = suggestions.filter(s => s.toLowerCase().startsWith('dev'));
      if (devSuggestions.length > 0) {
        expect(suggestions.indexOf(devSuggestions[0])).toBe(0);
      }
    });

    it('should return empty array for short search terms', () => {
      const suggestions = HistorySearchService.getSearchSuggestions(mockHistoryRecords, 'a');
      expect(suggestions).toEqual([]);
    });
  });

  describe('getFilterOptions', () => {
    it('should extract unique filter options from records', () => {
      const options = HistorySearchService.getFilterOptions(mockHistoryRecords);
      
      expect(options.modelNames).toEqual(['gpt-4', 'llama-2']);
      expect(options.clusterNames).toEqual(['development-cluster', 'production-cluster']);
      expect(options.statuses).toEqual(['active', 'inactive']);
      expect(options.imageTags).toEqual(['v1.0.0', 'v1.1.0', 'v2.0.0']);
    });

    it('should return sorted options', () => {
      const options = HistorySearchService.getFilterOptions(mockHistoryRecords);
      
      // Check if arrays are sorted
      expect(options.modelNames).toEqual([...options.modelNames].sort());
      expect(options.clusterNames).toEqual([...options.clusterNames].sort());
      expect(options.statuses).toEqual([...options.statuses].sort());
      expect(options.imageTags).toEqual([...options.imageTags].sort());
    });

    it('should handle empty records array', () => {
      const options = HistorySearchService.getFilterOptions([]);
      
      expect(options.modelNames).toEqual([]);
      expect(options.clusterNames).toEqual([]);
      expect(options.statuses).toEqual([]);
      expect(options.imageTags).toEqual([]);
    });
  });
});