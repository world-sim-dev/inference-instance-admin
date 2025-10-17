/**
 * Enumeration types matching backend models
 * Using const objects instead of enums for better TypeScript compatibility
 */

export const Status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  ERROR: 'error'
} as const;

export type Status = typeof Status[keyof typeof Status];

export const Priority = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
  VERY_LOW: 'very_low'
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ROLLBACK: 'rollback'
} as const;

export type OperationType = typeof OperationType[keyof typeof OperationType];

export const StoreType = {
  REDIS: 'redis',
  MEMORY: 'memory',
  DISK: 'disk'
} as const;

export type StoreType = typeof StoreType[keyof typeof StoreType];

export const PipelineMode = {
  DEFAULT: 'default',
  FAST: 'fast',
  QUALITY: 'quality',
  BALANCED: 'balanced'
} as const;

export type PipelineMode = typeof PipelineMode[keyof typeof PipelineMode];