/**
 * usePerformanceMonitor Hook
 * Monitors component performance and provides optimization insights
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
  totalRenderTime: number;
  memoryUsage?: number;
}

/**
 * Performance monitor options
 */
export interface PerformanceMonitorOptions {
  /** Component name for debugging */
  name?: string;
  /** Enable console logging */
  enableLogging?: boolean;
  /** Log threshold in milliseconds */
  logThreshold?: number;
  /** Enable memory monitoring */
  enableMemoryMonitoring?: boolean;
  /** Sample rate (0-1) for performance monitoring */
  sampleRate?: number;
}

/**
 * usePerformanceMonitor Hook
 */
export const usePerformanceMonitor = (
  options: PerformanceMonitorOptions = {}
): PerformanceMetrics => {
  const {
    name = 'Component',
    enableLogging = process.env.NODE_ENV === 'development',
    logThreshold = 16, // 16ms = 60fps threshold
    enableMemoryMonitoring = false,
    sampleRate = 1.0,
  } = options;

  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const lastRenderTimeRef = useRef(0);
  const startTimeRef = useRef(0);

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    totalRenderTime: 0,
  });

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    if (Math.random() > sampleRate) return;
    startTimeRef.current = performance.now();
  }, [sampleRate]);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (startTimeRef.current === 0) return;

    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    renderCountRef.current += 1;
    renderTimesRef.current.push(renderTime);
    lastRenderTimeRef.current = renderTime;

    // Keep only last 100 measurements to prevent memory leaks
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-100);
    }

    const totalRenderTime = renderTimesRef.current.reduce((sum, time) => sum + time, 0);
    const averageRenderTime = totalRenderTime / renderTimesRef.current.length;
    const maxRenderTime = Math.max(...renderTimesRef.current);

    let memoryUsage: number | undefined;
    if (enableMemoryMonitoring && 'memory' in performance) {
      memoryUsage = (performance as any).memory?.usedJSHeapSize;
    }

    const newMetrics: PerformanceMetrics = {
      renderCount: renderCountRef.current,
      lastRenderTime: renderTime,
      averageRenderTime,
      maxRenderTime,
      totalRenderTime,
      memoryUsage,
    };

    setMetrics(newMetrics);

    // Log performance warnings
    if (enableLogging && renderTime > logThreshold) {
      console.warn(
        `🐌 Slow render detected in ${name}:`,
        `${renderTime.toFixed(2)}ms (threshold: ${logThreshold}ms)`,
        newMetrics
      );
    }

    startTimeRef.current = 0;
  }, [name, enableLogging, logThreshold, enableMemoryMonitoring]);

  // Measure render performance
  useEffect(() => {
    startMeasurement();
    return endMeasurement;
  });

  return metrics;
};

/**
 * useRenderCount Hook
 * Simple hook to track render count
 */
export const useRenderCount = (name?: string): number => {
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    if (process.env.NODE_ENV === 'development' && name) {
      console.log(`${name} rendered ${renderCountRef.current} times`);
    }
  });

  return renderCountRef.current;
};

/**
 * useWhyDidYouUpdate Hook
 * Helps identify why a component re-rendered
 */
export const useWhyDidYouUpdate = (
  name: string,
  props: Record<string, any>
): void => {
  const previousProps = useRef<Record<string, any>>({});

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
};

/**
 * Performance measurement decorator
 */
export const measurePerformance = (
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) => {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = method.apply(this, args);
    const end = performance.now();
    
    console.log(`${propertyName} took ${(end - start).toFixed(2)}ms`);
    
    return result;
  };

  return descriptor;
};

/**
 * Debounced performance logger
 */
export const usePerformanceLogger = (
  componentName: string,
  threshold: number = 16
) => {
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  const logPerformance = useCallback((metrics: PerformanceMetrics) => {
    metricsRef.current.push(metrics);

    // Clear existing timeout
    if (logTimeoutRef.current) {
      clearTimeout(logTimeoutRef.current);
    }

    // Debounce logging
    logTimeoutRef.current = setTimeout(() => {
      const recentMetrics = metricsRef.current.slice(-10);
      const slowRenders = recentMetrics.filter(m => m.lastRenderTime > threshold);

      if (slowRenders.length > 0) {
        console.group(`🔍 Performance Report: ${componentName}`);
        console.log('Recent slow renders:', slowRenders);
        console.log('Average render time:', 
          recentMetrics.reduce((sum, m) => sum + m.lastRenderTime, 0) / recentMetrics.length
        );
        console.groupEnd();
      }

      metricsRef.current = [];
    }, 1000);
  }, [componentName, threshold]);

  useEffect(() => {
    return () => {
      if (logTimeoutRef.current) {
        clearTimeout(logTimeoutRef.current);
      }
    };
  }, []);

  return logPerformance;
};

export default usePerformanceMonitor;