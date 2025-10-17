/**
 * HistoryList Component
 * 
 * A reusable, independent history list component that supports different usage scenarios.
 * Features:
 * - Record selection, sorting, and pagination
 * - Configurable properties and event handling
 * - Testable and maintainable design
 * - Support for different view modes (list, compact, timeline)
 * - Built-in filtering and search capabilities
 * - Responsive design for different screen sizes
 */

import React, { useState, useCallback, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  List,
  Card,
  Typography,
  Space,
  Button,
  Checkbox,
  Tag,
  Tooltip,
  Empty,
  Spin,
  Pagination,
  Select,
  Row,
  Col,
  Divider,
  Alert,
  Badge
} from 'antd';
import {
  HistoryOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  InfoCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { HistoryRecord } from '../../types/history';
import type { ExtendedHistoryFilters } from './HistoryFilters';
import { HistoryService } from '../../services/historyService';
import { HistorySearchService, type SearchResult } from '../../services/historySearchService';
import { VirtualizedHistoryList, type VirtualizedHistoryListRef } from './VirtualizedHistoryList';
import { HistoryFilters } from './HistoryFilters';
import { SearchHighlight } from './SearchHighlight';
import { useResponsive } from '../../hooks/useResponsive';
import { useLoadingState } from '../../hooks/useLoadingState';

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * View mode options for the history list
 */
export type HistoryListViewMode = 'list' | 'compact' | 'timeline';

/**
 * Sort options for history records
 */
export type HistoryListSortField = 'operation_timestamp' | 'operation_type' | 'name' | 'model_name';
export type HistoryListSortOrder = 'asc' | 'desc';

/**
 * Selection mode for history records
 */
export type HistoryListSelectionMode = 'none' | 'single' | 'multiple';

/**
 * Pagination configuration
 */
export interface HistoryListPagination {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
}

/**
 * Props for HistoryList component
 */
export interface HistoryListProps {
  /** Instance ID to filter records (optional for showing all records) */
  instanceId?: number;
  
  /** Pre-loaded history records (if not provided, will fetch from API) */
  records?: HistoryRecord[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: Error | null;
  
  /** View mode */
  viewMode?: HistoryListViewMode;
  
  /** Selection mode */
  selectionMode?: HistoryListSelectionMode;
  
  /** Maximum number of selected records */
  maxSelection?: number;
  
  /** Selected record IDs */
  selectedRecordIds?: number[];
  
  /** Sort configuration */
  sortField?: HistoryListSortField;
  sortOrder?: HistoryListSortOrder;
  
  /** Pagination configuration */
  pagination?: HistoryListPagination | false;
  
  /** Filters */
  filters?: ExtendedHistoryFilters;
  
  /** Show filters panel */
  showFilters?: boolean;
  
  /** Show actions (selection, sorting, etc.) */
  showActions?: boolean;
  
  /** Show header with title and controls */
  showHeader?: boolean;
  
  /** Custom title */
  title?: string;
  
  /** Show record count */
  showRecordCount?: boolean;
  
  /** Enable virtual scrolling for large datasets */
  enableVirtualScrolling?: boolean;
  
  /** Virtual scroll container height */
  virtualScrollHeight?: number;
  
  /** Show load more button instead of pagination */
  showLoadMore?: boolean;
  
  /** Loading more records */
  loadingMore?: boolean;
  
  /** Has more records to load */
  hasMore?: boolean;
  
  /** Compact mode for smaller spaces */
  compact?: boolean;
  
  /** Event Handlers */
  onRecordClick?: (record: HistoryRecord) => void;
  onRecordSelect?: (record: HistoryRecord, selected: boolean) => void;
  onSelectionChange?: (selectedRecords: HistoryRecord[]) => void;
  onSortChange?: (field: HistoryListSortField, order: HistoryListSortOrder) => void;
  onPaginationChange?: (page: number, pageSize: number) => void;
  onFiltersChange?: (filters: ExtendedHistoryFilters) => void;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Ref interface for HistoryList component
 */
export interface HistoryListRef {
  /** Refresh the list */
  refresh: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Select all visible records */
  selectAll: () => void;
  /** Get selected records */
  getSelectedRecords: () => HistoryRecord[];
  /** Scroll to specific record */
  scrollToRecord: (recordId: number) => void;
  /** Get current filters */
  getCurrentFilters: () => ExtendedHistoryFilters;
}

/**
 * Individual history record item for different view modes
 */
interface HistoryRecordItemProps {
  record: HistoryRecord;
  viewMode: HistoryListViewMode;
  selectionMode: HistoryListSelectionMode;
  selected: boolean;
  disabled: boolean;
  compact: boolean;
  searchTerm?: string;
  searchOptions?: {
    fields?: string[];
    caseSensitive?: boolean;
    searchMode?: 'contains' | 'exact' | 'regex';
  };
  searchHighlight?: boolean;
  onClick?: (record: HistoryRecord) => void;
  onSelect?: (record: HistoryRecord, selected: boolean) => void;
}

const HistoryRecordItem: React.FC<HistoryRecordItemProps> = ({
  record,
  viewMode,
  selectionMode,
  selected,
  disabled,
  compact,
  searchTerm,
  searchOptions,
  searchHighlight,
  onClick,
  onSelect
}) => {
  const { isMobile } = useResponsive();
  
  const handleClick = useCallback(() => {
    if (onClick && selectionMode !== 'multiple') {
      onClick(record);
    }
  }, [onClick, record, selectionMode]);
  
  const handleSelect = useCallback((e: any) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(record, e.target.checked);
    }
  }, [onSelect, record]);
  
  const operationDisplay = HistoryService.formatOperationType(record.operation_type);
  
  // Render based on view mode
  if (viewMode === 'compact') {
    return (
      <div
        style={{
          padding: compact ? '8px 12px' : '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          cursor: onClick ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
        onClick={handleClick}
      >
        {selectionMode !== 'none' && (
          <Checkbox
            checked={selected}
            disabled={disabled}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        
        <Tag color={operationDisplay.color} size="small">
          {operationDisplay.label}
        </Tag>
        
        <SearchHighlight
          text={record.name}
          searchTerm={searchTerm}
          caseSensitive={searchOptions?.caseSensitive}
          searchMode={searchOptions?.searchMode}
          enabled={searchHighlight}
          textProps={{
            style: { fontWeight: 500, flex: 1 }
          }}
        />
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {HistoryService.getRelativeTime(record.operation_timestamp)}
        </Text>
      </div>
    );
  }
  
  if (viewMode === 'timeline') {
    return (
      <div
        style={{
          padding: compact ? '12px' : '16px',
          borderLeft: `3px solid ${operationDisplay.color === 'success' ? '#52c41a' : 
                                   operationDisplay.color === 'warning' ? '#faad14' :
                                   operationDisplay.color === 'error' ? '#ff4d4f' : '#1890ff'}`,
          marginLeft: 16,
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={handleClick}
      >
        {selectionMode !== 'none' && (
          <Checkbox
            checked={selected}
            disabled={disabled}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: 16, right: 16 }}
          />
        )}
        
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: 20,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: operationDisplay.color === 'success' ? '#52c41a' : 
                           operationDisplay.color === 'warning' ? '#faad14' :
                           operationDisplay.color === 'error' ? '#ff4d4f' : '#1890ff',
            border: '2px solid white'
          }}
        />
        
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Tag color={operationDisplay.color}>
              {operationDisplay.label}
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {HistoryService.formatTimestamp(record.operation_timestamp)}
            </Text>
          </Space>
          
          <SearchHighlight
            text={record.name}
            searchTerm={searchTerm}
            caseSensitive={searchOptions?.caseSensitive}
            searchMode={searchOptions?.searchMode}
            enabled={searchHighlight}
            textProps={{
              strong: true,
              style: { fontSize: '16px' }
            }}
          />
          
          {record.description && (
            <SearchHighlight
              text={record.description}
              searchTerm={searchTerm}
              caseSensitive={searchOptions?.caseSensitive}
              searchMode={searchOptions?.searchMode}
              enabled={searchHighlight}
              maxLength={120}
              textProps={{
                type: 'secondary',
                ellipsis: { tooltip: record.description }
              }}
            />
          )}
          
          <Space wrap size="small">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              模型: <SearchHighlight
                text={record.model_name}
                searchTerm={searchTerm}
                caseSensitive={searchOptions?.caseSensitive}
                searchMode={searchOptions?.searchMode}
                enabled={searchHighlight}
                textProps={{ type: 'secondary' }}
              />
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              集群: <SearchHighlight
                text={record.cluster_name}
                searchTerm={searchTerm}
                caseSensitive={searchOptions?.caseSensitive}
                searchMode={searchOptions?.searchMode}
                enabled={searchHighlight}
                textProps={{ type: 'secondary' }}
              />
            </Text>
          </Space>
        </Space>
      </div>
    );
  }
  
  // Default list view
  return (
    <List.Item
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: compact ? '12px 16px' : '16px 20px'
      }}
      onClick={handleClick}
      actions={selectionMode !== 'none' ? [
        <Checkbox
          key="select"
          checked={selected}
          disabled={disabled}
          onChange={handleSelect}
          onClick={(e) => e.stopPropagation()}
        >
          {!isMobile && '选择'}
        </Checkbox>
      ] : undefined}
    >
      <List.Item.Meta
        avatar={
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            backgroundColor: operationDisplay.color === 'success' ? '#f6ffed' : 
                           operationDisplay.color === 'warning' ? '#fffbe6' :
                           operationDisplay.color === 'error' ? '#fff2f0' : '#e6f7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: operationDisplay.color === 'success' ? '#52c41a' : 
                   operationDisplay.color === 'warning' ? '#faad14' :
                   operationDisplay.color === 'error' ? '#ff4d4f' : '#1890ff'
          }}>
            <HistoryOutlined />
          </div>
        }
        title={
          <Space wrap>
            <Tag color={operationDisplay.color}>
              {operationDisplay.label}
            </Tag>
            <SearchHighlight
              text={record.name}
              searchTerm={searchTerm}
              caseSensitive={searchOptions?.caseSensitive}
              searchMode={searchOptions?.searchMode}
              enabled={searchHighlight}
              textProps={{
                strong: true,
                style: { fontSize: compact ? '14px' : '16px' }
              }}
            />
            {selected && (
              <Badge status="processing" text="已选择" />
            )}
          </Space>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: compact ? '12px' : '14px' }}>
              {HistoryService.formatTimestamp(record.operation_timestamp)}
              {!compact && (
                <span style={{ marginLeft: 8 }}>
                  ({HistoryService.getRelativeTime(record.operation_timestamp)})
                </span>
              )}
            </Text>
            
            {record.description && (
              <SearchHighlight
                text={record.description}
                searchTerm={searchTerm}
                caseSensitive={searchOptions?.caseSensitive}
                searchMode={searchOptions?.searchMode}
                enabled={searchHighlight}
                maxLength={compact ? 80 : 150}
                textProps={{
                  type: 'secondary',
                  ellipsis: { tooltip: record.description },
                  style: { fontSize: compact ? '12px' : '13px' }
                }}
              />
            )}
            
            <Space wrap size="small" style={{ fontSize: compact ? '11px' : '12px' }}>
              <Text type="secondary">
                模型: <SearchHighlight
                  text={record.model_name}
                  searchTerm={searchTerm}
                  caseSensitive={searchOptions?.caseSensitive}
                  searchMode={searchOptions?.searchMode}
                  enabled={searchHighlight}
                  textProps={{ type: 'secondary' }}
                />
              </Text>
              <Text type="secondary">
                集群: <SearchHighlight
                  text={record.cluster_name}
                  searchTerm={searchTerm}
                  caseSensitive={searchOptions?.caseSensitive}
                  searchMode={searchOptions?.searchMode}
                  enabled={searchHighlight}
                  textProps={{ type: 'secondary' }}
                />
              </Text>
              {record.status && (
                <Text type="secondary">
                  状态: <SearchHighlight
                    text={record.status}
                    searchTerm={searchTerm}
                    caseSensitive={searchOptions?.caseSensitive}
                    searchMode={searchOptions?.searchMode}
                    enabled={searchHighlight}
                    textProps={{ type: 'secondary' }}
                  />
                </Text>
              )}
            </Space>
          </Space>
        }
      />
    </List.Item>
  );
};

/**
 * HistoryList Component
 */
export const HistoryList = forwardRef<HistoryListRef, HistoryListProps>(({
  instanceId,
  records: propRecords,
  loading: propLoading = false,
  error: propError = null,
  viewMode = 'list',
  selectionMode = 'none',
  maxSelection = 10,
  selectedRecordIds = [],
  sortField = 'operation_timestamp',
  sortOrder = 'desc',
  pagination = { current: 1, pageSize: 20, total: 0, showSizeChanger: true },
  filters: propFilters = {},
  showFilters = true,
  showActions = true,
  showHeader = true,
  title,
  showRecordCount = true,
  enableVirtualScrolling = false,
  virtualScrollHeight = 400,
  showLoadMore = false,
  loadingMore = false,
  hasMore = false,
  compact = false,
  onRecordClick,
  onRecordSelect,
  onSelectionChange,
  onSortChange,
  onPaginationChange,
  onFiltersChange,
  onLoadMore,
  onRefresh,
  onError
}, ref) => {
  // State management
  const [internalRecords, setInternalRecords] = useState<HistoryRecord[]>([]);
  const [internalFilters, setInternalFilters] = useState<ExtendedHistoryFilters>(propFilters);
  const [selectedRecords, setSelectedRecords] = useState<HistoryRecord[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    modelNames: [] as string[],
    clusterNames: [] as string[],
    statuses: [] as string[],
    imageTags: [] as string[]
  });
  
  const { isMobile, isTablet } = useResponsive();
  const virtualListRef = useRef<VirtualizedHistoryListRef>(null);
  
  // Enhanced loading state management
  const {
    isLoading,
    isError,
    error,
    execute: executeWithLoading,
    retry: retryOperation
  } = useLoadingState({
    showNotifications: false,
    enableRetry: true,
    maxRetries: 3
  });
  
  // Use prop records or internal records
  const records = propRecords || internalRecords;
  const currentLoading = propLoading || isLoading;
  const currentError = propError || error;
  const filters = Object.keys(propFilters).length > 0 ? propFilters : internalFilters;
  
  // Load records from API if not provided as props
  const loadRecords = useCallback(async () => {
    if (propRecords) return; // Don't load if records are provided as props
    
    const loadOperation = async () => {
      try {
        let response;
        if (instanceId) {
          response = await HistoryService.getInstanceHistory(
            instanceId,
            filters,
            pagination ? { 
              limit: pagination.pageSize, 
              offset: (pagination.current - 1) * pagination.pageSize 
            } : undefined
          );
        } else {
          response = await HistoryService.getAllHistory(
            { ...filters, instanceId },
            pagination ? { 
              limit: pagination.pageSize, 
              offset: (pagination.current - 1) * pagination.pageSize 
            } : undefined
          );
        }
        
        setInternalRecords(response.history_records);
        
        // Generate filter options
        const options = HistorySearchService.getFilterOptions(response.history_records);
        setFilterOptions(options);
        
        return response;
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Failed to load history records'));
        throw error;
      }
    };
    
    await executeWithLoading(loadOperation);
  }, [instanceId, JSON.stringify(filters), JSON.stringify(pagination), propRecords, executeWithLoading, onError]);
  
  // Apply client-side filtering and search
  const { filteredRecords, displayRecords } = useMemo(() => {
    let filtered = records;
    
    // Apply filters
    if (filters.search || filters.operation_type?.length || filters.model_name?.length) {
      filtered = HistorySearchService.filterRecords(records, filters);
    }
    
    // Apply search
    if (filters.search && filters.search.trim()) {
      const searchOptions = {
        fields: filters.searchFields || ['name', 'model_name', 'cluster_name', 'description'],
        mode: filters.searchMode || 'contains',
        caseSensitive: filters.caseSensitive || false
      };
      
      const results = HistorySearchService.searchRecords(filtered, filters.search, searchOptions);
      setSearchResults(results);
      filtered = results.map(r => r.record);
    } else {
      setSearchResults([]);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'operation_timestamp':
          aValue = new Date(a.operation_timestamp).getTime();
          bValue = new Date(b.operation_timestamp).getTime();
          break;
        case 'operation_type':
          aValue = a.operation_type;
          bValue = b.operation_type;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'model_name':
          aValue = a.model_name.toLowerCase();
          bValue = b.model_name.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return {
      filteredRecords: filtered,
      displayRecords: sorted
    };
  }, [records, filters, sortField, sortOrder]);
  
  // Update selected records based on selectedRecordIds prop
  React.useEffect(() => {
    const selected = displayRecords.filter(record => 
      selectedRecordIds.includes(record.history_id)
    );
    setSelectedRecords(selected);
  }, [displayRecords, selectedRecordIds]);
  
  // Load records on mount and when dependencies change
  React.useEffect(() => {
    if (!propRecords && instanceId) {
      loadRecords();
    }
  }, [instanceId]);
  
  // Handle record selection
  const handleRecordSelect = useCallback((record: HistoryRecord, selected: boolean) => {
    let newSelectedRecords: HistoryRecord[];
    
    if (selectionMode === 'single') {
      newSelectedRecords = selected ? [record] : [];
    } else if (selectionMode === 'multiple') {
      if (selected) {
        if (selectedRecords.length >= maxSelection) {
          return; // Don't allow more selections
        }
        newSelectedRecords = [...selectedRecords, record];
      } else {
        newSelectedRecords = selectedRecords.filter(r => r.history_id !== record.history_id);
      }
    } else {
      return; // No selection mode
    }
    
    setSelectedRecords(newSelectedRecords);
    onRecordSelect?.(record, selected);
    onSelectionChange?.(newSelectedRecords);
  }, [selectionMode, selectedRecords, maxSelection, onRecordSelect, onSelectionChange]);
  
  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ExtendedHistoryFilters) => {
    setInternalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [onFiltersChange]);
  
  // Handle sort changes
  const handleSortChange = useCallback((field: HistoryListSortField, order: HistoryListSortOrder) => {
    onSortChange?.(field, order);
  }, [onSortChange]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadRecords();
    onRefresh?.();
  }, [loadRecords, onRefresh]);
  
  // Expose ref methods
  useImperativeHandle(ref, () => ({
    refresh: handleRefresh,
    clearSelection: () => {
      setSelectedRecords([]);
      onSelectionChange?.([]);
    },
    selectAll: () => {
      const newSelected = displayRecords.slice(0, maxSelection);
      setSelectedRecords(newSelected);
      onSelectionChange?.(newSelected);
    },
    getSelectedRecords: () => selectedRecords,
    scrollToRecord: (recordId: number) => {
      const index = displayRecords.findIndex(r => r.history_id === recordId);
      if (index >= 0 && virtualListRef.current) {
        virtualListRef.current.scrollToItem(index, 'center');
      }
    },
    getCurrentFilters: () => filters
  }), [handleRefresh, displayRecords, maxSelection, selectedRecords, onSelectionChange, filters]);
  
  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    if (!pagination) return null;
    
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = Math.min(startIndex + pagination.pageSize, displayRecords.length);
    const paginatedRecords = displayRecords.slice(startIndex, endIndex);
    
    return {
      ...pagination,
      total: displayRecords.length,
      records: paginatedRecords
    };
  }, [pagination, displayRecords]);
  
  // Get records to display (paginated or all)
  const recordsToDisplay = paginationInfo ? paginationInfo.records : displayRecords;
  
  // Render header
  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={[16, 8]}>
          <Col flex="auto">
            <Space align="center">
              <HistoryOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
              <Title level={4} style={{ margin: 0 }}>
                {title || (instanceId ? '实例历史记录' : '历史记录')}
              </Title>
              {showRecordCount && (
                <Badge 
                  count={displayRecords.length} 
                  style={{ backgroundColor: '#52c41a' }}
                  overflowCount={9999}
                />
              )}
            </Space>
          </Col>
          
          {showActions && (
            <Col>
              <Space wrap>
                {selectionMode !== 'none' && (
                  <Space>
                    <Button
                      size="small"
                      icon={selectedRecords.length === displayRecords.length ? <BorderOutlined /> : <CheckSquareOutlined />}
                      onClick={() => {
                        if (selectedRecords.length === displayRecords.length) {
                          setSelectedRecords([]);
                          onSelectionChange?.([]);
                        } else {
                          const newSelected = displayRecords.slice(0, maxSelection);
                          setSelectedRecords(newSelected);
                          onSelectionChange?.(newSelected);
                        }
                      }}
                      disabled={displayRecords.length === 0}
                    >
                      {selectedRecords.length > 0 ? `清除选择 (${selectedRecords.length})` : '全选'}
                    </Button>
                  </Space>
                )}
                
                <Select
                  size="small"
                  value={`${sortField}-${sortOrder}`}
                  onChange={(value) => {
                    const [field, order] = value.split('-') as [HistoryListSortField, HistoryListSortOrder];
                    handleSortChange(field, order);
                  }}
                  style={{ width: 140 }}
                >
                  <Option value="operation_timestamp-desc">最新优先</Option>
                  <Option value="operation_timestamp-asc">最旧优先</Option>
                  <Option value="name-asc">名称 A-Z</Option>
                  <Option value="name-desc">名称 Z-A</Option>
                  <Option value="operation_type-asc">操作类型</Option>
                </Select>
                
                <Select
                  size="small"
                  value={viewMode}
                  onChange={(mode) => {
                    // This would need to be handled by parent component
                    console.log('View mode changed:', mode);
                  }}
                  style={{ width: 100 }}
                >
                  <Option value="list">
                    <Space>
                      <BarsOutlined />
                      列表
                    </Space>
                  </Option>
                  <Option value="compact">
                    <Space>
                      <AppstoreOutlined />
                      紧凑
                    </Space>
                  </Option>
                  <Option value="timeline">
                    <Space>
                      <ClockCircleOutlined />
                      时间线
                    </Space>
                  </Option>
                </Select>
                
                <Button
                  size="small"
                  onClick={handleRefresh}
                  loading={currentLoading}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </div>
    );
  };
  
  // Render filters
  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <HistoryFilters
        filters={filters}
        filterOptions={filterOptions}
        records={records}
        loading={currentLoading}
        collapsed={false}
        showAdvanced={true}
        onFiltersChange={handleFiltersChange}
        onReset={() => handleFiltersChange({})}
      />
    );
  };
  
  // Render content based on state
  const renderContent = () => {
    if (currentError) {
      return (
        <Alert
          message="加载失败"
          description={currentError.message}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={retryOperation}>
              重试
            </Button>
          }
        />
      );
    }
    
    if (currentLoading && recordsToDisplay.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">加载历史记录中...</Text>
          </div>
        </div>
      );
    }
    
    if (recordsToDisplay.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            filters.search || filters.operation_type?.length || filters.date_range
              ? "当前筛选条件下没有找到历史记录"
              : "暂无历史记录"
          }
        />
      );
    }
    
    // Use virtualized list for large datasets or when explicitly enabled
    if (enableVirtualScrolling || recordsToDisplay.length > 100) {
      return (
        <VirtualizedHistoryList
          ref={virtualListRef}
          records={recordsToDisplay}
          loading={currentLoading}
          compareMode={selectionMode === 'multiple'}
          selectedRecords={selectedRecords}
          onRecordSelect={handleRecordSelect}
          onRecordClick={onRecordClick}
          height={virtualScrollHeight}
          showLoadMore={showLoadMore}
          onLoadMore={onLoadMore}
          loadingMore={loadingMore}
          searchTerm={filters.search}
          searchOptions={{
            fields: filters.searchFields,
            caseSensitive: filters.caseSensitive,
            searchMode: filters.searchMode
          }}
          searchHighlight={true}
          searchResults={searchResults}
        />
      );
    }
    
    // Regular list for smaller datasets
    return (
      <div>
        {viewMode === 'timeline' ? (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 8,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#f0f0f0'
              }}
            />
            {recordsToDisplay.map(record => {
              const selected = selectedRecords.some(r => r.history_id === record.history_id);
              const disabled = !selected && selectedRecords.length >= maxSelection;
              
              return (
                <HistoryRecordItem
                  key={record.history_id}
                  record={record}
                  viewMode={viewMode}
                  selectionMode={selectionMode}
                  selected={selected}
                  disabled={disabled}
                  compact={compact}
                  searchTerm={filters.search}
                  searchOptions={{
                    fields: filters.searchFields,
                    caseSensitive: filters.caseSensitive,
                    searchMode: filters.searchMode
                  }}
                  searchHighlight={true}
                  onClick={onRecordClick}
                  onSelect={handleRecordSelect}
                />
              );
            })}
          </div>
        ) : (
          <List
            dataSource={recordsToDisplay}
            renderItem={(record) => {
              const selected = selectedRecords.some(r => r.history_id === record.history_id);
              const disabled = !selected && selectedRecords.length >= maxSelection;
              
              return (
                <HistoryRecordItem
                  key={record.history_id}
                  record={record}
                  viewMode={viewMode}
                  selectionMode={selectionMode}
                  selected={selected}
                  disabled={disabled}
                  compact={compact}
                  searchTerm={filters.search}
                  searchOptions={{
                    fields: filters.searchFields,
                    caseSensitive: filters.caseSensitive,
                    searchMode: filters.searchMode
                  }}
                  searchHighlight={true}
                  onClick={onRecordClick}
                  onSelect={handleRecordSelect}
                />
              );
            }}
            loading={currentLoading}
          />
        )}
        
        {/* Load more button */}
        {showLoadMore && hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              onClick={onLoadMore}
              loading={loadingMore}
              disabled={currentLoading}
            >
              加载更多
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // Render pagination
  const renderPagination = () => {
    if (!pagination || showLoadMore) return null;
    
    return (
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Pagination
          {...paginationInfo}
          onChange={onPaginationChange}
          showSizeChanger={pagination.showSizeChanger}
          showQuickJumper={pagination.showQuickJumper}
          showTotal={pagination.showTotal ? (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录` : undefined
          }
          size={isMobile ? 'small' : 'default'}
        />
      </div>
    );
  };
  
  return (
    <div>
      {renderHeader()}
      {renderFilters()}
      
      <Card 
        size={compact ? 'small' : 'default'}
        bodyStyle={{ padding: compact ? '12px' : '16px' }}
      >
        {renderContent()}
        {renderPagination()}
        
        {/* Selection summary */}
        {selectionMode !== 'none' && selectedRecords.length > 0 && (
          <>
            <Divider />
            <Alert
              message={
                <Space>
                  <InfoCircleOutlined />
                  <span>
                    已选择 {selectedRecords.length} 条记录
                    {maxSelection > 1 && ` (最多可选择 ${maxSelection} 条)`}
                  </span>
                </Space>
              }
              type="info"
              showIcon={false}
              action={
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedRecords([]);
                    onSelectionChange?.([]);
                  }}
                >
                  清除选择
                </Button>
              }
            />
          </>
        )}
      </Card>
    </div>
  );
});

HistoryList.displayName = 'HistoryList';

export default HistoryList;