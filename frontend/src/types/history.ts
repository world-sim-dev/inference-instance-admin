/**
 * TypeScript interfaces for InferenceInstanceHistory
 * Maps to backend models.py InferenceInstanceHistory and schemas.py
 */

import { OperationType } from './enums';

/**
 * History record interface matching backend InferenceInstanceHistory model
 */
export interface HistoryRecord {
  // History metadata
  history_id: number;
  original_id: number;
  operation_type: string;
  operation_timestamp: string;
  
  // Snapshot of instance fields at time of operation
  name: string;
  model_name: string;
  model_version?: string | null;
  cluster_name: string;
  image_tag: string;
  
  // Pipeline configuration
  pipeline_mode?: string | null;
  quant_mode?: boolean | null;
  distill_mode?: boolean | null;
  m405_mode?: boolean | null;
  fps?: number | null;
  checkpoint_path?: string | null;
  nonce?: string | null;
  
  // Resource allocation
  pp?: number | null;
  cp?: number | null;
  tp?: number | null;
  n_workers?: number | null;
  replicas?: number | null;
  
  // Priority and environment
  priorities?: string[] | null;
  envs?: any[] | null;
  description?: string | null;
  
  // Video processing options
  separate_video_encode?: boolean | null;
  separate_video_decode?: boolean | null;
  separate_t5_encode?: boolean | null;
  
  // Ephemeral instance configuration
  ephemeral?: boolean | null;
  ephemeral_min_period_seconds?: number | null;
  ephemeral_to?: string | null;
  ephemeral_from?: string | null;
  
  // Storage configuration
  vae_store_type?: string | null;
  t5_store_type?: string | null;
  
  // Performance options
  enable_cuda_graph?: boolean | null;
  task_concurrency?: number | null;
  celery_task_concurrency?: number | null;
  
  // Status and timestamps from original instance
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  
  // Computed properties for backward compatibility
  priority?: string | null;
}

/**
 * Query parameters for fetching history records
 */
export interface HistoryQueryParams {
  limit?: number;
  offset?: number;
  operation_type?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Response interface for paginated history
 */
export interface HistoryListResponse {
  total_count: number;
  history_records: HistoryRecord[];
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Interface for comparing field differences between history records
 */
export interface HistoryComparison {
  field: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}

/**
 * Interface for grouped history comparisons
 */
export interface HistoryComparisonGroup {
  category: string;
  fields: HistoryComparison[];
}

/**
 * History filter options
 */
export interface HistoryFilters {
  operation_type?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

/**
 * Utility type for history operation display
 */
export interface HistoryOperationDisplay {
  type: OperationType;
  label: string;
  icon: string;
  color: string;
}