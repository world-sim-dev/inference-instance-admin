// API endpoints
export const API_ENDPOINTS = {
  INSTANCES: '/api/instances',
  HISTORY: '/api/history',
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  INSTANCES: ['instances'],
  INSTANCE_DETAIL: (id: number) => ['instances', id],
  HISTORY: ['history'],
  INSTANCE_HISTORY: (id: number) => ['history', 'instance', id],
} as const;

// App constants
export const APP_CONFIG = {
  NAME: 'Instance Manager',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 10,
} as const;
