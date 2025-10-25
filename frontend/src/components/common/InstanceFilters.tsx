/**
 * InstanceFilters Component
 * Advanced filtering controls for instance list
 */

import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Select, 
  Button, 
  Space, 
  Divider, 
  Typography, 
  Row, 
  Col,
  Badge,
  Tooltip
} from 'antd';
import { 
  FilterOutlined, 
  ClearOutlined, 
  DownOutlined, 
  UpOutlined 
} from '@ant-design/icons';
import type { InstanceFilters as IInstanceFilters } from '../../types/instance';
import { Status } from '../../types/enums';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;
const { Text } = Typography;

/**
 * Props for InstanceFilters component
 */
export interface InstanceFiltersProps {
  filters: IInstanceFilters;
  filterOptions?: {
    modelNames: string[];
    clusterNames: string[];
    statuses: string[];
  };
  loading?: boolean;
  collapsed?: boolean;
  onFiltersChange: (filters: IInstanceFilters) => void;
  onReset?: () => void;
}

/**
 * Get active filter count
 */
const getActiveFilterCount = (filters: IInstanceFilters): number => {
  let count = 0;
  
  if (filters.status && filters.status.length > 0) count++;
  if (filters.cluster_name && filters.cluster_name.length > 0) count++;
  if (filters.model_name && filters.model_name.length > 0) count++;
  if (filters.ephemeral !== null && filters.ephemeral !== undefined) count++;
  
  return count;
};

/**
 * InstanceFilters Component
 */
export const InstanceFilters: React.FC<InstanceFiltersProps> = ({
  filters,
  filterOptions = { modelNames: [], clusterNames: [], statuses: [] },
  loading = false,
  collapsed: initialCollapsed = true,
  onFiltersChange,
  onReset,
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const { isMobile } = useResponsive();
  
  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof IInstanceFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  /**
   * Handle reset filters
   */
  const handleReset = () => {
    const resetFilters: IInstanceFilters = {
      status: [],
      cluster_name: [],
      model_name: [],
      ephemeral: null,
      search: filters.search, // Keep search term
    };
    onFiltersChange(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  /**
   * Toggle collapsed state
   */
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  /**
   * Available status options
   */
  const statusOptions = useMemo(() => {
    const defaultStatuses = [Status.ACTIVE, Status.INACTIVE];
    const availableStatuses = filterOptions.statuses.length > 0 
      ? filterOptions.statuses 
      : defaultStatuses;
    
    return availableStatuses.map(status => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: status,
    }));
  }, [filterOptions.statuses]);

  if (collapsed) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size={isMobile ? 'small' : 'middle'}>
              <Button
                type="text"
                icon={<FilterOutlined />}
                onClick={toggleCollapsed}
                size={isMobile ? 'large' : 'middle'}
              >
                {isMobile ? '筛选' : 'Filters'}
                {activeFilterCount > 0 && (
                  <Badge 
                    count={activeFilterCount} 
                    size="small" 
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Button>
              <DownOutlined 
                style={{ 
                  fontSize: isMobile ? '14px' : '12px', 
                  color: '#8c8c8c', 
                  cursor: 'pointer' 
                }}
                onClick={toggleCollapsed}
              />
            </Space>
          </Col>
          {activeFilterCount > 0 && (
            <Col>
              <Button
                type="text"
                size={isMobile ? 'large' : 'small'}
                icon={<ClearOutlined />}
                onClick={handleReset}
              >
                {isMobile ? '清除' : 'Clear'}
              </Button>
            </Col>
          )}
        </Row>
      </Card>
    );
  }

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <FilterOutlined />
          <Text>Filters</Text>
          {activeFilterCount > 0 && (
            <Badge count={activeFilterCount} size="small" />
          )}
        </Space>
      }
      extra={
        <Space>
          {activeFilterCount > 0 && (
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={handleReset}
            >
              Clear All
            </Button>
          )}
          <UpOutlined 
            style={{ fontSize: '12px', color: '#8c8c8c', cursor: 'pointer' }}
            onClick={toggleCollapsed}
          />
        </Space>
      }
    >
      <Row gutter={[12, 12]}>
        {/* Status Filter */}
        <Col xs={24} sm={12} md={6}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              {isMobile ? '状态' : 'Status'}
            </Text>
            <Select
              mode="multiple"
              placeholder={isMobile ? "选择状态" : "Select status"}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'small'}
              loading={loading}
              allowClear
              maxTagCount={isMobile ? 1 : 2}
            >
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>

        {/* Cluster Filter */}
        <Col xs={24} sm={12} md={6}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              {isMobile ? '集群' : 'Cluster'}
            </Text>
            <Select
              mode="multiple"
              placeholder={isMobile ? "选择集群" : "Select clusters"}
              value={filters.cluster_name}
              onChange={(value) => handleFilterChange('cluster_name', value)}
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'small'}
              loading={loading}
              allowClear
              maxTagCount={isMobile ? 1 : 2}
            >
              {filterOptions.clusterNames.map(cluster => (
                <Option key={cluster} value={cluster}>
                  {cluster}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>

        {/* Model Filter */}
        <Col xs={24} sm={12} md={6}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              {isMobile ? '模型' : 'Model'}
            </Text>
            <Select
              mode="multiple"
              placeholder={isMobile ? "选择模型" : "Select models"}
              value={filters.model_name}
              onChange={(value) => handleFilterChange('model_name', value)}
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'small'}
              loading={loading}
              allowClear
              maxTagCount={isMobile ? 1 : 2}
            >
              {filterOptions.modelNames.map(model => (
                <Option key={model} value={model}>
                  {model}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>

        {/* Ephemeral Filter */}
        <Col xs={24} sm={12} md={6}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              {isMobile ? '实例类型' : 'Instance Type'}
            </Text>
            <Select
              placeholder={isMobile ? "所有实例" : "All instances"}
              value={filters.ephemeral}
              onChange={(value) => handleFilterChange('ephemeral', value)}
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'small'}
              allowClear
            >
              <Option value={true}>{isMobile ? '临时实例' : 'Ephemeral Only'}</Option>
              <Option value={false}>{isMobile ? '持久实例' : 'Persistent Only'}</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Space wrap size={[8, 4]}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Active filters:</Text>
            {filters.status && filters.status.length > 0 && (
              <Tooltip title={`Status: ${filters.status.join(', ')}`}>
                <Badge 
                  count={filters.status.length} 
                  size="small"
                  style={{ backgroundColor: '#1890ff' }}
                >
                  <Text style={{ fontSize: '12px' }}>Status</Text>
                </Badge>
              </Tooltip>
            )}
            {filters.cluster_name && filters.cluster_name.length > 0 && (
              <Tooltip title={`Clusters: ${filters.cluster_name.join(', ')}`}>
                <Badge 
                  count={filters.cluster_name.length} 
                  size="small"
                  style={{ backgroundColor: '#52c41a' }}
                >
                  <Text style={{ fontSize: '12px' }}>Cluster</Text>
                </Badge>
              </Tooltip>
            )}
            {filters.model_name && filters.model_name.length > 0 && (
              <Tooltip title={`Models: ${filters.model_name.join(', ')}`}>
                <Badge 
                  count={filters.model_name.length} 
                  size="small"
                  style={{ backgroundColor: '#fa8c16' }}
                >
                  <Text style={{ fontSize: '12px' }}>Model</Text>
                </Badge>
              </Tooltip>
            )}
            {filters.ephemeral !== null && filters.ephemeral !== undefined && (
              <Text style={{ fontSize: '12px' }}>
                {filters.ephemeral ? 'Ephemeral' : 'Persistent'}
              </Text>
            )}
          </Space>
        </>
      )}
    </Card>
  );
};

export default InstanceFilters;