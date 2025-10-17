/**
 * VirtualizedHistoryList Component
 * 
 * A high-performance virtualized list component for displaying large numbers of history records.
 * Uses custom virtualization for efficient rendering of only visible items.
 */

import React, { useMemo, useCallback, forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import {
  List as AntList,
  Typography,
  Tag,
  Space,
  Checkbox,
  Empty,
  Spin,
  Tooltip
} from 'antd';
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  InfoCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { HistoryRecord } from '../../types/history';
import { OperationType } from '../../types/enums';
import { HistoryService } from '../../services/historyService';
import { HistorySearchService, type SearchResult } from '../../services/historySearchService';
import { SearchHighlight, FieldHighlight } from './SearchHighlight';
import { useResponsive } from '../../hooks/useResponsive';
import { useTouchGestures } from '../../hooks/useTouchGestures';

const { Text } = Typography;

export interface VirtualizedHistoryListProps {
  /** History records to display */
  records: HistoryRecord[];
  /** Loading state */
  loading?: boolean;
  /** Whether in compare mode */
  compareMode?: boolean;
  /** Selected records for comparison */
  selectedRecords?: HistoryRecord[];
  /** Record selection handler */
  onRecordSelect?: (record: HistoryRecord, checked: boolean) => void;
  /** Record click handler */
  onRecordClick?: (record: HistoryRecord) => void;
  /** Container height */
  height?: number;
  /** Item height (will be calculated dynamically if not provided) */
  itemHeight?: number;
  /** Whether to show load more button */
  showLoadMore?: boolean;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Whether loading more */
  loadingMore?: boolean;
  /** Search term for highlighting */
  searchTerm?: string;
  /** Search options */
  searchOptions?: {
    fields?: string[];
    caseSensitive?: boolean;
    searchMode?: 'contains' | 'exact' | 'regex';
  };
  /** Whether to enable search highlighting */
  searchHighlight?: boolean;
  /** Search results with scoring */
  searchResults?: SearchResult[];
}

export interface VirtualizedHistoryListRef {
  scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

/**
 * Individual history record item component
 */
interface HistoryRecordItemData {
  records: HistoryRecord[];
  compareMode: boolean;
  selectedRecords: HistoryRecord[];
  onRecordSelect?: (record: HistoryRecord, checked: boolean) => void;
  onRecordClick?: (record: HistoryRecord) => void;
  isMobile: boolean;
  isTablet: boolean;
  searchTerm?: string;
  searchOptions?: {
    fields?: string[];
    caseSensitive?: boolean;
    searchMode?: 'contains' | 'exact' | 'regex';
  };
  searchHighlight?: boolean;
  searchResults?: SearchResult[];
}

interface HistoryRecordItemProps {
  index: number;
  style: React.CSSProperties;
  data: HistoryRecordItemData;
}

const HistoryRecordItem: React.FC<HistoryRecordItemProps> = ({ 
  index, 
  style, 
  data 
}) => {
  const { 
    records, 
    compareMode, 
    selectedRecords, 
    onRecordSelect, 
    onRecordClick,
    isMobile,
    isTablet,
    searchTerm,
    searchOptions = {},
    searchHighlight = false,
    searchResults = []
  } = data;
  
  const record = records[index];
  
  if (!record) {
    return <div style={style} />;
  }

  const isSelected = selectedRecords.some(r => r.history_id === record.history_id);
  const isDisabled = !isSelected && selectedRecords.length >= 2;
  
  // Find search result for this record
  const searchResult = searchResults.find(sr => sr.record.history_id === record.history_id);
  const hasSearchMatches = searchResult && searchResult.matches.length > 0;

  // Get operation icon
  const getOperationIcon = (operationType: string) => {
    switch (operationType.toLowerCase()) {
      case OperationType.CREATE:
        return <PlusCircleOutlined style={{ color: '#52c41a' }} />;
      case OperationType.UPDATE:
        return <EditOutlined style={{ color: '#faad14' }} />;
      case OperationType.DELETE:
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      case OperationType.ROLLBACK:
        return <UndoOutlined style={{ color: '#1890ff' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  // Get operation color
  const getOperationColor = (operationType: string) => {
    switch (operationType.toLowerCase()) {
      case OperationType.CREATE:
        return 'success';
      case OperationType.UPDATE:
        return 'warning';
      case OperationType.DELETE:
        return 'error';
      case OperationType.ROLLBACK:
        return 'processing';
      default:
        return 'default';
    }
  };

  const handleRecordClick = () => {
    if (!compareMode && onRecordClick) {
      onRecordClick(record);
    }
  };

  const handleCheckboxChange = (e: any) => {
    if (onRecordSelect) {
      onRecordSelect(record, e.target.checked);
    }
  };

  return (
    <div 
      style={{
        ...style,
        padding: isMobile ? '12px 16px' : '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        cursor: compareMode ? 'default' : 'pointer',
        transition: 'background-color 0.2s ease',
        touchAction: 'manipulation', // Optimize for touch
        userSelect: 'none' // Prevent text selection on touch
      }}
      onClick={handleRecordClick}
      onTouchStart={(e) => {
        // Add touch feedback
        e.currentTarget.style.backgroundColor = '#f5f5f5';
      }}
      onTouchEnd={(e) => {
        // Remove touch feedback
        setTimeout(() => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }, 150);
      }}
    >
      <AntList.Item
        style={{ 
          border: 'none', 
          padding: 0,
          margin: 0
        }}
        actions={compareMode ? [
          <Checkbox
            key="select"
            checked={isSelected}
            onChange={handleCheckboxChange}
            disabled={isDisabled}
          >
            {isMobile ? '' : '选择'}
          </Checkbox>
        ] : undefined}
      >
        <AntList.Item.Meta
          avatar={getOperationIcon(record.operation_type)}
          title={
            <Space 
              wrap 
              size={isMobile ? 'small' : 'middle'}
              style={{ width: '100%' }}
            >
              <Tag 
                color={getOperationColor(record.operation_type)}
                style={{ fontSize: isMobile ? '12px' : '14px' }}
              >
                {HistoryService.formatOperationType(record.operation_type).label}
              </Tag>
              
              <SearchHighlight
                text={record.name}
                searchTerm={searchTerm}
                caseSensitive={searchOptions.caseSensitive}
                searchMode={searchOptions.searchMode}
                enabled={searchHighlight}
                textProps={{
                  strong: true,
                  style: { 
                    fontSize: isMobile ? '14px' : '16px',
                    wordBreak: 'break-word'
                  }
                }}
              />
              
              {record.operation_type === OperationType.UPDATE && !isMobile && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  (<SearchHighlight
                    text={record.model_name}
                    searchTerm={searchTerm}
                    caseSensitive={searchOptions.caseSensitive}
                    searchMode={searchOptions.searchMode}
                    enabled={searchHighlight}
                    textProps={{ type: 'secondary' }}
                  /> v{record.model_version})
                </Text>
              )}
              
              {isSelected && (
                <Tag color="blue">已选择</Tag>
              )}
              
              {hasSearchMatches && searchHighlight && (
                <Tooltip title={`找到 ${searchResult.matches.length} 个匹配项，相关度: ${searchResult.score.toFixed(1)}`}>
                  <Tag color="orange" icon={<SearchOutlined />} style={{ fontSize: '11px' }}>
                    {searchResult.matches.length}
                  </Tag>
                </Tooltip>
              )}
            </Space>
          }
          description={
            <Space 
              direction="vertical" 
              size="small" 
              style={{ width: '100%' }}
            >
              <div>
                <Text 
                  type="secondary" 
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  {HistoryService.formatTimestamp(record.operation_timestamp)}
                </Text>
                {!isMobile && (
                  <Text 
                    type="secondary" 
                    style={{ marginLeft: 8, fontSize: '12px' }}
                  >
                    ({HistoryService.getRelativeTime(record.operation_timestamp)})
                  </Text>
                )}
              </div>
              
              {record.description && (
                <SearchHighlight
                  text={record.description}
                  searchTerm={searchTerm}
                  caseSensitive={searchOptions.caseSensitive}
                  searchMode={searchOptions.searchMode}
                  enabled={searchHighlight}
                  maxLength={isMobile ? 80 : 120}
                  textProps={{
                    type: 'secondary',
                    ellipsis: { tooltip: record.description },
                    style: { fontSize: isMobile ? '12px' : '13px' }
                  }}
                />
              )}
              
              <Space 
                wrap 
                size="small"
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              >
                <Text type="secondary">
                  集群: <SearchHighlight
                    text={record.cluster_name}
                    searchTerm={searchTerm}
                    caseSensitive={searchOptions.caseSensitive}
                    searchMode={searchOptions.searchMode}
                    enabled={searchHighlight}
                    textProps={{ type: 'secondary' }}
                  />
                </Text>
                {!isMobile && (
                  <Text type="secondary">
                    镜像: <SearchHighlight
                      text={record.image_tag}
                      searchTerm={searchTerm}
                      caseSensitive={searchOptions.caseSensitive}
                      searchMode={searchOptions.searchMode}
                      enabled={searchHighlight}
                      textProps={{ type: 'secondary' }}
                    />
                  </Text>
                )}
                {record.status && (
                  <Text type="secondary">
                    状态: <SearchHighlight
                      text={record.status}
                      searchTerm={searchTerm}
                      caseSensitive={searchOptions.caseSensitive}
                      searchMode={searchOptions.searchMode}
                      enabled={searchHighlight}
                      textProps={{ type: 'secondary' }}
                    />
                  </Text>
                )}
              </Space>
            </Space>
          }
        />
      </AntList.Item>
    </div>
  );
};

/**
 * VirtualizedHistoryList Component
 */
export const VirtualizedHistoryList = forwardRef<
  VirtualizedHistoryListRef,
  VirtualizedHistoryListProps
>(({
  records,
  loading = false,
  compareMode = false,
  selectedRecords = [],
  onRecordSelect,
  onRecordClick,
  height = 400,
  itemHeight,
  showLoadMore = false,
  onLoadMore,
  loadingMore = false,
  searchTerm,
  searchOptions = {},
  searchHighlight = false,
  searchResults = []
}, ref) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Calculate dynamic item height based on screen size
  const calculatedItemHeight = useMemo(() => {
    if (itemHeight) return itemHeight;
    
    if (isMobile) {
      return 120; // Smaller height for mobile
    } else if (isTablet) {
      return 140; // Medium height for tablet
    } else {
      return 160; // Full height for desktop
    }
  }, [itemHeight, isMobile, isTablet]);

  // Virtualization state
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch gestures for mobile interaction
  const { isTouch } = useTouchGestures(containerRef as React.RefObject<HTMLElement>, {
    onSwipeUp: () => {
      // Smooth scroll down for more content
      if (containerRef.current && showLoadMore && onLoadMore && !loadingMore) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
          onLoadMore();
        }
      }
    },
    onSwipeDown: () => {
      // Refresh gesture at the top
      if (containerRef.current && containerRef.current.scrollTop === 0) {
        // Could trigger refresh if callback is provided
        console.log('Pull to refresh gesture detected');
      }
    },
    swipeThreshold: 30
  });

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const containerHeight = height;
    const totalItems = records.length;
    
    if (totalItems === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    const start = Math.floor(scrollTop / calculatedItemHeight);
    const visibleCount = Math.ceil(containerHeight / calculatedItemHeight);
    const end = Math.min(start + visibleCount + 5, totalItems); // Add 5 for overscan
    const actualStart = Math.max(0, start - 5); // Add 5 for overscan

    const items = records.slice(actualStart, end).map((record, index) => ({
      record,
      index: actualStart + index,
      top: (actualStart + index) * calculatedItemHeight
    }));

    return {
      startIndex: actualStart,
      endIndex: end,
      visibleItems: items
    };
  }, [scrollTop, calculatedItemHeight, height, records]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);

    // Load more when scrolled to 90% of the content
    const containerHeight = height;
    const totalHeight = records.length * calculatedItemHeight;
    const scrollPercentage = scrollTop / (totalHeight - containerHeight);
    
    if (scrollPercentage > 0.9 && showLoadMore && onLoadMore && !loadingMore) {
      onLoadMore();
    }
  }, [height, records.length, calculatedItemHeight, showLoadMore, onLoadMore, loadingMore]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    scrollToItem: (index: number, align = 'auto') => {
      if (containerRef.current) {
        const itemTop = index * calculatedItemHeight;
        let scrollTop = itemTop;
        
        if (align === 'center') {
          scrollTop = itemTop - height / 2 + calculatedItemHeight / 2;
        } else if (align === 'end') {
          scrollTop = itemTop - height + calculatedItemHeight;
        }
        
        containerRef.current.scrollTop = Math.max(0, scrollTop);
      }
    },
    scrollToTop: () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    },
    scrollToBottom: () => {
      if (containerRef.current && records.length > 0) {
        containerRef.current.scrollTop = records.length * calculatedItemHeight;
      }
    }
  }), [records.length, calculatedItemHeight, height]);

  // Show loading state
  if (loading && records.length === 0) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">加载历史记录中...</Typography.Text>
        </div>
      </div>
    );
  }

  // Show empty state
  if (records.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无历史记录"
        />
      </div>
    );
  }

  const totalHeight = records.length * calculatedItemHeight;

  return (
    <div style={{ height }}>
      <div
        ref={containerRef}
        style={{
          height,
          overflow: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d9d9d9 transparent',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          touchAction: 'pan-y', // Allow vertical scrolling
          overscrollBehavior: 'contain' // Prevent overscroll effects
        }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(({ record, index, top }) => (
            <div
              key={record.history_id}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: calculatedItemHeight
              }}
            >
              <HistoryRecordItem
                index={index}
                style={{ height: calculatedItemHeight }}
                data={{
                  records,
                  compareMode,
                  selectedRecords,
                  onRecordSelect,
                  onRecordClick,
                  isMobile,
                  isTablet,
                  searchTerm,
                  searchOptions,
                  searchHighlight,
                  searchResults
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Load more indicator */}
      {loadingMore && (
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '16px',
            borderTop: '1px solid #f0f0f0'
          }}
        >
          <Spin size="small" />
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
            加载更多记录中...
          </Typography.Text>
        </div>
      )}
    </div>
  );
});

VirtualizedHistoryList.displayName = 'VirtualizedHistoryList';

export default VirtualizedHistoryList;