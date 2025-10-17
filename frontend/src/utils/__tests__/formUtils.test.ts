/**
 * Form Utilities Tests
 * Tests for form validation and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateInstanceName,
  validateTimeFormat,
  validateTimeRange,
  validateResourceAllocation,
  validatePriorities,
  validateEnvironmentVariables,
  serializeFormData,
  deserializeFormData,
  getFieldError,
  formatValidationErrors,
  validateFormData,
} from '../formUtils';
import { createMockCreateInstanceData } from '../../test/utils';
import { Priority } from '../../types/enums';

describe('formUtils', () => {
  describe('validateInstanceName', () => {
    it('should validate correct instance names', () => {
      expect(validateInstanceName('valid-name')).toBe(true);
      expect(validateInstanceName('valid_name')).toBe(true);
      expect(validateInstanceName('ValidName123')).toBe(true);
      expect(validateInstanceName('test-instance-1')).toBe(true);
    });

    it('should reject invalid instance names', () => {
      expect(validateInstanceName('')).toBe(false);
      expect(validateInstanceName('invalid name')).toBe(false);
      expect(validateInstanceName('invalid@name')).toBe(false);
      expect(validateInstanceName('invalid.name')).toBe(false);
      expect(validateInstanceName('invalid/name')).toBe(false);
      expect(validateInstanceName('a'.repeat(101))).toBe(false); // Too long
    });

    it('should handle edge cases', () => {
      expect(validateInstanceName('a')).toBe(true); // Minimum length
      expect(validateInstanceName('a'.repeat(100))).toBe(true); // Maximum length
      expect(validateInstanceName('123')).toBe(true); // Numbers only
      expect(validateInstanceName('_')).toBe(true); // Underscore only
      expect(validateInstanceName('-')).toBe(true); // Hyphen only
    });
  });

  describe('validateTimeFormat', () => {
    it('should validate correct time formats', () => {
      expect(validateTimeFormat('00:00')).toBe(true);
      expect(validateTimeFormat('12:30')).toBe(true);
      expect(validateTimeFormat('23:59')).toBe(true);
      expect(validateTimeFormat('09:15')).toBe(true);
    });

    it('should reject invalid time formats', () => {
      expect(validateTimeFormat('24:00')).toBe(false);
      expect(validateTimeFormat('12:60')).toBe(false);
      expect(validateTimeFormat('1:30')).toBe(false); // Single digit hour
      expect(validateTimeFormat('12:5')).toBe(false); // Single digit minute
      expect(validateTimeFormat('12')).toBe(false); // Missing minutes
      expect(validateTimeFormat('12:30:00')).toBe(false); // With seconds
      expect(validateTimeFormat('')).toBe(false);
      expect(validateTimeFormat('invalid')).toBe(false);
    });
  });

  describe('validateTimeRange', () => {
    it('should validate correct time ranges', () => {
      expect(validateTimeRange('09:00', '17:00')).toBe(true);
      expect(validateTimeRange('00:00', '23:59')).toBe(true);
      expect(validateTimeRange('12:00', '12:01')).toBe(true);
    });

    it('should reject invalid time ranges', () => {
      expect(validateTimeRange('17:00', '09:00')).toBe(false); // End before start
      expect(validateTimeRange('12:00', '12:00')).toBe(false); // Same time
      expect(validateTimeRange('23:59', '00:00')).toBe(false); // Overnight (not supported)
    });

    it('should handle invalid time formats in range validation', () => {
      expect(validateTimeRange('invalid', '17:00')).toBe(false);
      expect(validateTimeRange('09:00', 'invalid')).toBe(false);
      expect(validateTimeRange('invalid', 'invalid')).toBe(false);
    });

    it('should validate minimum duration', () => {
      expect(validateTimeRange('09:00', '09:05', 300)).toBe(true); // 5 minutes >= 5 minutes
      expect(validateTimeRange('09:00', '09:04', 300)).toBe(false); // 4 minutes < 5 minutes
      expect(validateTimeRange('09:00', '10:00', 3600)).toBe(true); // 1 hour >= 1 hour
      expect(validateTimeRange('09:00', '09:59', 3600)).toBe(false); // 59 minutes < 1 hour
    });
  });

  describe('validateResourceAllocation', () => {
    it('should validate reasonable resource allocations', () => {
      expect(validateResourceAllocation(1, 1, 1)).toBe(true);
      expect(validateResourceAllocation(2, 2, 2)).toBe(true);
      expect(validateResourceAllocation(4, 1, 2)).toBe(true);
    });

    it('should reject excessive resource allocations', () => {
      expect(validateResourceAllocation(8, 8, 8)).toBe(false); // 512 GPUs
      expect(validateResourceAllocation(10, 10, 10)).toBe(false); // 1000 GPUs
      expect(validateResourceAllocation(4, 4, 4)).toBe(false); // 64 GPUs (assuming limit is 32)
    });

    it('should handle edge cases', () => {
      expect(validateResourceAllocation(0, 1, 1)).toBe(false); // Zero PP
      expect(validateResourceAllocation(1, 0, 1)).toBe(false); // Zero CP
      expect(validateResourceAllocation(1, 1, 0)).toBe(false); // Zero TP
      expect(validateResourceAllocation(-1, 1, 1)).toBe(false); // Negative values
    });

    it('should allow custom GPU limits', () => {
      expect(validateResourceAllocation(4, 4, 4, 64)).toBe(true); // 64 GPUs with limit 64
      expect(validateResourceAllocation(4, 4, 4, 32)).toBe(false); // 64 GPUs with limit 32
      expect(validateResourceAllocation(2, 2, 2, 8)).toBe(true); // 8 GPUs with limit 8
    });
  });

  describe('validatePriorities', () => {
    it('should validate correct priority arrays', () => {
      expect(validatePriorities([Priority.HIGH])).toBe(true);
      expect(validatePriorities([Priority.NORMAL, Priority.LOW])).toBe(true);
      expect(validatePriorities(Object.values(Priority))).toBe(true);
    });

    it('should reject invalid priority arrays', () => {
      expect(validatePriorities([])).toBe(false); // Empty array
      expect(validatePriorities(['invalid'] as any)).toBe(false); // Invalid priority
      expect(validatePriorities([Priority.HIGH, 'invalid'] as any)).toBe(false); // Mixed valid/invalid
      expect(validatePriorities(null as any)).toBe(false); // Null
      expect(validatePriorities(undefined as any)).toBe(false); // Undefined
      expect(validatePriorities('high' as any)).toBe(false); // String instead of array
    });

    it('should handle duplicate priorities', () => {
      expect(validatePriorities([Priority.HIGH, Priority.HIGH])).toBe(true); // Duplicates allowed
    });
  });

  describe('validateEnvironmentVariables', () => {
    it('should validate correct environment variable arrays', () => {
      expect(validateEnvironmentVariables([])).toBe(true); // Empty array is valid
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: 'value1' }
      ])).toBe(true);
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: 'value1' },
        { name: 'VAR2', value: 'value2' }
      ])).toBe(true);
    });

    it('should reject invalid environment variable arrays', () => {
      expect(validateEnvironmentVariables([
        { name: '', value: 'value1' }
      ])).toBe(false); // Empty name
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: null }
      ])).toBe(false); // Null value
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: undefined }
      ])).toBe(false); // Undefined value
      expect(validateEnvironmentVariables([
        { value: 'value1' }
      ] as any)).toBe(false); // Missing name
      expect(validateEnvironmentVariables([
        { name: 'VAR1' }
      ] as any)).toBe(false); // Missing value
    });

    it('should detect duplicate environment variable names', () => {
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: 'value1' },
        { name: 'VAR1', value: 'value2' }
      ])).toBe(false); // Duplicate names
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: 'value1' },
        { name: 'VAR2', value: 'value2' },
        { name: 'VAR1', value: 'value3' }
      ])).toBe(false); // Multiple duplicates
    });

    it('should handle edge cases', () => {
      expect(validateEnvironmentVariables(null as any)).toBe(false); // Null
      expect(validateEnvironmentVariables(undefined as any)).toBe(false); // Undefined
      expect(validateEnvironmentVariables('invalid' as any)).toBe(false); // String instead of array
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: '' }
      ])).toBe(true); // Empty string value is valid
      expect(validateEnvironmentVariables([
        { name: 'VAR1', value: 0 }
      ])).toBe(true); // Number value is valid
    });
  });

  describe('serializeFormData', () => {
    it('should serialize form data correctly', () => {
      const formData = createMockCreateInstanceData({
        fps: undefined,
        celery_task_concurrency: undefined,
        ephemeral: false,
        ephemeral_min_period_seconds: 300,
        ephemeral_from: '09:00',
        ephemeral_to: '17:00',
      });

      const serialized = serializeFormData(formData);

      expect(serialized.fps).toBeNull();
      expect(serialized.celery_task_concurrency).toBeNull();
      expect(serialized.ephemeral_min_period_seconds).toBeNull();
      expect(serialized.ephemeral_from).toBe('');
      expect(serialized.ephemeral_to).toBe('');
    });

    it('should preserve ephemeral fields when ephemeral is true', () => {
      const formData = createMockCreateInstanceData({
        ephemeral: true,
        ephemeral_min_period_seconds: 300,
        ephemeral_from: '09:00',
        ephemeral_to: '17:00',
      });

      const serialized = serializeFormData(formData);

      expect(serialized.ephemeral_min_period_seconds).toBe(300);
      expect(serialized.ephemeral_from).toBe('09:00');
      expect(serialized.ephemeral_to).toBe('17:00');
    });

    it('should ensure arrays are properly formatted', () => {
      const formData = createMockCreateInstanceData({
        priorities: null as any,
        envs: undefined as any,
      });

      const serialized = serializeFormData(formData);

      expect(Array.isArray(serialized.priorities)).toBe(true);
      expect(serialized.priorities).toEqual([]);
      expect(Array.isArray(serialized.envs)).toBe(true);
      expect(serialized.envs).toEqual([]);
    });
  });

  describe('deserializeFormData', () => {
    it('should deserialize form data correctly', () => {
      const instanceData = createMockCreateInstanceData({
        fps: null,
        celery_task_concurrency: null,
        ephemeral_min_period_seconds: null,
        priorities: null as any,
        envs: null as any,
      });

      const deserialized = deserializeFormData(instanceData);

      expect(deserialized.fps).toBeUndefined();
      expect(deserialized.celery_task_concurrency).toBeUndefined();
      expect(deserialized.ephemeral_min_period_seconds).toBeUndefined();
      expect(Array.isArray(deserialized.priorities)).toBe(true);
      expect(deserialized.priorities).toEqual([]);
      expect(Array.isArray(deserialized.envs)).toBe(true);
      expect(deserialized.envs).toEqual([]);
    });

    it('should preserve valid values', () => {
      const instanceData = createMockCreateInstanceData({
        fps: 30,
        celery_task_concurrency: 4,
        ephemeral_min_period_seconds: 300,
        priorities: [Priority.HIGH, Priority.NORMAL],
        envs: [{ name: 'VAR1', value: 'value1' }],
      });

      const deserialized = deserializeFormData(instanceData);

      expect(deserialized.fps).toBe(30);
      expect(deserialized.celery_task_concurrency).toBe(4);
      expect(deserialized.ephemeral_min_period_seconds).toBe(300);
      expect(deserialized.priorities).toEqual([Priority.HIGH, Priority.NORMAL]);
      expect(deserialized.envs).toEqual([{ name: 'VAR1', value: 'value1' }]);
    });
  });

  describe('getFieldError', () => {
    it('should extract field errors from validation results', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'model_name', message: 'Model name is required' },
      ];

      expect(getFieldError(errors, 'name')).toBe('Name is required');
      expect(getFieldError(errors, 'model_name')).toBe('Model name is required');
      expect(getFieldError(errors, 'nonexistent')).toBeUndefined();
    });

    it('should return first error for field with multiple errors', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'name', message: 'Name is too short' },
      ];

      expect(getFieldError(errors, 'name')).toBe('Name is required');
    });

    it('should handle empty error arrays', () => {
      expect(getFieldError([], 'name')).toBeUndefined();
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors for display', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'model_name', message: 'Model name is required' },
        { field: 'pp', message: 'PP must be between 1 and 64' },
      ];

      const formatted = formatValidationErrors(errors);

      expect(formatted).toContain('Name is required');
      expect(formatted).toContain('Model name is required');
      expect(formatted).toContain('PP must be between 1 and 64');
    });

    it('should handle empty error arrays', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toBe('');
    });

    it('should format single error', () => {
      const errors = [{ field: 'name', message: 'Name is required' }];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('Name is required');
    });

    it('should join multiple errors with newlines', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'model_name', message: 'Model name is required' },
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('Name is required\nModel name is required');
    });
  });

  describe('validateFormData', () => {
    it('should validate complete form data successfully', () => {
      const validFormData = createMockCreateInstanceData({
        name: 'valid-instance',
        pp: 1,
        cp: 1,
        tp: 1,
        priorities: [Priority.NORMAL],
        envs: [{ name: 'VAR1', value: 'value1' }],
        ephemeral: false,
        fps: 30,
        celery_task_concurrency: 4,
      });

      const errors = validateFormData(validFormData);
      expect(errors).toEqual([]);
    });

    it('should detect invalid instance name', () => {
      const invalidFormData = createMockCreateInstanceData({
        name: 'invalid name', // Contains space
      });

      const errors = validateFormData(invalidFormData);
      expect(errors).toContain('实例名称格式无效，只能包含字母、数字、下划线和连字符，长度不超过100个字符');
    });

    it('should detect invalid resource allocation', () => {
      const invalidFormData = createMockCreateInstanceData({
        pp: 0, // Invalid
        cp: 1,
        tp: 1,
      });

      const errors = validateFormData(invalidFormData);
      expect(errors).toContain('资源分配无效，PP、CP、TP必须大于0，且总GPU数量不能超过32');
    });

    it('should detect invalid priorities', () => {
      const invalidFormData = createMockCreateInstanceData({
        priorities: [], // Empty array
      });

      const errors = validateFormData(invalidFormData);
      expect(errors).toContain('优先级设置无效');
    });

    it('should detect invalid environment variables', () => {
      const invalidFormData = createMockCreateInstanceData({
        envs: [{ name: '', value: 'value1' }], // Empty name
      });

      const errors = validateFormData(invalidFormData);
      expect(errors).toContain('环境变量设置无效，变量名不能为空且不能重复');
    });

    it('should validate ephemeral instance settings', () => {
      const invalidEphemeralData = createMockCreateInstanceData({
        ephemeral: true,
        ephemeral_from: '', // Missing time
        ephemeral_to: '',
      });

      const errors = validateFormData(invalidEphemeralData);
      expect(errors).toContain('临时实例必须设置开始和结束时间');
    });

    it('should validate ephemeral time range', () => {
      const invalidTimeRangeData = createMockCreateInstanceData({
        ephemeral: true,
        ephemeral_from: '17:00',
        ephemeral_to: '09:00', // End before start
      });

      const errors = validateFormData(invalidTimeRangeData);
      expect(errors).toContain('临时实例时间范围无效');
    });

    it('should validate ephemeral minimum period', () => {
      const invalidMinPeriodData = createMockCreateInstanceData({
        ephemeral: true,
        ephemeral_from: '09:00',
        ephemeral_to: '17:00',
        ephemeral_min_period_seconds: 30, // Less than 60 seconds
      });

      const errors = validateFormData(invalidMinPeriodData);
      expect(errors).toContain('临时实例最小持续时间不能少于60秒');
    });

    it('should validate optional numeric fields', () => {
      const invalidNumericData = createMockCreateInstanceData({
        fps: -1, // Invalid
        celery_task_concurrency: 0, // Invalid
      });

      const errors = validateFormData(invalidNumericData);
      expect(errors).toContain('FPS必须大于0');
      expect(errors).toContain('Celery任务并发数必须大于0');
    });

    it('should collect multiple validation errors', () => {
      const multipleErrorsData = createMockCreateInstanceData({
        name: 'invalid name', // Invalid name
        pp: 0, // Invalid resource
        priorities: [], // Invalid priorities
        ephemeral: true,
        ephemeral_from: '', // Missing ephemeral time
        fps: -1, // Invalid FPS
      });

      const errors = validateFormData(multipleErrorsData);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('实例名称格式无效，只能包含字母、数字、下划线和连字符，长度不超过100个字符');
      expect(errors).toContain('资源分配无效，PP、CP、TP必须大于0，且总GPU数量不能超过32');
      expect(errors).toContain('优先级设置无效');
      expect(errors).toContain('临时实例必须设置开始和结束时间');
      expect(errors).toContain('FPS必须大于0');
    });
  });
});