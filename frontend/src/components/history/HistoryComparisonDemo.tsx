import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, Row, Col, Tag } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { HistoryComparison } from './HistoryComparison';
import type { HistoryRecord } from '../../types/history';

const { Title, Paragraph, Text } = Typography;

/**
 * Demo component showcasing the enhanced HistoryComparison functionality
 */
export const HistoryComparisonDemo: React.FC = () => {
  const [demoScenario, setDemoScenario] = useState<'basic' | 'complex' | 'large'>('basic');

  // Sample history records for different scenarios
  const basicOldRecord: HistoryRecord = {
    history_id: 1,
    original_id: 100,
    operation_type: 'update',
    operation_timestamp: '2024-01-15T10:00:00Z',
    name: 'inference-model-v1',
    model_name: 'llama-7b',
    model_version: '1.0.0',
    cluster_name: 'production-cluster',
    image_tag: 'v1.2.3',
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
    n_workers: 8,
    replicas: 3,
    priorities: ['high', 'gpu'],
    envs: [
      { name: 'CUDA_VISIBLE_DEVICES', value: '0,1,2,3' },
      { name: 'MODEL_PATH', value: '/models/llama-7b' }
    ],
    description: 'Standard inference configuration',
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

  const basicNewRecord: HistoryRecord = {
    ...basicOldRecord,
    history_id: 2,
    operation_timestamp: '2024-01-15T11:30:00Z',
    model_version: '1.1.0',
    image_tag: 'v1.2.4',
    fps: 60,
    replicas: 5,
    priorities: ['high', 'gpu', 'priority'],
    envs: [
      { name: 'CUDA_VISIBLE_DEVICES', value: '0,1,2,3,4,5' },
      { name: 'MODEL_PATH', value: '/models/llama-7b-v1.1' },
      { name: 'BATCH_SIZE', value: '32' }
    ],
    description: 'Updated configuration with higher performance',
    enable_cuda_graph: false,
    task_concurrency: 8
  };

  const complexOldRecord: HistoryRecord = {
    ...basicOldRecord,
    history_id: 3,
    envs: [
      {
        name: 'COMPLEX_CONFIG',
        value: JSON.stringify({
          model: {
            architecture: 'transformer',
            layers: 32,
            attention_heads: 32,
            hidden_size: 4096,
            vocab_size: 32000,
            max_position_embeddings: 2048
          },
          training: {
            batch_size: 16,
            learning_rate: 0.0001,
            warmup_steps: 1000,
            max_steps: 100000,
            gradient_accumulation_steps: 4
          },
          inference: {
            max_batch_size: 8,
            max_sequence_length: 1024,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50
          }
        })
      }
    ]
  };

  const complexNewRecord: HistoryRecord = {
    ...complexOldRecord,
    history_id: 4,
    operation_timestamp: '2024-01-15T12:00:00Z',
    envs: [
      {
        name: 'COMPLEX_CONFIG',
        value: JSON.stringify({
          model: {
            architecture: 'transformer',
            layers: 40, // Changed
            attention_heads: 40, // Changed
            hidden_size: 5120, // Changed
            vocab_size: 32000,
            max_position_embeddings: 4096 // Changed
          },
          training: {
            batch_size: 32, // Changed
            learning_rate: 0.00005, // Changed
            warmup_steps: 2000, // Changed
            max_steps: 200000, // Changed
            gradient_accumulation_steps: 8, // Changed
            optimizer: 'adamw' // Added
          },
          inference: {
            max_batch_size: 16, // Changed
            max_sequence_length: 2048, // Changed
            temperature: 0.8, // Changed
            top_p: 0.95, // Changed
            top_k: 40, // Changed
            repetition_penalty: 1.1 // Added
          },
          performance: { // Added entire section
            use_flash_attention: true,
            use_gradient_checkpointing: true,
            mixed_precision: 'fp16'
          }
        })
      }
    ]
  };

  // Generate large object for performance testing
  const generateLargeObject = () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `item-${i}`,
      data: {
        values: Array.from({ length: 100 }, (_, j) => Math.random() * 1000),
        metadata: {
          created: new Date().toISOString(),
          tags: [`tag-${i % 10}`, `category-${i % 5}`],
          properties: {
            weight: Math.random() * 100,
            height: Math.random() * 200,
            width: Math.random() * 300
          }
        }
      }
    }));

    return largeArray;
  };

  const largeOldRecord: HistoryRecord = {
    ...basicOldRecord,
    history_id: 5,
    envs: [
      {
        name: 'LARGE_DATASET',
        value: JSON.stringify({
          dataset: generateLargeObject().slice(0, 500),
          metadata: {
            version: '1.0',
            size: 500,
            checksum: 'abc123def456'
          }
        })
      }
    ]
  };

  const largeNewRecord: HistoryRecord = {
    ...largeOldRecord,
    history_id: 6,
    operation_timestamp: '2024-01-15T13:00:00Z',
    envs: [
      {
        name: 'LARGE_DATASET',
        value: JSON.stringify({
          dataset: generateLargeObject(),
          metadata: {
            version: '2.0', // Changed
            size: 1000, // Changed
            checksum: 'def456ghi789', // Changed
            compression: 'gzip' // Added
          }
        })
      }
    ]
  };

  const getRecords = () => {
    switch (demoScenario) {
      case 'basic':
        return { oldRecord: basicOldRecord, newRecord: basicNewRecord };
      case 'complex':
        return { oldRecord: complexOldRecord, newRecord: complexNewRecord };
      case 'large':
        return { oldRecord: largeOldRecord, newRecord: largeNewRecord };
      default:
        return { oldRecord: basicOldRecord, newRecord: basicNewRecord };
    }
  };

  const { oldRecord, newRecord } = getRecords();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>
          <PlayCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          Enhanced History Comparison Demo
        </Title>
        
        <Paragraph>
          This demo showcases the enhanced history comparison functionality with performance optimizations,
          export capabilities, and multiple comparison modes.
        </Paragraph>

        <Divider />

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Title level={4}>Demo Scenarios</Title>
            <Space wrap>
              <Button
                type={demoScenario === 'basic' ? 'primary' : 'default'}
                onClick={() => setDemoScenario('basic')}
              >
                Basic Changes
                <Tag color="blue" style={{ marginLeft: 4 }}>
                  Simple fields
                </Tag>
              </Button>
              <Button
                type={demoScenario === 'complex' ? 'primary' : 'default'}
                onClick={() => setDemoScenario('complex')}
              >
                Complex JSON
                <Tag color="orange" style={{ marginLeft: 4 }}>
                  Nested objects
                </Tag>
              </Button>
              <Button
                type={demoScenario === 'large' ? 'primary' : 'default'}
                onClick={() => setDemoScenario('large')}
              >
                Large Objects
                <Tag color="red" style={{ marginLeft: 4 }}>
                  Performance test
                </Tag>
              </Button>
            </Space>
          </Col>
        </Row>

        <Card size="small" style={{ backgroundColor: '#f9f9f9', marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Old Record:</Text>
              <br />
              <Text type="secondary">
                ID: {oldRecord.history_id} | {oldRecord.operation_timestamp}
              </Text>
            </Col>
            <Col span={12}>
              <Text strong>New Record:</Text>
              <br />
              <Text type="secondary">
                ID: {newRecord.history_id} | {newRecord.operation_timestamp}
              </Text>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Title level={4}>
          <ReloadOutlined style={{ marginRight: 8 }} />
          Comparison Results
        </Title>

        <HistoryComparison
          oldRecord={oldRecord}
          newRecord={newRecord}
          showUnchangedByDefault={false}
          compact={false}
          enableVirtualization={true}
          virtualizationThreshold={50}
        />
      </Card>
    </div>
  );
};

export default HistoryComparisonDemo;