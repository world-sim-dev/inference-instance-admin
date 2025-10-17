/**
 * TypeScript interfaces for InferenceInstance
 * Maps to backend models.py InferenceInstance and schemas.py
 */

import { Status, Priority, StoreType, PipelineMode } from './enums';

/**
 * Base interface for InferenceInstance matching backend model
 */
export interface Instance {
  // Primary key
  id: number;
  
  // Core identification
  name: string;
  model_name: string;
  model_version: string;
  
  // Pipeline configuration
  pipeline_mode: string;
  quant_mode: boolean;
  distill_mode: boolean;
  m405_mode: boolean;
  fps?: number | null;
  checkpoint_path?: string | null;
  
  // Infrastructure
  cluster_name: string;
  image_tag: string;
  nonce?: string | null;
  
  // Resource allocation
  pp: number; // Pipeline parallelism
  cp: number; // Context parallelism
  tp: number; // Tensor parallelism
  n_workers: number;
  replicas: number;
  
  // Priority and environment
  priorities: string[];
  envs: any[] | Record<string, any>;
  description: string;
  
  // Video processing options
  separate_video_encode: boolean;
  separate_video_decode: boolean;
  separate_t5_encode: boolean;
  
  // Ephemeral instance configuration
  ephemeral: boolean;
  ephemeral_min_period_seconds?: number | null;
  ephemeral_to: string;
  ephemeral_from: string;
  
  // Storage configuration
  vae_store_type: string;
  t5_store_type: string;
  
  // Performance options
  enable_cuda_graph: boolean;
  task_concurrency: number;
  celery_task_concurrency?: number | null;
  
  // Status and timestamps
  status: string;
  created_at: string;
  updated_at: string;
  
  // Computed properties for backward compatibility
  priority?: string;
}

/**
 * Form data interface for creating/editing instances
 * Excludes id, timestamps, and computed fields
 */
export interface InstanceFormData {
  // Core identification
  name: string;
  model_name: string;
  model_version: string;
  
  // Pipeline configuration
  pipeline_mode: string;
  quant_mode: boolean;
  distill_mode: boolean;
  m405_mode: boolean;
  fps?: number | null;
  checkpoint_path?: string | null;
  
  // Infrastructure
  cluster_name: string;
  image_tag: string;
  nonce?: string | null;
  
  // Resource allocation
  pp: number;
  cp: number;
  tp: number;
  n_workers: number;
  replicas: number;
  
  // Priority and environment
  priorities: string[];
  envs: any[] | Record<string, any>;
  description: string;
  
  // Video processing options
  separate_video_encode: boolean;
  separate_video_decode: boolean;
  separate_t5_encode: boolean;
  
  // Ephemeral instance configuration
  ephemeral: boolean;
  ephemeral_min_period_seconds?: number | null;
  ephemeral_to: string;
  ephemeral_from: string;
  
  // Storage configuration
  vae_store_type: string;
  t5_store_type: string;
  
  // Performance options
  enable_cuda_graph: boolean;
  task_concurrency: number;
  celery_task_concurrency?: number | null;
  
  // Status
  status: string;
}

/**
 * Interface for creating new instances
 */
export interface CreateInstanceData extends InstanceFormData {}

/**
 * Interface for updating existing instances
 * All fields are optional for partial updates
 */
export interface UpdateInstanceData {
  // Core identification
  name?: string;
  model_name?: string;
  model_version?: string;
  
  // Pipeline configuration
  pipeline_mode?: string;
  quant_mode?: boolean;
  distill_mode?: boolean;
  m405_mode?: boolean;
  fps?: number | null;
  checkpoint_path?: string | null;
  
  // Infrastructure
  cluster_name?: string;
  image_tag?: string;
  nonce?: string | null;
  
  // Resource allocation
  pp?: number;
  cp?: number;
  tp?: number;
  n_workers?: number;
  replicas?: number;
  
  // Priority and environment
  priorities?: string[];
  envs?: any[] | Record<string, any>;
  description?: string;
  
  // Video processing options
  separate_video_encode?: boolean;
  separate_video_decode?: boolean;
  separate_t5_encode?: boolean;
  
  // Ephemeral instance configuration
  ephemeral?: boolean;
  ephemeral_min_period_seconds?: number | null;
  ephemeral_to?: string;
  ephemeral_from?: string;
  
  // Storage configuration
  vae_store_type?: string;
  t5_store_type?: string;
  
  // Performance options
  enable_cuda_graph?: boolean;
  task_concurrency?: number;
  celery_task_concurrency?: number | null;
  
  // Status
  status?: string;
  
  // Backward compatibility
  priority?: string;
}

/**
 * Query parameters for fetching instances
 */
export interface InstanceQueryParams {
  model_name?: string;
  cluster_name?: string;
  active_only?: boolean;
  inactive_only?: boolean;
  ephemeral_only?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Filter options for instance list
 */
export interface InstanceFilters {
  status?: string[];
  cluster_name?: string[];
  model_name?: string[];
  ephemeral?: boolean | null;
  search?: string;
}

/**
 * Pagination state
 */
export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

/**
 * Default values for new instances
 */
export const DEFAULT_INSTANCE_VALUES: Partial<InstanceFormData> = {
  model_version: 'latest',
  pipeline_mode: PipelineMode.DEFAULT,
  quant_mode: false,
  distill_mode: false,
  m405_mode: false,
  fps: null,
  checkpoint_path: null,
  nonce: null,
  pp: 1,
  cp: 8,
  tp: 1,
  n_workers: 1,
  replicas: 1,
  priorities: [Priority.HIGH, Priority.NORMAL, Priority.LOW, Priority.VERY_LOW],
  envs: [],
  description: '',
  separate_video_encode: true,
  separate_video_decode: true,
  separate_t5_encode: true,
  ephemeral: false,
  ephemeral_min_period_seconds: 300,
  ephemeral_to: '',
  ephemeral_from: '',
  vae_store_type: StoreType.REDIS,
  t5_store_type: StoreType.REDIS,
  enable_cuda_graph: false,
  task_concurrency: 1,
  celery_task_concurrency: null,
  status: Status.ACTIVE
};