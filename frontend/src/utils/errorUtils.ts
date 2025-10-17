/**
 * Error handling utilities
 * Provides comprehensive error handling, classification, and user-friendly messaging
 */

import type { AxiosError } from 'axios';
import type { ApiError } from '../types/api';

/**
 * Error types for classification
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Structured error interface
 */
export interface StructuredError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: any;
  code?: string | number;
  timestamp: Date;
  retryable: boolean;
  suggestions?: string[];
}

/**
 * Network error patterns
 */
const NETWORK_ERROR_PATTERNS = {
  CONNECTION_REFUSED: /ECONNREFUSED|ERR_CONNECTION_REFUSED/i,
  TIMEOUT: /timeout|ETIMEDOUT/i,
  NETWORK_ERROR: /Network Error|ERR_NETWORK/i,
  DNS_ERROR: /ENOTFOUND|getaddrinfo/i,
  SSL_ERROR: /SSL|certificate/i,
};

/**
 * HTTP status code mappings
 */
const HTTP_STATUS_MAPPINGS: Record<number, { type: ErrorType; severity: ErrorSeverity; userMessage: string }> = {
  400: {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '请求参数有误，请检查输入内容'
  },
  401: {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: '身份验证失败，请重新登录'
  },
  403: {
    type: ErrorType.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    userMessage: '权限不足，无法执行此操作'
  },
  404: {
    type: ErrorType.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '请求的资源不存在'
  },
  408: {
    type: ErrorType.TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '请求超时，请稍后重试'
  },
  409: {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '数据冲突，请刷新后重试'
  },
  422: {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '数据验证失败，请检查输入内容'
  },
  429: {
    type: ErrorType.CLIENT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '请求过于频繁，请稍后重试'
  },
  500: {
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    userMessage: '服务器内部错误，请稍后重试'
  },
  502: {
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    userMessage: '服务器网关错误，请稍后重试'
  },
  503: {
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    userMessage: '服务暂时不可用，请稍后重试'
  },
  504: {
    type: ErrorType.TIMEOUT,
    severity: ErrorSeverity.HIGH,
    userMessage: '服务器响应超时，请稍后重试'
  }
};

/**
 * Classify error based on various factors
 */
export const classifyError = (error: any): StructuredError => {
  const timestamp = new Date();
  
  // Handle AxiosError
  if (error?.isAxiosError) {
    const axiosError = error as AxiosError;
    
    // Network errors (no response)
    if (!axiosError.response) {
      const message = axiosError.message || 'Network error occurred';
      
      // Check for specific network error patterns
      for (const [pattern, regex] of Object.entries(NETWORK_ERROR_PATTERNS)) {
        if (regex.test(message)) {
          return {
            type: ErrorType.NETWORK,
            severity: ErrorSeverity.HIGH,
            message,
            userMessage: getNetworkErrorMessage(pattern),
            details: { originalError: axiosError },
            timestamp,
            retryable: true,
            suggestions: getNetworkErrorSuggestions(pattern)
          };
        }
      }
      
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message,
        userMessage: '网络连接失败，请检查网络连接后重试',
        details: { originalError: axiosError },
        timestamp,
        retryable: true,
        suggestions: ['检查网络连接', '稍后重试', '联系管理员']
      };
    }
    
    // HTTP response errors
    const status = axiosError.response.status;
    const responseData = axiosError.response.data as any;
    
    const statusMapping = HTTP_STATUS_MAPPINGS[status];
    if (statusMapping) {
      return {
        type: statusMapping.type,
        severity: statusMapping.severity,
        message: responseData?.message || responseData?.detail || axiosError.message,
        userMessage: statusMapping.userMessage,
        details: { 
          status, 
          responseData,
          originalError: axiosError 
        },
        code: status,
        timestamp,
        retryable: isRetryableStatus(status),
        suggestions: getStatusErrorSuggestions(status)
      };
    }
    
    // Unknown HTTP status
    return {
      type: ErrorType.SERVER,
      severity: ErrorSeverity.MEDIUM,
      message: responseData?.message || axiosError.message,
      userMessage: `服务器返回错误 (${status})，请稍后重试`,
      details: { status, responseData, originalError: axiosError },
      code: status,
      timestamp,
      retryable: status >= 500,
      suggestions: ['稍后重试', '联系管理员']
    };
  }
  
  // Handle ApiError
  if (error?.error && error?.message) {
    const apiError = error as ApiError;
    
    return {
      type: getErrorTypeFromApiError(apiError),
      severity: ErrorSeverity.MEDIUM,
      message: apiError.message,
      userMessage: getUserMessageFromApiError(apiError),
      details: apiError.details,
      code: apiError.status,
      timestamp,
      retryable: isRetryableApiError(apiError),
      suggestions: getApiErrorSuggestions(apiError)
    };
  }
  
  // Handle validation errors
  if (error?.name === 'ValidationError' || error?.type === 'validation') {
    return {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'Validation failed',
      userMessage: '输入数据验证失败，请检查表单内容',
      details: error.details || error.errors,
      timestamp,
      retryable: false,
      suggestions: ['检查输入内容', '确保所有必填字段已填写', '检查数据格式']
    };
  }
  
  // Handle JavaScript errors
  if (error instanceof Error) {
    return {
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: '应用程序出现错误，请刷新页面重试',
      details: { 
        name: error.name, 
        stack: error.stack,
        originalError: error 
      },
      timestamp,
      retryable: true,
      suggestions: ['刷新页面', '清除浏览器缓存', '联系技术支持']
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error,
      userMessage: error,
      timestamp,
      retryable: false,
      suggestions: ['稍后重试']
    };
  }
  
  // Unknown error type
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: 'An unknown error occurred',
    userMessage: '发生未知错误，请稍后重试',
    details: { originalError: error },
    timestamp,
    retryable: true,
    suggestions: ['刷新页面', '稍后重试', '联系技术支持']
  };
};

/**
 * Get network error message based on pattern
 */
const getNetworkErrorMessage = (pattern: string): string => {
  const messages: Record<string, string> = {
    CONNECTION_REFUSED: '无法连接到服务器，请检查服务器状态',
    TIMEOUT: '网络请求超时，请检查网络连接',
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    DNS_ERROR: 'DNS解析失败，请检查网络配置',
    SSL_ERROR: 'SSL证书验证失败，请联系管理员'
  };
  
  return messages[pattern] || '网络连接失败，请稍后重试';
};

/**
 * Get network error suggestions
 */
const getNetworkErrorSuggestions = (pattern: string): string[] => {
  const suggestions: Record<string, string[]> = {
    CONNECTION_REFUSED: ['检查服务器是否运行', '确认服务器地址正确', '联系管理员'],
    TIMEOUT: ['检查网络连接', '尝试刷新页面', '稍后重试'],
    NETWORK_ERROR: ['检查网络连接', '尝试重新连接WiFi', '联系网络管理员'],
    DNS_ERROR: ['检查DNS设置', '尝试使用其他网络', '联系网络管理员'],
    SSL_ERROR: ['联系管理员更新证书', '检查系统时间', '尝试使用其他浏览器']
  };
  
  return suggestions[pattern] || ['检查网络连接', '稍后重试'];
};

/**
 * Check if HTTP status is retryable
 */
const isRetryableStatus = (status: number): boolean => {
  // Retry on server errors and some client errors
  return status >= 500 || status === 408 || status === 429;
};

/**
 * Get suggestions for HTTP status errors
 */
const getStatusErrorSuggestions = (status: number): string[] => {
  const suggestions: Record<number, string[]> = {
    400: ['检查输入参数', '确认数据格式正确'],
    401: ['重新登录', '检查登录状态'],
    403: ['联系管理员获取权限', '确认操作权限'],
    404: ['检查资源是否存在', '确认URL正确'],
    408: ['稍后重试', '检查网络连接'],
    409: ['刷新页面获取最新数据', '稍后重试'],
    422: ['检查输入数据', '确认所有必填字段'],
    429: ['稍后重试', '减少请求频率'],
    500: ['稍后重试', '联系技术支持'],
    502: ['稍后重试', '联系管理员'],
    503: ['稍后重试', '等待服务恢复'],
    504: ['稍后重试', '检查网络连接']
  };
  
  return suggestions[status] || ['稍后重试', '联系技术支持'];
};

/**
 * Get error type from ApiError
 */
const getErrorTypeFromApiError = (apiError: ApiError): ErrorType => {
  if (apiError.error === 'NetworkError') return ErrorType.NETWORK;
  if (apiError.error === 'ValidationError') return ErrorType.VALIDATION;
  if (apiError.status === 401) return ErrorType.AUTHENTICATION;
  if (apiError.status === 403) return ErrorType.AUTHORIZATION;
  if (apiError.status === 404) return ErrorType.NOT_FOUND;
  if (apiError.status && apiError.status >= 500) return ErrorType.SERVER;
  
  return ErrorType.CLIENT;
};

/**
 * Get user message from ApiError
 */
const getUserMessageFromApiError = (apiError: ApiError): string => {
  if (apiError.status && HTTP_STATUS_MAPPINGS[apiError.status]) {
    return HTTP_STATUS_MAPPINGS[apiError.status].userMessage;
  }
  
  return apiError.message || '操作失败，请稍后重试';
};

/**
 * Check if ApiError is retryable
 */
const isRetryableApiError = (apiError: ApiError): boolean => {
  if (apiError.error === 'NetworkError') return true;
  if (apiError.status && apiError.status >= 500) return true;
  if (apiError.status === 408 || apiError.status === 429) return true;
  
  return false;
};

/**
 * Get suggestions for ApiError
 */
const getApiErrorSuggestions = (apiError: ApiError): string[] => {
  if (apiError.status && HTTP_STATUS_MAPPINGS[apiError.status]) {
    return getStatusErrorSuggestions(apiError.status);
  }
  
  if (apiError.error === 'NetworkError') {
    return ['检查网络连接', '稍后重试'];
  }
  
  return ['稍后重试', '联系技术支持'];
};

/**
 * Format error for logging
 */
export const formatErrorForLogging = (error: StructuredError): string => {
  const logData = {
    timestamp: error.timestamp.toISOString(),
    type: error.type,
    severity: error.severity,
    message: error.message,
    code: error.code,
    retryable: error.retryable,
    details: error.details
  };
  
  return JSON.stringify(logData, null, 2);
};

/**
 * Check if error should be reported to monitoring service
 */
export const shouldReportError = (error: StructuredError): boolean => {
  // Report high and critical severity errors
  if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
    return true;
  }
  
  // Report server errors
  if (error.type === ErrorType.SERVER) {
    return true;
  }
  
  // Report authentication/authorization errors
  if (error.type === ErrorType.AUTHENTICATION || error.type === ErrorType.AUTHORIZATION) {
    return true;
  }
  
  return false;
};

/**
 * Get retry configuration based on error type
 */
export const getRetryConfig = (error: StructuredError): { maxRetries: number; delay: number; backoff: boolean } => {
  if (!error.retryable) {
    return { maxRetries: 0, delay: 0, backoff: false };
  }
  
  switch (error.type) {
    case ErrorType.NETWORK:
      return { maxRetries: 3, delay: 1000, backoff: true };
    case ErrorType.TIMEOUT:
      return { maxRetries: 2, delay: 2000, backoff: true };
    case ErrorType.SERVER:
      return { maxRetries: 2, delay: 3000, backoff: true };
    default:
      return { maxRetries: 1, delay: 1000, backoff: false };
  }
};

/**
 * Create user-friendly error message with suggestions
 */
export const createUserErrorMessage = (error: StructuredError): { title: string; message: string; suggestions: string[] } => {
  const severityTitles = {
    [ErrorSeverity.LOW]: '提示',
    [ErrorSeverity.MEDIUM]: '警告',
    [ErrorSeverity.HIGH]: '错误',
    [ErrorSeverity.CRITICAL]: '严重错误'
  };
  
  return {
    title: severityTitles[error.severity],
    message: error.userMessage,
    suggestions: error.suggestions || []
  };
};

export default {
  classifyError,
  formatErrorForLogging,
  shouldReportError,
  getRetryConfig,
  createUserErrorMessage,
  ErrorType,
  ErrorSeverity
};