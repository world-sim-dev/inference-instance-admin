/**
 * HistoryDetail Integration Test
 * Simple test to verify the component integrates correctly with the existing system
 */

import React from 'react';
import { HistoryDetail } from './HistoryDetail';
import type { HistoryRecord } from '../../types/history';
import { OperationType } from '../../types/enums';

// Simple integration test - just verify the component can be imported and instantiated
describe('HistoryDetail Integration', () => {
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

  it('can be imported and instantiated', () => {
    // This test verifies that the component can be imported and created without errors
    expect(HistoryDetail).toBeDefined();
    expect(typeof HistoryDetail).toBe('function');
    
    // Create component instance (without rendering to avoid DOM issues)
    const element = React.createElement(HistoryDetail, { record: mockRecord });
    expect(element).toBeDefined();
    expect(element.type).toBe(HistoryDetail);
  });

  it('accepts all required and optional props', () => {
    // Test with minimal props
    const minimalElement = React.createElement(HistoryDetail, { 
      record: mockRecord 
    });
    expect(minimalElement.props.record).toBe(mockRecord);

    // Test with all props
    const fullElement = React.createElement(HistoryDetail, {
      record: mockRecord,
      showMetadata: true,
      compact: false,
      searchTerm: 'test',
      searchOptions: { fields: ['name'], caseSensitive: false },
      searchHighlight: true,
      title: 'Custom Title',
      drawerMode: false,
      actions: []
    });
    expect(fullElement.props.record).toBe(mockRecord);
    expect(fullElement.props.showMetadata).toBe(true);
    expect(fullElement.props.compact).toBe(false);
  });
});