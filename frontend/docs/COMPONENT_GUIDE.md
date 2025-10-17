# Component Usage Guide

## Overview

This guide provides detailed documentation for all React components in the Inference Dashboard application. Each component is documented with its purpose, props interface, usage examples, and best practices.

## Table of Contents

1. [Common Components](#common-components)
2. [Form Components](#form-components)
3. [Table Components](#table-components)
4. [Modal Components](#modal-components)
5. [History Components](#history-components)
6. [Layout Components](#layout-components)
7. [Page Components](#page-components)
8. [Custom Hooks](#custom-hooks)
9. [Usage Patterns](#usage-patterns)

## Common Components

### SearchInput

A debounced search input component with clear functionality.

**Props Interface:**
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
}
```

**Usage Example:**
```typescript
import { SearchInput } from '@/components/common/SearchInput';

const MyComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <SearchInput
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Search instances..."
      debounceMs={300}
      onClear={() => setSearchTerm('')}
    />
  );
};
```

**Features:**
- Automatic debouncing to prevent excessive API calls
- Built-in clear button
- Keyboard navigation support
- Accessibility compliant

### SkeletonLoader

Loading placeholder component for better user experience during data fetching.

**Props Interface:**
```typescript
interface SkeletonLoaderProps {
  type: 'text' | 'card' | 'table' | 'custom';
  rows?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
}
```

**Usage Example:**
```typescript
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

const InstanceList = () => {
  const { instances, loading } = useInstances();
  
  if (loading) {
    return <SkeletonLoader type="table" rows={5} />;
  }
  
  return <InstanceTable instances={instances} />;
};
```

### ErrorDisplay

Consistent error message display with retry functionality.

**Props Interface:**
```typescript
interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}
```

**Usage Example:**
```typescript
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

const DataComponent = () => {
  const { data, error, refetch } = useQuery('instances', fetchInstances);
  
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={refetch}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }
  
  return <div>{/* Render data */}</div>;
};
```

### NotificationSystem

Toast notifications and alert system.

**Props Interface:**
```typescript
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
}
```

**Usage Example:**
```typescript
import { notification } from '@/components/common/NotificationSystem';

const handleSave = async () => {
  try {
    await saveInstance(data);
    notification.success({
      message: 'Success',
      description: 'Instance created successfully'
    });
  } catch (error) {
    notification.error({
      message: 'Error',
      description: 'Failed to create instance'
    });
  }
};
```

## Form Components

### InstanceForm

Main form component for creating and editing instances.

**Props Interface:**
```typescript
interface InstanceFormProps {
  instance?: Instance;
  onSubmit: (data: InstanceFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}
```

**Usage Example:**
```typescript
import { InstanceForm } from '@/components/forms/InstanceForm';

const CreateInstanceModal = () => {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (data: InstanceFormData) => {
    setLoading(true);
    try {
      await apiClient.createInstance(data);
      onSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <InstanceForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={onCancel}
      loading={loading}
    />
  );
};
```

**Form Sections:**
1. **Basic Information**: Name, model, version, cluster
2. **Resource Configuration**: PP, CP, TP, workers, replicas
3. **Advanced Options**: Pipeline mode, quantization, priorities
4. **Storage Settings**: VAE and T5 store types
5. **Performance Options**: CUDA graph, task concurrency

### JsonEditor

JSON field editor with syntax highlighting and validation.

**Props Interface:**
```typescript
interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  height?: number;
}
```

**Usage Example:**
```typescript
import { JsonEditor } from '@/components/forms/JsonEditor';

const ConfigForm = () => {
  const [envs, setEnvs] = useState({});
  
  return (
    <JsonEditor
      value={envs}
      onChange={setEnvs}
      placeholder="Enter environment variables..."
      height={200}
    />
  );
};
```

### FormErrorHandler

Centralized form error management component.

**Props Interface:**
```typescript
interface FormErrorHandlerProps {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  children: React.ReactNode;
}
```

## Table Components

### InstanceTable

Main data table with sorting, filtering, and pagination.

**Props Interface:**
```typescript
interface InstanceTableProps {
  instances: Instance[];
  loading?: boolean;
  onEdit: (instance: Instance) => void;
  onDelete: (instanceId: number) => void;
  onViewHistory: (instanceId: number) => void;
  onViewDetails: (instance: Instance) => void;
  selectedRowKeys?: number[];
  onSelectionChange?: (selectedKeys: number[]) => void;
}
```

**Usage Example:**
```typescript
import { InstanceTable } from '@/components/tables/InstanceTable';

const Dashboard = () => {
  const { instances, loading } = useInstances();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  return (
    <InstanceTable
      instances={instances}
      loading={loading}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onViewHistory={handleViewHistory}
      onViewDetails={handleViewDetails}
      selectedRowKeys={selectedRows}
      onSelectionChange={setSelectedRows}
    />
  );
};
```

**Features:**
- Sortable columns
- Row selection (single/multiple)
- Pagination
- Responsive design
- Status indicators
- Action buttons

### InstanceCard

Card view component for mobile and responsive layouts.

**Props Interface:**
```typescript
interface InstanceCardProps {
  instance: Instance;
  onEdit: (instance: Instance) => void;
  onDelete: (instanceId: number) => void;
  onViewHistory: (instanceId: number) => void;
  selected?: boolean;
  onSelect?: (instanceId: number) => void;
}
```

### VirtualizedInstanceTable

Performance-optimized table for large datasets.

**Props Interface:**
```typescript
interface VirtualizedInstanceTableProps extends InstanceTableProps {
  height: number;
  rowHeight?: number;
  overscan?: number;
}
```

**Usage Example:**
```typescript
import { VirtualizedInstanceTable } from '@/components/tables/VirtualizedInstanceTable';

const LargeDatasetView = () => {
  const { instances } = useInstances();
  
  return (
    <VirtualizedInstanceTable
      instances={instances}
      height={600}
      rowHeight={50}
      overscan={5}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
```

## Modal Components

### CreateInstanceModal

Modal dialog for creating new instances.

**Props Interface:**
```typescript
interface CreateInstanceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (instance: Instance) => void;
}
```

**Usage Example:**
```typescript
import { CreateInstanceModal } from '@/components/modals/CreateInstanceModal';

const Dashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const handleSuccess = (instance: Instance) => {
    setShowCreateModal(false);
    // Refresh instance list
    refetchInstances();
  };
  
  return (
    <>
      <Button onClick={() => setShowCreateModal(true)}>
        Create Instance
      </Button>
      
      <CreateInstanceModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};
```

### ViewDetailsModal

Modal for viewing instance details in read-only mode.

**Props Interface:**
```typescript
interface ViewDetailsModalProps {
  instance: Instance | null;
  visible: boolean;
  onClose: () => void;
}
```

### DeleteConfirmModal

Confirmation dialog for delete operations.

**Props Interface:**
```typescript
interface DeleteConfirmModalProps {
  instance: Instance | null;
  visible: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
```

### HistoryModal

Modal for viewing instance history and comparisons.

**Props Interface:**
```typescript
interface HistoryModalProps {
  visible: boolean;
  instance?: Instance;
  onClose: () => void;
  onError?: (error: Error) => void;
  showComparison?: boolean;
  defaultFilters?: HistoryFilters;
  maxRecords?: number;
}
```

**Usage Example:**
```typescript
import { HistoryModal } from '@/components/modals/HistoryModal';

const InstanceManager = () => {
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

  const handleViewHistory = (instance: Instance) => {
    setSelectedInstance(instance);
    setHistoryVisible(true);
  };

  return (
    <>
      <InstanceTable onViewHistory={handleViewHistory} />
      
      <HistoryModal
        visible={historyVisible}
        instance={selectedInstance}
        onClose={() => setHistoryVisible(false)}
        showComparison={true}
        defaultFilters={{
          operation_type: ['update'],
          date_range: {
            start: dayjs().subtract(7, 'days').toISOString(),
            end: dayjs().toISOString()
          }
        }}
      />
    </>
  );
};
```

## History Components

### HistoryList

Standalone component for displaying history records in various contexts.

**Props Interface:**
```typescript
interface HistoryListProps {
  instanceId?: number;
  records?: HistoryRecord[];
  loading?: boolean;
  error?: string | null;
  filters?: HistoryFilters;
  pageSize?: number;
  showActions?: boolean;
  compact?: boolean;
  virtualized?: boolean;
  onRecordClick?: (record: HistoryRecord) => void;
  onRecordSelect?: (record: HistoryRecord, selected: boolean) => void;
  onLoadMore?: () => void;
}
```

**Usage Example:**
```typescript
import { HistoryList } from '@/components/history/HistoryList';

const InstanceDetailPage = ({ instanceId }: { instanceId: number }) => {
  const { history, loading, error } = useHistory(instanceId);

  return (
    <div className="instance-detail">
      <h2>Instance History</h2>
      <HistoryList
        instanceId={instanceId}
        records={history}
        loading={loading}
        error={error}
        compact={true}
        showActions={false}
        onRecordClick={(record) => {
          showRecordDetails(record);
        }}
      />
    </div>
  );
};
```

### HistoryDetail

Component for displaying detailed information about a single history record.

**Props Interface:**
```typescript
interface HistoryDetailProps {
  record: HistoryRecord;
  showMetadata?: boolean;
  compact?: boolean;
  expandedFields?: string[];
  onFieldExpand?: (field: string) => void;
  customFieldRenderer?: (field: string, value: any) => React.ReactNode;
}
```

**Usage Example:**
```typescript
import { HistoryDetail } from '@/components/history/HistoryDetail';

const RecordDetailModal = ({ record, visible, onClose }) => {
  const customFieldRenderer = (field: string, value: any) => {
    if (field === 'envs' && typeof value === 'object') {
      return <JsonViewer data={value} collapsed={false} />;
    }
    return null; // Use default renderer
  };

  return (
    <Modal title="History Record Details" open={visible} onCancel={onClose}>
      <HistoryDetail
        record={record}
        showMetadata={true}
        customFieldRenderer={customFieldRenderer}
      />
    </Modal>
  );
};
```

### HistoryComparison

Component for comparing two history records side by side.

**Props Interface:**
```typescript
interface HistoryComparisonProps {
  record1: HistoryRecord;
  record2: HistoryRecord;
  showOnlyDifferences?: boolean;
  highlightChanges?: boolean;
  customDiffRenderer?: (field: string, oldValue: any, newValue: any) => React.ReactNode;
  onExport?: (format: 'json' | 'csv' | 'pdf') => void;
}
```

**Usage Example:**
```typescript
import { HistoryComparison } from '@/components/history/HistoryComparison';

const ComparisonView = ({ record1, record2 }) => {
  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    const comparisonData = generateComparisonData(record1, record2);
    exportData(comparisonData, format);
  };

  return (
    <HistoryComparison
      record1={record1}
      record2={record2}
      showOnlyDifferences={true}
      highlightChanges={true}
      onExport={handleExport}
    />
  );
};
```

### VirtualizedHistoryList

Performance-optimized history list for large datasets.

**Props Interface:**
```typescript
interface VirtualizedHistoryListProps extends HistoryListProps {
  height: number;
  itemHeight?: number;
  overscan?: number;
}
```

**Usage Example:**
```typescript
import { VirtualizedHistoryList } from '@/components/history/VirtualizedHistoryList';

const LargeHistoryView = ({ instanceId }: { instanceId: number }) => {
  const { history, loading, hasMore, loadMore } = useInfiniteHistory(instanceId);

  return (
    <VirtualizedHistoryList
      records={history}
      loading={loading}
      height={600}
      itemHeight={120}
      overscan={5}
      onLoadMore={hasMore ? loadMore : undefined}
    />
  );
};
```

### HistoryFilters

Component for filtering and searching history records.

**Props Interface:**
```typescript
interface HistoryFiltersProps {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
  onReset: () => void;
  compact?: boolean;
  showAdvanced?: boolean;
}
```

**Usage Example:**
```typescript
import { HistoryFilters } from '@/components/history/HistoryFilters';

const HistoryPage = () => {
  const [filters, setFilters] = useState<HistoryFilters>({});

  return (
    <div>
      <HistoryFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
        showAdvanced={true}
      />
      <HistoryList filters={filters} />
    </div>
  );
};
```

## Layout Components

### AppLayout

Main application layout with navigation and content areas.

**Props Interface:**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}
```

**Usage Example:**
```typescript
import { AppLayout } from '@/components/Layout/AppLayout';

const App = () => {
  return (
    <AppLayout title="Inference Dashboard">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/instances" element={<InstancesPage />} />
      </Routes>
    </AppLayout>
  );
};
```

## Custom Hooks

### useInstances

Hook for managing instance data with CRUD operations.

**Interface:**
```typescript
interface UseInstancesReturn {
  instances: Instance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createInstance: (data: CreateInstanceData) => Promise<Instance>;
  updateInstance: (id: number, data: UpdateInstanceData) => Promise<Instance>;
  deleteInstance: (id: number) => Promise<void>;
}
```

**Usage Example:**
```typescript
import { useInstances } from '@/hooks/useInstances';

const InstanceManager = () => {
  const {
    instances,
    loading,
    error,
    createInstance,
    updateInstance,
    deleteInstance,
    refetch
  } = useInstances();
  
  const handleCreate = async (data: CreateInstanceData) => {
    try {
      await createInstance(data);
      // Instance list will be automatically updated
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <div>
      {loading && <SkeletonLoader type="table" />}
      {error && <ErrorDisplay error={error} onRetry={refetch} />}
      {instances && <InstanceTable instances={instances} />}
    </div>
  );
};
```

### useHistory

Hook for managing instance history data with advanced features.

**Interface:**
```typescript
interface UseHistoryReturn {
  history: HistoryRecord[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  filters: HistoryFilters;
  selectedRecords: HistoryRecord[];
  // Actions
  loadHistory: (instanceId: number, options?: LoadOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: HistoryFilters) => void;
  selectRecord: (record: HistoryRecord) => void;
  deselectRecord: (record: HistoryRecord) => void;
  clearSelection: () => void;
  compareVersions: (id1: number, id2: number) => Promise<HistoryComparison>;
  exportHistory: (format: 'json' | 'csv') => void;
  refetch: () => Promise<void>;
}
```

**Usage Example:**
```typescript
import { useHistory } from '@/hooks/useHistory';

const HistoryManager = ({ instanceId }: { instanceId: number }) => {
  const {
    history,
    loading,
    error,
    pagination,
    filters,
    selectedRecords,
    loadHistory,
    loadMore,
    setFilters,
    selectRecord,
    compareVersions,
    exportHistory
  } = useHistory();

  useEffect(() => {
    if (instanceId) {
      loadHistory(instanceId);
    }
  }, [instanceId, loadHistory]);

  const handleCompare = async () => {
    if (selectedRecords.length === 2) {
      const comparison = await compareVersions(
        selectedRecords[0].id,
        selectedRecords[1].id
      );
      // Handle comparison result
    }
  };

  return (
    <div>
      <HistoryFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />
      
      <HistoryList
        records={history}
        loading={loading}
        error={error}
        onRecordSelect={selectRecord}
        onLoadMore={pagination.hasMore ? loadMore : undefined}
      />
      
      {selectedRecords.length === 2 && (
        <Button onClick={handleCompare}>
          Compare Selected Records
        </Button>
      )}
      
      <Button onClick={() => exportHistory('csv')}>
        Export History
      </Button>
    </div>
  );
};
```

### useAppContext

Hook for accessing global application state.

**Interface:**
```typescript
interface UseAppContextReturn {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  setSearchTerm: (term: string) => void;
  setFilters: (filters: InstanceFilters) => void;
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
}
```

## Usage Patterns

### Data Fetching Pattern

```typescript
const DataComponent = () => {
  const { data, loading, error, refetch } = useQuery(
    'queryKey',
    fetchFunction,
    {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  if (loading) return <SkeletonLoader type="card" />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
  
  return <DataDisplay data={data} />;
};
```

### Form Handling Pattern

```typescript
const FormComponent = () => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await submitForm(formData);
      onSuccess();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Modal Management Pattern

```typescript
const ModalManager = () => {
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    delete: false,
  });
  
  const openModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };
  
  const closeModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };
  
  return (
    <>
      <Button onClick={() => openModal('create')}>Create</Button>
      
      <CreateModal
        visible={modals.create}
        onClose={() => closeModal('create')}
      />
    </>
  );
};
```

### Error Boundary Pattern

```typescript
const SafeComponent = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={<ErrorDisplay error="Something went wrong" />}
      onError={(error, errorInfo) => {
        console.error('Component error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Performance Optimization Pattern

```typescript
const OptimizedComponent = React.memo(({ data, onAction }) => {
  const memoizedData = useMemo(() => {
    return processData(data);
  }, [data]);
  
  const handleAction = useCallback((id: number) => {
    onAction(id);
  }, [onAction]);
  
  return (
    <div>
      {memoizedData.map(item => (
        <Item
          key={item.id}
          data={item}
          onAction={handleAction}
        />
      ))}
    </div>
  );
});
```

## Best Practices

### Component Design

1. **Keep components small and focused**
2. **Use TypeScript interfaces for all props**
3. **Implement proper error boundaries**
4. **Include accessibility attributes**
5. **Use semantic HTML elements**

### State Management

1. **Use local state for component-specific data**
2. **Use context for shared application state**
3. **Implement optimistic updates for better UX**
4. **Handle loading and error states consistently**

### History Components

1. **Use virtualization for large history datasets**
2. **Implement proper caching for performance**
3. **Provide clear visual feedback for operations**
4. **Support keyboard navigation and accessibility**
5. **Handle comparison state properly**

### Performance

1. **Use React.memo for expensive components**
2. **Implement virtualization for large lists**
3. **Lazy load components when possible**
4. **Optimize bundle size with code splitting**

### Testing

1. **Test component behavior, not implementation**
2. **Use data-testid attributes for reliable selectors**
3. **Mock external dependencies**
4. **Test accessibility features**

### Accessibility

1. **Provide proper ARIA labels**
2. **Support keyboard navigation**
3. **Ensure sufficient color contrast**
4. **Test with screen readers**