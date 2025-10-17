# Migration Guide: From Legacy Frontend to React

## Overview

This guide provides detailed steps for migrating from the legacy HTML/JavaScript frontend to the new React-based application. It covers data migration, feature mapping, deployment transition, and rollback procedures.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Feature Mapping](#feature-mapping)
4. [Data Migration](#data-migration)
5. [Step-by-Step Migration](#step-by-step-migration)
6. [Testing and Validation](#testing-and-validation)
7. [Deployment Strategy](#deployment-strategy)
8. [Rollback Procedures](#rollback-procedures)
9. [Post-Migration Tasks](#post-migration-tasks)
10. [Troubleshooting](#troubleshooting)

## Migration Overview

### What's Changing

**From Legacy System:**
- Static HTML templates with jQuery
- Server-side rendering with Jinja2
- Inline JavaScript and CSS
- Manual DOM manipulation
- Limited component reusability

**To React System:**
- Component-based React architecture
- Client-side rendering with API integration
- TypeScript for type safety
- Modern build tools (Vite)
- Responsive design with Ant Design

### Migration Benefits

1. **Better User Experience**: Faster interactions, better responsiveness
2. **Improved Maintainability**: Component-based architecture, TypeScript
3. **Enhanced Performance**: Code splitting, lazy loading, optimized bundles
4. **Modern Development**: Hot reload, better debugging tools
5. **Scalability**: Easier to add new features and maintain

### Timeline

- **Phase 1**: Setup and basic functionality (2-3 weeks)
- **Phase 2**: Feature parity with legacy system (3-4 weeks)
- **Phase 3**: Testing and optimization (1-2 weeks)
- **Phase 4**: Deployment and monitoring (1 week)

## Pre-Migration Checklist

### Environment Preparation

- [ ] Node.js 18+ installed
- [ ] React development environment setup
- [ ] API endpoints documented and tested
- [ ] Database schema reviewed
- [ ] Backup procedures in place

### Legacy System Analysis

- [ ] Document all existing features
- [ ] Identify custom JavaScript functions
- [ ] Map all API endpoints
- [ ] Document user workflows
- [ ] Identify browser compatibility requirements

### Team Preparation

- [ ] React training for development team
- [ ] TypeScript basics covered
- [ ] Testing strategy defined
- [ ] Code review process established
- [ ] Deployment pipeline configured

## Feature Mapping

### Legacy to React Component Mapping

| Legacy Feature | Legacy Implementation | React Component | Status |
|---|---|---|---|
| Instance Table | `templates/dashboard.html` + `static/js/dashboard.js` | `InstanceTable.tsx` | ✅ Complete |
| Create Modal | `templates/modals/create-instance-modal.html` | `CreateInstanceModal.tsx` | ✅ Complete |
| Edit Modal | `templates/modals/detailed-view-modal.html` | `ViewDetailsModal.tsx` | ✅ Complete |
| Form Handling | `static/js/form-handler.js` | `InstanceForm.tsx` | ✅ Complete |
| API Client | `static/js/api-client.js` | `services/api.ts` | ✅ Complete |
| History View | `static/js/history-handler.js` | `HistoryModal.tsx` | ✅ Complete |
| Error Handling | Inline error divs | `ErrorBoundary.tsx` + `ErrorDisplay.tsx` | ✅ Complete |
| Loading States | Manual spinner HTML | `SkeletonLoader.tsx` | ✅ Complete |
| Notifications | Alert() calls | `NotificationSystem.tsx` | ✅ Complete |

### API Endpoint Mapping

| Legacy Endpoint | Method | React Integration | Notes |
|---|---|---|---|
| `/` | GET | Dashboard page load | Now client-side routing |
| `/instances` | GET | `InstanceApi.getInstances()` | Same endpoint |
| `/instances` | POST | `InstanceApi.createInstance()` | Same endpoint |
| `/instances/{id}` | PUT | `InstanceApi.updateInstance()` | Same endpoint |
| `/instances/{id}` | DELETE | `InstanceApi.deleteInstance()` | Same endpoint |
| `/instances/{id}/history` | GET | `HistoryApi.getInstanceHistory()` | Same endpoint |

### JavaScript Function Migration

| Legacy Function | File | React Equivalent | Migration Notes |
|---|---|---|---|
| `loadInstances()` | `dashboard.js` | `useInstances()` hook | Now uses React hooks |
| `openCreateModal()` | `dashboard.js` | Modal state management | Context-based state |
| `submitForm()` | `form-handler.js` | Form component submit | Built into form components |
| `validateForm()` | `form-handler.js` | Form validation hooks | Uses react-hook-form |
| `showNotification()` | `ui-utils.js` | `notification.success()` | Ant Design notifications |
| `formatDate()` | `ui-utils.js` | `dayjs` utility | Modern date library |

## Data Migration

### Local Storage Migration

The legacy system may have stored data in localStorage that needs to be migrated:

```typescript
// src/utils/migrationUtils.ts
interface LegacyData {
  userPreferences?: any;
  cachedInstances?: any;
  formData?: any;
}

export const migrateLegacyData = (): void => {
  try {
    // Check for legacy data
    const legacyPrefs = localStorage.getItem('user_preferences');
    const legacyCache = localStorage.getItem('instances_cache');
    
    if (legacyPrefs) {
      const prefs = JSON.parse(legacyPrefs);
      // Migrate to new format
      localStorage.setItem('app_preferences', JSON.stringify({
        theme: prefs.theme || 'light',
        pageSize: prefs.pageSize || 20,
        sortOrder: prefs.sortOrder || 'desc',
      }));
      
      // Remove legacy data
      localStorage.removeItem('user_preferences');
    }
    
    if (legacyCache) {
      // Clear legacy cache as React will manage its own cache
      localStorage.removeItem('instances_cache');
    }
    
    console.log('Legacy data migration completed');
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }
};

// Run migration on app startup
// src/main.tsx
import { migrateLegacyData } from './utils/migrationUtils';

migrateLegacyData();
```

### Session Data Migration

```typescript
// Handle session data migration
export const migrateSessionData = (): void => {
  try {
    const legacySession = sessionStorage.getItem('current_session');
    
    if (legacySession) {
      const session = JSON.parse(legacySession);
      
      // Migrate authentication token
      if (session.token) {
        localStorage.setItem('auth_token', session.token);
      }
      
      // Migrate user info
      if (session.user) {
        localStorage.setItem('user_info', JSON.stringify(session.user));
      }
      
      // Clear legacy session
      sessionStorage.removeItem('current_session');
    }
  } catch (error) {
    console.error('Failed to migrate session data:', error);
  }
};
```

## Step-by-Step Migration

### Phase 1: Setup and Infrastructure

#### 1. Setup React Application

```bash
# Create React application
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Install additional dependencies
npm install antd axios dayjs react-router-dom
npm install -D @types/node
```

#### 2. Configure Build System

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

#### 3. Setup Project Structure

```bash
mkdir -p src/{components,pages,hooks,services,utils,types,styles}
mkdir -p src/components/{common,forms,modals,tables,Layout}
```

### Phase 2: Core Components Migration

#### 1. Create Base Components

```typescript
// src/components/Layout/AppLayout.tsx
import React from 'react';
import { Layout, Menu } from 'antd';

const { Header, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <Layout>
      <Header>
        <div className="logo">Inference Dashboard</div>
      </Header>
      <Content style={{ padding: '24px' }}>
        {children}
      </Content>
    </Layout>
  );
};
```

#### 2. Migrate API Client

```typescript
// src/services/api.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Migrate legacy API functions
export const instanceApi = {
  getAll: () => apiClient.get('/instances'),
  create: (data: any) => apiClient.post('/instances', data),
  update: (id: number, data: any) => apiClient.put(`/instances/${id}`, data),
  delete: (id: number) => apiClient.delete(`/instances/${id}`),
};
```

#### 3. Create Instance Table

```typescript
// src/components/tables/InstanceTable.tsx
import React from 'react';
import { Table, Button, Space } from 'antd';
import type { Instance } from '@/types/instance';

interface InstanceTableProps {
  instances: Instance[];
  loading?: boolean;
  onEdit: (instance: Instance) => void;
  onDelete: (id: number) => void;
}

export const InstanceTable: React.FC<InstanceTableProps> = ({
  instances,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Model',
      dataIndex: 'model_name',
      key: 'model_name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Instance) => (
        <Space>
          <Button onClick={() => onEdit(record)}>Edit</Button>
          <Button danger onClick={() => onDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={instances}
      loading={loading}
      rowKey="id"
    />
  );
};
```

### Phase 3: Feature Implementation

#### 1. Implement Dashboard Page

```typescript
// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button, Space } from 'antd';
import { InstanceTable } from '@/components/tables/InstanceTable';
import { CreateInstanceModal } from '@/components/modals/CreateInstanceModal';
import { useInstances } from '@/hooks/useInstances';

export const Dashboard: React.FC = () => {
  const { instances, loading, createInstance, updateInstance, deleteInstance } = useInstances();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setShowCreateModal(true)}>
          Create Instance
        </Button>
      </Space>

      <InstanceTable
        instances={instances}
        loading={loading}
        onEdit={handleEdit}
        onDelete={deleteInstance}
      />

      <CreateInstanceModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(instance) => {
          createInstance(instance);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};
```

#### 2. Implement Forms

```typescript
// src/components/forms/InstanceForm.tsx
import React from 'react';
import { Form, Input, InputNumber, Select, Button } from 'antd';
import type { Instance } from '@/types/instance';

interface InstanceFormProps {
  instance?: Instance;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export const InstanceForm: React.FC<InstanceFormProps> = ({
  instance,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={instance}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="name"
        label="Instance Name"
        rules={[{ required: true, message: 'Please enter instance name' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="model_name"
        label="Model Name"
        rules={[{ required: true, message: 'Please enter model name' }]}
      >
        <Input />
      </Form.Item>

      {/* Add other form fields */}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {instance ? 'Update' : 'Create'} Instance
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### Phase 4: Testing and Validation

#### 1. Unit Tests

```typescript
// src/components/tables/__tests__/InstanceTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { InstanceTable } from '../InstanceTable';

const mockInstances = [
  {
    id: 1,
    name: 'test-instance',
    model_name: 'test-model',
    status: 'active',
  },
];

describe('InstanceTable', () => {
  it('renders instances correctly', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <InstanceTable
        instances={mockInstances}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('test-instance')).toBeInTheDocument();
    expect(screen.getByText('test-model')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <InstanceTable
        instances={mockInstances}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockInstances[0]);
  });
});
```

#### 2. Integration Tests

```typescript
// src/test/integration/migration.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/pages/Dashboard';
import * as api from '@/services/api';

jest.mock('@/services/api');

describe('Migration Integration', () => {
  it('should load instances from API', async () => {
    const mockInstances = [
      { id: 1, name: 'test-instance', model_name: 'test-model', status: 'active' }
    ];

    (api.instanceApi.getAll as jest.Mock).mockResolvedValue({
      data: mockInstances
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('test-instance')).toBeInTheDocument();
    });
  });
});
```

## Deployment Strategy

### Blue-Green Deployment

1. **Setup Blue Environment** (Current Legacy)
   - Keep legacy system running
   - Monitor traffic and performance

2. **Setup Green Environment** (New React App)
   - Deploy React application to new infrastructure
   - Configure load balancer for gradual traffic shift

3. **Traffic Migration**
   ```nginx
   # nginx.conf - Gradual traffic shift
   upstream legacy_backend {
       server legacy-app:80 weight=70;
   }
   
   upstream react_backend {
       server react-app:80 weight=30;
   }
   
   server {
       listen 80;
       
       location / {
           # Route based on user agent or feature flag
           if ($http_user_agent ~* "modern-browser") {
               proxy_pass http://react_backend;
           }
           proxy_pass http://legacy_backend;
       }
   }
   ```

### Feature Flag Approach

```typescript
// src/utils/featureFlags.ts
interface FeatureFlags {
  useReactApp: boolean;
  enableNewFeatures: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  return {
    useReactApp: localStorage.getItem('use_react_app') === 'true',
    enableNewFeatures: localStorage.getItem('enable_new_features') === 'true',
  };
};

// Gradual rollout
export const shouldUseReactApp = (): boolean => {
  const flags = getFeatureFlags();
  const userId = getCurrentUserId();
  
  // Enable for specific users first
  if (flags.useReactApp) return true;
  
  // Enable for percentage of users
  const rolloutPercentage = 20; // Start with 20%
  return (userId % 100) < rolloutPercentage;
};
```

### Rollback Strategy

```bash
#!/bin/bash
# rollback.sh - Quick rollback script

echo "Starting rollback to legacy system..."

# Update load balancer to route all traffic to legacy
kubectl patch service frontend-service -p '{"spec":{"selector":{"app":"legacy-frontend"}}}'

# Scale down React deployment
kubectl scale deployment react-frontend --replicas=0

# Verify legacy system is healthy
curl -f http://legacy-frontend/health || exit 1

echo "Rollback completed successfully"
```

## Testing and Validation

### Pre-Migration Testing

1. **Legacy System Baseline**
   ```bash
   # Performance baseline
   lighthouse http://localhost:8000 --output=json --output-path=legacy-baseline.json
   
   # Load testing
   ab -n 1000 -c 10 http://localhost:8000/
   ```

2. **API Compatibility Testing**
   ```typescript
   // test/api-compatibility.test.ts
   describe('API Compatibility', () => {
     it('should maintain same response format', async () => {
       const legacyResponse = await fetch('/api/instances');
       const reactResponse = await instanceApi.getAll();
       
       expect(reactResponse.data).toMatchObject(legacyResponse.data);
     });
   });
   ```

### Post-Migration Validation

1. **Feature Parity Checklist**
   - [ ] All CRUD operations work
   - [ ] Search and filtering functional
   - [ ] History viewing works
   - [ ] Error handling consistent
   - [ ] Performance meets requirements

2. **User Acceptance Testing**
   ```typescript
   // test/e2e/user-acceptance.test.ts
   import { test, expect } from '@playwright/test';
   
   test('complete user workflow', async ({ page }) => {
     await page.goto('/');
     
     // Test instance creation
     await page.click('[data-testid="create-instance-btn"]');
     await page.fill('[data-testid="instance-name"]', 'test-instance');
     await page.click('[data-testid="submit-btn"]');
     
     // Verify instance appears in table
     await expect(page.locator('[data-testid="instance-row"]')).toContainText('test-instance');
   });
   ```

## Post-Migration Tasks

### 1. Legacy System Cleanup

```bash
# Remove legacy files after successful migration
rm -rf templates/
rm -rf static/js/dashboard.js
rm -rf static/js/form-handler.js
rm -rf static/js/api-client.js
rm -rf static/js/history-handler.js
rm -rf static/js/ui-utils.js

# Update server to serve only API endpoints
# Remove template rendering routes
```

### 2. Documentation Updates

- [ ] Update API documentation
- [ ] Create React component documentation
- [ ] Update deployment procedures
- [ ] Update troubleshooting guides

### 3. Monitoring Setup

```typescript
// src/utils/migrationMonitoring.ts
export const trackMigrationMetrics = () => {
  // Track page load times
  const navigationTiming = performance.getEntriesByType('navigation')[0];
  
  // Send metrics to monitoring service
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'page_load',
      duration: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
      timestamp: Date.now(),
    }),
  });
};
```

### 4. Performance Optimization

```typescript
// Implement performance monitoring
export const monitorPerformance = () => {
  // Monitor Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
};
```

## Troubleshooting

### Common Migration Issues

#### 1. API Response Format Differences

```typescript
// Handle API response format changes
const normalizeApiResponse = (response: any) => {
  // Legacy API might return different format
  if (response.results) {
    return response.results; // Legacy format
  }
  return response.data; // New format
};
```

#### 2. Browser Compatibility

```typescript
// Check for required browser features
const checkBrowserSupport = () => {
  const requiredFeatures = [
    'fetch',
    'Promise',
    'localStorage',
    'sessionStorage',
  ];
  
  const unsupported = requiredFeatures.filter(feature => !(feature in window));
  
  if (unsupported.length > 0) {
    console.warn('Unsupported browser features:', unsupported);
    // Redirect to legacy version or show upgrade message
  }
};
```

#### 3. State Management Issues

```typescript
// Handle state synchronization issues
export const syncStateWithLegacy = () => {
  // Listen for legacy system events
  window.addEventListener('legacy-state-change', (event) => {
    const { type, data } = event.detail;
    
    switch (type) {
      case 'instance-updated':
        // Update React state
        updateInstanceInState(data);
        break;
      case 'user-logged-out':
        // Handle logout
        handleLogout();
        break;
    }
  });
};
```

### Performance Issues

#### 1. Bundle Size Optimization

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist/stats.html

# Optimize imports
# Instead of: import { Button } from 'antd';
# Use: import Button from 'antd/es/button';
```

#### 2. Memory Leaks

```typescript
// Prevent memory leaks
export const useCleanup = () => {
  useEffect(() => {
    const cleanup = () => {
      // Cancel pending requests
      // Clear timers
      // Remove event listeners
    };
    
    return cleanup;
  }, []);
};
```

### Rollback Scenarios

#### When to Rollback

1. **Critical Bugs**: Data loss or corruption
2. **Performance Issues**: Significant performance degradation
3. **User Experience**: Major usability problems
4. **API Issues**: Backend compatibility problems

#### Rollback Procedure

```bash
#!/bin/bash
# emergency-rollback.sh

echo "EMERGENCY ROLLBACK INITIATED"

# 1. Switch traffic back to legacy
kubectl patch service frontend-service -p '{"spec":{"selector":{"app":"legacy-frontend"}}}'

# 2. Scale up legacy system
kubectl scale deployment legacy-frontend --replicas=3

# 3. Scale down React system
kubectl scale deployment react-frontend --replicas=0

# 4. Clear CDN cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# 5. Notify team
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-type: application/json' \
  --data '{"text":"🚨 Emergency rollback completed. Legacy system is now active."}'

echo "Rollback completed. Legacy system is now serving all traffic."
```

## Success Metrics

### Technical Metrics

- **Performance**: Page load time < 2 seconds
- **Bundle Size**: < 1MB gzipped
- **Error Rate**: < 0.1%
- **API Response Time**: < 500ms
- **Test Coverage**: > 80%

### User Experience Metrics

- **User Satisfaction**: > 4.5/5
- **Task Completion Rate**: > 95%
- **Support Tickets**: < 10% increase
- **User Adoption**: > 90% within 30 days

### Business Metrics

- **Development Velocity**: 30% improvement
- **Maintenance Cost**: 40% reduction
- **Feature Delivery**: 50% faster
- **Bug Resolution**: 60% faster

## Conclusion

This migration guide provides a comprehensive approach to transitioning from the legacy frontend to the modern React application. Following these steps ensures a smooth migration with minimal disruption to users and business operations.

Remember to:
- Test thoroughly at each phase
- Monitor performance continuously
- Have rollback procedures ready
- Communicate changes to stakeholders
- Document lessons learned for future migrations