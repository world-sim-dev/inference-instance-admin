import React, { useMemo, useCallback } from 'react';
import { Modal, Descriptions, Tag, Space, Typography, Divider, Row, Col } from 'antd';
import { 
  InfoCircleOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { Instance } from '../../types/instance';
import { formatTimestamp, getRelativeTime } from '../../utils/dataUtils';
import { getStatusColor } from '../../utils/statusUtils';

const { Title, Text } = Typography;

export interface ViewDetailsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Instance to display details for */
  instance?: Instance;
  /** Modal close handler */
  onClose: () => void;
}

/**
 * ViewDetailsModal Component
 * 
 * A modal dialog for displaying detailed instance information.
 * Features:
 * - Comprehensive instance information display
 * - Organized sections for different types of data
 * - Status indicators and visual formatting
 * - Responsive layout for different screen sizes
 * - Read-only view with no editing capabilities
 */
export const ViewDetailsModal: React.FC<ViewDetailsModalProps> = React.memo(({
  visible,
  instance,
  onClose
}) => {
  if (!instance) {
    return null;
  }

  // Memoize expensive computations
  const statusDisplay = useMemo(() => (
    <Tag 
      color={getStatusColor(instance.status)}
    >
      {instance.status.toUpperCase()}
    </Tag>
  ), [instance.status]);

  const formattedPriorities = useMemo(() => {
    if (!instance.priorities || instance.priorities.length === 0) return 'None';
    return instance.priorities.map(priority => (
      <Tag key={priority} color="blue">{priority}</Tag>
    ));
  }, [instance.priorities]);

  const formattedEnvs = useMemo(() => {
    try {
      console.log('Debug envs:', instance.envs, typeof instance.envs);
      
      // Simple test - just return a basic message
      return <Text style={{ color: 'blue' }}>环境变量内容: {JSON.stringify(instance.envs) || 'undefined'}</Text>;
    } catch (error) {
      console.error('Error in formattedEnvs:', error);
      return <Text style={{ color: 'red' }}>渲染环境变量时出错</Text>;
    }
  }, [instance.envs]);

  // Memoize close handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          <span>实例详情</span>
          <Text type="secondary">({instance.name})</Text>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      centered
      footer={null}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '24px'
        }
      }}
    >
      <div>
        {/* TEST - This should always be visible */}
        <div style={{ backgroundColor: 'yellow', padding: '10px', margin: '10px 0' }}>
          <h2 style={{ color: 'red' }}>🔴 测试：如果你能看到这个黄色区域，说明 ViewDetailsModal 正在工作</h2>
        </div>

        {/* Basic Information */}
        <Title level={4}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          基础信息
        </Title>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="实例ID" span={1}>
            <Text code>{instance.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="实例名称" span={1}>
            <Text strong>{instance.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="状态" span={1}>
            {statusDisplay}
          </Descriptions.Item>
          <Descriptions.Item label="实例类型" span={1}>
            <Tag color={instance.ephemeral ? 'orange' : 'green'}>
              {instance.ephemeral ? '临时实例' : '持久实例'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {instance.description || <Text type="secondary">无描述</Text>}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Model Information */}
        <Title level={4}>
          <ClusterOutlined style={{ marginRight: 8 }} />
          模型配置
        </Title>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="模型名称" span={1}>
            <Text strong>{instance.model_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="模型版本" span={1}>
            <Text code>v{instance.model_version}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="集群名称" span={1}>
            <Text>{instance.cluster_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="镜像标签" span={1}>
            <Text code>{instance.image_tag}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="检查点路径" span={2}>
            {instance.checkpoint_path ? (
              <Text code style={{ fontSize: '12px' }}>{instance.checkpoint_path}</Text>
            ) : (
              <Text type="secondary">未设置</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Nonce" span={2}>
            {instance.nonce ? (
              <Text code>{instance.nonce}</Text>
            ) : (
              <Text type="secondary">未设置</Text>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Pipeline Configuration */}
        <Title level={4}>
          <SettingOutlined style={{ marginRight: 8 }} />
          管道配置
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="管道模式">
                <Text code>{instance.pipeline_mode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="量化模式">
                <Tag color={instance.quant_mode ? 'green' : 'default'}>
                  {instance.quant_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="蒸馏模式">
                <Tag color={instance.distill_mode ? 'green' : 'default'}>
                  {instance.distill_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="M405模式">
                <Tag color={instance.m405_mode ? 'green' : 'default'}>
                  {instance.m405_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              {(instance.fps !== null && instance.fps !== undefined) && (
                <Descriptions.Item label="FPS">
                  <Text>{instance.fps}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="CUDA图">
                <Tag color={instance.enable_cuda_graph ? 'green' : 'default'}>
                  {instance.enable_cuda_graph ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="视频编码分离">
                <Tag color={instance.separate_video_encode ? 'green' : 'default'}>
                  {instance.separate_video_encode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="视频解码分离">
                <Tag color={instance.separate_video_decode ? 'green' : 'default'}>
                  {instance.separate_video_decode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="T5编码分离">
                <Tag color={instance.separate_t5_encode ? 'green' : 'default'}>
                  {instance.separate_t5_encode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider />

        {/* Resource Allocation */}
        <Title level={4}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          资源分配
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="管道并行 (PP)">
                <Text strong>{instance.pp}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="上下文并行 (CP)">
                <Text strong>{instance.cp}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="张量并行 (TP)">
                <Text strong>{instance.tp}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="工作进程数">
                <Text strong>{instance.n_workers}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="副本数">
                <Text strong>{instance.replicas}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="任务并发数">
                <Text>{instance.task_concurrency}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Celery任务并发数">
                <Text>{instance.celery_task_concurrency ?? '未设置'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="VAE存储类型">
                <Text code>{instance.vae_store_type}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="T5存储类型">
                <Text code>{instance.t5_store_type}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider />

        {/* Priorities */}
        <Title level={4}>
          <SettingOutlined style={{ marginRight: 8 }} />
          优先级配置
        </Title>
        <Descriptions bordered size="small" column={1}>
          {instance.priority && (
            <Descriptions.Item label="当前优先级">
              <Tag color="blue">{instance.priority}</Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="支持优先级">
            <Space wrap>
              {formattedPriorities}
            </Space>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Environment Variables - TEST SECTION */}
        <Divider />
        <Title level={4} style={{ color: 'red' }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          🔴 环境变量测试区域
        </Title>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="测试显示">
            <Text style={{ color: 'red', fontWeight: 'bold' }}>
              如果你能看到这行文字，说明这个部分正在渲染
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="环境变量">
            {formattedEnvs}
          </Descriptions.Item>
          <Descriptions.Item label="调试信息">
            <Text code style={{ fontSize: '10px' }}>
              envs类型: {typeof instance.envs}, 值: {JSON.stringify(instance.envs)}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Ephemeral Configuration */}
        {instance.ephemeral && (
          <>
            <Divider />
            <Title level={4}>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              临时实例配置
            </Title>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="最小运行时间" span={1}>
                <Text>{instance.ephemeral_min_period_seconds ? `${instance.ephemeral_min_period_seconds} 秒` : '未设置'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="生效时间" span={1}>
                <Text>{instance.ephemeral_from || '未设置'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="失效时间" span={1}>
                <Text>{instance.ephemeral_to || '未设置'}</Text>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        <Divider />

        {/* Timestamps */}
        <Title level={4}>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          时间信息
        </Title>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="创建时间" span={1}>
            <Space direction="vertical" size={0}>
              <Text>{formatTimestamp(instance.created_at)}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ({getRelativeTime(instance.created_at)})
              </Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="更新时间" span={1}>
            <Space direction="vertical" size={0}>
              <Text>{formatTimestamp(instance.updated_at)}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ({getRelativeTime(instance.updated_at)})
              </Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
});

// Add display name for debugging
ViewDetailsModal.displayName = 'ViewDetailsModal';

export default ViewDetailsModal;