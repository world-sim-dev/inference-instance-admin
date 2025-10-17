/**
 * VirtualizedInstanceTable Component
 * High-performance virtualized table for handling large datasets
 * Uses react-window for efficient rendering of large lists
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { List } from 'react-window';
import { Table, Tag, Button, Space, Tooltip, Typography, Card } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  HistoryOutlined, 
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined 
} from '@ant-design/icons';
import type { Instance } from '../../types/instance';
import { Status } from '../../types/enums';
import { useResponsive } from '../../hooks/useResponsive';

const { Text } = Typography;

/**
 * Props for VirtualizedInstanceTable component
 */
export interface VirtualizedInstanceTableProps {
  instances: Instance[];
  loading?: boolean;
  height?: number;
  itemHeight?: number;
  onEdit?: (instance: Instance) => void;
  onDelete?: (instance: Instance) => void;
  onViewHistory?: (instance: Instance) => void;
  onViewDetails?: (instance: Instance) => void;
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
    case Status.PENDING:
      return 'orange';
    case Status.ERROR:
      return 'red';
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
    case Status.PENDING:
      return <PlayCircleOutlined spin />;
    case Status.ERROR:
      return <PauseCircleOutlined />;
    default:
      return null;
  }
};

/**
 * Row component for virtualized list
 */
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    instances: Instance[];
    onEdit?: (instance: Instance) => void;
    onDelete?: (instance: Instance) => void;
    onViewHistory?: (instance: Instance) => void;
    onViewDetails?: (instance: Instance) => void;
    isMobile: boolean;
  };
}

const Row: React.FC<RowProps> = React.memo(({ index, style, data }) => {
  const { instances, onEdit, onDelete, onViewHistory, onViewDetails, isMobile } = data;
  const instance = instances[index];

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

  return (
    <div style={style}>
      <Card 
        size="small" 
        style={{ 
          margin: '4px 8px',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          {/* Instance Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small">
              <div>
                <Text strong ellipsis style={{ maxWidth: '200px' }}>
                  {instance.name}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                  ID: {instance.id}
                </Text>
              </div>
              
              <Tag 
                color={getStatusColor(instance.status)} 
                icon={getStatusIcon(instance.status)}
              >
                {instance.status.toUpperCase()}
              </Tag>

              {!isMobile && (
                <>
                  <Text style={{ fontSize: '12px' }}>
                    {instance.model_name} v{instance.model_version}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {instance.cluster_name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    PP:{instance.pp} CP:{instance.cp} TP:{instance.tp}
                  </Text>
                </>
              )}
            </Space>
          </div>

          {/* Actions */}
          <div style={{ flexShrink: 0, marginLeft: 8 }}>
            <Space size="small">
              {onViewDetails && (
                <Tooltip title="View Details">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={handleViewDetails}
                  />
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                  />
                </Tooltip>
              )}
              {onViewHistory && (
                <Tooltip title="View History">
                  <Button
                    type="text"
                    size="small"
                    icon={<HistoryOutlined />}
                    onClick={handleViewHistory}
                  />
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                  />
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
});

Row.displayName = 'VirtualizedRow';

/**
 * VirtualizedInstanceTable Component
 */
export const VirtualizedInstanceTable: React.FC<VirtualizedInstanceTableProps> = React.memo(({
  instances,
  loading = false,
  height = 600,
  itemHeight = 80,
  onEdit,
  onDelete,
  onViewHistory,
  onViewDetails,
}) => {
  const { isMobile } = useResponsive();
  const listRef = useRef<any>(null);

  // Memoize list data to prevent unnecessary re-renders
  const listData = useMemo(() => ({
    instances,
    onEdit,
    onDelete,
    onViewHistory,
    onViewDetails,
    isMobile,
  }), [instances, onEdit, onDelete, onViewHistory, onViewDetails, isMobile]);

  // Scroll to top when instances change
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToItem(0);
  }, []);

  // Effect to scroll to top when instances change
  React.useEffect(() => {
    scrollToTop();
  }, [instances.length, scrollToTop]);

  if (loading && instances.length === 0) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Text type="secondary">Loading instances...</Text>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Text type="secondary">No instances found</Text>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: '6px' }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa',
        fontWeight: 500
      }}>
        <Text>
          Showing {instances.length} instances (Virtualized View)
        </Text>
      </div>

      {/* Virtualized List */}
      <List
        ref={listRef}
        height={height - 45} // Subtract header height
        itemCount={instances.length}
        itemSize={itemHeight}
        itemData={listData}
        overscanCount={5} // Render 5 extra items for smooth scrolling
        style={{ outline: 'none' }}
      >
        {Row}
      </List>
    </div>
  );
});

VirtualizedInstanceTable.displayName = 'VirtualizedInstanceTable';

export default VirtualizedInstanceTable;