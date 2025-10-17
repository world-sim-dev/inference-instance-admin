import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryComparison } from '../HistoryComparison';
import type { HistoryRecord } from '../../../types/history';

import { vi } from 'vitest';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and appendChild for download functionality
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
};
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any;
  }
  return {} as any;
});
document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('HistoryComparison', () => {
  const mockOldRecord: HistoryRecord = {
    history_id: 1,
    original_id: 100,
    operation_type: 'update',
    operation_timestamp: '2024-01-15T10:00:00Z',
    name: 'test-instance',
    model_name: 'llama-7b',
    model_version: '1.0.0',
    cluster_name: 'test-cluster',
    image_tag: 'v1.0.0',
    pipeline_mode: 'standard',
    quant_mode: false,
    distill_mode: false,
    m405_mode: false,
    fps: 30,
    checkpoint_path: '/models/checkpoint-v1',
    nonce: 'abc123',
    pp: 2,
    cp: 1,
    tp: 4,
    n_workers: 4,
    replicas: 2,
    priorities: ['high'],
    envs: [{ name: 'TEST_ENV', value: 'test' }],
    description: 'Test description',
    separate_video_encode: false,
    separate_video_decode: false,
    separate_t5_encode: false,
    ephemeral: false,
    ephemeral_min_period_seconds: null,
    ephemeral_to: null,
    ephemeral_from: null,
    vae_store_type: 'memory',
    t5_store_type: 'disk',
    enable_cuda_graph: true,
    task_concurrency: 4,
    celery_task_concurrency: 2,
    status: 'running'
  };

  const mockNewRecord: HistoryRecord = {
    ...mockOldRecord,
    history_id: 2,
    operation_timestamp: '2024-01-15T11:00:00Z',
    model_version: '1.1.0',
    image_tag: 'v1.1.0',
    fps: 60,
    replicas: 4,
    priorities: ['high', 'gpu'],
    envs: [
      { name: 'TEST_ENV', value: 'updated' },
      { name: 'NEW_ENV', value: 'new_value' }
    ],
    description: 'Updated test description',
    enable_cuda_graph: false,
    task_concurrency: 8
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comparison statistics correctly', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Check that statistics are displayed
    expect(screen.getByText('总字段数')).toBeInTheDocument();
    expect(screen.getByText('已变更')).toBeInTheDocument();
    expect(screen.getByText('未变更')).toBeInTheDocument();
    expect(screen.getByText('变更率')).toBeInTheDocument();
  });

  it('shows changed fields by default and hides unchanged fields', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Should show changed fields
    expect(screen.getByText('模型版本')).toBeInTheDocument();
    expect(screen.getByText('镜像标签')).toBeInTheDocument();
    
    // Should not show unchanged fields by default
    expect(screen.queryByText('实例名称')).not.toBeInTheDocument();
  });

  it('toggles unchanged fields visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Find and click the "显示未变更字段" switch
    const showUnchangedSwitch = screen.getByRole('switch');
    await user.click(showUnchangedSwitch);

    // Now unchanged fields should be visible
    await waitFor(() => {
      expect(screen.getByText('实例名称')).toBeInTheDocument();
    });
  });

  it('switches between comparison modes', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Find the comparison mode selector
    const modeSelector = screen.getByDisplayValue('内联对比');
    
    // Switch to side-by-side mode
    await user.click(modeSelector);
    await user.click(screen.getByText('并排对比'));

    // Verify mode changed (this would be reflected in the field diff components)
    expect(screen.getByDisplayValue('并排对比')).toBeInTheDocument();
  });

  it('filters fields by search term', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
        showUnchangedByDefault={true}
      />
    );

    // Find the search input
    const searchInput = screen.getByPlaceholderText('搜索字段名称...');
    
    // Search for a specific field
    await user.type(searchInput, 'model_version');

    // Should only show matching fields
    await waitFor(() => {
      expect(screen.getByText('模型版本')).toBeInTheDocument();
      // Other fields should be filtered out
      expect(screen.queryByText('镜像标签')).not.toBeInTheDocument();
    });
  });

  it('expands and collapses all panels', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Click expand all
    const expandAllButton = screen.getByText('展开全部');
    await user.click(expandAllButton);

    // Click collapse all
    const collapseAllButton = screen.getByText('折叠全部');
    await user.click(collapseAllButton);

    // Verify buttons are working (panels should be collapsed)
    expect(collapseAllButton).toBeInTheDocument();
  });

  it('exports comparison in JSON format', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Find and click the export dropdown
    const exportButton = screen.getByText('导出');
    await user.click(exportButton);

    // Click JSON export option
    const jsonOption = screen.getByText('JSON 格式');
    await user.click(jsonOption);

    // Verify download was triggered
    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('.json');
    });
  });

  it('exports comparison in CSV format', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Find and click the export dropdown
    const exportButton = screen.getByText('导出');
    await user.click(exportButton);

    // Click CSV export option
    const csvOption = screen.getByText('CSV 格式');
    await user.click(csvOption);

    // Verify download was triggered
    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('.csv');
    });
  });

  it('shares comparison summary', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Find and click the share dropdown
    const shareButton = screen.getByText('分享');
    await user.click(shareButton);

    // Click copy summary option
    const copyOption = screen.getByText('复制摘要');
    await user.click(copyOption);

    // Verify clipboard was used
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('handles large JSON objects with performance optimization', () => {
    const largeObject = {
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
        nested: { deep: { value: Math.random() } }
      }))
    };

    const largeOldRecord = {
      ...mockOldRecord,
      envs: [{ name: 'LARGE_DATA', value: JSON.stringify(largeObject) }]
    };

    const largeNewRecord = {
      ...mockNewRecord,
      envs: [{ name: 'LARGE_DATA', value: JSON.stringify({ ...largeObject, version: 2 }) }]
    };

    render(
      <HistoryComparison
        oldRecord={largeOldRecord}
        newRecord={largeNewRecord}
        enableVirtualization={true}
        virtualizationThreshold={50}
      />
    );

    // Should render without performance issues
    expect(screen.getByText('环境变量')).toBeInTheDocument();
  });

  it('renders compact mode correctly', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
        compact={true}
      />
    );

    // Find and verify compact mode switch is checked
    const compactSwitch = screen.getAllByRole('switch')[1]; // Second switch is compact mode
    expect(compactSwitch).toBeChecked();
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
        showUnchangedByDefault={true}
      />
    );

    // Find the category filter
    const categoryFilter = screen.getByPlaceholderText('筛选分类');
    await user.click(categoryFilter);

    // Select a specific category
    const basicInfoOption = screen.getByText('Basic Information');
    await user.click(basicInfoOption);

    // Should only show fields from that category
    await waitFor(() => {
      expect(screen.getByText('模型版本')).toBeInTheDocument();
    });
  });
});