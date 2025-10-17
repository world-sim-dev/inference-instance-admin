/**
 * Data utilities for transformation, serialization, and processing
 * Provides comprehensive data handling utilities for instance management
 */

import type { Instance, InstanceFormData } from '../types/instance';
import type { HistoryRecord } from '../types/history';

/**
 * Data transformation utilities
 */
export class DataTransformer {
  /**
   * Transform backend instance data to frontend format
   */
  static instanceFromBackend(backendData: any): Instance {
    return {
      id: backendData.id,
      name: backendData.name,
      model_name: backendData.model_name,
      model_version: backendData.model_version || 'latest',
      cluster_name: backendData.cluster_name,
      image_tag: backendData.image_tag,
      pipeline_mode: backendData.pipeline_mode || 'default',
      quant_mode: Boolean(backendData.quant_mode),
      distill_mode: Boolean(backendData.distill_mode),
      m405_mode: Boolean(backendData.m405_mode),
      fps: backendData.fps || null,
      checkpoint_path: backendData.checkpoint_path || null,
      nonce: backendData.nonce || null,
      pp: Number(backendData.pp) || 1,
      cp: Number(backendData.cp) || 8,
      tp: Number(backendData.tp) || 1,
      n_workers: Number(backendData.n_workers) || 1,
      replicas: Number(backendData.replicas) || 1,
      priorities: Array.isArray(backendData.priorities) 
        ? backendData.priorities 
        : [backendData.priorities || 'normal'],
      envs: Array.isArray(backendData.envs) ? backendData.envs : [],
      description: backendData.description || backendData.desc || '',
      separate_video_encode: Boolean(backendData.separate_video_encode ?? true),
      separate_video_decode: Boolean(backendData.separate_video_decode ?? true),
      separate_t5_encode: Boolean(backendData.separate_t5_encode ?? true),
      ephemeral: Boolean(backendData.ephemeral),
      ephemeral_min_period_seconds: backendData.ephemeral_min_period_seconds || null,
      ephemeral_to: backendData.ephemeral_to || '',
      ephemeral_from: backendData.ephemeral_from || '',
      vae_store_type: backendData.vae_store_type || 'redis',
      t5_store_type: backendData.t5_store_type || 'redis',
      enable_cuda_graph: Boolean(backendData.enable_cuda_graph),
      task_concurrency: Number(backendData.task_concurrency) || 1,
      celery_task_concurrency: backendData.celery_task_concurrency || null,
      status: backendData.status || 'active',
      created_at: backendData.created_at,
      updated_at: backendData.updated_at,
      // Computed property for backward compatibility
      priority: Array.isArray(backendData.priorities) 
        ? backendData.priorities[0] 
        : backendData.priorities || 'normal'
    };
  }

  /**
   * Transform frontend instance data to backend format
   */
  static instanceToBackend(instanceData: InstanceFormData): any {
    return {
      name: instanceData.name,
      model_name: instanceData.model_name,
      model_version: instanceData.model_version,
      cluster_name: instanceData.cluster_name,
      image_tag: instanceData.image_tag,
      pipeline_mode: instanceData.pipeline_mode,
      quant_mode: instanceData.quant_mode,
      distill_mode: instanceData.distill_mode,
      m405_mode: instanceData.m405_mode,
      fps: instanceData.fps,
      checkpoint_path: instanceData.checkpoint_path,
      nonce: instanceData.nonce,
      pp: instanceData.pp,
      cp: instanceData.cp,
      tp: instanceData.tp,
      n_workers: instanceData.n_workers,
      replicas: instanceData.replicas,
      priorities: instanceData.priorities,
      envs: instanceData.envs,
      desc: instanceData.description, // Backend uses 'desc' instead of 'description'
      separate_video_encode: instanceData.separate_video_encode,
      separate_video_decode: instanceData.separate_video_decode,
      separate_t5_encode: instanceData.separate_t5_encode,
      ephemeral: instanceData.ephemeral,
      ephemeral_min_period_seconds: instanceData.ephemeral_min_period_seconds,
      ephemeral_to: instanceData.ephemeral_to,
      ephemeral_from: instanceData.ephemeral_from,
      vae_store_type: instanceData.vae_store_type,
      t5_store_type: instanceData.t5_store_type,
      enable_cuda_graph: instanceData.enable_cuda_graph,
      task_concurrency: instanceData.task_concurrency,
      celery_task_concurrency: instanceData.celery_task_concurrency,
      status: instanceData.status
    };
  }

  /**
   * Transform history record from backend
   */
  static historyFromBackend(backendData: any): HistoryRecord {
    return {
      history_id: backendData.history_id,
      original_id: backendData.original_id,
      operation_type: backendData.operation_type,
      operation_timestamp: backendData.operation_timestamp,
      // Instance data snapshot
      name: backendData.name,
      model_name: backendData.model_name,
      model_version: backendData.model_version,
      cluster_name: backendData.cluster_name,
      image_tag: backendData.image_tag,
      pipeline_mode: backendData.pipeline_mode,
      quant_mode: Boolean(backendData.quant_mode),
      distill_mode: Boolean(backendData.distill_mode),
      m405_mode: Boolean(backendData.m405_mode),
      fps: backendData.fps,
      checkpoint_path: backendData.checkpoint_path,
      nonce: backendData.nonce,
      pp: Number(backendData.pp),
      cp: Number(backendData.cp),
      tp: Number(backendData.tp),
      n_workers: Number(backendData.n_workers),
      replicas: Number(backendData.replicas),
      priorities: Array.isArray(backendData.priorities) 
        ? backendData.priorities 
        : [backendData.priorities || 'normal'],
      envs: Array.isArray(backendData.envs) ? backendData.envs : [],
      description: backendData.description || backendData.desc || '',
      separate_video_encode: Boolean(backendData.separate_video_encode ?? true),
      separate_video_decode: Boolean(backendData.separate_video_decode ?? true),
      separate_t5_encode: Boolean(backendData.separate_t5_encode ?? true),
      ephemeral: Boolean(backendData.ephemeral),
      ephemeral_min_period_seconds: backendData.ephemeral_min_period_seconds,
      ephemeral_to: backendData.ephemeral_to || '',
      ephemeral_from: backendData.ephemeral_from || '',
      vae_store_type: backendData.vae_store_type || 'redis',
      t5_store_type: backendData.t5_store_type || 'redis',
      enable_cuda_graph: Boolean(backendData.enable_cuda_graph),
      task_concurrency: Number(backendData.task_concurrency) || 1,
      celery_task_concurrency: backendData.celery_task_concurrency,
      status: backendData.status || 'active'
    };
  }
}

/**
 * Data serialization utilities
 */
export class DataSerializer {
  /**
   * Serialize data for local storage
   */
  static serialize<T>(data: T): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error serializing data:', error);
      return '{}';
    }
  }

  /**
   * Deserialize data from local storage
   */
  static deserialize<T>(serializedData: string, defaultValue: T): T {
    try {
      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error deserializing data:', error);
      return defaultValue;
    }
  }

  /**
   * Serialize form data for draft saving
   */
  static serializeFormData(formData: Partial<InstanceFormData>): string {
    const cleanData = { ...formData };
    
    // Remove empty values
    Object.keys(cleanData).forEach(key => {
      const value = (cleanData as any)[key];
      if (value === undefined || value === null || value === '') {
        delete (cleanData as any)[key];
      }
    });
    
    return this.serialize(cleanData);
  }

  /**
   * Deserialize form data from draft
   */
  static deserializeFormData(serializedData: string): Partial<InstanceFormData> {
    return this.deserialize(serializedData, {});
  }

  /**
   * Export instances to JSON
   */
  static exportInstances(instances: Instance[]): string {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      count: instances.length,
      instances: instances.map(instance => ({
        ...instance,
        // Remove sensitive or computed fields
        id: undefined,
        created_at: undefined,
        updated_at: undefined
      }))
    };
    
    return this.serialize(exportData);
  }

  /**
   * Import instances from JSON
   */
  static importInstances(serializedData: string): InstanceFormData[] {
    try {
      const importData = this.deserialize(serializedData, { instances: [] });
      
      if (!importData.instances || !Array.isArray(importData.instances)) {
        throw new Error('Invalid import data format');
      }
      
      return importData.instances.map((instance: any) => ({
        ...instance,
        // Ensure required fields have default values
        model_version: instance.model_version || 'latest',
        pipeline_mode: instance.pipeline_mode || 'default',
        pp: instance.pp || 1,
        cp: instance.cp || 8,
        tp: instance.tp || 1,
        n_workers: instance.n_workers || 1,
        replicas: instance.replicas || 1,
        priorities: instance.priorities || ['normal'],
        envs: instance.envs || [],
        description: instance.description || '',
        status: instance.status || 'active'
      }));
    } catch (error) {
      console.error('Error importing instances:', error);
      throw new Error('导入数据格式错误');
    }
  }
}

/**
 * Data processing utilities
 */
export class DataProcessor {
  /**
   * Sort instances by multiple criteria
   */
  static sortInstances(
    instances: Instance[], 
    sortBy: string = 'updated_at', 
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Instance[] {
    return [...instances].sort((a, b) => {
      let aValue: any = (a as any)[sortBy];
      let bValue: any = (b as any)[sortBy];
      
      // Handle date strings
      if (sortBy.includes('_at')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Filter instances by multiple criteria
   */
  static filterInstances(
    instances: Instance[],
    filters: {
      search?: string;
      status?: string[];
      cluster_name?: string[];
      model_name?: string[];
      ephemeral?: boolean;
      priority?: string[];
    }
  ): Instance[] {
    return instances.filter(instance => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          instance.name,
          instance.model_name,
          instance.cluster_name,
          instance.description,
          instance.status
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(instance.status)) {
          return false;
        }
      }
      
      // Cluster filter
      if (filters.cluster_name && filters.cluster_name.length > 0) {
        if (!filters.cluster_name.includes(instance.cluster_name)) {
          return false;
        }
      }
      
      // Model filter
      if (filters.model_name && filters.model_name.length > 0) {
        if (!filters.model_name.includes(instance.model_name)) {
          return false;
        }
      }
      
      // Ephemeral filter
      if (filters.ephemeral !== undefined) {
        if (instance.ephemeral !== filters.ephemeral) {
          return false;
        }
      }
      
      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        const instancePriorities = Array.isArray(instance.priorities) 
          ? instance.priorities 
          : [instance.priorities || 'normal'];
        
        const hasMatchingPriority = filters.priority.some(priority => 
          instancePriorities.includes(priority)
        );
        
        if (!hasMatchingPriority) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Group instances by field
   */
  static groupInstances(
    instances: Instance[], 
    groupBy: keyof Instance
  ): Record<string, Instance[]> {
    const groups: Record<string, Instance[]> = {};
    
    instances.forEach(instance => {
      const groupKey = String(instance[groupBy]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(instance);
    });
    
    return groups;
  }

  /**
   * Get instance statistics
   */
  static getInstanceStats(instances: Instance[]) {
    const stats = {
      total: instances.length,
      byStatus: {} as Record<string, number>,
      byCluster: {} as Record<string, number>,
      byModel: {} as Record<string, number>,
      ephemeral: 0,
      totalResources: {
        pp: 0,
        cp: 0,
        tp: 0,
        workers: 0,
        replicas: 0
      }
    };
    
    instances.forEach(instance => {
      // Status stats
      stats.byStatus[instance.status] = (stats.byStatus[instance.status] || 0) + 1;
      
      // Cluster stats
      stats.byCluster[instance.cluster_name] = (stats.byCluster[instance.cluster_name] || 0) + 1;
      
      // Model stats
      stats.byModel[instance.model_name] = (stats.byModel[instance.model_name] || 0) + 1;
      
      // Ephemeral count
      if (instance.ephemeral) {
        stats.ephemeral++;
      }
      
      // Resource totals
      stats.totalResources.pp += instance.pp;
      stats.totalResources.cp += instance.cp;
      stats.totalResources.tp += instance.tp;
      stats.totalResources.workers += instance.n_workers;
      stats.totalResources.replicas += instance.replicas;
    });
    
    return stats;
  }

  /**
   * Validate instance data integrity
   */
  static validateInstanceData(instance: Instance): string[] {
    const errors: string[] = [];
    
    // Required fields
    if (!instance.name) errors.push('实例名称不能为空');
    if (!instance.model_name) errors.push('模型名称不能为空');
    if (!instance.cluster_name) errors.push('集群名称不能为空');
    if (!instance.image_tag) errors.push('镜像标签不能为空');
    
    // Numeric validations
    if (instance.pp < 1) errors.push('管道并行度必须大于0');
    if (instance.cp < 1) errors.push('上下文并行度必须大于0');
    if (instance.tp < 1) errors.push('张量并行度必须大于0');
    if (instance.n_workers < 1) errors.push('工作进程数必须大于0');
    if (instance.replicas < 1) errors.push('副本数必须大于0');
    if (instance.task_concurrency < 1) errors.push('任务并发数必须大于0');
    
    // Array validations
    if (!Array.isArray(instance.priorities) || instance.priorities.length === 0) {
      errors.push('至少需要一个优先级');
    }
    
    if (!Array.isArray(instance.envs)) {
      errors.push('环境变量必须是数组格式');
    }
    
    // Date validations
    if (instance.ephemeral) {
      if (!instance.ephemeral_from || !instance.ephemeral_to) {
        errors.push('临时实例必须设置开始和结束时间');
      }
      
      if (instance.ephemeral_from && instance.ephemeral_to) {
        const fromDate = new Date(instance.ephemeral_from);
        const toDate = new Date(instance.ephemeral_to);
        
        if (fromDate >= toDate) {
          errors.push('结束时间必须晚于开始时间');
        }
      }
    }
    
    return errors;
  }

  /**
   * Calculate instance resource usage
   */
  static calculateResourceUsage(instance: Instance) {
    return {
      totalParallelism: instance.pp * instance.cp * instance.tp,
      totalWorkers: instance.n_workers * instance.replicas,
      estimatedMemoryUsage: instance.cp * instance.tp * 2, // Rough estimate in GB
      estimatedGpuUsage: instance.tp * instance.replicas
    };
  }

  /**
   * Generate instance summary
   */
  static generateInstanceSummary(instance: Instance): string {
    const resources = this.calculateResourceUsage(instance);
    
    return [
      `模型: ${instance.model_name}@${instance.model_version}`,
      `集群: ${instance.cluster_name}`,
      `并行度: PP=${instance.pp}, CP=${instance.cp}, TP=${instance.tp}`,
      `工作进程: ${instance.n_workers} × ${instance.replicas} = ${resources.totalWorkers}`,
      `状态: ${instance.status}`,
      instance.ephemeral ? '临时实例' : '持久实例'
    ].join(' | ');
  }
}

/**
 * Date and time formatting utilities
 */
export class DateFormatter {
  /**
   * Format timestamp to readable string
   */
  static formatTimestamp(timestamp: string | Date): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return String(timestamp);
    }
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  static getRelativeTime(timestamp: string | Date): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffSeconds < 60) {
        return '刚刚';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else if (diffWeeks < 4) {
        return `${diffWeeks}周前`;
      } else if (diffMonths < 12) {
        return `${diffMonths}个月前`;
      } else {
        return `${diffYears}年前`;
      }
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return '未知时间';
    }
  }

  /**
   * Format duration in seconds to readable string
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
    } else {
      const days = Math.floor(seconds / 86400);
      const remainingHours = Math.floor((seconds % 86400) / 3600);
      return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
    }
  }
}

// Export commonly used functions
export const instanceFromBackend = DataTransformer.instanceFromBackend;
export const instanceToBackend = DataTransformer.instanceToBackend;
export const historyFromBackend = DataTransformer.historyFromBackend;

export const serialize = DataSerializer.serialize;
export const deserialize = DataSerializer.deserialize;
export const serializeFormData = DataSerializer.serializeFormData;
export const deserializeFormData = DataSerializer.deserializeFormData;
export const exportInstances = DataSerializer.exportInstances;
export const importInstances = DataSerializer.importInstances;

export const sortInstances = DataProcessor.sortInstances;
export const filterInstances = DataProcessor.filterInstances;
export const groupInstances = DataProcessor.groupInstances;
export const getInstanceStats = DataProcessor.getInstanceStats;
export const validateInstanceData = DataProcessor.validateInstanceData;
export const calculateResourceUsage = DataProcessor.calculateResourceUsage;
export const generateInstanceSummary = DataProcessor.generateInstanceSummary;

export const formatTimestamp = DateFormatter.formatTimestamp;
export const getRelativeTime = DateFormatter.getRelativeTime;
export const formatDuration = DateFormatter.formatDuration;