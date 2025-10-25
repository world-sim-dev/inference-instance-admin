/**
 * InstanceCard Component
 * Mobile-friendly card view for displaying instance information
 */

import React, { useCallback, useMemo } from 'react';
import { Card, Tag, Space, Button, Typography, Row, Col, Tooltip, Divider } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  HistoryOutlined, 
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  SettingOutlined,
  CopyOutlined
} from '@ant-design/icons';
import type { Instance } from '../../types/instance';
import { Status } from '../../types/enums';
import './InstanceCard.css';

const { Text, Title } = Typography;

/**
 * Props for InstanceCard component
 */
export interface InstanceCardProps {
  instance: Instance;
  onEdit?: (instance: Instance) => void;
  onDelete?: (instance: Instance) => void;
  onViewHistory?: (instance: Instance) => void;
  onViewDetails?: (instance: Instance) => void;
  onCopy?: (instance: Instance) => void;
}

/**
 * Get status tag color based on status value
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case Status.ACTIVE:
      return 'green';
    case Status.INACTIVE:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get status icon based on status value
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case Status.ACTIVE:
      return <PlayCircleOutlined />;
    case Status.INACTIVE:
      return <PauseCircleOutlined />;
    default:
      return null;
  }
};

/**
 * Format priorities array for display
 */
const formatPriorities = (priorities: string[]): string => {
  if (!priorities || priorities.length === 0) return 'None';
  return priorities.slice(0, 3).join(', ') + (priorities.length > 3 ? '...' : '');
};

/**
 * InstanceCard Component - Memoized for performance
 */
export const InstanceCard: React.FC<InstanceCardProps> = React.memo(({
  instance,
  onEdit,
  onDelete,
  onViewHistory,
  onViewDetails,
  onCopy,
}) => {
  // Memoize action handlers to prevent unnecessary re-renders
  const handleEdit = useCallback(() => {
    onEdit?.(instance);
  }, [onEdit, instance]);

  const handleDelete = useCallback(() => {
    onDelete?.(instance);
  }, [onDelete, instance]);

  const handleViewHistory = useCallback(() => {
    onViewHistory?.(instance);
  }, [onViewHistory, instance]);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(instance);
  }, [onViewDetails, instance]);

  const handleCopy = useCallback(() => {
    onCopy?.(instance);
  }, [onCopy, instance]);
  // Memoize card className to prevent unnecessary recalculations
  const cardClassName = useMemo(() => `instance-card ${
    instance.ephemeral ? 'ephemeral-card' : ''
  } ${
    instance.status === Status.INACTIVE ? 'inactive-card' : ''
  }`, [instance.ephemeral, instance.status]);

  // Memoize formatted priorities to prevent unnecessary recalculations
  const formattedPriorities = useMemo(() => 
    formatPriorities(instance.priorities), 
    [instance.priorities]
  );

  return (
    <Card 
      className={cardClassName}
      size="small"
      hoverable
      actions={[
        onViewDetails && (
          <Tooltip title="查看详情" key="details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={handleViewDetails}
              className="card-action-btn"
              size="large"
            />
          </Tooltip>
        ),
        onEdit && (
          <Tooltip title="编辑" key="edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEdit}
              className="card-action-btn"
              size="large"
            />
          </Tooltip>
        ),
        onCopy && (
          <Tooltip title="复制实例" key="copy">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              className="card-action-btn"
              size="large"
            />
          </Tooltip>
        ),
        onViewHistory && (
          <Tooltip title="查看历史" key="history">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={handleViewHistory}
              className="card-action-btn"
              size="large"
            />
          </Tooltip>
        ),
        onDelete && (
          <Tooltip title="删除" key="delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              className="card-action-btn"
              size="large"
            />
          </Tooltip>
        ),
      ].filter(Boolean)}
    >
      {/* Header with name and status */}
      <div className="card-header">
        <div className="card-title-section">
          <Title level={5} className="card-title" ellipsis={{ tooltip: instance.name }}>
            {instance.name}
          </Title>
          <Text type="secondary" className="card-id">
            ID: {instance.id}
          </Text>
        </div>
        <Tag 
          color={getStatusColor(instance.status)} 
          icon={getStatusIcon(instance.status)}
          className="card-status-tag"
        >
          {instance.status.toUpperCase()}
        </Tag>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Model and Version */}
      <Row gutter={[8, 8]} className="card-info-row">
        <Col span={24}>
          <Space>
            <DatabaseOutlined className="card-icon" />
            <div>
              <Text strong>{instance.model_name}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                v{instance.model_version}
              </Text>
            </div>
          </Space>
        </Col>
      </Row>

      {/* Cluster */}
      <Row gutter={[8, 8]} className="card-info-row">
        <Col span={24}>
          <Space>
            <ClusterOutlined className="card-icon" />
            <Text>{instance.cluster_name}</Text>
          </Space>
        </Col>
      </Row>

      {/* Workers */}
      <Row gutter={[8, 8]} className="card-info-row">
        <Col span={24}>
          <Space>
            <SettingOutlined className="card-icon" />
            <div className="worker-info">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {instance.n_workers} workers × {instance.replicas} replicas
              </Text>
            </div>
          </Space>
        </Col>
      </Row>

      {/* Priorities */}
      {instance.priorities && instance.priorities.length > 0 && (
        <Row gutter={[8, 8]} className="card-info-row">
          <Col span={24}>
            <div className="priorities-section">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                优先级:
              </Text>
              <div style={{ marginTop: 4 }}>
                <Tooltip title={instance.priorities.join(', ')}>
                  <Text style={{ fontSize: '12px' }}>
                    {formattedPriorities}
                  </Text>
                </Tooltip>
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* Description */}
      {instance.description && (
        <Row gutter={[8, 8]} className="card-info-row">
          <Col span={24}>
            <div className="description-section">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                描述:
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text 
                  style={{ fontSize: '12px' }}
                  ellipsis={{ tooltip: instance.description }}
                >
                  {instance.description}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* Special indicators */}
      <div className="card-indicators">
        <Space size="small" wrap>
          {instance.ephemeral && (
            <Tag color="blue">临时实例</Tag>
          )}
          {instance.quant_mode && (
            <Tag color="purple">量化模式</Tag>
          )}
          {instance.distill_mode && (
            <Tag color="cyan">蒸馏模式</Tag>
          )}
          {instance.m405_mode && (
            <Tag color="orange">M405模式</Tag>
          )}
        </Space>
      </div>

      {/* Footer with timestamps */}
      <div className="card-footer">
        <Text type="secondary" style={{ fontSize: '11px' }}>
          创建于 {new Date(instance.created_at).toLocaleDateString('zh-CN')}
        </Text>
        {instance.updated_at !== instance.created_at && (
          <Text type="secondary" style={{ fontSize: '11px', marginLeft: 8 }}>
            • 更新于 {new Date(instance.updated_at).toLocaleDateString('zh-CN')}
          </Text>
        )}
      </div>
    </Card>
  );
});

// Add display name for debugging
InstanceCard.displayName = 'InstanceCard';

export default InstanceCard;