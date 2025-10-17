# React Frontend Development Guide

## Overview

This document provides comprehensive guidance for developing and maintaining the React-based frontend for the Inference Instance Management System. The application is built with modern React patterns, TypeScript, and Ant Design components.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Testing Strategy](#testing-strategy)
8. [Performance Guidelines](#performance-guidelines)
9. [Accessibility](#accessibility)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd inference-dashboard

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create a `.env.development` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=Inference Dashboard
VITE_ENABLE_MOCK_API=false
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components (buttons, inputs, etc.)
│   │   ├── forms/          # Form-specific components
│   │   ├── modals/         # Modal dialog components
│   │   ├── tables/         # Table and data display components
│   │   └── Layout/         # Layout components
│   ├── pages/              # Page-level components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services and external integrations
│   ├── contexts/           # React Context providers
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── styles/             # Global styles and themes
│   └── test/               # Test utilities and setup
├── public/                 # Static assets
├── docs/                   # Documentation
└── dist/                   # Build output (generated)
```

## Development Workflow

### Code Style and Standards

We use ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

### Git Workflow

1. Create feature branches from `main`
2. Use conventional commit messages
3. Run tests before committing
4. Create pull requests for code review

```bash
# Example commit messages
git commit -m "feat: add instance creation form"
git commit -m "fix: resolve table pagination issue"
git commit -m "docs: update component usage guide"
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Type checking
npm run type-check
```

## Component Architecture

### Component Design Principles

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition to build complex UIs
3. **Props Interface**: Always define TypeScript interfaces for props
4. **Error Boundaries**: Wrap components that might fail
5. **Accessibility**: Include ARIA labels and keyboard navigation

### Component Structure

```typescript
// ComponentName.tsx
import React from 'react';
import { ComponentNameProps } from './types';
import styles from './ComponentName.module.css';

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // Component logic here
  
  return (
    <div className={styles.container} {...props}>
      {/* Component JSX */}
    </div>
  );
};

// types.ts
export interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  children?: React.ReactNode;
}
```

### Component Categories

#### 1. Common Components (`src/components/common/`)

Generic, reusable components used throughout the application:

- `SearchInput`: Debounced search input with clear functionality
- `SkeletonLoader`: Loading placeholders for better UX
- `ErrorDisplay`: Consistent error message display
- `NotificationSystem`: Toast notifications and alerts
- `AccessibilityHelper`: Screen reader and keyboard navigation aids

#### 2. Form Components (`src/components/forms/`)

Form-related components with validation and error handling:

- `InstanceForm`: Main form for creating/editing instances
- `JsonEditor`: JSON field editor with syntax highlighting
- `FormErrorHandler`: Centralized form error management

#### 3. Table Components (`src/components/tables/`)

Data display and interaction components:

- `InstanceTable`: Main data table with sorting and filtering
- `InstanceCard`: Card view for mobile/responsive layouts
- `InstanceGrid`: Grid layout for dashboard view
- `VirtualizedInstanceTable`: Performance-optimized table for large datasets

#### 4. Modal Components (`src/components/modals/`)

Dialog and overlay components:

- `CreateInstanceModal`: Instance creation dialog
- `ViewDetailsModal`: Instance details viewer
- `DeleteConfirmModal`: Confirmation dialog for deletions
- `HistoryModal`: History viewing and comparison

## State Management

### Global State with Context API

The application uses React Context API with useReducer for global state management:

```typescript
// contexts/AppContext.tsx
interface AppState {
  instances: {
    data: Instance[];
    loading: boolean;
    error: string | null;
  };
  ui: {
    selectedInstanceId: number | null;
    searchTerm: string;
    filters: InstanceFilters;
  };
  modals: {
    createInstance: boolean;
    editInstance: boolean;
    deleteConfirm: boolean;
  };
}

// Usage in components
const { state, dispatch } = useAppContext();
```

### Local State Guidelines

- Use `useState` for simple component-local state
- Use `useReducer` for complex state logic
- Use `useMemo` and `useCallback` to optimize performance
- Avoid prop drilling - use Context for deeply nested state

### State Update Patterns

```typescript
// Action-based updates
dispatch({
  type: 'LOAD_INSTANCES_SUCCESS',
  payload: instances
});

// Optimistic updates
dispatch({
  type: 'CREATE_INSTANCE_OPTIMISTIC',
  payload: newInstance
});

// Error handling
dispatch({
  type: 'LOAD_INSTANCES_ERROR',
  payload: 'Failed to load instances'
});
```

## API Integration

### API Client Structure

The API client is built with Axios and provides type-safe methods:

```typescript
// services/api.ts
class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 10000,
    });
  }
  
  // Instance methods
  async getInstances(params?: InstanceQueryParams): Promise<Instance[]>
  async createInstance(data: CreateInstanceData): Promise<Instance>
  async updateInstance(id: number, data: UpdateInstanceData): Promise<Instance>
  async deleteInstance(id: number): Promise<void>
}
```

### Custom Hooks for Data Fetching

```typescript
// hooks/useInstances.ts
export const useInstances = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getInstances();
      setInstances(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { instances, loading, error, fetchInstances };
};
```

### Error Handling

```typescript
// utils/errorUtils.ts
export const handleApiError = (error: AxiosError): string => {
  if (error.response?.status === 404) {
    return 'Resource not found';
  }
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  return error.message || 'An unexpected error occurred';
};
```

## Testing Strategy

### Unit Tests

Use React Testing Library for component tests:

```typescript
// __tests__/InstanceTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { InstanceTable } from '../InstanceTable';

describe('InstanceTable', () => {
  it('renders instances correctly', () => {
    const mockInstances = [
      { id: 1, name: 'test-instance', status: 'active' }
    ];
    
    render(<InstanceTable instances={mockInstances} />);
    
    expect(screen.getByText('test-instance')).toBeInTheDocument();
  });
  
  it('handles row selection', () => {
    const onSelect = jest.fn();
    render(<InstanceTable instances={[]} onSelect={onSelect} />);
    
    // Test selection logic
  });
});
```

### Integration Tests

Test component interactions and API integration:

```typescript
// test/integration/api-integration.test.ts
describe('API Integration', () => {
  it('should create instance successfully', async () => {
    const instanceData = {
      name: 'test-instance',
      model_name: 'test-model'
    };
    
    const response = await apiClient.createInstance(instanceData);
    expect(response.id).toBeDefined();
  });
});
```

### E2E Tests

Use Playwright for end-to-end testing:

```typescript
// test/integration/e2e/user-flows.test.ts
import { test, expect } from '@playwright/test';

test('complete instance management flow', async ({ page }) => {
  await page.goto('/');
  
  // Test full user workflow
  await page.click('[data-testid="create-instance-btn"]');
  await page.fill('[data-testid="instance-name"]', 'test-instance');
  await page.click('[data-testid="submit-btn"]');
  
  await expect(page.locator('[data-testid="instance-row"]')).toContainText('test-instance');
});
```

## Performance Guidelines

### Optimization Techniques

1. **React.memo**: Prevent unnecessary re-renders
2. **useMemo**: Cache expensive calculations
3. **useCallback**: Stabilize function references
4. **Code Splitting**: Lazy load components
5. **Virtualization**: Handle large datasets efficiently

### Performance Monitoring

```typescript
// hooks/usePerformanceMonitor.ts
export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`${componentName} render time: ${endTime - startTime}ms`);
    };
  });
};
```

### Bundle Optimization

```typescript
// Lazy loading
const HistoryModal = lazy(() => import('./components/modals/HistoryModal'));

// Code splitting by route
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

## Accessibility

### ARIA Guidelines

- Use semantic HTML elements
- Provide ARIA labels for interactive elements
- Ensure proper heading hierarchy
- Support keyboard navigation

### Implementation Examples

```typescript
// Accessible button
<button
  aria-label="Delete instance"
  aria-describedby="delete-help-text"
  onClick={handleDelete}
>
  <DeleteIcon />
</button>

// Accessible form
<form role="form" aria-labelledby="form-title">
  <h2 id="form-title">Create Instance</h2>
  <input
    aria-label="Instance name"
    aria-required="true"
    aria-invalid={hasError}
  />
</form>
```

### Keyboard Navigation

```typescript
// hooks/useKeyboardShortcuts.ts
export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'n') {
        // Open create modal
        event.preventDefault();
        openCreateModal();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);
};
```

## Troubleshooting

### Common Issues

#### 1. Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### 2. Type Errors

```bash
# Run type checking
npm run type-check

# Update TypeScript definitions
npm update @types/react @types/react-dom
```

#### 3. API Connection Issues

Check environment variables and network connectivity:

```typescript
// Debug API calls
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Request config:', axiosConfig);
```

#### 4. Performance Issues

Use React DevTools Profiler to identify bottlenecks:

```typescript
// Add performance markers
performance.mark('component-start');
// Component logic
performance.mark('component-end');
performance.measure('component-render', 'component-start', 'component-end');
```

### Debug Tools

- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Console for error tracking
- Lighthouse for performance auditing

### Logging

```typescript
// utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  }
};
```

## Best Practices

### Code Organization

1. Group related files together
2. Use index files for clean imports
3. Keep components small and focused
4. Extract custom hooks for reusable logic
5. Use TypeScript strictly

### Performance

1. Minimize bundle size
2. Optimize images and assets
3. Use proper caching strategies
4. Implement error boundaries
5. Monitor Core Web Vitals

### Security

1. Validate all user inputs
2. Sanitize data before display
3. Use HTTPS in production
4. Implement proper error handling
5. Keep dependencies updated

### Maintenance

1. Regular dependency updates
2. Code review process
3. Automated testing
4. Performance monitoring
5. Documentation updates

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Ant Design Components](https://ant.design/components/overview/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)