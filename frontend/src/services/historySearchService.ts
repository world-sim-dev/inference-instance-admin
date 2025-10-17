/**
 * History Search Service
 * Advanced search functionality for history records with field-specific search,
 * highlighting, and intelligent filtering
 */

import type { HistoryRecord } from '../types/history';
import type { ExtendedHistoryFilters } from '../components/history/HistoryFilters';

/**
 * Search result with highlighting information
 */
export interface SearchResult {
  record: HistoryRecord;
  matches: SearchMatch[];
  score: number;
}

/**
 * Individual search match with position and context
 */
export interface SearchMatch {
  field: string;
  value: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  context?: string;
}

/**
 * Search options for customizing search behavior
 */
export interface SearchOptions {
  fields?: string[];
  mode?: 'contains' | 'exact' | 'regex';
  caseSensitive?: boolean;
  maxResults?: number;
  minScore?: number;
  highlightTags?: {
    pre: string;
    post: string;
  };
}

/**
 * History Search Service Class
 */
export class HistorySearchService {
  private static readonly DEFAULT_SEARCH_FIELDS = [
    'name',
    'model_name', 
    'cluster_name',
    'description',
    'image_tag',
    'checkpoint_path'
  ];

  private static readonly FIELD_WEIGHTS = {
    name: 3.0,
    model_name: 2.5,
    cluster_name: 2.0,
    description: 1.5,
    image_tag: 1.2,
    checkpoint_path: 1.0,
    status: 1.0,
    pipeline_mode: 0.8,
    nonce: 0.5
  };

  /**
   * Search history records with advanced filtering and scoring
   */
  static searchRecords(
    records: HistoryRecord[],
    searchTerm: string,
    options: SearchOptions = {}
  ): SearchResult[] {
    if (!searchTerm || !searchTerm.trim()) {
      return records.map(record => ({
        record,
        matches: [],
        score: 0
      }));
    }

    const {
      fields = this.DEFAULT_SEARCH_FIELDS,
      mode = 'contains',
      caseSensitive = false,
      maxResults = 1000,
      minScore = 0
    } = options;

    const results: SearchResult[] = [];
    const processedTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    for (const record of records) {
      const matches: SearchMatch[] = [];
      let totalScore = 0;

      // Search in specified fields
      for (const field of fields) {
        const fieldValue = this.getFieldValue(record, field);
        if (!fieldValue) continue;

        const processedValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();
        const fieldMatches = this.searchInField(
          field,
          fieldValue,
          processedValue,
          processedTerm,
          mode
        );

        if (fieldMatches.length > 0) {
          matches.push(...fieldMatches);
          
          // Calculate field score based on matches and field weight
          const fieldWeight = this.FIELD_WEIGHTS[field as keyof typeof this.FIELD_WEIGHTS] || 1.0;
          const fieldScore = fieldMatches.length * fieldWeight;
          totalScore += fieldScore;
        }
      }

      // Add bonus score for exact matches and multiple field matches
      if (matches.length > 0) {
        // Bonus for exact matches
        const exactMatches = matches.filter(m => m.matchedText.toLowerCase() === processedTerm);
        totalScore += exactMatches.length * 2.0;

        // Bonus for multiple field matches
        const uniqueFields = new Set(matches.map(m => m.field));
        if (uniqueFields.size > 1) {
          totalScore += uniqueFields.size * 0.5;
        }

        // Only include results above minimum score
        if (totalScore >= minScore) {
          results.push({
            record,
            matches,
            score: totalScore
          });
        }
      }
    }

    // Sort by score (descending) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Filter records based on extended filters
   */
  static filterRecords(
    records: HistoryRecord[],
    filters: ExtendedHistoryFilters
  ): HistoryRecord[] {
    return records.filter(record => {
      // Text search filter
      if (filters.search && filters.search.trim()) {
        const searchResults = this.searchRecords(
          [record],
          filters.search,
          {
            fields: filters.searchFields,
            mode: filters.searchMode,
            caseSensitive: filters.caseSensitive,
            minScore: 0.1
          }
        );
        if (searchResults.length === 0) return false;
      }

      // Operation type filter
      if (filters.operation_type && filters.operation_type.length > 0) {
        if (!filters.operation_type.includes(record.operation_type)) return false;
      }

      // Date range filter
      if (filters.date_range) {
        const recordDate = new Date(record.operation_timestamp);
        const startDate = new Date(filters.date_range.start);
        const endDate = new Date(filters.date_range.end);
        if (recordDate < startDate || recordDate > endDate) return false;
      }

      // Model name filter
      if (filters.model_name && filters.model_name.length > 0) {
        if (!filters.model_name.includes(record.model_name)) return false;
      }

      // Cluster name filter
      if (filters.cluster_name && filters.cluster_name.length > 0) {
        if (!filters.cluster_name.includes(record.cluster_name)) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!record.status || !filters.status.includes(record.status)) return false;
      }

      // Image tag filter
      if (filters.image_tag && filters.image_tag.length > 0) {
        if (!filters.image_tag.includes(record.image_tag)) return false;
      }

      // Boolean filters
      if (filters.ephemeral !== null && filters.ephemeral !== undefined) {
        if (record.ephemeral !== filters.ephemeral) return false;
      }

      if (filters.quant_mode !== null && filters.quant_mode !== undefined) {
        if (record.quant_mode !== filters.quant_mode) return false;
      }

      if (filters.distill_mode !== null && filters.distill_mode !== undefined) {
        if (record.distill_mode !== filters.distill_mode) return false;
      }

      if (filters.m405_mode !== null && filters.m405_mode !== undefined) {
        if (record.m405_mode !== filters.m405_mode) return false;
      }

      // Content-based filters
      if (filters.has_description) {
        if (!record.description || record.description.trim() === '') return false;
      }

      if (filters.has_priorities) {
        if (!record.priorities || record.priorities.length === 0) return false;
      }

      if (filters.has_envs) {
        if (!record.envs || record.envs.length === 0) return false;
      }

      // Numeric range filters
      if (filters.replicas_range) {
        const replicas = record.replicas || 0;
        if (replicas < filters.replicas_range[0] || replicas > filters.replicas_range[1]) {
          return false;
        }
      }

      if (filters.fps_range) {
        const fps = record.fps || 0;
        if (fps < filters.fps_range[0] || fps > filters.fps_range[1]) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Highlight search terms in text
   */
  static highlightText(
    text: string,
    searchTerm: string,
    options: {
      caseSensitive?: boolean;
      mode?: 'contains' | 'exact' | 'regex';
      highlightTags?: { pre: string; post: string };
    } = {}
  ): string {
    if (!text || !searchTerm) return text;

    const {
      caseSensitive = false,
      mode = 'contains',
      highlightTags = { pre: '<mark>', post: '</mark>' }
    } = options;

    try {
      let regex: RegExp;
      const flags = caseSensitive ? 'g' : 'gi';

      switch (mode) {
        case 'exact':
          regex = new RegExp(`\\b${this.escapeRegExp(searchTerm)}\\b`, flags);
          break;
        case 'regex':
          regex = new RegExp(searchTerm, flags);
          break;
        case 'contains':
        default:
          regex = new RegExp(this.escapeRegExp(searchTerm), flags);
          break;
      }

      return text.replace(regex, `${highlightTags.pre}$&${highlightTags.post}`);
    } catch (error) {
      // If regex is invalid, fall back to simple highlighting
      console.warn('Invalid regex pattern:', searchTerm, error);
      return text;
    }
  }

  /**
   * Get search suggestions based on existing records
   */
  static getSearchSuggestions(
    records: HistoryRecord[],
    searchTerm: string,
    maxSuggestions: number = 10
  ): string[] {
    if (!searchTerm || searchTerm.length < 2) return [];

    const suggestions = new Set<string>();
    const term = searchTerm.toLowerCase();

    // Extract suggestions from various fields
    records.forEach(record => {
      this.extractSuggestionsFromField(record.name, term, suggestions);
      this.extractSuggestionsFromField(record.model_name, term, suggestions);
      this.extractSuggestionsFromField(record.cluster_name, term, suggestions);
      this.extractSuggestionsFromField(record.image_tag, term, suggestions);
      
      if (record.description) {
        this.extractSuggestionsFromField(record.description, term, suggestions);
      }
    });

    return Array.from(suggestions)
      .sort((a, b) => {
        // Prioritize suggestions that start with the search term
        const aStarts = a.toLowerCase().startsWith(term);
        const bStarts = b.toLowerCase().startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length; // Shorter suggestions first
      })
      .slice(0, maxSuggestions);
  }

  /**
   * Get filter options from records
   */
  static getFilterOptions(records: HistoryRecord[]): {
    modelNames: string[];
    clusterNames: string[];
    statuses: string[];
    imageTags: string[];
  } {
    const modelNames = new Set<string>();
    const clusterNames = new Set<string>();
    const statuses = new Set<string>();
    const imageTags = new Set<string>();

    records.forEach(record => {
      if (record.model_name) modelNames.add(record.model_name);
      if (record.cluster_name) clusterNames.add(record.cluster_name);
      if (record.status) statuses.add(record.status);
      if (record.image_tag) imageTags.add(record.image_tag);
    });

    return {
      modelNames: Array.from(modelNames).sort(),
      clusterNames: Array.from(clusterNames).sort(),
      statuses: Array.from(statuses).sort(),
      imageTags: Array.from(imageTags).sort()
    };
  }

  /**
   * Private helper methods
   */
  private static getFieldValue(record: HistoryRecord, field: string): string | null {
    const value = (record as any)[field];
    if (value === null || value === undefined) return null;
    
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return value.join(' ');
    if (typeof value === 'object') return JSON.stringify(value);
    
    return String(value);
  }

  private static searchInField(
    field: string,
    originalValue: string,
    processedValue: string,
    searchTerm: string,
    mode: 'contains' | 'exact' | 'regex'
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];

    try {
      let regex: RegExp;
      const flags = 'gi';

      switch (mode) {
        case 'exact':
          regex = new RegExp(`\\b${this.escapeRegExp(searchTerm)}\\b`, flags);
          break;
        case 'regex':
          regex = new RegExp(searchTerm, flags);
          break;
        case 'contains':
        default:
          regex = new RegExp(this.escapeRegExp(searchTerm), flags);
          break;
      }

      let match;
      while ((match = regex.exec(processedValue)) !== null) {
        matches.push({
          field,
          value: originalValue,
          matchedText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: this.getContext(originalValue, match.index, match[0].length)
        });

        // Prevent infinite loop for zero-length matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } catch (error) {
      console.warn('Search error in field', field, ':', error);
    }

    return matches;
  }

  private static getContext(text: string, startIndex: number, matchLength: number): string {
    const contextLength = 50;
    const start = Math.max(0, startIndex - contextLength);
    const end = Math.min(text.length, startIndex + matchLength + contextLength);
    
    let context = text.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  private static extractSuggestionsFromField(
    fieldValue: string | null | undefined,
    searchTerm: string,
    suggestions: Set<string>
  ): void {
    if (!fieldValue) return;

    const value = fieldValue.toLowerCase();
    
    // Add the full field value if it contains the search term
    if (value.includes(searchTerm)) {
      suggestions.add(fieldValue);
    }

    // Extract words that contain the search term
    const words = fieldValue.split(/[\s\-_\.]+/);
    words.forEach(word => {
      if (word.toLowerCase().includes(searchTerm) && word.length > 2) {
        suggestions.add(word);
      }
    });
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default HistorySearchService;