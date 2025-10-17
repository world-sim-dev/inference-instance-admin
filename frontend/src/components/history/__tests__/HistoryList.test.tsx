/**
 * HistoryList Component Tests
 * 
 * Basic tests for the HistoryList component functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HistoryList } from '../HistoryList';
import type { HistoryRecord } from '../../../types/history';
import { OperationType } from '../../../types/enums';
import { vi } from 'vitest';

// Mock dependencies to prevent complex interactions
vi.mock('../../../services/historyService', () => ({
  HistoryService: {
    formatOperationType: (type: string) => ({
      label: type === 'create' ? 'Created' : type === 'update' ? 'Updated' : 'Deleted',
      icon: 'icon',
      color: 'blue'
    }),
    formatTimestamp: (timestamp: string) => new Date(timestamp).toLocaleString(),
    getRelativeTime: (timestamp: string) => '1 hour ago'
  }
}));

vi.mock('../../../services/historySearchService', () => ({
  HistorySearchService: {
    filterRecords: (records: any[]) => records,
    searchRecords: (records: any[]) => [],
    getFilterOptions: () => ({
      modelNames: [],
      clusterNames: [],
      statuses: [],
      imageTags: []
    })
  }
}));

vi.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    screenWidth: 1200
  })
}));

vi.mock('../../../hooks/useLoadingState', () => ({
  useLoadingState: () => ({
    isLoading: false,
    isError: false,
    error: null,
    execute: vi.fn(),
    retry: vi.fn()
  })
}));

// Mock complex components to avoid rendering issues
vi.mock('../HistoryFilters', () => ({
  HistoryFilters: () => <div>Mocked HistoryFilters</div>
}));

vi.mock('../VirtualizedHistoryList', () => ({
  VirtualizedHistoryList: React.forwardRef(() => <div>Mocked VirtualizedHistoryList</div>)
}));

vi.mock('../SearchHighlight', () => ({
  SearchHighlight: ({ text }: { text: string }) => <span>{text}</span>
}));

// Mock history records
const mockHistoryRecords: HistoryRecord[] = [
  {
    history_id: 1,
    original_id: 1,
    operation_type: OperationType.CREATE,
    operation_timestamp: '2024-01-01T10:00:00Z',
    name: 'test-instance-1',
    model_name: 'gpt-4',
    model_version: 'v1.0',
    cluster_name: 'prod-cluster',
    image_tag: 'latest',
    pipeline_mode: 'default',
    quant_mode: false,
    distill_mode: false,
    m405_mode: false,
    fps: null,
    checkpoint_path: null,
    nonce: 'nonce1',
    pp: 1,
    cp: 8,
    tp: 1,
    n_workers: 1,
    replicas: 1,
    priorities: ['high'],
    envs: [],
    description: 'Test instance 1 description',
    separate_video_encode: true,
    separate_video_decode: true,
    separate_t5_encode: true,
    ephemeral: false,
    ephemeral_min_period_seconds: null,
    ephemeral_to: '',
    ephemeral_from: '',
    vae_store_type: 'redis',
    t5_store_type: 'redis',
    enable_cuda_graph: false,
    task_concurrency: 1,
    celery_task_concurrency: null,
    status: 'active',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    priority: null
  }
];

describe('HistoryList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with records provided', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('历史记录')).toBeInTheDocument();
      expect(screen.getByText('test-instance-1')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          title="自定义历史记录标题"
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('自定义历史记录标题')).toBeInTheDocument();
    });

    it('should render without header when showHeader is false', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          showHeader={false}
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.queryByText('历史记录')).not.toBeInTheDocument();
    });

    it('should show empty state when no records', () => {
      render(
        <HistoryList 
          records={[]} 
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <HistoryList 
          records={[]} 
          loading={true}
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('加载历史记录中...')).toBeInTheDocument();
    });
  });

  describe('View Modes', () => {
    it('should render in list view mode', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          viewMode="list"
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('test-instance-1')).toBeInTheDocument();
    });

    it('should render in compact view mode', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          viewMode="compact"
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('test-instance-1')).toBeInTheDocument();
    });

    it('should render in timeline view mode', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          viewMode="timeline"
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('test-instance-1')).toBeInTheDocument();
    });
  });

  describe('Selection Functionality', () => {
    it('should not show selection controls when selectionMode is none', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          selectionMode="none"
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should show selection controls when selectionMode is multiple', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          selectionMode="multiple"
          showFilters={false}
          pagination={false}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Component Props', () => {
    it('should hide filters when showFilters is false', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.queryByText('Mocked HistoryFilters')).not.toBeInTheDocument();
    });

    it('should show filters when showFilters is true', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          showFilters={true}
          pagination={false}
        />
      );
      
      expect(screen.getByText('Mocked HistoryFilters')).toBeInTheDocument();
    });

    it('should use virtual scrolling when enabled', () => {
      render(
        <HistoryList 
          records={mockHistoryRecords} 
          enableVirtualScrolling={true}
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(screen.getByText('Mocked VirtualizedHistoryList')).toBeInTheDocument();
    });
  });

  describe('Ref Methods', () => {
    it('should expose ref methods', () => {
      const ref = React.createRef<any>();
      
      render(
        <HistoryList 
          ref={ref}
          records={mockHistoryRecords} 
          selectionMode="multiple"
          showFilters={false}
          pagination={false}
        />
      );
      
      expect(ref.current).toBeDefined();
      expect(typeof ref.current.refresh).toBe('function');
      expect(typeof ref.current.clearSelection).toBe('function');
      expect(typeof ref.current.selectAll).toBe('function');
      expect(typeof ref.current.getSelectedRecords).toBe('function');
      expect(typeof ref.current.scrollToRecord).toBe('function');
      expect(typeof ref.current.getCurrentFilters).toBe('function');
    });
  });
});