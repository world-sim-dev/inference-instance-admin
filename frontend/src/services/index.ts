/**
 * Services export file
 * Provides centralized access to all service modules
 */

export { ApiClient, apiClient, createApiClient } from './api';
export { InstanceService } from './instanceService';
export { HistoryService } from './historyService';
export { HistorySearchService } from './historySearchService';

// Optimized services
export { OptimizedApiClient, optimizedApiClient, createOptimizedApiClient } from './optimizedApiClient';
export { EnhancedHistoryService } from './enhancedHistoryService';

// Re-export types for convenience
export type {
  ApiClientInterface,
  ApiClientConfig,
  ApiError,
  RequestInterceptor,
  ResponseInterceptor
} from '../types/api';