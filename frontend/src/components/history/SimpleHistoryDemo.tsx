import React, { useState } from 'react';
import { Button, Card, Space } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { HistoryModal } from '../modals/HistoryModal';
import type { Instance } from '../../types/instance';

/**
 * SimpleHistoryDemo Component
 * 
 * Demo component to showcase the simplified history modal
 */
export const SimpleHistoryDemo: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);

  // Mock instance data
  const mockInstance: Instance = {
    id: 19,
    name: 'test-instance',
    model_name: 'test-model',
    model_version: 'latest',
    cluster_name: 'test-cluster',
    image_tag: 'latest',
    pipeline_mode: 'default',
    quant_mode: false,
    distill_mode: false,
    m405_mode: false,
    fps: null,
    checkpoint_path: null,
    nonce: null,
    pp: 1,
    cp: 8,
    tp: 1,
    n_workers: 1,
    replicas: 1,
    priorities: ['high', 'normal', 'low', 'very_low'],
    envs: [],
    description: '',
    separate_video_encode: true,
    separate_video_decode: true,
    separate_t5_encode: true,
    ephemeral: false,
    ephemeral_min_period_seconds: 300,
    ephemeral_to: '',
    ephemeral_from: '',
    vae_store_type: 'redis',
    t5_store_type: 'redis',
    enable_cuda_graph: false,
    task_concurrency: 1,
    celery_task_concurrency: null,
    status: 'active',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    priority: 'high'
  };

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  const handleError = (error: Error) => {
    console.error('History error:', error);
  };

  return (
    <Card title="简化历史记录演示" style={{ margin: 16 }}>
      <Space direction="vertical" size="middle">
        <div>
          <h4>实例信息</h4>
          <p>名称: {mockInstance.name}</p>
          <p>模型: {mockInstance.model_name}</p>
          <p>集群: {mockInstance.cluster_name}</p>
        </div>
        
        <Button 
          type="primary" 
          icon={<HistoryOutlined />} 
          onClick={handleShowHistory}
        >
          查看历史记录
        </Button>
      </Space>

      <HistoryModal
        visible={showHistory}
        instance={mockInstance}
        onClose={handleCloseHistory}
        onError={handleError}
      />
    </Card>
  );
};

export default SimpleHistoryDemo;