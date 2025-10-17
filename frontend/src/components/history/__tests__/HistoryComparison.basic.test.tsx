import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryComparison } from '../HistoryComparison';
import type { HistoryRecord } from '../../../types/history';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('HistoryComparison Basic Tests', () => {
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

  it('renders without crashing', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Basic check that the component renders
    expect(document.body).toBeTruthy();
  });

  it('displays statistics section', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Check for statistics labels
    expect(screen.getByText('总字段数')).toBeInTheDocument();
    expect(screen.getByText('已变更')).toBeInTheDocument();
    expect(screen.getByText('未变更')).toBeInTheDocument();
    expect(screen.getByText('变更率')).toBeInTheDocument();
  });

  it('displays control buttons', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Check for control buttons
    expect(screen.getByText('展开全部')).toBeInTheDocument();
    expect(screen.getByText('折叠全部')).toBeInTheDocument();
    expect(screen.getByText('导出')).toBeInTheDocument();
    expect(screen.getByText('分享')).toBeInTheDocument();
  });

  it('shows comparison mode selector', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
      />
    );

    // Check for comparison mode text
    expect(screen.getByText('对比模式:')).toBeInTheDocument();
  });

  it('handles performance optimization props', () => {
    render(
      <HistoryComparison
        oldRecord={mockOldRecord}
        newRecord={mockNewRecord}
        enableVirtualization={true}
        virtualizationThreshold={50}
      />
    );

    // Should render without errors
    expect(document.body).toBeTruthy();
  });
});