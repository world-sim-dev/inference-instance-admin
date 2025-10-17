/**
 * Instance Service
 * High-level service for instance management operations
 */

import { apiClient } from './api';
import type {
  Instance,
  CreateInstanceData,
  UpdateInstanceData,
  InstanceQueryParams,
  InstanceFilters
} from '../types/instance';

/**
 * Service class for instance-related operations
 */
export class InstanceService {
  /**
   * Get all instances with optional filtering
   */
  static async getInstances(filters?: InstanceFilters): Promise<Instance[]> {
    try {
      const params: InstanceQueryParams = {};
      
      if (filters) {
        if (filters.search) params.search = filters.search;
        if (filters.model_name && filters.model_name.length > 0) {
          params.model_name = filters.model_name[0]; // Backend supports single model_name
        }
        if (filters.cluster_name && filters.cluster_name.length > 0) {
          params.cluster_name = filters.cluster_name[0]; // Backend supports single cluster_name
        }
        if (filters.status && filters.status.length > 0) {
          // Handle status filtering
          if (filters.status.includes('active')) params.active_only = true;
          if (filters.status.includes('inactive')) params.inactive_only = true;
        }
        if (filters.ephemeral !== null && filters.ephemeral !== undefined) {
          params.ephemeral_only = filters.ephemeral;
        }
      }

      return await apiClient.getInstances(params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single instance by ID
   */
  static async getInstance(id: number): Promise<Instance> {
    try {
      return await apiClient.getInstance(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single instance by name
   */
  static async getInstanceByName(name: string): Promise<Instance> {
    try {
      return await apiClient.getInstanceByName(name);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new instance
   */
  static async createInstance(data: CreateInstanceData): Promise<Instance> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Instance name is required');
      }
      if (!data.model_name?.trim()) {
        throw new Error('Model name is required');
      }
      if (!data.cluster_name?.trim()) {
        throw new Error('Cluster name is required');
      }
      if (!data.image_tag?.trim()) {
        throw new Error('Image tag is required');
      }

      return await apiClient.createInstance(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing instance
   */
  static async updateInstance(id: number, data: UpdateInstanceData): Promise<Instance> {
    try {
      // Validate that at least one field is being updated
      const hasUpdates = Object.values(data).some(value => value !== undefined);
      if (!hasUpdates) {
        throw new Error('At least one field must be provided for update');
      }

      return await apiClient.updateInstance(id, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an instance
   */
  static async deleteInstance(id: number): Promise<void> {
    try {
      await apiClient.deleteInstance(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if instance name is available
   */
  static async isNameAvailable(name: string, excludeId?: number): Promise<boolean> {
    try {
      const instances = await apiClient.getInstances({ search: name });
      
      // Check if any instance has the exact name
      const existingInstance = instances.find(instance => 
        instance.name.toLowerCase() === name.toLowerCase()
      );
      
      // If no existing instance found, name is available
      if (!existingInstance) return true;
      
      // If we're excluding an ID (for updates), check if it's the same instance
      if (excludeId && existingInstance.id === excludeId) return true;
      
      return false;
    } catch (error) {
      // If error occurs, assume name is not available for safety
      console.error('Error checking name availability:', error);
      return false;
    }
  }

  /**
   * Get unique values for filtering
   */
  static async getFilterOptions(): Promise<{
    modelNames: string[];
    clusterNames: string[];
    statuses: string[];
  }> {
    try {
      const instances = await apiClient.getInstances();
      
      const modelNames = [...new Set(instances.map(i => i.model_name))].sort();
      const clusterNames = [...new Set(instances.map(i => i.cluster_name))].sort();
      const statuses = [...new Set(instances.map(i => i.status))].sort();
      
      return {
        modelNames,
        clusterNames,
        statuses
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        modelNames: [],
        clusterNames: [],
        statuses: []
      };
    }
  }

  /**
   * Validate instance data
   */
  static validateInstanceData(data: Partial<CreateInstanceData | UpdateInstanceData>): string[] {
    const errors: string[] = [];

    // Name validation
    if (data.name !== undefined) {
      if (!data.name?.trim()) {
        errors.push('Instance name is required');
      } else if (data.name.length > 255) {
        errors.push('Instance name must be less than 255 characters');
      }
    }

    // Model name validation
    if (data.model_name !== undefined) {
      if (!data.model_name?.trim()) {
        errors.push('Model name is required');
      } else if (data.model_name.length > 255) {
        errors.push('Model name must be less than 255 characters');
      }
    }

    // Cluster name validation
    if (data.cluster_name !== undefined) {
      if (!data.cluster_name?.trim()) {
        errors.push('Cluster name is required');
      } else if (data.cluster_name.length > 255) {
        errors.push('Cluster name must be less than 255 characters');
      }
    }

    // Image tag validation
    if (data.image_tag !== undefined) {
      if (!data.image_tag?.trim()) {
        errors.push('Image tag is required');
      } else if (data.image_tag.length > 255) {
        errors.push('Image tag must be less than 255 characters');
      }
    }

    // Resource allocation validation
    if (data.pp !== undefined && (data.pp < 1 || data.pp > 16)) {
      errors.push('Pipeline parallelism must be between 1 and 16');
    }
    if (data.cp !== undefined && (data.cp < 1 || data.cp > 64)) {
      errors.push('Context parallelism must be between 1 and 64');
    }
    if (data.tp !== undefined && (data.tp < 1 || data.tp > 16)) {
      errors.push('Tensor parallelism must be between 1 and 16');
    }
    if (data.n_workers !== undefined && (data.n_workers < 1 || data.n_workers > 100)) {
      errors.push('Number of workers must be between 1 and 100');
    }
    if (data.replicas !== undefined && (data.replicas < 1 || data.replicas > 100)) {
      errors.push('Number of replicas must be between 1 and 100');
    }

    // Task concurrency validation
    if (data.task_concurrency !== undefined && data.task_concurrency < 1) {
      errors.push('Task concurrency must be at least 1');
    }

    // Ephemeral configuration validation
    if (data.ephemeral_min_period_seconds !== undefined && data.ephemeral_min_period_seconds !== null && data.ephemeral_min_period_seconds < 0) {
      errors.push('Ephemeral minimum period must be non-negative');
    }

    // Description length validation
    if (data.description !== undefined && data.description.length > 1024) {
      errors.push('Description must be less than 1024 characters');
    }

    return errors;
  }
}

export default InstanceService;