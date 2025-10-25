/**
 * HistoryListDemo Component
 * 
 * Demonstrates the usage of the HistoryList component in different scenarios
 */

import React, { useState, useRef } from 'react';
import {
  Card,
  Space,
  Button,
  Select,
  Switch,
  InputNumber,
  Divider,
  Typography,
  Row,
  Col,
  Alert,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { HistoryList, type HistoryListRef, type HistoryListViewMode, type HistoryListSelectionMode } from './HistoryList';
import type { HistoryRecord } from '../../types/history';
import type { ExtendedHistoryFilters } from './HistoryFilters';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * Mock history data for demonstration
 */
const generateMockHistoryData = (count: number = 50): HistoryRecord[] => {
  const operations = ['create', 'update', 'delete', 'rollback'];
  const models = ['gpt-4', 'claude-3', 'llama-2', 'mistral-7b'];
  const clusters = ['prod-cluster-1', 'dev-cluster-2', 'test-cluster-3'];
  const statuses = ['active', 'inactive'];
  
  return Array.from({ length: count }, (_, index) => ({
    history_id: index + 1,
    original_id: Math.floor(Math.random() * 10) + 1,
    operation_type: operations[Math.floor(Math.random() * operations.length)],
    operation_timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    name: `instance-${index + 1}`,
    model_name: models[Math.floor(Math.random() * models.length)],
    model_version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
    cluster_name: clusters[Math.floor(Math.random() * clusters.length)],
    image_tag: `latest-${Math.floor(Math.random() * 100)}`,
    pipeline_mode: 'default',
    quant_mode: Math.random() > 0.5,
    distill_mode: Math.random() > 0.7,
    m405_mode: Math.random() > 0.8,
    fps: Math.random() > 0.5 ? Math.floor(Math.random() * 60) + 30 : null,
    checkpoint_path: Math.random() > 0.6 ? `/checkpoints/model_${index}` : null,
    nonce: `nonce_${index}`,
    pp: Math.floor(Math.random() * 4) + 1,
    cp: Math.floor(Math.random() * 8) + 1,
    tp: Math.floor(Math.random() * 4) + 1,
    n_workers: Math.floor(Math.random() * 8) + 1,
    replicas: Math.floor(Math.random() * 5) + 1,
    priorities: ['high', 'normal', 'low'],
    envs: [],
    description: Math.random() > 0.3 ? `Description for instance ${index + 1} with some details about its configuration and purpose.` : null,
    separate_video_encode: Math.random() > 0.5,
    separate_video_decode: Math.random() > 0.5,
    separate_t5_encode: Math.random() > 0.5,
    ephemeral: Math.random() > 0.7,
    ephemeral_min_period_seconds: Math.random() > 0.5 ? 300 : null,
    ephemeral_to: '',
    ephemeral_from: '',
    vae_store_type: 'redis',
    t5_store_type: 'redis',
    enable_cuda_graph: Math.random() > 0.6,
    task_concurrency: Math.floor(Math.random() * 4) + 1,
    celery_task_concurrency: Math.random() > 0.5 ? Math.floor(Math.random() * 4) + 1 : null,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    priority: null
  }));
};

/**
 * HistoryListDemo Component
 */
export const HistoryListDemo: React.FC = () => {
  // Demo configuration state
  const [viewMode, setViewMode] = useState<HistoryListViewMode>('list');
  const [selectionMode, setSelectionMode] = useState<HistoryListSelectionMode>('multiple');
  const [maxSelection, setMaxSelection] = useState(5);
  const [showFilters, setShowFilters] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [compact, setCompact] = useState(false);
  const [enableVirtualScrolling, setEnableVirtualScrolling] = useState(false);
  const [recordCount, setRecordCount] = useState(50);
  const [instanceId, setInstanceId] = useState<number | undefined>(1);
  
  // Demo data and state
  const [mockData, setMockData] = useState<HistoryRecord[]>(() => generateMockHistoryData(50));
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<ExtendedHistoryFilters>({});
  const [loading, setLoading] = useState(false);
  
  // Ref for HistoryList component
  const historyListRef = useRef<HistoryListRef>(null);
  
  // Regenerate mock data
  const regenerateData = () => {
    setLoading(true);
    setTimeout(() => {
      setMockData(generateMockHistoryData(recordCount));
      setSelectedRecordIds([]);
      setLoading(false);
      message.success(`已生成 ${recordCount} 条模拟历史记录`);
    }, 500);
  };
  
  // Handle record click
  const handleRecordClick = (record: HistoryRecord) => {
    message.info(`点击了历史记录: ${record.name} (${record.operation_type})`);
  };
  
  // Handle record selection
  const handleRecordSelect = (record: HistoryRecord, selected: boolean) => {
    console.log('Record selection changed:', record.name, selected);
  };
  
  // Handle selection change
  const handleSelectionChange = (selectedRecords: HistoryRecord[]) => {
    setSelectedRecordIds(selectedRecords.map(r => r.history_id));
    console.log('Selection changed:', selectedRecords.length, 'records selected');
  };
  
  // Handle filters change
  const handleFiltersChange = (newFilters: ExtendedHistoryFilters) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    message.info('刷新历史记录列表');
    regenerateData();
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>HistoryList 组件演示</Title>
      <Paragraph>
        这个演示展示了 HistoryList 组件的各种功能和配置选项。
        HistoryList 是一个可复用的独立组件，支持不同的使用场景。
      </Paragraph>
      
      {/* Configuration Panel */}
      <Card 
        title={
          <Space>
            <SettingOutlined />
            <span>配置选项</span>
          </Space>
        }
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>视图模式</Text>
              <Select
                value={viewMode}
                onChange={setViewMode}
                style={{ width: '100%' }}
              >
                <Option value="list">列表视图</Option>
                <Option value="compact">紧凑视图</Option>
                <Option value="timeline">时间线视图</Option>
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>选择模式</Text>
              <Select
                value={selectionMode}
                onChange={setSelectionMode}
                style={{ width: '100%' }}
              >
                <Option value="none">无选择</Option>
                <Option value="single">单选</Option>
                <Option value="multiple">多选</Option>
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>最大选择数</Text>
              <InputNumber
                value={maxSelection}
                onChange={(value) => setMaxSelection(value || 5)}
                min={1}
                max={20}
                style={{ width: '100%' }}
                disabled={selectionMode === 'none'}
              />
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>记录数量</Text>
              <InputNumber
                value={recordCount}
                onChange={(value) => setRecordCount(value || 50)}
                min={10}
                max={1000}
                step={10}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>实例ID (可选)</Text>
              <InputNumber
                value={instanceId}
                onChange={setInstanceId}
                min={1}
                max={10}
                placeholder="留空显示所有"
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          
          <Col xs={24} sm={18} md={12}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>组件选项</Text>
              <Space wrap>
                <Switch
                  checked={showFilters}
                  onChange={setShowFilters}
                  checkedChildren="显示筛选"
                  unCheckedChildren="隐藏筛选"
                />
                <Switch
                  checked={showActions}
                  onChange={setShowActions}
                  checkedChildren="显示操作"
                  unCheckedChildren="隐藏操作"
                />
                <Switch
                  checked={showHeader}
                  onChange={setShowHeader}
                  checkedChildren="显示标题"
                  unCheckedChildren="隐藏标题"
                />
                <Switch
                  checked={compact}
                  onChange={setCompact}
                  checkedChildren="紧凑模式"
                  unCheckedChildren="标准模式"
                />
                <Switch
                  checked={enableVirtualScrolling}
                  onChange={setEnableVirtualScrolling}
                  checkedChildren="虚拟滚动"
                  unCheckedChildren="普通滚动"
                />
              </Space>
            </Space>
          </Col>
          
          <Col xs={24} sm={6} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>操作</Text>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={regenerateData}
                  loading={loading}
                >
                  重新生成数据
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>
      
      {/* Current Configuration Info */}
      <Alert
        message="当前配置"
        description={
          <Space direction="vertical" size="small">
            <Text>
              视图模式: <Text code>{viewMode}</Text> | 
              选择模式: <Text code>{selectionMode}</Text> | 
              最大选择: <Text code>{maxSelection}</Text> | 
              记录数量: <Text code>{mockData.length}</Text>
            </Text>
            <Text>
              已选择记录: <Text code>{selectedRecordIds.length}</Text> 条
              {selectedRecordIds.length > 0 && (
                <span> (ID: {selectedRecordIds.slice(0, 5).join(', ')}{selectedRecordIds.length > 5 ? '...' : ''})</span>
              )}
            </Text>
          </Space>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />
      
      {/* Demo Actions */}
      <Card size="small" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button
            onClick={() => historyListRef.current?.refresh()}
          >
            刷新列表
          </Button>
          <Button
            onClick={() => historyListRef.current?.clearSelection()}
            disabled={selectionMode === 'none'}
          >
            清除选择
          </Button>
          <Button
            onClick={() => historyListRef.current?.selectAll()}
            disabled={selectionMode === 'none'}
          >
            全选
          </Button>
          <Button
            onClick={() => {
              const selected = historyListRef.current?.getSelectedRecords() || [];
              message.info(`当前选择了 ${selected.length} 条记录`);
            }}
            disabled={selectionMode === 'none'}
          >
            获取选择
          </Button>
          <Button
            onClick={() => {
              if (mockData.length > 0) {
                historyListRef.current?.scrollToRecord(mockData[Math.floor(mockData.length / 2)].history_id);
              }
            }}
          >
            滚动到中间
          </Button>
        </Space>
      </Card>
      
      <Divider />
      
      {/* HistoryList Component Demo */}
      <HistoryList
        ref={historyListRef}
        instanceId={instanceId}
        records={mockData}
        loading={loading}
        viewMode={viewMode}
        selectionMode={selectionMode}
        maxSelection={maxSelection}
        selectedRecordIds={selectedRecordIds}
        sortField="operation_timestamp"
        sortOrder="desc"
        pagination={{
          current: 1,
          pageSize: 20,
          total: mockData.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: true
        }}
        filters={filters}
        showFilters={showFilters}
        showActions={showActions}
        showHeader={showHeader}
        title="历史记录演示"
        showRecordCount={true}
        enableVirtualScrolling={enableVirtualScrolling}
        virtualScrollHeight={400}
        compact={compact}
        onRecordClick={handleRecordClick}
        onRecordSelect={handleRecordSelect}
        onSelectionChange={handleSelectionChange}
        onSortChange={(field, order) => {
          console.log('Sort changed:', field, order);
        }}
        onPaginationChange={(page, pageSize) => {
          console.log('Pagination changed:', page, pageSize);
        }}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        onError={(error) => {
          message.error(`错误: ${error.message}`);
        }}
      />
      
      {/* Usage Examples */}
      <Divider />
      
      <Card 
        title="使用示例"
        size="small"
        style={{ marginTop: 24 }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={5}>基本用法</Title>
            <Text code>
              {`<HistoryList instanceId={1} onRecordClick={handleClick} />`}
            </Text>
          </div>
          
          <div>
            <Title level={5}>多选模式</Title>
            <Text code>
              {`<HistoryList selectionMode="multiple" maxSelection={10} onSelectionChange={handleSelection} />`}
            </Text>
          </div>
          
          <div>
            <Title level={5}>紧凑视图</Title>
            <Text code>
              {`<HistoryList viewMode="compact" compact={true} showFilters={false} />`}
            </Text>
          </div>
          
          <div>
            <Title level={5}>虚拟滚动</Title>
            <Text code>
              {`<HistoryList enableVirtualScrolling={true} virtualScrollHeight={500} />`}
            </Text>
          </div>
          
          <div>
            <Title level={5}>自定义筛选</Title>
            <Text code>
              {`<HistoryList filters={{ operation_type: ['update'], search: 'instance' }} />`}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default HistoryListDemo;