/**
 * InstanceGrid Component
 * Responsive grid layout for instance cards on mobile devices
 */

import React, { useMemo, useCallback } from 'react';
import { Row, Col, Empty, Spin, Typography, Space, Button } from 'antd';
import { ReloadOutlined, AppstoreOutlined } from '@ant-design/icons';
import { InstanceCard } from './InstanceCard';
import type { Instance } from '../../types/instance';
import { useResponsive } from '../../hooks/useResponsive';
import './InstanceGrid.css';

const { Text } = Typography;

/**
 * Props for InstanceGrid component
 */
export interface InstanceGridProps {
  instances: Instance[];
  loading?: boolean;
  onEdit?: (instance: Instance) => void;
  onDelete?: (instance: Instance) => void;
  onViewHistory?: (instance: Instance) => void;
  onViewDetails?: (instance: Instance) => void;
  onCopy?: (instance: Instance) => void;
  onRefresh?: () => void;
  emptyText?: string;
  showRefreshButton?: boolean;
}

/**
 * InstanceGrid Component - Memoized for performance
 */
export const InstanceGrid: React.FC<InstanceGridProps> = React.memo(({
  instances,
  loading = false,
  onEdit,
  onDelete,
  onViewHistory,
  onViewDetails,
  onCopy,
  onRefresh,
  emptyText = '暂无实例数据',
  showRefreshButton = true,
}) => {
  const { isMobile, isTablet, screenWidth } = useResponsive();

  // Memoize action handlers to prevent unnecessary re-renders
  const handleEdit = useCallback((instance: Instance) => {
    onEdit?.(instance);
  }, [onEdit]);

  const handleDelete = useCallback((instance: Instance) => {
    onDelete?.(instance);
  }, [onDelete]);

  const handleViewHistory = useCallback((instance: Instance) => {
    onViewHistory?.(instance);
  }, [onViewHistory]);

  const handleViewDetails = useCallback((instance: Instance) => {
    onViewDetails?.(instance);
  }, [onViewDetails]);

  const handleCopy = useCallback((instance: Instance) => {
    onCopy?.(instance);
  }, [onCopy]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  /**
   * Calculate responsive column spans
   */
  const getColSpan = useMemo(() => {
    if (screenWidth < 480) {
      // Very small mobile: 1 column
      return 24;
    } else if (screenWidth < 768) {
      // Mobile: 1 column
      return 24;
    } else if (screenWidth < 1024) {
      // Tablet: 2 columns
      return 12;
    } else if (screenWidth < 1400) {
      // Small desktop: 3 columns
      return 8;
    } else {
      // Large desktop: 4 columns
      return 6;
    }
  }, [screenWidth]);

  /**
   * Calculate grid gutter based on screen size
   */
  const getGutter = useMemo((): [number, number] => {
    if (isMobile) {
      return [12, 12];
    } else if (isTablet) {
      return [16, 16];
    } else {
      return [20, 20];
    }
  }, [isMobile, isTablet]);

  /**
   * Render loading state
   */
  if (loading && instances.length === 0) {
    return (
      <div className="instance-grid-loading">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">加载实例数据中...</Text>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (!loading && instances.length === 0) {
    return (
      <div className="instance-grid-empty">
        <Empty
          image={<AppstoreOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <Space direction="vertical" size={8}>
              <Text type="secondary">{emptyText}</Text>
              {showRefreshButton && onRefresh && (
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="small"
                >
                  刷新数据
                </Button>
              )}
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="instance-grid-container">
      {/* Loading overlay for refresh */}
      <Spin spinning={loading} tip="刷新中...">
        <Row gutter={getGutter} className="instance-grid">
          {instances.map((instance) => (
            <Col
              key={instance.id}
              span={getColSpan}
              className="instance-grid-col"
            >
              <InstanceCard
                instance={instance}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                onViewDetails={handleViewDetails}
                onCopy={handleCopy}
              />
            </Col>
          ))}
        </Row>
      </Spin>

      {/* Grid info footer */}
      {instances.length > 0 && (
        <div className="instance-grid-footer">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            显示 {instances.length} 个实例
            {isMobile && ' • 卡片视图'}
          </Text>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
InstanceGrid.displayName = 'InstanceGrid';

export default InstanceGrid;