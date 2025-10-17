/**
 * InstanceSearchBar Component
 * Combined search input and filter controls for instance management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Space, Button, Typography, Empty } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import SearchInput from './SearchInput';
import InstanceFilters from './InstanceFilters';
import type { InstanceFilters as IInstanceFilters } from '../../types/instance';
import { useResponsive } from '../../hooks/useResponsive';

const { Text } = Typography;

/**
 * Props for InstanceSearchBar component
 */
export interface InstanceSearchBarProps {
  searchTerm: string;
  filters: IInstanceFilters;
  filterOptions?: {
    modelNames: string[];
    clusterNames: string[];
    statuses: string[];
  };
  loading?: boolean;
  resultsCount?: number;
  totalCount?: number;
  showCreateButton?: boolean;
  showRefreshButton?: boolean;
  onSearchChange: (searchTerm: string) => void;
  onFiltersChange: (filters: IInstanceFilters) => void;
  onCreateClick?: () => void;
  onRefresh?: () => void;
  onResetFilters?: () => void;
}

/**
 * InstanceSearchBar Component
 */
export const InstanceSearchBar: React.FC<InstanceSearchBarProps> = ({
  searchTerm,
  filters,
  filterOptions,
  loading = false,
  resultsCount,
  totalCount,
  showCreateButton = true,
  showRefreshButton = true,
  onSearchChange,
  onFiltersChange,
  onCreateClick,
  onRefresh,
  onResetFilters,
}) => {
  const { isMobile } = useResponsive();
  const [searchValue, setSearchValue] = useState(searchTerm);

  // Update local search value when prop changes
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  /**
   * Handle search input change
   */
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Update filters with search term
    const updatedFilters = { ...filters, search: value };
    onFiltersChange(updatedFilters);
    onSearchChange(value);
  };

  /**
   * Handle search clear
   */
  const handleSearchClear = () => {
    setSearchValue('');
    const updatedFilters = { ...filters, search: '' };
    onFiltersChange(updatedFilters);
    onSearchChange('');
  };

  /**
   * Handle filters change
   */
  const handleFiltersChange = (newFilters: IInstanceFilters) => {
    // Preserve search term
    const updatedFilters = { ...newFilters, search: searchValue };
    onFiltersChange(updatedFilters);
  };

  /**
   * Handle reset all filters including search
   */
  const handleResetAll = () => {
    setSearchValue('');
    const resetFilters: IInstanceFilters = {
      status: [],
      cluster_name: [],
      model_name: [],
      ephemeral: null,
      search: '',
    };
    onFiltersChange(resetFilters);
    onSearchChange('');
    if (onResetFilters) {
      onResetFilters();
    }
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      searchValue.trim() !== '' ||
      (filters.status && filters.status.length > 0) ||
      (filters.cluster_name && filters.cluster_name.length > 0) ||
      (filters.model_name && filters.model_name.length > 0) ||
      (filters.ephemeral !== null && filters.ephemeral !== undefined)
    );
  }, [searchValue, filters]);

  /**
   * Results summary text
   */
  const resultsSummary = useMemo(() => {
    if (resultsCount === undefined || totalCount === undefined) {
      return null;
    }

    if (resultsCount === 0) {
      return hasActiveFilters ? 'No instances match your filters' : 'No instances found';
    }

    if (hasActiveFilters && resultsCount !== totalCount) {
      return `Showing ${resultsCount} of ${totalCount} instances`;
    }

    return `${resultsCount} instance${resultsCount !== 1 ? 's' : ''}`;
  }, [resultsCount, totalCount, hasActiveFilters]);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Search and Action Bar */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={16} lg={18}>
          <SearchInput
            value={searchValue}
            placeholder={isMobile ? "搜索实例..." : "Search instances by name, model, cluster..."}
            onSearch={handleSearchChange}
            onChange={setSearchValue}
            onClear={handleSearchClear}
            loading={loading}
            size={isMobile ? 'large' : 'middle'}
          />
        </Col>
        <Col xs={24} sm={24} md={8} lg={6}>
          <Space 
            style={{ 
              width: '100%', 
              justifyContent: isMobile ? 'space-between' : 'flex-end' 
            }}
            size={isMobile ? 'middle' : 'small'}
          >
            {showRefreshButton && (
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={loading}
                size={isMobile ? 'large' : 'middle'}
                style={{ 
                  flex: isMobile ? 1 : undefined,
                  minWidth: isMobile ? '80px' : undefined
                }}
              >
                {isMobile ? '刷新' : 'Refresh'}
              </Button>
            )}
            {showCreateButton && onCreateClick && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreateClick}
                size={isMobile ? 'large' : 'middle'}
                style={{ 
                  flex: isMobile ? 1 : undefined,
                  minWidth: isMobile ? '100px' : undefined
                }}
              >
                {isMobile ? '新建' : 'Create Instance'}
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Advanced Filters */}
      <InstanceFilters
        filters={filters}
        filterOptions={filterOptions}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetAll}
      />

      {/* Results Summary */}
      {resultsSummary && (
        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
          <Col>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {resultsSummary}
            </Text>
          </Col>
          {hasActiveFilters && (
            <Col>
              <Button
                type="link"
                size="small"
                onClick={handleResetAll}
                style={{ padding: 0, fontSize: '12px' }}
              >
                Clear all filters
              </Button>
            </Col>
          )}
        </Row>
      )}

      {/* Empty State for No Results */}
      {resultsCount === 0 && hasActiveFilters && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size={8}>
              <Text>No instances match your current filters</Text>
              <Button type="link" onClick={handleResetAll} size="small">
                Clear filters to see all instances
              </Button>
            </Space>
          }
          style={{ margin: '24px 0' }}
        />
      )}
    </div>
  );
};

export default InstanceSearchBar;