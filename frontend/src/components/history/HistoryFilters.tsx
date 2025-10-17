/**
 * HistoryFilters Component
 * Advanced filtering controls for history records with search functionality
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Tooltip,
  DatePicker,
  Input,
  Collapse,
  Tag,
  Switch,
  Slider,
  AutoComplete
} from 'antd';
import { 
  FilterOutlined, 
  ClearOutlined, 
  DownOutlined, 
  UpOutlined,
  SearchOutlined,
  SettingOutlined,
  HighlightOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { HistoryFilters as IHistoryFilters, HistoryRecord } from '../../types/history';
import { OperationType } from '../../types/enums';
import { useResponsive } from '../../hooks/useResponsive';
import { SearchInput } from '../common/SearchInput';

const { Option } = Select;
const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

/**
 * Extended history filters interface with advanced search capabilities
 */
export interface ExtendedHistoryFilters extends IHistoryFilters {
  // Text search
  search?: string;
  searchFields?: string[];
  searchMode?: 'contains' | 'exact' | 'regex';
  caseSensitive?: boolean;
  
  // Field-specific filters
  model_name?: string[];
  cluster_name?: string[];
  status?: string[];
  image_tag?: string[];
  
  // Numeric range filters
  replicas_range?: [number, number];
  fps_range?: [number, number];
  
  // Boolean filters
  ephemeral?: boolean | null;
  quant_mode?: boolean | null;
  distill_mode?: boolean | null;
  m405_mode?: boolean | null;
  
  // Advanced filters
  has_description?: boolean;
  has_priorities?: boolean;
  has_envs?: boolean;
  
  // Time-based filters
  time_range_type?: 'last_hour' | 'last_day' | 'last_week' | 'last_month' | 'custom';
  relative_time?: string;
}

/**
 * Props for HistoryFilters component
 */
export interface HistoryFiltersProps {
  filters: ExtendedHistoryFilters;
  filterOptions?: {
    modelNames: string[];
    clusterNames: string[];
    statuses: string[];
    imageTags: string[];
  };
  records?: HistoryRecord[];
  loading?: boolean;
  collapsed?: boolean;
  showAdvanced?: boolean;
  searchHighlight?: boolean;
  onFiltersChange: (filters: ExtendedHistoryFilters) => void;
  onReset?: () => void;
  onSearchHighlight?: (enabled: boolean) => void;
}

/**
 * Get active filter count
 */
const getActiveFilterCount = (filters: ExtendedHistoryFilters): number => {
  let count = 0;
  
  if (filters.search && filters.search.trim()) count++;
  if (filters.operation_type && filters.operation_type.length > 0) count++;
  if (filters.model_name && filters.model_name.length > 0) count++;
  if (filters.cluster_name && filters.cluster_name.length > 0) count++;
  if (filters.status && filters.status.length > 0) count++;
  if (filters.image_tag && filters.image_tag.length > 0) count++;
  if (filters.date_range) count++;
  if (filters.time_range_type && filters.time_range_type !== 'custom') count++;
  if (filters.ephemeral !== null && filters.ephemeral !== undefined) count++;
  if (filters.quant_mode !== null && filters.quant_mode !== undefined) count++;
  if (filters.distill_mode !== null && filters.distill_mode !== undefined) count++;
  if (filters.m405_mode !== null && filters.m405_mode !== undefined) count++;
  if (filters.replicas_range) count++;
  if (filters.fps_range) count++;
  if (filters.has_description) count++;
  if (filters.has_priorities) count++;
  if (filters.has_envs) count++;
  
  return count;
};

/**
 * Generate search suggestions based on records
 */
const generateSearchSuggestions = (records: HistoryRecord[], searchTerm: string): string[] => {
  if (!records || !searchTerm || searchTerm.length < 2) return [];
  
  const suggestions = new Set<string>();
  const term = searchTerm.toLowerCase();
  
  records.forEach(record => {
    // Search in name
    if (record.name && record.name.toLowerCase().includes(term)) {
      suggestions.add(record.name);
    }
    
    // Search in model name
    if (record.model_name && record.model_name.toLowerCase().includes(term)) {
      suggestions.add(record.model_name);
    }
    
    // Search in cluster name
    if (record.cluster_name && record.cluster_name.toLowerCase().includes(term)) {
      suggestions.add(record.cluster_name);
    }
    
    // Search in description
    if (record.description && record.description.toLowerCase().includes(term)) {
      // Extract relevant phrases from description
      const words = record.description.split(/\s+/);
      words.forEach(word => {
        if (word.toLowerCase().includes(term) && word.length > 2) {
          suggestions.add(word);
        }
      });
    }
    
    // Search in image tag
    if (record.image_tag && record.image_tag.toLowerCase().includes(term)) {
      suggestions.add(record.image_tag);
    }
  });
  
  return Array.from(suggestions).slice(0, 10); // Limit to 10 suggestions
};

/**
 * HistoryFilters Component
 */
export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  filterOptions = { modelNames: [], clusterNames: [], statuses: [], imageTags: [] },
  records = [],
  loading = false,
  collapsed: initialCollapsed = false,
  showAdvanced: initialShowAdvanced = false,
  searchHighlight = false,
  onFiltersChange,
  onReset,
  onSearchHighlight,
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const { isMobile, isTablet } = useResponsive();
  
  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((key: keyof ExtendedHistoryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  /**
   * Handle reset filters
   */
  const handleReset = useCallback(() => {
    const resetFilters: ExtendedHistoryFilters = {
      search: '',
      searchFields: ['name', 'model_name', 'cluster_name', 'description'],
      searchMode: 'contains',
      caseSensitive: false,
    };
    onFiltersChange(resetFilters);
    if (onReset) {
      onReset();
    }
  }, [onFiltersChange, onReset]);

  /**
   * Toggle collapsed state
   */
  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  /**
   * Toggle advanced filters
   */
  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(!showAdvanced);
  }, [showAdvanced]);

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((value: string) => {
    handleFilterChange('search', value);
    
    // Generate suggestions
    if (value && value.length >= 2) {
      const suggestions = generateSearchSuggestions(records, value);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [handleFilterChange, records]);

  /**
   * Handle time range preset selection
   */
  const handleTimeRangePreset = useCallback((preset: string) => {
    const now = new Date();
    let startDate: Date;
    
    switch (preset) {
      case 'last_hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'last_day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last_week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }
    
    handleFilterChange('time_range_type', preset);
    handleFilterChange('date_range', {
      start: startDate.toISOString(),
      end: now.toISOString()
    });
  }, [handleFilterChange]);

  /**
   * Available operation type options
   */
  const operationTypeOptions = useMemo(() => [
    { label: '创建', value: OperationType.CREATE, color: 'success' },
    { label: '更新', value: OperationType.UPDATE, color: 'warning' },
    { label: '删除', value: OperationType.DELETE, color: 'error' },
    { label: '回滚', value: OperationType.ROLLBACK, color: 'processing' },
  ], []);

  /**
   * Search field options
   */
  const searchFieldOptions = useMemo(() => [
    { label: '实例名称', value: 'name' },
    { label: '模型名称', value: 'model_name' },
    { label: '集群名称', value: 'cluster_name' },
    { label: '描述', value: 'description' },
    { label: '镜像标签', value: 'image_tag' },
    { label: '检查点路径', value: 'checkpoint_path' },
  ], []);

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
                {isMobile ? '筛选' : '历史记录筛选'}
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
                {isMobile ? '清除' : '清除筛选'}
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
          <Text>历史记录筛选</Text>
          {activeFilterCount > 0 && (
            <Badge count={activeFilterCount} size="small" />
          )}
        </Space>
      }
      extra={
        <Space>
          {onSearchHighlight && (
            <Tooltip title="搜索结果高亮">
              <Button
                type="text"
                size="small"
                icon={<HighlightOutlined />}
                onClick={() => onSearchHighlight(!searchHighlight)}
                style={{ color: searchHighlight ? '#1890ff' : undefined }}
              >
                高亮
              </Button>
            </Tooltip>
          )}
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={toggleAdvanced}
            style={{ color: showAdvanced ? '#1890ff' : undefined }}
          >
            高级
          </Button>
          {activeFilterCount > 0 && (
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={handleReset}
            >
              清除全部
            </Button>
          )}
          <UpOutlined 
            style={{ fontSize: '12px', color: '#8c8c8c', cursor: 'pointer' }}
            onClick={toggleCollapsed}
          />
        </Space>
      }
    >
      {/* Basic Filters */}
      <Row gutter={[12, 12]}>
        {/* Search Input */}
        <Col xs={24} sm={24} md={12} lg={8}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              搜索内容
            </Text>
            <AutoComplete
              value={filters.search}
              options={searchSuggestions.map(suggestion => ({ value: suggestion }))}
              onSelect={handleSearchChange}
              style={{ width: '100%' }}
            >
              <SearchInput
                value={filters.search}
                placeholder="搜索实例名称、模型、集群等..."
                size={isMobile ? 'large' : 'small'}
                onSearch={handleSearchChange}
                onChange={handleSearchChange}
                allowClear
              />
            </AutoComplete>
          </Space>
        </Col>

        {/* Operation Type Filter */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              操作类型
            </Text>
            <Select
              mode="multiple"
              placeholder="选择操作类型"
              value={filters.operation_type}
              onChange={(value) => handleFilterChange('operation_type', value)}
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'small'}
              loading={loading}
              allowClear
              maxTagCount={isMobile ? 1 : 2}
            >
              {operationTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color} style={{ margin: 0 }}>
                    {option.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Space>
        </Col>

        {/* Time Range Presets */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              时间范围
            </Text>
            <Select
              placeholder="选择时间范围"
              value={filters.time_range_type}
              onChange={handleTimeRangePreset}
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'small'}
              allowClear
            >
              <Option value="last_hour">最近1小时</Option>
              <Option value="last_day">最近1天</Option>
              <Option value="last_week">最近1周</Option>
              <Option value="last_month">最近1月</Option>
            </Select>
          </Space>
        </Col>

        {/* Custom Date Range */}
        <Col xs={24} sm={24} md={12} lg={8}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '12px' }}>
              自定义时间范围
            </Text>
            <RangePicker
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'small'}
              placeholder={['开始时间', '结束时间']}
              showTime
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  handleFilterChange('date_range', {
                    start: dates[0].toISOString(),
                    end: dates[1].toISOString()
                  });
                  handleFilterChange('time_range_type', 'custom');
                } else {
                  handleFilterChange('date_range', undefined);
                  handleFilterChange('time_range_type', undefined);
                }
              }}
            />
          </Space>
        </Col>
      </Row>

      {/* Advanced Filters */}
      {showAdvanced && (
        <>
          <Divider style={{ margin: '16px 0 12px 0' }} />
          
          <Collapse ghost>
            <Panel 
              header={
                <Space>
                  <SettingOutlined />
                  <Text strong>高级筛选选项</Text>
                </Space>
              } 
              key="advanced"
            >
              <Row gutter={[12, 12]}>
                {/* Search Configuration */}
                <Col xs={24} sm={12} md={8}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      搜索字段
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择搜索字段"
                      value={filters.searchFields || ['name', 'model_name', 'cluster_name', 'description']}
                      onChange={(value) => handleFilterChange('searchFields', value)}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      {searchFieldOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      搜索模式
                    </Text>
                    <Select
                      value={filters.searchMode || 'contains'}
                      onChange={(value) => handleFilterChange('searchMode', value)}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="contains">包含</Option>
                      <Option value="exact">精确匹配</Option>
                      <Option value="regex">正则表达式</Option>
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      搜索选项
                    </Text>
                    <Space>
                      <Switch
                        size="small"
                        checked={filters.caseSensitive || false}
                        onChange={(checked) => handleFilterChange('caseSensitive', checked)}
                      />
                      <Text style={{ fontSize: '12px' }}>区分大小写</Text>
                    </Space>
                  </Space>
                </Col>

                {/* Field-specific Filters */}
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      模型名称
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择模型"
                      value={filters.model_name}
                      onChange={(value) => handleFilterChange('model_name', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      {filterOptions.modelNames.map(model => (
                        <Option key={model} value={model}>
                          {model}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      集群名称
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择集群"
                      value={filters.cluster_name}
                      onChange={(value) => handleFilterChange('cluster_name', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      {filterOptions.clusterNames.map(cluster => (
                        <Option key={cluster} value={cluster}>
                          {cluster}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      状态
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择状态"
                      value={filters.status}
                      onChange={(value) => handleFilterChange('status', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      {filterOptions.statuses.map(status => (
                        <Option key={status} value={status}>
                          {status}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      镜像标签
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择镜像标签"
                      value={filters.image_tag}
                      onChange={(value) => handleFilterChange('image_tag', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      {filterOptions.imageTags.map(tag => (
                        <Option key={tag} value={tag}>
                          {tag}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>

                {/* Boolean Filters */}
                <Col xs={24} sm={8} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      实例类型
                    </Text>
                    <Select
                      placeholder="选择实例类型"
                      value={filters.ephemeral}
                      onChange={(value) => handleFilterChange('ephemeral', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      <Option value={true}>临时实例</Option>
                      <Option value={false}>持久实例</Option>
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={8} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      量化模式
                    </Text>
                    <Select
                      placeholder="量化模式"
                      value={filters.quant_mode}
                      onChange={(value) => handleFilterChange('quant_mode', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      <Option value={true}>启用</Option>
                      <Option value={false}>禁用</Option>
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={8} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      蒸馏模式
                    </Text>
                    <Select
                      placeholder="蒸馏模式"
                      value={filters.distill_mode}
                      onChange={(value) => handleFilterChange('distill_mode', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      <Option value={true}>启用</Option>
                      <Option value={false}>禁用</Option>
                    </Select>
                  </Space>
                </Col>

                <Col xs={24} sm={8} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      M405模式
                    </Text>
                    <Select
                      placeholder="M405模式"
                      value={filters.m405_mode}
                      onChange={(value) => handleFilterChange('m405_mode', value)}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      <Option value={true}>启用</Option>
                      <Option value={false}>禁用</Option>
                    </Select>
                  </Space>
                </Col>

                {/* Content-based Filters */}
                <Col xs={24} sm={8} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      内容筛选
                    </Text>
                    <Space direction="vertical" size={2}>
                      <Space>
                        <Switch
                          size="small"
                          checked={filters.has_description || false}
                          onChange={(checked) => handleFilterChange('has_description', checked)}
                        />
                        <Text style={{ fontSize: '12px' }}>有描述</Text>
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={filters.has_priorities || false}
                          onChange={(checked) => handleFilterChange('has_priorities', checked)}
                        />
                        <Text style={{ fontSize: '12px' }}>有优先级</Text>
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={filters.has_envs || false}
                          onChange={(checked) => handleFilterChange('has_envs', checked)}
                        />
                        <Text style={{ fontSize: '12px' }}>有环境变量</Text>
                      </Space>
                    </Space>
                  </Space>
                </Col>

                {/* Numeric Range Filters */}
                <Col xs={24} sm={16} md={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      副本数范围: {filters.replicas_range ? `${filters.replicas_range[0]} - ${filters.replicas_range[1]}` : '不限'}
                    </Text>
                    <Slider
                      range
                      min={1}
                      max={20}
                      value={filters.replicas_range || [1, 20]}
                      onChange={(value) => handleFilterChange('replicas_range', value)}
                      marks={{
                        1: '1',
                        5: '5',
                        10: '10',
                        20: '20'
                      }}
                    />
                  </Space>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Space wrap size={[8, 4]}>
            <Text type="secondary" style={{ fontSize: '12px' }}>当前筛选条件:</Text>
            
            {filters.search && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('search', '')}
                color="blue"
              >
                搜索: {filters.search}
              </Tag>
            )}
            
            {filters.operation_type && filters.operation_type.length > 0 && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('operation_type', [])}
                color="green"
              >
                操作类型 ({filters.operation_type.length})
              </Tag>
            )}
            
            {filters.time_range_type && (
              <Tag 
                closable 
                onClose={() => {
                  handleFilterChange('time_range_type', undefined);
                  handleFilterChange('date_range', undefined);
                }}
                color="orange"
              >
                时间范围: {
                  filters.time_range_type === 'last_hour' ? '最近1小时' :
                  filters.time_range_type === 'last_day' ? '最近1天' :
                  filters.time_range_type === 'last_week' ? '最近1周' :
                  filters.time_range_type === 'last_month' ? '最近1月' :
                  '自定义'
                }
              </Tag>
            )}
            
            {filters.model_name && filters.model_name.length > 0 && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('model_name', [])}
                color="purple"
              >
                模型 ({filters.model_name.length})
              </Tag>
            )}
            
            {filters.cluster_name && filters.cluster_name.length > 0 && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('cluster_name', [])}
                color="cyan"
              >
                集群 ({filters.cluster_name.length})
              </Tag>
            )}
            
            {filters.ephemeral !== null && filters.ephemeral !== undefined && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('ephemeral', null)}
                color="geekblue"
              >
                {filters.ephemeral ? '临时实例' : '持久实例'}
              </Tag>
            )}
          </Space>
        </>
      )}
    </Card>
  );
};

export default HistoryFilters;