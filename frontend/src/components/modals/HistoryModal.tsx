import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Typography,
  Space,
  Button,
  Alert,
  List,
  Card,
  Tag,
  Spin,
  Empty,
  Descriptions
} from 'antd';
import {
  HistoryOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { Instance } from '../../types/instance';
import type { HistoryRecord } from '../../types/history';
import { HistoryService } from '../../services/historyService';

const { Title, Text } = Typography;

export interface HistoryModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Instance to show history for */
  instance?: Instance;
  /** Modal close handler */
  onClose: () => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * HistoryModal Component
 * 
 * A simplified modal dialog for displaying instance history records.
 * Features:
 * - Displays history records in chronological order
 * - Shows operation type, timestamp, and brief summary
 * - Provides detailed view for each record
 * - Simple loading states and error handling
 */
export const HistoryModal: React.FC<HistoryModalProps> = ({
  visible,
  instance,
  onClose,
  onError
}) => {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Load history records
  const loadHistory = useCallback(async () => {
    if (!instance) return;

    setLoading(true);
    try {
      const response = await HistoryService.getInstanceHistory(
        instance.id,
        {},
        { limit: 100, offset: 0 }
      );
      setHistoryRecords(response.history_records);
    } catch (error) {
      console.error('Failed to load history:', error);
      onError?.(error instanceof Error ? error : new Error('加载历史记录失败'));
    } finally {
      setLoading(false);
    }
  }, [instance, onError]);

  // Load history when modal opens
  useEffect(() => {
    if (visible && instance) {
      loadHistory();
    }
  }, [visible, instance, loadHistory]);

  // Handle refresh
  const handleRefresh = () => {
    loadHistory();
  };

  // Handle view detail
  const handleViewDetail = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  // Handle close detail
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRecord(null);
  };

  // Get operation type icon and color
  const getOperationDisplay = (operationType: string) => {
    switch (operationType) {
      case 'create':
        return { icon: <PlusOutlined />, color: 'green', text: '创建' };
      case 'update':
        return { icon: <EditOutlined />, color: 'blue', text: '更新' };
      case 'delete':
        return { icon: <DeleteOutlined />, color: 'red', text: '删除' };
      default:
        return { icon: <InfoCircleOutlined />, color: 'default', text: operationType };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // Get brief summary of changes
  const getBriefSummary = (record: HistoryRecord) => {
    const changes = [];
    if (record.model_name) changes.push(`模型: ${record.model_name}`);
    if (record.cluster_name) changes.push(`集群: ${record.cluster_name}`);
    if (record.status) changes.push(`状态: ${record.status}`);
    if (record.replicas) changes.push(`副本数: ${record.replicas}`);

    return changes.slice(0, 3).join(', ') + (changes.length > 3 ? '...' : '');
  };

  if (!instance) {
    return null;
  }

  return (
    <>
      <Modal
        title={
          <Space size="middle">
            <HistoryOutlined />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                实例历史记录
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {instance.name}
              </Text>
            </div>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        centered
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>,
          <Button key="close" onClick={onClose}>
            关闭
          </Button>
        ]}
        styles={{
          body: { maxHeight: '60vh', overflowY: 'auto' }
        }}
      >
        <Spin spinning={loading}>
          {historyRecords.length === 0 && !loading ? (
            <Empty
              description="暂无历史记录"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={historyRecords}
              renderItem={(record) => {
                const operation = getOperationDisplay(record.operation_type);
                return (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Tag color={operation.color} icon={operation.icon}>
                          {operation.text}
                        </Tag>
                      }
                      title={
                        <Space>
                          <Text strong>{formatTimestamp(record.operation_timestamp)}</Text>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">{getBriefSummary(record)}</Text>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Spin>

        {/* Summary Info */}
        {historyRecords.length > 0 && (
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                <span>共 {historyRecords.length} 条历史记录</span>
              </Space>
            }
            type="info"
            showIcon={false}
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="历史记录详情"
        open={showDetail}
        onCancel={handleCloseDetail}
        width={900}
        centered
        footer={[
          <Button key="close" onClick={handleCloseDetail}>
            关闭
          </Button>
        ]}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' }
        }}
      >
        {selectedRecord && (
          <Card>
            <Descriptions title="基本信息" bordered column={2} size="small">
              <Descriptions.Item label="操作类型">
                <Tag color={getOperationDisplay(selectedRecord.operation_type).color}>
                  {getOperationDisplay(selectedRecord.operation_type).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作时间">
                {formatTimestamp(selectedRecord.operation_timestamp)}
              </Descriptions.Item>
              <Descriptions.Item label="实例名称">{selectedRecord.name}</Descriptions.Item>
              <Descriptions.Item label="模型名称">{selectedRecord.model_name}</Descriptions.Item>
              <Descriptions.Item label="模型版本">{selectedRecord.model_version || 'latest'}</Descriptions.Item>
              <Descriptions.Item label="集群名称">{selectedRecord.cluster_name}</Descriptions.Item>
              <Descriptions.Item label="镜像标签">{selectedRecord.image_tag}</Descriptions.Item>
              <Descriptions.Item label="状态">{selectedRecord.status}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="资源配置" bordered column={2} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="副本数">{selectedRecord.replicas}</Descriptions.Item>
              <Descriptions.Item label="工作进程数">{selectedRecord.n_workers}</Descriptions.Item>
              <Descriptions.Item label="Pipeline并行度">{selectedRecord.pp}</Descriptions.Item>
              <Descriptions.Item label="Context并行度">{selectedRecord.cp}</Descriptions.Item>
              <Descriptions.Item label="Tensor并行度">{selectedRecord.tp}</Descriptions.Item>
              <Descriptions.Item label="任务并发数">{selectedRecord.task_concurrency}</Descriptions.Item>
              {selectedRecord.celery_task_concurrency && (
                <Descriptions.Item label="Celery任务并发">{selectedRecord.celery_task_concurrency}</Descriptions.Item>
              )}
              {selectedRecord.fps && (
                <Descriptions.Item label="FPS">{selectedRecord.fps}</Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions title="模式配置" bordered column={2} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="管道模式">{selectedRecord.pipeline_mode || 'default'}</Descriptions.Item>
              <Descriptions.Item label="量化模式">
                <Tag color={selectedRecord.quant_mode ? 'purple' : 'default'}>
                  {selectedRecord.quant_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="蒸馏模式">
                <Tag color={selectedRecord.distill_mode ? 'cyan' : 'default'}>
                  {selectedRecord.distill_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="M405模式">
                <Tag color={selectedRecord.m405_mode ? 'orange' : 'default'}>
                  {selectedRecord.m405_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="CUDA图优化">
                <Tag color={selectedRecord.enable_cuda_graph ? 'green' : 'default'}>
                  {selectedRecord.enable_cuda_graph ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分离视频编码">
                <Tag color={selectedRecord.separate_video_encode ? 'green' : 'default'}>
                  {selectedRecord.separate_video_encode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分离视频解码">
                <Tag color={selectedRecord.separate_video_decode ? 'green' : 'default'}>
                  {selectedRecord.separate_video_decode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分离T5编码">
                <Tag color={selectedRecord.separate_t5_encode ? 'green' : 'default'}>
                  {selectedRecord.separate_t5_encode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="临时实例配置" bordered column={2} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="临时实例">
                <Tag color={selectedRecord.ephemeral ? 'blue' : 'default'}>
                  {selectedRecord.ephemeral ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最小存活时间">
                {selectedRecord.ephemeral_min_period_seconds ? 
                  `${selectedRecord.ephemeral_min_period_seconds} 秒` : 
                  '未设置'
                }
              </Descriptions.Item>
              <Descriptions.Item label="ephemeral来源">
                {selectedRecord.ephemeral_from || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="ephemeral目标">
                {selectedRecord.ephemeral_to || '未设置'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="存储配置" bordered column={2} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="VAE存储类型">
                {selectedRecord.vae_store_type || 'redis'}
              </Descriptions.Item>
              <Descriptions.Item label="T5存储类型">
                {selectedRecord.t5_store_type || 'redis'}
              </Descriptions.Item>
            </Descriptions>

            {selectedRecord.checkpoint_path && (
              <Descriptions title="路径配置" bordered column={1} size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="检查点路径">{selectedRecord.checkpoint_path}</Descriptions.Item>
              </Descriptions>
            )}

            {selectedRecord.nonce && (
              <Descriptions title="其他信息" bordered column={1} size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="Nonce">{selectedRecord.nonce}</Descriptions.Item>
              </Descriptions>
            )}

            {selectedRecord.priorities && Array.isArray(selectedRecord.priorities) && selectedRecord.priorities.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>优先级配置</Title>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                  {selectedRecord.priorities.map((priority, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: 4, marginRight: 8 }}>
                      {priority}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.description && (
              <Descriptions title="描述信息" bordered column={1} size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="描述">{selectedRecord.description}</Descriptions.Item>
              </Descriptions>
            )}

            {selectedRecord.envs && typeof selectedRecord.envs === 'object' && Object.keys(selectedRecord.envs).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>环境变量</Title>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                  {Object.entries(selectedRecord.envs).map(([key, value]) => (
                    <Tag key={key} style={{ marginBottom: 4, marginRight: 8 }}>
                      {key}: {String(value)}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </Modal>
    </>
  );
};

export default HistoryModal;