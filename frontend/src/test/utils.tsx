/**
 * Test utilities and helpers
 * Provides common testing utilities, mocks, and render functions
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AppProvider } from '../contexts/AppProvider';
import { vi } from 'vitest';
import type { Instance, CreateInstanceData } from '../types/instance';
import type { HistoryRecord } from '../types/history';

/**
 * Custom render function with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialState?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), initialState, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <AppProvider initialState={initialState}>
          {children}
        </AppProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Create a test query client with disabled retries and caching
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Mock data factories
 */
export const createMockInstance = (overrides: Partial<Instance> = {}): Instance => ({
  id: 1,
  name: 'test-instance',
  model_name: 'test-model',
  model_version: '1.0.0',
  cluster_name: 'test-cluster',
  image_tag: 'latest',
  pipeline_mode: 'standard',
  quant_mode: false,
  distill_mode: false,
  m405_mode: false,
  fps: 30,
  checkpoint_path: '/path/to/checkpoint',
  nonce: 'test-nonce',
  pp: 1,
  cp: 1,
  tp: 1,
  n_workers: 4,
  replicas: 1,
  priorities: ['normal'],
  envs: [],
  description: 'Test instance description',
  separate_video_encode: false,
  separate_video_decode: false,
  separate_t5_encode: false,
  ephemeral: false,
  ephemeral_min_period_seconds: 300,
  ephemeral_to: '23:59',
  ephemeral_from: '00:00',
  vae_store_type: 'memory',
  t5_store_type: 'memory',
  enable_cuda_graph: true,
  task_concurrency: 1,
  celery_task_concurrency: 1,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockInstances = (count: number = 3): Instance[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockInstance({
      id: index + 1,
      name: `test-instance-${index + 1}`,
      model_name: `model-${index + 1}`,
      cluster_name: index % 2 === 0 ? 'cluster-a' : 'cluster-b',
      status: index % 3 === 0 ? 'inactive' : 'active',
    })
  );
};

export const createMockCreateInstanceData = (overrides: Partial<CreateInstanceData> = {}): CreateInstanceData => ({
  name: 'new-instance',
  model_name: 'new-model',
  model_version: '1.0.0',
  cluster_name: 'new-cluster',
  image_tag: 'latest',
  pipeline_mode: 'standard',
  quant_mode: false,
  distill_mode: false,
  m405_mode: false,
  fps: 30,
  checkpoint_path: '/path/to/checkpoint',
  nonce: 'new-nonce',
  pp: 1,
  cp: 1,
  tp: 1,
  n_workers: 4,
  replicas: 1,
  priorities: ['normal'],
  envs: [],
  description: 'New instance description',
  separate_video_encode: false,
  separate_video_decode: false,
  separate_t5_encode: false,
  ephemeral: false,
  ephemeral_min_period_seconds: 300,
  ephemeral_to: '23:59',
  ephemeral_from: '00:00',
  vae_store_type: 'memory',
  t5_store_type: 'memory',
  enable_cuda_graph: true,
  task_concurrency: 1,
  celery_task_concurrency: 1,
  status: 'active',
  ...overrides,
});

export const createMockHistoryRecord = (overrides: Partial<HistoryRecord> = {}): HistoryRecord => ({
  history_id: 1,
  original_id: 1,
  operation_type: 'update',
  operation_timestamp: '2024-01-01T00:00:00Z',
  name: 'test-instance',
  model_name: 'test-model',
  model_version: '1.0.0',
  cluster_name: 'test-cluster',
  image_tag: 'latest',
  pipeline_mode: 'standard',
  quant_mode: false,
  distill_mode: false,
  m405_mode: false,
  fps: 30,
  checkpoint_path: '/path/to/checkpoint',
  nonce: 'test-nonce',
  pp: 1,
  cp: 1,
  tp: 1,
  n_workers: 4,
  replicas: 1,
  priorities: ['normal'],
  envs: [],
  description: 'Test instance description',
  separate_video_encode: false,
  separate_video_decode: false,
  separate_t5_encode: false,
  ephemeral: false,
  ephemeral_min_period_seconds: 300,
  ephemeral_to: '23:59',
  ephemeral_from: '00:00',
  vae_store_type: 'memory',
  t5_store_type: 'memory',
  enable_cuda_graph: true,
  task_concurrency: 1,
  celery_task_concurrency: 1,
  status: 'active',
  ...overrides,
});

export const createMockHistoryRecords = (count: number = 3): HistoryRecord[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockHistoryRecord({
      history_id: index + 1,
      original_id: 1,
      operation_type: index % 3 === 0 ? 'create' : index % 3 === 1 ? 'update' : 'delete',
      operation_timestamp: new Date(Date.now() - index * 60000).toISOString(),
    })
  );
};

/**
 * Mock API responses
 */
export const mockApiResponses = {
  instances: {
    getInstances: createMockInstances(),
    getInstance: createMockInstance(),
    createInstance: createMockInstance({ id: 999, name: 'created-instance' }),
    updateInstance: createMockInstance({ id: 1, name: 'updated-instance' }),
  },
  history: {
    getInstanceHistory: {
      history_records: createMockHistoryRecords(),
      total_count: 3,
      limit: 20,
      offset: 0,
      has_more: false,
    },
    getHistoryRecord: createMockHistoryRecord(),
  },
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock user interactions
 */
export const mockUserEvent = {
  click: async (element: Element) => {
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(element);
  },
  type: async (element: Element, text: string) => {
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(element, { target: { value: text } });
  },
  submit: async (form: Element) => {
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.submit(form);
  },
};

/**
 * Console spy utilities
 */
export const createConsoleSpy = () => {
  const originalConsole = { ...console };
  const spies = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(() => {
    console.log = spies.log;
    console.error = spies.error;
    console.warn = spies.warn;
    console.info = spies.info;
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
    Object.values(spies).forEach(spy => spy.mockClear());
  });

  return spies;
};

/**
 * Integration test helpers
 */
export const integrationTestHelpers = {
  // Performance measurement
  measurePerformance: async (operation: () => Promise<void>) => {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Memory usage tracking
  getMemoryUsage: () => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  },

  // Network simulation
  simulateSlowNetwork: (delay: number = 1000) => {
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  // Error simulation
  simulateError: (errorType: 'network' | 'server' | 'timeout' = 'server') => {
    switch (errorType) {
      case 'network':
        throw new Error('Network Error');
      case 'server':
        throw new Error('Internal Server Error');
      case 'timeout':
        throw new Error('Request Timeout');
      default:
        throw new Error('Unknown Error');
    }
  },

  // Accessibility testing
  checkAccessibility: async (element: Element) => {
    // Basic accessibility checks
    const checks = {
      hasAriaLabel: element.hasAttribute('aria-label'),
      hasRole: element.hasAttribute('role'),
      isFocusable: element.tabIndex >= 0,
      hasAltText: element.tagName === 'IMG' ? element.hasAttribute('alt') : true,
    };
    return checks;
  },

  // Responsive testing
  simulateViewport: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },

  // Touch simulation
  simulateTouch: (element: Element, type: 'tap' | 'swipe' = 'tap') => {
    const touch = new Touch({
      identifier: 1,
      target: element,
      clientX: 100,
      clientY: 100,
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 10,
      force: 0.5,
    });

    const touchEvent = new TouchEvent(type === 'tap' ? 'touchstart' : 'touchmove', {
      cancelable: true,
      bubbles: true,
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch],
    });

    element.dispatchEvent(touchEvent);
  },
};

/**
 * Mock data generators for complex scenarios
 */
export const complexMockData = {
  // Large dataset for performance testing
  createLargeInstanceDataset: (size: number = 1000) => {
    return Array.from({ length: size }, (_, i) => createMockInstance({
      id: i + 1,
      name: `perf-instance-${i + 1}`,
      description: `Performance test instance ${i + 1} with detailed description`.repeat(3),
      created_at: new Date(Date.now() - i * 60000).toISOString(),
    }));
  },

  // Diverse data for filtering tests
  createDiverseInstanceDataset: () => {
    const statuses = ['active', 'inactive', 'pending', 'error'];
    const clusters = ['prod-cluster', 'test-cluster', 'dev-cluster', 'staging-cluster'];
    const models = ['gpt-4', 'claude-3', 'llama-2', 'mistral-7b'];

    return Array.from({ length: 50 }, (_, i) => createMockInstance({
      id: i + 1,
      name: `diverse-instance-${i + 1}`,
      status: statuses[i % statuses.length] as any,
      cluster_name: clusters[i % clusters.length],
      model_name: models[i % models.length],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },

  // Error scenarios
  createErrorScenarios: () => ({
    validationErrors: {
      detail: [
        { loc: ['body', 'name'], msg: 'Instance name already exists', type: 'value_error' },
        { loc: ['body', 'pp'], msg: 'PP value must be between 1 and 64', type: 'value_error' },
      ],
    },
    serverError: { detail: 'Internal server error occurred' },
    networkError: { message: 'Network request failed' },
    timeoutError: { message: 'Request timeout' },
  }),

  // Batch operation data
  createBatchOperationData: () => ({
    batchUpdate: {
      instanceIds: [1, 2, 3, 4, 5],
      updateData: { status: 'inactive', description: 'Batch updated' },
      expectedResults: {
        successful: [1, 2, 3, 5],
        failed: [{ id: 4, error: 'Instance has active tasks' }],
      },
    },
    batchDelete: {
      instanceIds: [6, 7, 8],
      expectedResults: {
        successful: [6, 8],
        failed: [{ id: 7, error: 'Cannot delete instance with dependencies' }],
      },
    },
  }),
};

/**
 * Test environment setup helpers
 */
export const testEnvironment = {
  // Setup test data in localStorage
  setupLocalStorage: (data: Record<string, any>) => {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  },

  // Clear test data
  cleanup: () => {
    localStorage.clear();
    sessionStorage.clear();
  },

  // Mock window properties
  mockWindow: (properties: Record<string, any>) => {
    const originalProperties: Record<string, any> = {};
    
    Object.entries(properties).forEach(([key, value]) => {
      originalProperties[key] = (window as any)[key];
      (window as any)[key] = value;
    });

    return () => {
      Object.entries(originalProperties).forEach(([key, value]) => {
        (window as any)[key] = value;
      });
    };
  },

  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    const mocks = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    };

    Object.assign(console, mocks);

    return {
      mocks,
      restore: () => Object.assign(console, originalConsole),
    };
  },
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';