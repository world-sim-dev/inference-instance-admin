# History Component Integration Guide

## Overview

This guide provides comprehensive documentation for developers integrating history-related components into the Inference Instance Management System. It covers component APIs, integration patterns, customization options, and best practices.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Core Components](#core-components)
3. [Integration Patterns](#integration-patterns)
4. [Customization Options](#customization-options)
5. [Performance Optimization](#performance-optimization)
6. [Testing Integration](#testing-integration)
7. [Troubleshooting](#troubleshooting)

## Component Architecture

### Component Hierarchy

```
HistoryModal (Container)
├── HistoryFilters (Filter Controls)
├── HistoryList (Data Display)
│   ├── VirtualizedHistoryList (Performance)
│   └── HistoryRecordItem (Individual Records)
├── HistoryDetail (Record Details)
│   ├── FieldDiff (Field Comparison)
│   └── JsonViewer (JSON Display)
└── HistoryComparison (Version Comparison)
    ├── ComparisonHeader (Metadata)
    ├── ComparisonBody (Field Diffs)
    └── ComparisonActions (Export/Print)
```

### Data Flow

```
API Layer → HistoryService → useHistory Hook → Components
                ↓
            Cache Layer → Performance Optimization
                ↓
            Error Handling → User Feedback
```

## Core Components

### HistoryModal

The main container component for displaying instance history.

**Props Interface:**
```typescript
interface HistoryModalProps {
  visible: boolean;
  instance?: Instance;
  onClose: () => void;
  onError?: (error: Error) => void;
  // Enhanced props
  showComparison?: boolean;
  defaultFilters?: HistoryFilters;
  maxRecords?: number;
  enableVirtualization?: boolean;
  customActions?: HistoryAction[];
}
```

**Basic Integration:**
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
        maxRecords={1000}
      />
    </>
  );
};
```

**Advanced Integration with Custom Actions:**
```typescript
const customActions: HistoryAction[] = [
  {
    key: 'export-csv',
    label: 'Export CSV',
    icon: <DownloadOutlined />,
    handler: (records: HistoryRecord[]) => {
      exportToCSV(records);
    }
  },
  {
    key: 'create-report',
    label: 'Generate Report',
    icon: <FileTextOutlined />,
    handler: (records: HistoryRecord[]) => {
      generateHistoryReport(records);
    }
  }
];

<HistoryModal
  visible={historyVisible}
  instance={selectedInstance}
  onClose={() => setHistoryVisible(false)}
  customActions={customActions}
  defaultFilters={{
    operation_type: ['update'],
    date_range: {
      start: dayjs().subtract(7, 'days').toISOString(),
      end: dayjs().toISOString()
    }
  }}
/>
```

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
  renderCustomAction?: (record: HistoryRecord) => React.ReactNode;
}
```

**Standalone Usage:**
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
          // Handle record click
          showRecordDetails(record);
        }}
      />
    </div>
  );
};
```

**Embedded Usage with Custom Actions:**
```typescript
const EmbeddedHistoryList = () => {
  const renderCustomAction = (record: HistoryRecord) => (
    <Dropdown
      menu={{
        items: [
          {
            key: 'restore',
            label: 'Restore This Version',
            icon: <UndoOutlined />,
            onClick: () => handleRestore(record)
          },
          {
            key: 'duplicate',
            label: 'Create Copy',
            icon: <CopyOutlined />,
            onClick: () => handleDuplicate(record)
          }
        ]
      }}
    >
      <Button size="small" icon={<MoreOutlined />} />
    </Dropdown>
  );

  return (
    <HistoryList
      instanceId={instanceId}
      compact={true}
      renderCustomAction={renderCustomAction}
    />
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
  const [expandedFields, setExpandedFields] = useState<string[]>([]);

  const handleFieldExpand = (field: string) => {
    setExpandedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const customFieldRenderer = (field: string, value: any) => {
    if (field === 'envs' && typeof value === 'object') {
      return <JsonViewer data={value} collapsed={false} />;
    }
    return null; // Use default renderer
  };

  return (
    <Modal
      title="History Record Details"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <HistoryDetail
        record={record}
        showMetadata={true}
        expandedFields={expandedFields}
        onFieldExpand={handleFieldExpand}
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
    
    switch (format) {
      case 'json':
        downloadJSON(comparisonData);
        break;
      case 'csv':
        downloadCSV(comparisonData);
        break;
      case 'pdf':
        generatePDF(comparisonData);
        break;
    }
  };

  const customDiffRenderer = (field: string, oldValue: any, newValue: any) => {
    if (field === 'status') {
      return (
        <div className="status-diff">
          <StatusBadge status={oldValue} /> → <StatusBadge status={newValue} />
        </div>
      );
    }
    return null;
  };

  return (
    <HistoryComparison
      record1={record1}
      record2={record2}
      showOnlyDifferences={true}
      highlightChanges={true}
      customDiffRenderer={customDiffRenderer}
      onExport={handleExport}
    />
  );
};
```

## Integration Patterns

### Pattern 1: Modal Integration

For displaying history in a modal dialog:

```typescript
const useHistoryModal = () => {
  const [state, setState] = useState({
    visible: false,
    instance: null as Instance | null,
    loading: false
  });

  const openHistory = (instance: Instance) => {
    setState({
      visible: true,
      instance,
      loading: false
    });
  };

  const closeHistory = () => {
    setState({
      visible: false,
      instance: null,
      loading: false
    });
  };

  return {
    historyModalProps: {
      visible: state.visible,
      instance: state.instance,
      onClose: closeHistory
    },
    openHistory,
    closeHistory
  };
};

// Usage
const MyComponent = () => {
  const { historyModalProps, openHistory } = useHistoryModal();

  return (
    <>
      <Button onClick={() => openHistory(instance)}>
        View History
      </Button>
      <HistoryModal {...historyModalProps} />
    </>
  );
};
```

### Pattern 2: Embedded Integration

For embedding history directly in a page:

```typescript
const InstanceDetailPage = ({ instanceId }: { instanceId: number }) => {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="instance-detail-page">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Details" key="details">
          <InstanceDetails instanceId={instanceId} />
        </TabPane>
        
        <TabPane tab="History" key="history">
          <div className="history-tab">
            <HistoryList
              instanceId={instanceId}
              showActions={true}
              onRecordClick={(record) => {
                // Handle record selection
              }}
            />
          </div>
        </TabPane>
        
        <TabPane tab="Comparison" key="comparison">
          <HistoryComparisonManager instanceId={instanceId} />
        </TabPane>
      </Tabs>
    </div>
  );
};
```

### Pattern 3: Dashboard Widget

For displaying recent history as a dashboard widget:

```typescript
const RecentHistoryWidget = ({ instanceIds }: { instanceIds: number[] }) => {
  const { recentHistory, loading } = useRecentHistory(instanceIds, {
    limit: 10,
    timeRange: '24h'
  });

  return (
    <Card title="Recent Changes" size="small">
      <HistoryList
        records={recentHistory}
        loading={loading}
        compact={true}
        showActions={false}
        pageSize={5}
        onRecordClick={(record) => {
          // Navigate to full history view
          navigateToHistory(record.instance_id);
        }}
      />
    </Card>
  );
};
```

### Pattern 4: Comparison Workflow

For implementing a comparison workflow:

```typescript
const HistoryComparisonWorkflow = ({ instanceId }: { instanceId: number }) => {
  const [selectedRecords, setSelectedRecords] = useState<HistoryRecord[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);

  const handleRecordSelect = (record: HistoryRecord, selected: boolean) => {
    if (selected) {
      if (selectedRecords.length < 2) {
        setSelectedRecords(prev => [...prev, record]);
      }
    } else {
      setSelectedRecords(prev => prev.filter(r => r.id !== record.id));
    }
  };

  const startComparison = () => {
    if (selectedRecords.length === 2) {
      setComparisonMode(true);
    }
  };

  if (comparisonMode && selectedRecords.length === 2) {
    return (
      <div className="comparison-workflow">
        <div className="comparison-header">
          <Button onClick={() => setComparisonMode(false)}>
            ← Back to History
          </Button>
          <h3>Comparing Versions</h3>
        </div>
        
        <HistoryComparison
          record1={selectedRecords[0]}
          record2={selectedRecords[1]}
          showOnlyDifferences={true}
        />
      </div>
    );
  }

  return (
    <div className="history-selection">
      <div className="selection-header">
        <h3>Select Records to Compare</h3>
        <Button
          type="primary"
          disabled={selectedRecords.length !== 2}
          onClick={startComparison}
        >
          Compare Selected ({selectedRecords.length}/2)
        </Button>
      </div>
      
      <HistoryList
        instanceId={instanceId}
        onRecordSelect={handleRecordSelect}
        showActions={false}
      />
    </div>
  );
};
```

## Customization Options

### Theme Customization

```typescript
// Custom theme for history components
const historyTheme = {
  colors: {
    create: '#52c41a',
    update: '#1890ff',
    delete: '#ff4d4f',
    background: '#fafafa',
    border: '#d9d9d9'
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24
  },
  typography: {
    fontSize: {
      small: 12,
      medium: 14,
      large: 16
    }
  }
};

// Apply theme using CSS variables or styled-components
const ThemedHistoryModal = styled(HistoryModal)`
  --history-create-color: ${props => props.theme.colors.create};
  --history-update-color: ${props => props.theme.colors.update};
  --history-delete-color: ${props => props.theme.colors.delete};
`;
```

### Custom Field Renderers

```typescript
const customFieldRenderers = {
  status: (value: string, context: 'old' | 'new') => (
    <StatusBadge status={value} variant={context} />
  ),
  
  envs: (value: Record<string, any>) => (
    <JsonViewer 
      data={value} 
      collapsed={true}
      theme="dark"
    />
  ),
  
  created_at: (value: string) => (
    <Tooltip title={value}>
      <span>{dayjs(value).fromNow()}</span>
    </Tooltip>
  ),
  
  replicas: (value: number, context: 'old' | 'new') => (
    <div className={`replica-count ${context}`}>
      <ServerOutlined /> {value}
    </div>
  )
};

// Usage
<HistoryDetail
  record={record}
  customFieldRenderer={(field, value, context) => {
    const renderer = customFieldRenderers[field];
    return renderer ? renderer(value, context) : null;
  }}
/>
```

### Custom Actions

```typescript
const createCustomActions = (onRestore: Function, onExport: Function) => [
  {
    key: 'restore',
    label: 'Restore Version',
    icon: <UndoOutlined />,
    handler: (record: HistoryRecord) => {
      Modal.confirm({
        title: 'Restore Version',
        content: 'Are you sure you want to restore this version?',
        onOk: () => onRestore(record)
      });
    },
    visible: (record: HistoryRecord) => record.operation_type !== 'delete'
  },
  
  {
    key: 'export',
    label: 'Export Record',
    icon: <DownloadOutlined />,
    handler: (record: HistoryRecord) => {
      onExport(record);
    }
  },
  
  {
    key: 'share',
    label: 'Share Link',
    icon: <ShareAltOutlined />,
    handler: (record: HistoryRecord) => {
      const url = generateShareUrl(record);
      navigator.clipboard.writeText(url);
      message.success('Link copied to clipboard');
    }
  }
];
```

## Performance Optimization

### Virtualization Setup

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
      onRecordClick={(record) => {
        // Handle record click
      }}
    />
  );
};
```

### Caching Configuration

```typescript
// Configure caching for history data
const historyCacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum number of cached entries
  strategy: 'lru' // Least Recently Used eviction
};

const useOptimizedHistory = (instanceId: number) => {
  return useQuery(
    ['history', instanceId],
    () => HistoryService.getInstanceHistory(instanceId),
    {
      staleTime: historyCacheConfig.ttl,
      cacheTime: historyCacheConfig.ttl * 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  );
};
```

### Lazy Loading Implementation

```typescript
const LazyHistoryModal = React.lazy(() => 
  import('@/components/modals/HistoryModal')
);

const HistoryModalWrapper = (props: HistoryModalProps) => {
  if (!props.visible) {
    return null;
  }

  return (
    <Suspense fallback={<Spin size="large" />}>
      <LazyHistoryModal {...props} />
    </Suspense>
  );
};
```

## Testing Integration

### Component Testing

```typescript
// test/components/HistoryModal.integration.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HistoryModal } from '@/components/modals/HistoryModal';
import { mockHistoryData } from '@/test/mocks/historyMocks';

describe('HistoryModal Integration', () => {
  const mockInstance = {
    id: 1,
    name: 'test-instance',
    // ... other properties
  };

  beforeEach(() => {
    // Mock API calls
    jest.spyOn(HistoryService, 'getInstanceHistory')
      .mockResolvedValue(mockHistoryData);
  });

  it('should load and display history records', async () => {
    render(
      <HistoryModal
        visible={true}
        instance={mockInstance}
        onClose={jest.fn()}
      />
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('History Records')).toBeInTheDocument();
    });

    // Verify records are displayed
    expect(screen.getByText('Update operation')).toBeInTheDocument();
    expect(screen.getByText('Create operation')).toBeInTheDocument();
  });

  it('should handle record selection for comparison', async () => {
    render(
      <HistoryModal
        visible={true}
        instance={mockInstance}
        onClose={jest.fn()}
        showComparison={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Compare')).toBeInTheDocument();
    });

    // Enter comparison mode
    fireEvent.click(screen.getByText('Compare'));

    // Select two records
    const records = screen.getAllByTestId('history-record');
    fireEvent.click(records[0]);
    fireEvent.click(records[1]);

    // Start comparison
    fireEvent.click(screen.getByText('Compare Selected'));

    // Verify comparison view
    await waitFor(() => {
      expect(screen.getByText('Version Comparison')).toBeInTheDocument();
    });
  });
});
```

### Hook Testing

```typescript
// test/hooks/useHistory.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useHistory } from '@/hooks/useHistory';
import { QueryClient, QueryClientProvider } from 'react-query';

describe('useHistory Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch history data successfully', async () => {
    const { result } = renderHook(
      () => useHistory(1),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle comparison operations', async () => {
    const { result } = renderHook(
      () => useHistory(1),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const comparisonResult = await result.current.compareVersions(1, 2);
    
    expect(comparisonResult.success).toBe(true);
    expect(comparisonResult.data).toHaveProperty('differences');
  });
});
```

## Troubleshooting

### Common Integration Issues

#### Issue: History Modal Not Opening

**Symptoms**: Modal doesn't appear when triggered

**Solutions**:
```typescript
// Ensure proper state management
const [modalVisible, setModalVisible] = useState(false);

// Check for proper instance data
const handleOpenHistory = (instance: Instance) => {
  if (!instance || !instance.id) {
    console.error('Invalid instance data');
    return;
  }
  setModalVisible(true);
};

// Verify modal props
<HistoryModal
  visible={modalVisible} // Should be boolean
  instance={selectedInstance} // Should be Instance object
  onClose={() => setModalVisible(false)} // Should be function
/>
```

#### Issue: Performance Problems with Large History

**Symptoms**: Slow rendering, browser freezing

**Solutions**:
```typescript
// Enable virtualization
<HistoryList
  instanceId={instanceId}
  virtualized={true}
  pageSize={50} // Limit initial load
/>

// Implement pagination
const { history, loading, hasMore, loadMore } = useInfiniteHistory(instanceId, {
  pageSize: 20
});

// Use filters to reduce data
<HistoryModal
  defaultFilters={{
    date_range: {
      start: dayjs().subtract(30, 'days').toISOString(),
      end: dayjs().toISOString()
    }
  }}
/>
```

#### Issue: Comparison Not Working

**Symptoms**: Cannot compare records or comparison shows no differences

**Solutions**:
```typescript
// Ensure records are from same instance
const validateComparison = (record1: HistoryRecord, record2: HistoryRecord) => {
  if (record1.instance_id !== record2.instance_id) {
    throw new Error('Cannot compare records from different instances');
  }
  
  if (record1.id === record2.id) {
    throw new Error('Cannot compare record with itself');
  }
};

// Check for proper data structure
const ensureRecordData = (record: HistoryRecord) => {
  if (!record.old_values && !record.new_values) {
    console.warn('Record missing comparison data');
  }
};
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug logging
const HistoryModalWithDebug = (props: HistoryModalProps) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('HistoryModal props:', props);
    }
  }, [props]);

  return <HistoryModal {...props} />;
};

// Add performance monitoring
const useHistoryPerformance = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('history')) {
          console.log(`History operation: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
};
```

This integration guide provides comprehensive documentation for developers working with the history interface components. It covers all major integration patterns, customization options, and troubleshooting scenarios.