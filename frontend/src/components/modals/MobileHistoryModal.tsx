/**
 * MobileHistoryModal Component
 * 
 * A mobile-optimized version of the history modal with touch-friendly interactions
 * and improved layout for small screens.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  Typography,
  Tag,
  Space,
  Button,
  Alert,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  message,
  Drawer,
  Card,
  Tabs
} from 'antd';
import {
  HistoryOutlined,
  ReloadOutlined,
  DiffOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import type { Instance } from '../../types/instance';
import type { HistoryRecord, HistoryFilters } from '../../types/history';
import { HistoryService } from '../../services/historyService';
import { OperationType } from '../../types/enums';
import { HistoryComparison } from '../history/HistoryComparison';
import { VirtualizedHistoryList, type VirtualizedHistoryListRef } from '../history/VirtualizedHistoryList';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export interface MobileHistoryModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Instance to show history for */
  instance?: Instance;
  /** Modal close handler */
  onClose: () => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Show comparison functionality */
  showComparison?: boolean;
  /** Default filters */
  defaultFilters?: HistoryFilters;
  /** Maximum records to load */
  maxRecords?: number;
}

/**
 * MobileHistoryModal Component
 */
export const MobileHistoryModal: React.FC<MobileHistoryModalProps> = ({
  visible,
  instance,
  onClose,
  onError,
  showComparison = true,
  defaultFilters = {},
  maxRecords = 1000
}) => {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters);
  const [hasMore, setHasMore] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<HistoryRecord[]>([]);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // Ref for virtualized list
  const virtualListRef = useRef<VirtualizedHistoryListRef>(null);

  // Load history records
  const loadHistory = useCallback(async (page: number = 1, reset: boolean = true) => {
    if (!instance) return;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const offset = (page - 1) * pageSize;
      
      if (reset || historyRecords.length < maxRecords) {
        const response = await HistoryService.getInstanceHistory(
          instance.id,
          filters,
          { limit: Math.min(pageSize, maxRecords - (reset ? 0 : historyRecords.length)), offset }
        );

        if (reset) {
          setHistoryRecords(response.history_records);
        } else {
          setHistoryRecords(prev => [...prev, ...response.history_records]);
        }
        
        setTotalCount(response.total_count);
        setHasMore(response.has_more && (reset ? response.history_records.length : historyRecords.length + response.history_records.length) < maxRecords);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      const errorMessage = error instanceof Error ? error.message : '加载历史记录失败';
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [instance, filters, pageSize, onError, maxRecords, historyRecords.length]);

  // Load history when modal opens or filters change
  useEffect(() => {
    if (visible && instance) {
      loadHistory(1, true);
    }
  }, [visible, instance, loadHistory]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<HistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadHistory(1, true);
  };

  // Handle compare mode toggle
  const handleCompareModeToggle = () => {
    setCompareMode(!compareMode);
    setSelectedRecords([]);
    setShowComparisonView(false);
    if (!compareMode) {
      setActiveTab('compare');
    } else {
      setActiveTab('list');
    }
  };

  // Handle record selection for comparison
  const handleRecordSelect = (record: HistoryRecord, checked: boolean) => {
    if (checked) {
      if (selectedRecords.length >= 2) {
        message.warning('最多只能选择两条记录进行对比');
        return;
      }
      setSelectedRecords([...selectedRecords, record]);
    } else {
      setSelectedRecords(selectedRecords.filter(r => r.history_id !== record.history_id));
    }
  };

  // Handle start comparison
  const handleStartComparison = () => {
    if (selectedRecords.length !== 2) {
      message.error('请选择两条记录进行对比');
      return;
    }
    setShowComparisonView(true);
    setActiveTab('comparison');
  };

  // Handle close comparison
  const handleCloseComparison = () => {
    setShowComparisonView(false);
    setActiveTab('compare');
  };

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      loadHistory(currentPage + 1, false);
    }
  }, [loading, loadingMore, hasMore, loadHistory, currentPage]);

  // Handle record click
  const handleRecordClick = useCallback((record: HistoryRecord) => {
    console.log('Record clicked:', record);
  }, []);

  if (!instance) {
    return null;
  }

  // Mobile-optimized filters component
  const FiltersContent = () => (
    <div style={{ padding: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>操作类型</Text>
          <Select
            placeholder="选择操作类型"
            allowClear
            style={{ width: '100%' }}
            size="large"
            value={filters.operation_type?.[0]}
            onChange={(value) => 
              handleFilterChange({ 
                operation_type: value ? [value] : undefined 
              })
            }
          >
            <Option value={OperationType.CREATE}>创建</Option>
            <Option value={OperationType.UPDATE}>更新</Option>
            <Option value={OperationType.DELETE}>删除</Option>
            <Option value={OperationType.ROLLBACK}>回滚</Option>
          </Select>
        </div>
        
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>时间范围</Text>
          <RangePicker
            style={{ width: '100%' }}
            size="large"
            placeholder={['开始日期', '结束日期']}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                handleFilterChange({
                  date_range: {
                    start: dates[0].toISOString(),
                    end: dates[1].toISOString()
                  }
                });
              } else {
                handleFilterChange({ date_range: undefined });
              }
            }}
          />
        </div>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            size="large"
            onClick={() => {
              setFilters({});
              setShowFilters(false);
            }}
          >
            重置
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={() => setShowFilters(false)}
          >
            应用筛选
          </Button>
        </Space>
      </Space>
    </div>
  );

  return (
    <>
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史记录</span>
          </Space>
        }
        placement="bottom"
        height="90vh"
        open={visible}
        onClose={onClose}
        styles={{
          body: { padding: 0 }
        }}
        extra={
          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(true)}
              size="large"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size="large"
            />
          </Space>
        }
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Instance Info */}
          <Card size="small" style={{ margin: '0 16px 16px 16px', borderRadius: 8 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong style={{ fontSize: '16px' }}>{instance.name}</Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {instance.model_name} v{instance.model_version}
              </Text>
            </Space>
          </Card>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            items={[
              {
                key: 'list',
                label: '历史列表',
                children: (
                  <div style={{ flex: 1, padding: '0 16px' }}>
                    <VirtualizedHistoryList
                      ref={virtualListRef}
                      records={historyRecords}
                      loading={loading}
                      compareMode={false}
                      selectedRecords={[]}
                      onRecordClick={handleRecordClick}
                      height={window.innerHeight * 0.6}
                      showLoadMore={hasMore}
                      onLoadMore={handleLoadMore}
                      loadingMore={loadingMore}
                    />
                  </div>
                )
              },
              ...(showComparison ? [{
                key: 'compare',
                label: `对比模式${selectedRecords.length > 0 ? ` (${selectedRecords.length}/2)` : ''}`,
                children: (
                  <div style={{ flex: 1, padding: '0 16px' }}>
                    {/* Compare Mode Instructions */}
                    <Alert
                      message="对比模式"
                      description={`请选择两条历史记录进行对比。已选择: ${selectedRecords.length}/2`}
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                      action={
                        selectedRecords.length === 2 ? (
                          <Button
                            type="primary"
                            size="small"
                            icon={<DiffOutlined />}
                            onClick={handleStartComparison}
                          >
                            开始对比
                          </Button>
                        ) : null
                      }
                    />

                    <VirtualizedHistoryList
                      ref={virtualListRef}
                      records={historyRecords}
                      loading={loading}
                      compareMode={true}
                      selectedRecords={selectedRecords}
                      onRecordSelect={handleRecordSelect}
                      onRecordClick={handleRecordClick}
                      height={window.innerHeight * 0.5}
                      showLoadMore={hasMore}
                      onLoadMore={handleLoadMore}
                      loadingMore={loadingMore}
                    />
                  </div>
                )
              }] : []),
              ...(showComparisonView && selectedRecords.length === 2 ? [{
                key: 'comparison',
                label: '对比结果',
                children: (
                  <div style={{ flex: 1, padding: '0 16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 16 
                    }}>
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleCloseComparison}
                        size="large"
                      >
                        返回
                      </Button>
                    </div>
                    
                    <HistoryComparison
                      oldRecord={selectedRecords[0]}
                      newRecord={selectedRecords[1]}
                      showUnchangedByDefault={false}
                      compact={true}
                    />
                  </div>
                )
              }] : [])
            ]}
          />

          {/* Summary Info */}
          {totalCount > 0 && (
            <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
              <Alert
                message={
                  <Space>
                    <InfoCircleOutlined />
                    <span style={{ fontSize: '14px' }}>
                      共找到 {totalCount} 条历史记录
                      {historyRecords.length < totalCount && ` (已显示 ${historyRecords.length} 条)`}
                      {filters.operation_type && ` (${HistoryService.formatOperationType(filters.operation_type[0]).label} 操作)`}
                      {filters.date_range && ' (指定时间范围内)'}
                      {historyRecords.length >= maxRecords && ` (已达到最大显示限制 ${maxRecords} 条)`}
                    </span>
                  </Space>
                }
                type="info"
                showIcon={false}
              />
            </div>
          )}
        </div>
      </Drawer>

      {/* Filters Drawer */}
      <Drawer
        title="筛选条件"
        placement="bottom"
        height="60vh"
        open={showFilters}
        onClose={() => setShowFilters(false)}
        styles={{
          body: { padding: 0 }
        }}
      >
        <FiltersContent />
      </Drawer>
    </>
  );
};

export default MobileHistoryModal;