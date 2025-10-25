// Date formatting utilities
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date with more options
 */
export const formatDateTime = (
  dateString: string, 
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    locale?: string;
    timeZone?: string;
  } = {}
): string => {
  const {
    includeTime = true,
    includeSeconds = false,
    locale = 'zh-CN',
    timeZone
  } = options;

  try {
    const date = new Date(dateString);
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      
      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }
    }

    if (timeZone) {
      formatOptions.timeZone = timeZone;
    }

    return date.toLocaleDateString(locale, formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTimeFromString = (dateString: string): string => {
  try {
    const date = new Date(dateString);
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
    return dateString;
  }
};

/**
 * Format duration in milliseconds to human readable string
 */
export const formatDurationMs = (durationMs: number): string => {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天 ${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟 ${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

// Error handling utilities
export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.message) {
      return err.message;
    }
  }
  return '发生未知错误';
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate instance name
 */
export const isValidInstanceName = (name: string): boolean => {
  // Instance name should be 1-50 characters, alphanumeric with hyphens and underscores
  const nameRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  return nameRegex.test(name);
};

/**
 * Validate positive integer
 */
export const isValidPositiveInteger = (value: any): boolean => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * Validate non-negative integer
 */
export const isValidNonNegativeInteger = (value: any): boolean => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
};

/**
 * Validate number range
 */
export const isInRange = (value: any, min: number, max: number): boolean => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate JSON string
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Data transformation utilities

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    Object.keys(obj).forEach(key => {
      (cloned as any)[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  
  return obj;
};

/**
 * Remove undefined and null values from object
 */
export const removeEmptyValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      result[key as keyof T] = value;
    }
  });
  
  return result;
};

/**
 * Convert array to object with key selector
 */
export const arrayToObject = <T, K extends string | number>(
  array: T[],
  keySelector: (item: T) => K
): Record<K, T> => {
  const result = {} as Record<K, T>;
  array.forEach(item => {
    const key = keySelector(item);
    result[key] = item;
  });
  return result;
};

/**
 * Group array items by key
 */
export const groupBy = <T, K extends string | number>(
  array: T[],
  keySelector: (item: T) => K
): Record<K, T[]> => {
  const result = {} as Record<K, T[]>;
  array.forEach(item => {
    const key = keySelector(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  });
  return result;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// String utilities

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert camelCase to kebab-case
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Convert kebab-case to camelCase
 */
export const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Number utilities

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number, locale: string = 'zh-CN'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Clamp number between min and max
 */
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

// Re-export everything from specific utility modules
export * from './statusUtils';
export * from './errorUtils';
export * from './retryUtils';
export * from './requestOptimization';
export * from './securityUtils';

// Selective exports to avoid conflicts
export {
  // Form utilities
  validateInstanceName,
  validateTimeFormat,
  validateTimeRange,
  validateResourceAllocation,
  validatePriorities,
  validateEnvironmentVariables,
  validateFormData,
  getFieldError,
  formatValidationErrors,
  serializeFormData as serializeFormDataForValidation,
  deserializeFormData as deserializeFormDataForValidation
} from './formUtils';

export {
  // Data utilities
  DataTransformer,
  DataSerializer,
  DataProcessor,
  DateFormatter,
  instanceFromBackend,
  instanceToBackend,
  historyFromBackend,
  serialize,
  deserialize,
  serializeFormData,
  deserializeFormData,
  exportInstances,
  importInstances,
  sortInstances,
  filterInstances,
  groupInstances,
  getInstanceStats,
  validateInstanceData,
  calculateResourceUsage,
  generateInstanceSummary,
  formatTimestamp,
  getRelativeTime,
  formatDuration
} from './dataUtils';
