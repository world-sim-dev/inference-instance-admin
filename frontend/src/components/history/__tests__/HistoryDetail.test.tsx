/**
 * HistoryDetail Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { HistoryDetail } from '../HistoryDetail';
import type { HistoryRecord } from '../../../types/history';
import { OperationType } from '../../../types/enums';
import { expect } from '@playwright/test';
import { it } from 'node:test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'node:test';
import { expect } from '@playwright/test';
import { it } from 'node:test';
import { expect } from '@playwright/test';
import { it } from 'node:test';
import { expect } from '@playwright/test';
import { it } from 'node:test';
import { expect } from '@playwright/test';
import { it } from 'node:test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Mock message API
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn()
    }
  };
});

// Mock SearchHighlight component
vi.mock('../SearchHighlight', () => ({
  SearchHighlight: ({ text }: { text: string }) => <span>{text}</span>,
  FieldHighlight: ({ value }: { value: any }) => <span>{String(value)}</span>
}));

// Mock HistoryService
vi.mock('../../../services/historyService', () => ({
  HistoryService: {
    formatOperationType: vi.fn((type: string) => ({
      label: type === 'update' ? 'Updated' : 'Created',
      icon: 'edit',
      color: 'warning'
    })),
    formatTimestamp: vi.fn((timestamp: string) => new Date(timestamp).toLocaleString()),
    getRelativeTime: vi.fn(() => '2 hours ago')
  }
}));

// Mock responsive hook
vi.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false
  })
}));

const mockRecord: HistoryRecord = {
  history_id: 1,
  original_id: 101,
  operation_type: OperationType.UPDATE,
  operation_timestamp: '2024-01-15T10:30:00Z',
  name: 'test-instance',
  model_name: 'test-model',
  model_version: '1.0.0',
  cluster_name: 'test-cluster',
  image_tag: 'test:latest',
  pipeline_mode: 'inference',
  quant_mode: true,
  distill_mode: false,
  m405_mode: false,
  fps: 30,
  checkpoint_path: '/test/path',
  nonce: 'test-nonce',
  pp: 2,
  cp: 1,
  tp: 4,
  n_workers: 8,
  replicas: 3,
  priorities: ['high'],
  envs: [{ name: 'TEST_ENV', value: 'test_value' }],
  description: 'Test description',
  separate_video_encode: true,
  separate_video_decode: false,
  separate_t5_encode: false,
  ephemeral: false,
  vae_store_type: 'memory',
  t5_store_type: 'disk',
  enable_cuda_graph: true,
  task_concurrency: 4,
  celery_task_concurrency: 2,
  status: 'running',
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-15T10:30:00Z'
};

describe('HistoryDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders history record details correctly', () => {
    render(<HistoryDetail record={mockRecord} />);
    
    // Check if basic information is displayed
    expect(screen.getByText('test-instance')).toBeInTheDocument();
    expect(screen.getByText('test-model')).toBeInTheDocument();
    expect(screen.getByText('test-cluster')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays operation type correctly', () => {
    render(<HistoryDetail record={mockRecord} />);
    
    // Should show the formatted operation type
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('shows metadata when showMetadata is true', () => {
    render(<HistoryDetail record={mockRecord} showMetadata={true} />);
    
    // Should show metadata section
    expect(screen.getByText('元数据')).toBeInTheDocument();
  });

  it('hides metadata when showMetadata is false', () => {
    render(<HistoryDetail record={mockRecord} showMetadata={false} />);
    
    // Should not show metadata section
    expect(screen.queryByText('元数据')).not.toBeInTheDocument();
  });

  it('handles copy record functionality', async () => {
    render(<HistoryDetail record={mockRecord} />);
    
    // Find and click copy button by icon name
    const copyButton = screen.getByRole('button', { name: 'copy' });
    fireEvent.click(copyButton);
    
    // Should call clipboard API
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(mockRecord, null, 2)
      );
    });
  });

  it('handles export record functionality', async () => {
    // Mock URL.createObjectURL and related APIs
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const mockCreateElement = vi.fn(() => mockLink);
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    
    document.createElement = mockCreateElement;
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    render(<HistoryDetail record={mockRecord} />);
    
    // Find and click export button by icon name
    const exportButton = screen.getByRole('button', { name: 'download' });
    fireEvent.click(exportButton);
    
    // Should create download link
    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  it('renders basic functionality correctly', () => {
    // This test verifies the component renders without crashing
    const { container } = render(<HistoryDetail record={mockRecord} />);
    expect(container).toBeInTheDocument();
  });
});