/**
 * HistorySearchDemo Component
 * Demonstrates the enhanced history search and filtering capabilities
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Space,
  Button,
  Alert,
  Divider,
  Row,
  Col,
  Statistic,
  Tag
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  HighlightOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { HistoryFilters, type ExtendedHistoryFilters } from './HistoryFilters';
import { VirtualizedHistoryList } from './VirtualizedHistoryList';
import { HistorySearchService, type SearchResult } from '../../services/historySearchService';
import type { HistoryRecord } from '../../types/history';
import { OperationType } from '../../types/enums';

const { Title, Text, Paragraph } = Typography;

/**
 * Mock data for demonstration
 */
const generateMockHistoryRecords = (): HistoryRecord[] => {
  const records: HistoryRecord[] = [];
  const models = ['gpt-4', 'gpt-3.5-turbo', 'llama-2', 'claude-3', 'gemini-pro'];
  const clusters = ['production-cluster', 'staging-cluster', 'development-cluster'];
  const operations = [OperationType.CREATE, OperationType.UPDATE, OperationType.DELETE];
  const statuses = ['active', 'inactive', 'pending', 'error'];

  for (let i = 1; i <= 50; i++) {
    const model = models[Math.floor(Math.random() * models.length)];
    const cluster = clusters[Math.floor(Math.random() * clusters.length)];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    records.push({
      history_id: i,
      original_id: Math.floor(i / 3) + 1,
      operation_type: operation,
      operation_timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      name: `instance-${Math.floor(i / 3) + 1}${operation === OperationType.UPDATE ? '-v' + (i % 5 + 1) : ''}`,
      model_name: model,
      model_version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}`,
      cluster_name: cluster,
      image_tag: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      description: `${operation === OperationType.CREATE ? 'Created' : operation === OperationType.UPDATE ? 'Updated' : 'Deleted'} ${model} instance on ${cluster} for ${status === 'active' ? 'production' : 'testing'} workloads`,
      status,
      ephemeral: Math.random() > 0.7,
      quant_mode: Math.random() > 0.5,
      distill_mode: Math.random() > 0.6,
      m405_mode: Math.random() > 0.8,
      replicas: Math.floor(Math.random() * 10) + 1,
      fps: Math.floor(Math.random() * 60) + 15,
      priorities: Math.random() > 0.5 ? ['high'] : ['low'],
      envs: Math.random() > 0.3 ? [{ key: 'ENV', value: status === 'active' ? 'prod' : 'dev' }] : [],
      pipeline_mode: Math.random() > 0.5 ? 'standard' : 'advanced',
      checkpoint_path: `/models/${model}/checkpoint-${i}.pt`
    });
  }

  return records.sort((a, b) => new Date(b.operation_timestamp).getTime() - new Date(a.operation_timestamp).getTime());
};

/**
 * HistorySearchDemo Component
 */
export const HistorySearchDemo: React.FC = () => {
  const [mockRecords] = useState<HistoryRecord[]>(generateMockHistoryRecords());
  const [filters, setFilters] = useState<ExtendedHistoryFilters>({
    search: '',
    searchFields: ['name', 'model_name', 'cluster_name', 'description'],
    searchMode: 'contains',
    caseSensitive: false,
  });
  const [filteredRecords, setFilteredRecords] = useState<HistoryRecord[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHighlight, setSearchHighlight] = useState(true);

  // Apply filtering and search
  useEffect(() => {
    // Apply filters
    const filtered = HistorySearchService.filterRecords(mockRecords, filters);
    setFilteredRecords(filtered);

    // Apply search if search term exists
    if (filters.search && filters.search.trim()) {
      const searchOptions = {
        fields: filters.searchFields || ['name', 'model_name', 'cluster_name', 'description'],
        mode: filters.searchMode || 'contains',
        caseSensitive: filters.caseSensitive || false
      };
      
      const results = HistorySearchService.searchRecords(
        filtered,
        filters.search,
        searchOptions
      );
      
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [mockRecords, filters]);

  // Get filter options
  const filterOptions = useMemo(() => {
    return HistorySearchService.getFilterOptions(mockRecords);
  }, [mockRecords]);

  // Calculate statistics
  const stats = useMemo(() => {
    const displayRecords = filters.search ? searchResults.map(r => r.record) : filteredRecords;
    
    return {
      total: mockRecords.length,
      filtered: filteredRecords.length,
      displayed: displayRecords.length,
      searchMatches: searchResults.length,
      avgScore: searchResults.length > 0 
        ? (searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length).toFixed(2)
        : '0'
    };
  }, [mockRecords.length, filteredRecords.length, searchResults]);

  const displayRecords = filters.search ? searchResults.map(r => r.record) : filteredRecords;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={2}>
              <SearchOutlined style={{ marginRight: 8 }} />
              历史记录搜索与筛选演示
            </Title>
            <Paragraph type="secondary">
              展示增强的历史记录搜索和筛选功能，包括智能搜索、高级筛选、结果高亮等特性。
            </Paragraph>
          </div>

          {/* Statistics */}
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="总记录数"
                  value={stats.total}
                  prefix={<InfoCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="筛选后"
                  value={stats.filtered}
                  prefix={<FilterOutlined />}
                  valueStyle={{ color: stats.filtered < stats.total ? '#1890ff' : undefined }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="显示记录"
                  value={stats.displayed}
                  prefix={<SearchOutlined />}
                  valueStyle={{ color: stats.displayed < stats.filtered ? '#52c41a' : undefined }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="平均相关度"
                  value={stats.avgScore}
                  prefix={<HighlightOutlined />}
                  valueStyle={{ color: parseFloat(stats.avgScore) > 2 ? '#fa8c16' : undefined }}
                />
              </Col>
            </Row>
          </Card>

          {/* Enhanced Filters */}
          <HistoryFilters
            filters={filters}
            filterOptions={filterOptions}
            records={mockRecords}
            loading={false}
            collapsed={false}
            showAdvanced={true}
            searchHighlight={searchHighlight}
            onFiltersChange={setFilters}
            onReset={() => setFilters({
              search: '',
              searchFields: ['name', 'model_name', 'cluster_name', 'description'],
              searchMode: 'contains',
              caseSensitive: false,
            })}
            onSearchHighlight={setSearchHighlight}
          />

          {/* Search Results Info */}
          {filters.search && (
            <Alert
              message={
                <Space>
                  <SearchOutlined />
                  <span>
                    搜索 "{filters.search}" 找到 {searchResults.length} 条匹配记录
                    {searchResults.length > 0 && (
                      <>
                        ，最高相关度: {Math.max(...searchResults.map(r => r.score)).toFixed(2)}
                      </>
                    )}
                  </span>
                </Space>
              }
              type="info"
              showIcon={false}
              style={{ marginBottom: 16 }}
              action={
                <Space>
                  <Tag color={searchHighlight ? 'green' : 'default'}>
                    高亮: {searchHighlight ? '开启' : '关闭'}
                  </Tag>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setSearchHighlight(!searchHighlight)}
                  >
                    切换高亮
                  </Button>
                </Space>
              }
            />
          )}

          <Divider />

          {/* History List */}
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              历史记录列表 ({displayRecords.length} 条)
            </Title>
            
            <VirtualizedHistoryList
              records={displayRecords}
              loading={false}
              compareMode={false}
              selectedRecords={[]}
              height={600}
              searchTerm={filters.search}
              searchOptions={{
                fields: filters.searchFields,
                caseSensitive: filters.caseSensitive,
                searchMode: filters.searchMode
              }}
              searchHighlight={searchHighlight}
              searchResults={searchResults}
            />
          </div>

          {/* Feature Highlights */}
          <Card title="功能特性" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" style={{ height: '100%' }}>
                  <Space direction="vertical" size="small">
                    <SearchOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <Text strong>智能搜索</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      支持多字段搜索、模糊匹配、正则表达式，智能相关度评分
                    </Text>
                  </Space>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={8}>
                <Card size="small" style={{ height: '100%' }}>
                  <Space direction="vertical" size="small">
                    <FilterOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <Text strong>高级筛选</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      支持操作类型、时间范围、字段值、数值范围等多维度筛选
                    </Text>
                  </Space>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={8}>
                <Card size="small" style={{ height: '100%' }}>
                  <Space direction="vertical" size="small">
                    <HighlightOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                    <Text strong>结果高亮</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      搜索结果实时高亮显示，支持自定义高亮样式和匹配模式
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default HistorySearchDemo;