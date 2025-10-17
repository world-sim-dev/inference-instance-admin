/**
 * Form Utilities
 * Validation and utility functions for forms
 */

import type { InstanceFormData } from '../types/instance';
import { Priority } from '../types/enums';

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Environment variable interface
 */
export interface EnvironmentVariable {
  name: string;
  value: any;
}

/**
 * Validate instance name format
 */
export const validateInstanceName = (name: string): boolean => {
  if (!name || name.length === 0 || name.length > 100) {
    return false;
  }
  
  // Only allow alphanumeric characters, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(name);
};

/**
 * Validate time format (HH:MM)
 */
export const validateTimeFormat = (time: string): boolean => {
  if (!time) return false;
  
  const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timePattern.test(time);
};

/**
 * Validate time range
 */
export const validateTimeRange = (
  fromTime: string, 
  toTime: string, 
  minDurationSeconds?: number
): boolean => {
  if (!validateTimeFormat(fromTime) || !validateTimeFormat(toTime)) {
    return false;
  }
  
  const [fromHour, fromMin] = fromTime.split(':').map(Number);
  const [toHour, toMin] = toTime.split(':').map(Number);
  
  const fromMinutes = fromHour * 60 + fromMin;
  const toMinutes = toHour * 60 + toMin;
  
  if (toMinutes <= fromMinutes) {
    return false;
  }
  
  if (minDurationSeconds) {
    const durationMinutes = toMinutes - fromMinutes;
    const minDurationMinutes = minDurationSeconds / 60;
    
    if (durationMinutes < minDurationMinutes) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validate resource allocation (PP × CP × TP)
 */
export const validateResourceAllocation = (
  pp: number, 
  cp: number, 
  tp: number, 
  maxGpus: number = 32
): boolean => {
  if (pp <= 0 || cp <= 0 || tp <= 0) {
    return false;
  }
  
  const totalGpus = pp * cp * tp;
  return totalGpus <= maxGpus;
};

/**
 * Validate priorities array
 */
export const validatePriorities = (priorities: any): boolean => {
  if (!Array.isArray(priorities) || priorities.length === 0) {
    return false;
  }
  
  const validPriorities = Object.values(Priority);
  return priorities.every(priority => validPriorities.includes(priority));
};

/**
 * Validate environment variables array
 */
export const validateEnvironmentVariables = (envs: any): boolean => {
  if (!Array.isArray(envs)) {
    return false;
  }
  
  // Empty array is valid
  if (envs.length === 0) {
    return true;
  }
  
  // Check each environment variable
  for (const env of envs) {
    if (!env.name || typeof env.name !== 'string' || env.name.trim() === '') {
      return false;
    }
    
    if (env.value === null || env.value === undefined) {
      return false;
    }
  }
  
  // Check for duplicate names
  const names = envs.map(env => env.name);
  const uniqueNames = new Set(names);
  
  return names.length === uniqueNames.size;
};

/**
 * Serialize form data for API submission
 */
export const serializeFormData = (formData: InstanceFormData): InstanceFormData => {
  const serialized = { ...formData };
  
  // Ensure arrays are properly formatted
  if (!Array.isArray(serialized.priorities)) {
    serialized.priorities = [];
  }
  if (!Array.isArray(serialized.envs)) {
    serialized.envs = [];
  }
  
  // Convert null/undefined numeric values
  if (serialized.fps === null || serialized.fps === undefined) {
    serialized.fps = null;
  }
  if (serialized.celery_task_concurrency === null || serialized.celery_task_concurrency === undefined) {
    serialized.celery_task_concurrency = null;
  }
  if (serialized.ephemeral_min_period_seconds === null || serialized.ephemeral_min_period_seconds === undefined) {
    serialized.ephemeral_min_period_seconds = null;
  }
  
  // Clean up ephemeral fields if not ephemeral
  if (!serialized.ephemeral) {
    serialized.ephemeral_min_period_seconds = null;
    serialized.ephemeral_from = '';
    serialized.ephemeral_to = '';
  }
  
  return serialized;
};

/**
 * Deserialize instance data for form initialization
 */
export const deserializeFormData = (instanceData: InstanceFormData): InstanceFormData => {
  const deserialized = { ...instanceData };
  
  // Ensure priorities is an array
  if (!Array.isArray(deserialized.priorities)) {
    deserialized.priorities = [];
  }
  
  // Ensure envs is an array
  if (!Array.isArray(deserialized.envs)) {
    deserialized.envs = [];
  }
  
  // Handle null values for optional numeric fields
  if (deserialized.fps === null) {
    deserialized.fps = undefined;
  }
  if (deserialized.celery_task_concurrency === null) {
    deserialized.celery_task_concurrency = undefined;
  }
  if (deserialized.ephemeral_min_period_seconds === null) {
    deserialized.ephemeral_min_period_seconds = undefined;
  }
  
  return deserialized;
};

/**
 * Get field error from validation results
 */
export const getFieldError = (errors: ValidationError[], fieldName: string): string | undefined => {
  const error = errors.find(err => err.field === fieldName);
  return error?.message;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(error => error.message).join('\n');
};

/**
 * Comprehensive form data validation
 */
export const validateFormData = (formData: InstanceFormData): string[] => {
  const errors: string[] = [];
  
  // Validate instance name
  if (!validateInstanceName(formData.name)) {
    errors.push('实例名称格式无效，只能包含字母、数字、下划线和连字符，长度不超过100个字符');
  }
  
  // Validate resource allocation
  if (!validateResourceAllocation(formData.pp, formData.cp, formData.tp)) {
    errors.push('资源分配无效，PP、CP、TP必须大于0，且总GPU数量不能超过32');
  }
  
  // Validate priorities
  if (!validatePriorities(formData.priorities)) {
    errors.push('优先级设置无效');
  }
  
  // Validate environment variables
  if (!validateEnvironmentVariables(formData.envs)) {
    errors.push('环境变量设置无效，变量名不能为空且不能重复');
  }
  
  // Validate ephemeral settings
  if (formData.ephemeral) {
    if (!formData.ephemeral_from || !formData.ephemeral_to) {
      errors.push('临时实例必须设置开始和结束时间');
    } else if (!validateTimeRange(formData.ephemeral_from, formData.ephemeral_to)) {
      errors.push('临时实例时间范围无效');
    }
    
    if (formData.ephemeral_min_period_seconds && formData.ephemeral_min_period_seconds < 60) {
      errors.push('临时实例最小持续时间不能少于60秒');
    }
  }
  
  // Validate optional numeric fields
  if (formData.fps !== undefined && formData.fps !== null && formData.fps <= 0) {
    errors.push('FPS必须大于0');
  }
  
  if (formData.celery_task_concurrency !== undefined && 
      formData.celery_task_concurrency !== null && 
      formData.celery_task_concurrency <= 0) {
    errors.push('Celery任务并发数必须大于0');
  }
  
  return errors;
};