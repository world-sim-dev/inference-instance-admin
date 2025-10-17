/**
 * History Service
 * High-level service for history management operations
 */

import { apiClient } from './api';
import type {
  HistoryRecord,
  HistoryQueryParams,
  HistoryListResponse,
  HistoryComparison,
  HistoryComparisonGroup,
  HistoryFilters
} from '../types/history';
import { OperationType } from '../types/enums';

/**
 * Service class for history-related operations
 */
export class HistoryService {
  /**
   * Get history records for a specific instance
   */
  static async getInstanceHistory(
    instanceId: number, 
    filters?: HistoryFilters,
    pagination?: { limit?: number; offset?: number }
  ): Promise<HistoryListResponse> {
    try {
      const params: HistoryQueryParams = {
        limit: pagination?.limit || 50,
        offset: pagination?.offset || 0
      };

      if (filters) {
        if (filters.operation_type && filters.operation_type.length > 0) {
          params.operation_type = filters.operation_type[0]; // Backend supports single operation_type
        }
        if (filters.date_range) {
          params.start_date = filters.date_range.start;
          params.end_date = filters.date_range.end;
        }
      }

      return await apiClient.getInstanceHistory(instanceId, params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific history record
   */
  static async getHistoryRecord(historyId: number): Promise<HistoryRecord> {
    try {
      return await apiClient.getHistoryRecord(historyId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all history records with filtering
   */
  static async getAllHistory(
    filters?: HistoryFilters & { instanceId?: number },
    pagination?: { limit?: number; offset?: number }
  ): Promise<HistoryListResponse> {
    try {
      const params: HistoryQueryParams & { original_id?: number } = {
        limit: pagination?.limit || 50,
        offset: pagination?.offset || 0
      };

      if (filters) {
        if (filters.instanceId) params.original_id = filters.instanceId;
        if (filters.operation_type && filters.operation_type.length > 0) {
          params.operation_type = filters.operation_type[0];
        }
        if (filters.date_range) {
          params.start_date = filters.date_range.start;
          params.end_date = filters.date_range.end;
        }
      }

      return await apiClient.getAllHistory(params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the latest history record for an instance
   */
  static async getLatestHistory(instanceId: number, operationType?: OperationType): Promise<HistoryRecord> {
    try {
      return await apiClient.getLatestHistory(instanceId, operationType);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get history count for an instance
   */
  static async getHistoryCount(instanceId: number, filters?: HistoryFilters): Promise<number> {
    try {
      const params: Omit<HistoryQueryParams, 'limit' | 'offset'> = {};

      if (filters) {
        if (filters.operation_type && filters.operation_type.length > 0) {
          params.operation_type = filters.operation_type[0];
        }
        if (filters.date_range) {
          params.start_date = filters.date_range.start;
          params.end_date = filters.date_range.end;
        }
      }

      const result = await apiClient.getInstanceHistoryCount(instanceId, params);
      return result.count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare two history records and return differences
   */
  static compareHistoryRecords(oldRecord: HistoryRecord, newRecord: HistoryRecord): HistoryComparison[] {
    const comparisons: HistoryComparison[] = [];
    
    // Define fields to compare (excluding metadata fields)
    const fieldsToCompare = [
      'name', 'model_name', 'model_version', 'cluster_name', 'image_tag',
      'pipeline_mode', 'quant_mode', 'distill_mode', 'm405_mode', 'fps', 'checkpoint_path', 'nonce',
      'pp', 'cp', 'tp', 'n_workers', 'replicas',
      'priorities', 'envs', 'description',
      'separate_video_encode', 'separate_video_decode', 'separate_t5_encode',
      'ephemeral', 'ephemeral_min_period_seconds', 'ephemeral_to', 'ephemeral_from',
      'vae_store_type', 't5_store_type',
      'enable_cuda_graph', 'task_concurrency', 'celery_task_concurrency',
      'status'
    ];

    fieldsToCompare.forEach(field => {
      const oldValue = (oldRecord as any)[field];
      const newValue = (newRecord as any)[field];
      
      // Deep comparison for arrays and objects
      const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
      
      comparisons.push({
        field,
        oldValue,
        newValue,
        changed
      });
    });

    return comparisons;
  }

  /**
   * Group history comparisons by category
   */
  static groupHistoryComparisons(comparisons: HistoryComparison[]): HistoryComparisonGroup[] {
    const groups: HistoryComparisonGroup[] = [
      {
        category: 'Basic Information',
        fields: comparisons.filter(c => 
          ['name', 'model_name', 'model_version', 'cluster_name', 'image_tag', 'description', 'status'].includes(c.field)
        )
      },
      {
        category: 'Pipeline Configuration',
        fields: comparisons.filter(c => 
          ['pipeline_mode', 'quant_mode', 'distill_mode', 'm405_mode', 'fps', 'checkpoint_path', 'nonce'].includes(c.field)
        )
      },
      {
        category: 'Resource Allocation',
        fields: comparisons.filter(c => 
          ['pp', 'cp', 'tp', 'n_workers', 'replicas'].includes(c.field)
        )
      },
      {
        category: 'Priority and Environment',
        fields: comparisons.filter(c => 
          ['priorities', 'envs'].includes(c.field)
        )
      },
      {
        category: 'Video Processing',
        fields: comparisons.filter(c => 
          ['separate_video_encode', 'separate_video_decode', 'separate_t5_encode'].includes(c.field)
        )
      },
      {
        category: 'Ephemeral Configuration',
        fields: comparisons.filter(c => 
          ['ephemeral', 'ephemeral_min_period_seconds', 'ephemeral_to', 'ephemeral_from'].includes(c.field)
        )
      },
      {
        category: 'Storage Configuration',
        fields: comparisons.filter(c => 
          ['vae_store_type', 't5_store_type'].includes(c.field)
        )
      },
      {
        category: 'Performance Options',
        fields: comparisons.filter(c => 
          ['enable_cuda_graph', 'task_concurrency', 'celery_task_concurrency'].includes(c.field)
        )
      }
    ];

    // Filter out empty groups
    return groups.filter(group => group.fields.length > 0);
  }

  /**
   * Format operation type for display
   */
  static formatOperationType(operationType: string): {
    label: string;
    icon: string;
    color: string;
  } {
    switch (operationType.toLowerCase()) {
      case OperationType.CREATE:
        return {
          label: 'Created',
          icon: 'plus-circle',
          color: 'success'
        };
      case OperationType.UPDATE:
        return {
          label: 'Updated',
          icon: 'edit',
          color: 'warning'
        };
      case OperationType.DELETE:
        return {
          label: 'Deleted',
          icon: 'delete',
          color: 'error'
        };
      case OperationType.ROLLBACK:
        return {
          label: 'Rolled Back',
          icon: 'undo',
          color: 'info'
        };
      default:
        return {
          label: operationType,
          icon: 'info-circle',
          color: 'default'
        };
    }
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  static getRelativeTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSeconds < 60) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return timestamp;
    }
  }

  /**
   * Get filter options for history records
   */
  static getFilterOptions(): {
    operationTypes: { value: string; label: string }[];
  } {
    return {
      operationTypes: [
        { value: OperationType.CREATE, label: 'Created' },
        { value: OperationType.UPDATE, label: 'Updated' },
        { value: OperationType.DELETE, label: 'Deleted' },
        { value: OperationType.ROLLBACK, label: 'Rolled Back' }
      ]
    };
  }
}

export default HistoryService;