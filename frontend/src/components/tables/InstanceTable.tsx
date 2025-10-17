/**
 * InstanceTable Component
 * Displays instances in a responsive table with sorting, pagination, and actions
 * Optimized with React.memo and useMemo for performance
 */

import React, { useMemo, useCallback } from 'react';
import './InstanceTable.css';
import { Table, Tag, Button, Space, Tooltip, Typography } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  HistoryOutlined, 
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined 
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { Instance } from '../../types/instance';
import { Status } from '../../types/enums';
import { useResponsive } from '../../hooks/useResponsive';
import { InstanceGrid } from './InstanceGrid';
import { ResponsiveContainer } from '../common/ResponsiveContainer';

const { Text } = Typography;

/**
 * Props for InstanceTable component
 */
export interface InstanceTableProps {
  instances: Instance[];
  loading?: boolean;
  pagination?: TableProps<Instance>['pagination'];
  onChange?: TableProps<Instance>['onChange'];
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
 * Format priorities array for display
 */
const formatPriorities = (priorities: string[]): string => {
  if (!priorities || priorities.length === 0) return 'None';
  return priorities.slice(0, 2).join(', ') + (priorities.length > 2 ? '...' : '');
};

/**
 * Format resource allocation for display
 */
const formatResources = (instance: Instance): string => {
  return `PP:${instance.pp} CP:${instance.cp} TP:${instance.tp}`;
};

/**
 * InstanceTable Component - Memoized for performance
 */
export const InstanceTable: React.FC<InstanceTableProps> = React.memo(({
  instances,
  loading = false,
  pagination,
  onChange,
  onEdit,
  onDelete,
  onViewHistory,
  onViewDetails,
}) => {
  const { isMobile, isTablet } = useResponsive();

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

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<Instance> = useMemo(() => {
    const baseColumns: ColumnsType<Instance> = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left',
        width: 200,
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (name: string, record: Instance) => (
          <Space direction="vertical" size={0}>
            <Text strong>{name}</Text>
            {!isMobile && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {record.id}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        sorter: (a, b) => a.status.localeCompare(b.status),
        render: (status: string) => (
          <Tag 
            color={getStatusColor(status)} 
            icon={getStatusIcon(status)}
          >
            {status.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: 'Model',
        dataIndex: 'model_name',
        key: 'model_name',
        width: 150,
        sorter: (a, b) => a.model_name.localeCompare(b.model_name),
        render: (modelName: string, record: Instance) => (
          <Space direction="vertical" size={0}>
            <Text>{modelName}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              v{record.model_version}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Cluster',
        dataIndex: 'cluster_name',
        key: 'cluster_name',
        width: 120,
        sorter: (a, b) => a.cluster_name.localeCompare(b.cluster_name),
      },
      {
        title: 'Resources',
        key: 'resources',
        width: 120,
        render: (_, record: Instance) => (
          <Tooltip title={`Pipeline: ${record.pp}, Context: ${record.cp}, Tensor: ${record.tp}`}>
            <Text style={{ fontSize: '12px' }}>
              {formatResources(record)}
            </Text>
          </Tooltip>
        ),
      },
      {
        title: 'Workers',
        key: 'workers',
        width: 100,
        sorter: (a, b) => a.n_workers - b.n_workers,
        render: (_, record: Instance) => (
          <Space direction="vertical" size={0}>
            <Text>{record.n_workers}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              x{record.replicas}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Priorities',
        dataIndex: 'priorities',
        key: 'priorities',
        width: 120,
        render: (priorities: string[]) => (
          <Tooltip title={priorities?.join(', ') || 'None'}>
            <Text style={{ fontSize: '12px' }}>
              {formatPriorities(priorities)}
            </Text>
          </Tooltip>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 120,
        sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (createdAt: string) => (
          <Text style={{ fontSize: '12px' }}>
            {new Date(createdAt).toLocaleDateString()}
          </Text>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: isMobile ? 80 : 160,
        render: (_, record: Instance) => (
          <Space size="small">
            {onViewDetails && (
              <Tooltip title="View Details">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetails(record)}
                />
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            )}
            {onViewHistory && (
              <Tooltip title="View History">
                <Button
                  type="text"
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => handleViewHistory(record)}
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
                  onClick={() => handleDelete(record)}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];

    // Hide columns on mobile/tablet for better responsiveness
    if (isMobile) {
      return baseColumns.filter(col => 
        ['name', 'status', 'actions'].includes(col.key as string)
      );
    }

    if (isTablet) {
      return baseColumns.filter(col => 
        !['priorities', 'created_at'].includes(col.key as string)
      );
    }

    return baseColumns;
  }, [isMobile, isTablet, handleEdit, handleDelete, handleViewHistory, handleViewDetails]);

  /**
   * Table scroll configuration for responsiveness
   */
  const scroll = useMemo(() => {
    if (isMobile) {
      return { x: 400 };
    }
    if (isTablet) {
      return { x: 800 };
    }
    return { x: 1200 };
  }, [isMobile, isTablet]);

  return (
    <ResponsiveContainer
      mobile={
        <InstanceGrid
          instances={instances}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewHistory={handleViewHistory}
          onViewDetails={handleViewDetails}
          emptyText="No instances found"
        />
      }
    >
      <Table<Instance>
        columns={columns}
        dataSource={instances}
        loading={loading}
        pagination={pagination}
        onChange={onChange}
        rowKey="id"
        scroll={scroll}
        size={isMobile ? 'small' : 'middle'}
        showSorterTooltip={false}
        locale={{
          emptyText: 'No instances found',
        }}
        rowClassName={(record) => {
          // Add visual indicators for different states
          if (record.ephemeral) return 'ephemeral-instance';
          if (record.status === Status.ERROR) return 'error-instance';
          return '';
        }}
      />
    </ResponsiveContainer>
  );
});

// Add display name for debugging
InstanceTable.displayName = 'InstanceTable';

export default InstanceTable;