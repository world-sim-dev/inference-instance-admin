/**
 * HistoryDetailDemo Component
 * 
 * Demonstrates the HistoryDetail component with various configurations and sample data.
 */

import React, { useState } from 'react';
import {
  Card,
  Space,
  Button,
  Switch,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Divider,
  Alert
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { HistoryDetail } from './HistoryDetail';
import type { HistoryRecord } from '../../types/history';
import { OperationType } from '../../types/enums';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * Sample history records for demonstration
 */
const sampleRecords: HistoryRecord[] = [
  {
    history_id: 1,
    original_id: 101,
    operation_type: OperationType.UPDATE,
    operation_timestamp: '2024-01-15T10:30:00Z',
    name: 'inference-model-v2',
    model_name: 'llama-2-7b',
    model_version: '2.1.0',
    cluster_name: 'gpu-cluster-01',
    image_tag: 'pytorch:2.0-cuda11.8',
    pipeline_mode: 'inference',
    quant_mode: true,
    distill_mode: false,
    m405_mode: true,
    fps: 30,
    checkpoint_path: '/models/checkpoints/llama-2-7b-v2.1.0.pt',
    nonce: 'abc123def456',
    pp: 2,
    cp: 1,
    tp: 4,
    n_workers: 8,
    replicas: 3,
    priorities: ['high', 'gpu'],
    envs: [
      { name: 'CUDA_VISIBLE_DEVICES', value: '0,1,2,3' },
      { name: 'PYTORCH_CUDA_ALLOC_CONF', value: 'max_split_size_mb:512' },
      { name: 'MODEL_CACHE_DIR', value: '/cache/models' }
    ],
    description: 'Updated model configuration to enable quantization and M405 mode for better performance',
    separate_video_encode: true,
    separate_video_decode: true,
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
  },
  {
    history_id: 2,
    original_id: 102,
    operation_type: OperationType.CREATE,
    operation_timestamp: '2024-01-16T14:20:00Z',
    name: 'ephemeral-test-instance',
    model_name: 'gpt-3.5-turbo',
    model_version: '1.0.0',
    cluster_name: 'cpu-cluster-02',
    image_tag: 'tensorflow:2.12-cpu',
    pipeline_mode: 'training',
    quant_mode: false,
    distill_mode: true,
    m405_mode: false,
    fps: null,
    checkpoint_path: null,
    nonce: 'xyz789uvw012',
    pp: 1,
    cp: 1,
    tp: 1,
    n_workers: 4,
    replicas: 1,
    priorities: ['normal'],
    envs: [
      { name: 'TF_CPP_MIN_LOG_LEVEL', value: '2' },
      { name: 'PYTHONPATH', value: '/app:/app/src' }
    ],
    description: 'Temporary instance for testing distillation pipeline',
    separate_video_encode: false,
    separate_video_decode: false,
    separate_t5_encode: false,
    ephemeral: true,
    ephemeral_min_period_seconds: 3600,
    ephemeral_from: '2024-01-16T14:00:00Z',
    ephemeral_to: '2024-01-16T18:00:00Z',
    vae_store_type: 'disk',
    t5_store_type: 'memory',
    enable_cuda_graph: false,
    task_concurrency: 2,
    celery_task_concurrency: null,
    status: 'pending',
    created_at: '2024-01-16T14:20:00Z',
    updated_at: '2024-01-16T14:20:00Z'
  },
  {
    history_id: 3,
    original_id: 103,
    operation_type: OperationType.DELETE,
    operation_timestamp: '2024-01-17T09:45:00Z',
    name: 'old-model-instance',
    model_name: 'bert-base',
    model_version: '1.0.0',
    cluster_name: 'mixed-cluster-01',
    image_tag: 'huggingface:4.21-pytorch',
    pipeline_mode: 'inference',
    quant_mode: false,
    distill_mode: false,
    m405_mode: false,
    fps: 60,
    checkpoint_path: '/models/bert-base-uncased',
    nonce: 'old123model456',
    pp: 1,
    cp: 2,
    tp: 2,
    n_workers: 2,
    replicas: 1,
    priorities: ['low'],
    envs: [],
    description: 'Legacy BERT model instance scheduled for deletion',
    separate_video_encode: false,
    separate_video_decode: false,
    separate_t5_encode: true,
    ephemeral: false,
    vae_store_type: 'memory',
    t5_store_type: 'memory',
    enable_cuda_graph: false,
    task_concurrency: 1,
    celery_task_concurrency: 1,
    status: 'stopped',
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2024-01-17T09:45:00Z'
  }
];

/**
 * HistoryDetailDemo Component
 */
export const HistoryDetailDemo: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord>(sampleRecords[0]);
  const [showMetadata, setShowMetadata] = useState(true);
  const [compact, setCompact] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHighlight, setSearchHighlight] = useState(true);
  const [drawerMode, setDrawerMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <EyeOutlined style={{ marginRight: 8 }} />
        历史记录详情组件演示
      </Title>
      
      <Alert
        message="组件功能"
        description="HistoryDetail组件提供完整的历史记录详情展示，包括字段分组、JSON语法高亮、复制导出功能等。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Configuration Panel */}
      <Card title="配置选项" size="small" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>选择记录:</Text>
              <Select
                style={{ width: '100%' }}
                value={selectedRecord.history_id}
                onChange={(historyId) => {
                  const record = sampleRecords.find(r => r.history_id === historyId);
                  if (record) setSelectedRecord(record);
                }}
              >
                {sampleRecords.map(record => (
                  <Option key={record.history_id} value={record.history_id}>
                    #{record.history_id} - {record.name} ({record.operation_type})
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>搜索高亮:</Text>
              <Input
                placeholder="输入搜索词"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Text strong>显示选项:</Text>
              <Space direction="vertical">
                <Space>
                  <Switch
                    checked={showMetadata}
                    onChange={setShowMetadata}
                    size="small"
                  />
                  <Text>显示元数据</Text>
                </Space>
                <Space>
                  <Switch
                    checked={compact}
                    onChange={setCompact}
                    size="small"
                  />
                  <Text>紧凑模式</Text>
                </Space>
                <Space>
                  <Switch
                    checked={searchHighlight}
                    onChange={setSearchHighlight}
                    size="small"
                  />
                  <Text>搜索高亮</Text>
                </Space>
              </Space>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Text strong>显示模式:</Text>
              <Space direction="vertical">
                <Button
                  type={!drawerMode ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setDrawerMode(false)}
                  icon={<FileTextOutlined />}
                >
                  卡片模式
                </Button>
                <Button
                  type={drawerMode ? 'primary' : 'default'}
                  size="small"
                  onClick={() => {
                    setDrawerMode(true);
                    setDrawerVisible(true);
                  }}
                  icon={<SettingOutlined />}
                >
                  抽屉模式
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* Component Demo */}
      <Title level={3}>组件演示</Title>
      
      {!drawerMode ? (
        <HistoryDetail
          record={selectedRecord}
          showMetadata={showMetadata}
          compact={compact}
          searchTerm={searchTerm}
          searchHighlight={searchHighlight}
          title="历史记录详情演示"
        />
      ) : (
        <>
          <Card>
            <Alert
              message="抽屉模式已激活"
              description="点击右侧的抽屉查看历史记录详情。抽屉模式适合在有限空间内显示详细信息。"
              type="success"
              showIcon
              action={
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setDrawerVisible(true)}
                >
                  打开抽屉
                </Button>
              }
            />
          </Card>
          
          <HistoryDetail
            record={selectedRecord}
            showMetadata={showMetadata}
            compact={compact}
            searchTerm={searchTerm}
            searchHighlight={searchHighlight}
            title="历史记录详情演示"
            drawerMode={true}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
          />
        </>
      )}

      <Divider style={{ marginTop: 32 }} />

      {/* Feature Highlights */}
      <Title level={3}>功能特性</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <Space direction="vertical" size="small">
              <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Text strong>字段分组显示</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                将历史记录字段按功能分组，提供清晰的信息层次结构
              </Text>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <Space direction="vertical" size="small">
              <SearchOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <Text strong>搜索高亮</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                支持搜索词高亮显示，快速定位相关信息
              </Text>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <Space direction="vertical" size="small">
              <SettingOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
              <Text strong>JSON语法高亮</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                复杂数据结构的语法高亮显示，支持折叠和展开
              </Text>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <Space direction="vertical" size="small">
              <EyeOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
              <Text strong>复制导出</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                支持复制单个字段或整个记录，以及导出为JSON文件
              </Text>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <Space direction="vertical" size="small">
              <FileTextOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />
              <Text strong>响应式设计</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                适配不同屏幕尺寸，支持卡片和抽屉两种显示模式
              </Text>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <Space direction="vertical" size="small">
              <SettingOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />
              <Text strong>可配置选项</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                支持紧凑模式、元数据显示等多种配置选项
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HistoryDetailDemo;