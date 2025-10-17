export { useResponsive, getResponsiveValue } from './useResponsive';
export { useInstances, INSTANCES_QUERY_KEYS } from './useInstances';
export type { UseInstancesReturn } from './useInstances';
export { 
  useHistory, 
  useHistoryRecord, 
  useHistoryCount, 
  useLatestHistory,
  HISTORY_QUERY_KEYS 
} from './useHistory';
export type { 
  UseHistoryReturn, 
  UseHistoryRecordReturn, 
  UseHistoryCountReturn,
  UseHistoryOptions 
} from './useHistory';

// Optimized history hooks
export { 
  useOptimizedHistory, 
  useOptimizedHistoryRecord 
} from './useOptimizedHistory';
export type { 
  UseOptimizedHistoryReturn, 
  UseOptimizedHistoryOptions,
  SearchOptions,
  BatchOptions 
} from './useOptimizedHistory';

// Performance and UX hooks
export { 
  usePerformanceMonitor, 
  useRenderCount, 
  useWhyDidYouUpdate 
} from './usePerformanceMonitor';
export { 
  useKeyboardShortcuts, 
  useGlobalShortcuts, 
  useModalShortcuts, 
  useTableShortcuts,
  createCommonShortcuts,
  formatShortcutKey
} from './useKeyboardShortcuts';

// Error handling hooks
export { 
  default as useErrorHandler, 
  initializeGlobalErrorHandler, 
  getGlobalErrorHandler 
} from './useErrorHandler';
export { useRetry } from '../utils/retryUtils';

// Loading state hooks
export { 
  useLoadingState, 
  useBatchLoadingState 
} from './useLoadingState';
export type { 
  LoadingState, 
  LoadingConfig, 
  LoadingStateData, 
  LoadingOperationResult 
} from './useLoadingState';

// Touch and gesture hooks
export { useTouchGestures } from './useTouchGestures';
export type { TouchGestureOptions } from './useTouchGestures';