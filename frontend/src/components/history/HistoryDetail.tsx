/**
 * HistoryDetail Component
 * 
 * Displays detailed information for a single history record.
 * Features:
 * - Field grouping and formatted display
 * - JSON data syntax highlighting and folding
 * - Copy and export functionality
 * - Responsive design for different screen sizes
 * - Expandable sections for better navigation
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  Descriptions,
  Typography,
  Space,
  Button,
  Tag,
  Divider,
  Row,
  Col,
  Collapse,
  Tooltip,
  message,
  Alert,
  Badge,
  Drawer
} from 'antd';
import {
  InfoCircleOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExpandOutlined,
  CompressOutlined,
  EyeOutlined,
  CodeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { HistoryRecord } from '../../types/history';
import { HistoryService } from '../../services/historyService';
import { SearchHighlight, FieldHighlight } from './SearchHighlight';
import { useResponsive } from '../../hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Props for HistoryDetail component
 */
export interface HistoryDetailProps {
  /** History record to display */
  record: HistoryRecord;
  /** Whether to show metadata fields */
  showMetadata?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
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
  /** Custom title */
  title?: string;
  /** Whether to show in drawer mode */
  drawerMode?: boolean;
  /** Drawer visibility (only used in drawer mode) */
  visible?: boolean;
  /** Drawer close handler (only used in drawer mode) */
  onClose?: () => void;
  /** Custom actions */
  actions?: React.ReactNode[];
}

/**
 * JSON Viewer Component with syntax highlighting and folding
 */
interface JsonViewerProps {
  data: any;
  title?: string;
  compact?: boolean;
  searchTerm?: string;
  searchHighlight?: boolean;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'JSON Data',
  compact = false,
  searchTerm,
  searchHighlight = false
}) => {
  const [collapsed, setCollapsed] = useState(compact);
  const [copyLoading, setCopyLoading] = useState(false);

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  }, [data]);

  const handleCopy = useCallback(async () => {
    setCopyLoading(true);
    try {
      await navigator.clipboard.writeText(jsonString);
      message.success('JSON数据已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    } finally {
      setCopyLoading(false);
    }
  }, [jsonString]);

  if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <Text type="secondary" italic>
        无数据
      </Text>
    );
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <CodeOutlined />
          <span>{title}</span>
          <Badge count={Array.isArray(data) ? data.length : Object.keys(data).length} />
        </Space>
      }
      extra={
        <Space>
          <Tooltip title={collapsed ? '展开' : '折叠'}>
            <Button
              type="text"
              size="small"
              icon={collapsed ? <ExpandOutlined /> : <CompressOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </Tooltip>
          <Tooltip title="复制JSON">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              loading={copyLoading}
              onClick={handleCopy}
            />
          </Tooltip>
        </Space>
      }
      style={{ marginTop: 8 }}
    >
      {!collapsed && (
        <div
          style={{
            backgroundColor: '#f6f8fa',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            padding: '12px',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '12px',
            lineHeight: '1.45',
            overflow: 'auto',
            maxHeight: '300px'
          }}
        >
          <SearchHighlight
            text={jsonString}
            searchTerm={searchTerm}
            enabled={searchHighlight}
            textProps={{
              style: {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0
              }
            }}
            highlightStyle={{
              backgroundColor: '#fff566',
              padding: '1px 2px',
              borderRadius: '2px',
              fontWeight: 600
            }}
          />
        </div>
      )}
    </Card>
  );
};

/**
 * Field Group Component
 */
interface FieldGroupProps {
  title: string;
  icon: React.ReactNode;
  fields: Array<{
    label: string;
    value: any;
    key: string;
    span?: number;
    render?: (value: any) => React.ReactNode;
  }>;
  compact?: boolean;
  searchTerm?: string;
  searchHighlight?: boolean;
  defaultCollapsed?: boolean;
}

const FieldGroup: React.FC<FieldGroupProps> = ({
  title,
  icon,
  fields,
  compact = false,
  searchTerm,
  searchHighlight = false,
  defaultCollapsed = false
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const visibleFields = fields.filter(field => 
    field.value !== null && 
    field.value !== undefined && 
    field.value !== '' &&
    !(Array.isArray(field.value) && field.value.length === 0)
  );

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <Card
      size={compact ? 'small' : 'default'}
      title={
        <Space>
          {icon}
          <span>{title}</span>
          <Badge count={visibleFields.length} />
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={collapsed ? <ExpandOutlined /> : <CompressOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
      }
      style={{ marginBottom: 16 }}
    >
      {!collapsed && (
        <Descriptions
          bordered
          size={compact ? 'small' : 'default'}
          column={compact ? 1 : 2}
        >
          {visibleFields.map(field => (
            <Descriptions.Item
              key={field.key}
              label={field.label}
              span={field.span || 1}
            >
              {field.render ? (
                field.render(field.value)
              ) : (
                <FieldHighlight
                  value={field.value}
                  fieldName={field.key}
                  searchTerm={searchTerm}
                  enabled={searchHighlight}
                />
              )}
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
    </Card>
  );
};

/**
 * Main HistoryDetail Component
 */
export const HistoryDetail: React.FC<HistoryDetailProps> = ({
  record,
  showMetadata = true,
  compact = false,
  searchTerm,
  searchOptions = {},
  searchHighlight = false,
  title,
  drawerMode = false,
  visible = true,
  onClose,
  actions = []
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [exportLoading, setExportLoading] = useState(false);

  // Format operation display
  const operationDisplay = useMemo(() => 
    HistoryService.formatOperationType(record.operation_type), 
    [record.operation_type]
  );

  // Handle copy record
  const handleCopyRecord = useCallback(async () => {
    try {
      const recordData = JSON.stringify(record, null, 2);
      await navigator.clipboard.writeText(recordData);
      message.success('历史记录已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  }, [record]);

  // Handle export record
  const handleExportRecord = useCallback(async () => {
    setExportLoading(true);
    try {
      const recordData = JSON.stringify(record, null, 2);
      const blob = new Blob([recordData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `history_${record.history_id}_${record.name}_${record.operation_timestamp.replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('历史记录已导出');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  }, [record]);

  // Prepare field groups
  const fieldGroups = useMemo(() => {
    const groups = [
      {
        title: '基础信息',
        icon: <InfoCircleOutlined />,
        fields: [
          {
            label: '实例名称',
            value: record.name,
            key: 'name',
            span: 1
          },
          {
            label: '操作类型',
            value: record.operation_type,
            key: 'operation_type',
            span: 1,
            render: (value: string) => (
              <Tag color={operationDisplay.color}>
                {operationDisplay.label}
              </Tag>
            )
          },
          {
            label: '操作时间',
            value: record.operation_timestamp,
            key: 'operation_timestamp',
            span: 2,
            render: (value: string) => (
              <Space direction="vertical" size={0}>
                <Text>{HistoryService.formatTimestamp(value)}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({HistoryService.getRelativeTime(value)})
                </Text>
              </Space>
            )
          },
          {
            label: '描述',
            value: record.description,
            key: 'description',
            span: 2
          },
          {
            label: '状态',
            value: record.status,
            key: 'status',
            span: 1,
            render: (value: string) => value ? (
              <Tag color="blue">{value.toUpperCase()}</Tag>
            ) : null
          }
        ]
      },
      {
        title: '模型配置',
        icon: <ClusterOutlined />,
        fields: [
          {
            label: '模型名称',
            value: record.model_name,
            key: 'model_name',
            span: 1
          },
          {
            label: '模型版本',
            value: record.model_version,
            key: 'model_version',
            span: 1,
            render: (value: string) => value ? <Text code>v{value}</Text> : null
          },
          {
            label: '集群名称',
            value: record.cluster_name,
            key: 'cluster_name',
            span: 1
          },
          {
            label: '镜像标签',
            value: record.image_tag,
            key: 'image_tag',
            span: 1,
            render: (value: string) => <Text code>{value}</Text>
          },
          {
            label: '检查点路径',
            value: record.checkpoint_path,
            key: 'checkpoint_path',
            span: 2,
            render: (value: string) => (
              <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {value}
              </Text>
            )
          },
          {
            label: 'Nonce',
            value: record.nonce,
            key: 'nonce',
            span: 2,
            render: (value: string) => <Text code>{value}</Text>
          }
        ]
      },
      {
        title: '管道配置',
        icon: <SettingOutlined />,
        fields: [
          {
            label: '管道模式',
            value: record.pipeline_mode,
            key: 'pipeline_mode',
            span: 1,
            render: (value: string) => <Text code>{value}</Text>
          },
          {
            label: 'FPS',
            value: record.fps,
            key: 'fps',
            span: 1
          },
          {
            label: '量化模式',
            value: record.quant_mode,
            key: 'quant_mode',
            span: 1,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'default'}>
                {value ? '启用' : '禁用'}
              </Tag>
            )
          },
          {
            label: '蒸馏模式',
            value: record.distill_mode,
            key: 'distill_mode',
            span: 1,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'default'}>
                {value ? '启用' : '禁用'}
              </Tag>
            )
          },
          {
            label: 'M405模式',
            value: record.m405_mode,
            key: 'm405_mode',
            span: 1,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'default'}>
                {value ? '启用' : '禁用'}
              </Tag>
            )
          },
          {
            label: 'CUDA图',
            value: record.enable_cuda_graph,
            key: 'enable_cuda_graph',
            span: 1,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'default'}>
                {value ? '启用' : '禁用'}
              </Tag>
            )
          }
        ]
      },
      {
        title: '资源分配',
        icon: <DatabaseOutlined />,
        fields: [
          {
            label: '管道并行 (PP)',
            value: record.pp,
            key: 'pp',
            span: 1
          },
          {
            label: '上下文并行 (CP)',
            value: record.cp,
            key: 'cp',
            span: 1
          },
          {
            label: '张量并行 (TP)',
            value: record.tp,
            key: 'tp',
            span: 1
          },
          {
            label: '工作进程数',
            value: record.n_workers,
            key: 'n_workers',
            span: 1
          },
          {
            label: '副本数',
            value: record.replicas,
            key: 'replicas',
            span: 1
          },
          {
            label: '任务并发数',
            value: record.task_concurrency,
            key: 'task_concurrency',
            span: 1
          },
          {
            label: 'Celery任务并发数',
            value: record.celery_task_concurrency,
            key: 'celery_task_concurrency',
            span: 1
          },
          {
            label: 'VAE存储类型',
            value: record.vae_store_type,
            key: 'vae_store_type',
            span: 1,
            render: (value: string) => <Text code>{value}</Text>
          },
          {
            label: 'T5存储类型',
            value: record.t5_store_type,
            key: 't5_store_type',
            span: 1,
            render: (value: string) => <Text code>{value}</Text>
          }
        ]
      },
      {
        title: '视频处理',
        icon: <SettingOutlined />,
        fields: [
          {
            label: '视频编码分离',
            value: record.separate_video_encode,
            key: 'separate_video_encode',
            span: 1,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'default'}>
                {value ? '启用' : '禁用'}
              </Tag>
            )
          },
          {
            label: '视频解码分离',
            value: record.separate_video_decode,
            key: 'separate_video_decode',
            span: 1,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'default'}>
                {value ? '启用' : '禁用'}
              </Tag>
            )
          },
          {
            label: 'T5编码分离',
            value: record.separate_t5_encode,
            key: 'separate_t5_encode',
            span: 1,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'default'}>
                {value ? '启用' : '禁用'}
              </Tag>
            )
          }
        ]
      }
    ];

    // Add ephemeral configuration if applicable
    if (record.ephemeral) {
      groups.push({
        title: '临时实例配置',
        icon: <ClockCircleOutlined />,
        fields: [
          {
            label: '临时实例',
            value: record.ephemeral,
            key: 'ephemeral',
            span: 1,
            render: (value: boolean) => (
              <Tag color="orange">临时实例</Tag>
            )
          },
          {
            label: '最小运行时间',
            value: record.ephemeral_min_period_seconds,
            key: 'ephemeral_min_period_seconds',
            span: 1,
            render: (value: any) => value ? `${value} 秒` : null
          },
          {
            label: 'ephemeral来源',
            value: record.ephemeral_from,
            key: 'ephemeral_from',
            span: 1
          },
          {
            label: 'ephemeral目标',
            value: record.ephemeral_to,
            key: 'ephemeral_to',
            span: 1
          }
        ]
      });
    }

    // Add metadata if requested
    if (showMetadata) {
      groups.push({
        title: '元数据',
        icon: <InfoCircleOutlined />,
        fields: [
          {
            label: '历史记录ID',
            value: record.history_id,
            key: 'history_id',
            span: 1,
            render: (value: any) => <Text code>#{value}</Text>
          },
          {
            label: '原始实例ID',
            value: record.original_id,
            key: 'original_id',
            span: 1,
            render: (value: any) => <Text code>#{value}</Text>
          },
          {
            label: '创建时间',
            value: record.created_at,
            key: 'created_at',
            span: 1,
            render: (value: string) => value ? (
              <Space direction="vertical" size={0}>
                <Text>{HistoryService.formatTimestamp(value)}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({HistoryService.getRelativeTime(value)})
                </Text>
              </Space>
            ) : null
          },
          {
            label: '更新时间',
            value: record.updated_at,
            key: 'updated_at',
            span: 1,
            render: (value: string) => value ? (
              <Space direction="vertical" size={0}>
                <Text>{HistoryService.formatTimestamp(value)}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({HistoryService.getRelativeTime(value)})
                </Text>
              </Space>
            ) : null
          }
        ]
      });
    }

    return groups;
  }, [record, showMetadata, operationDisplay]);

  // Render header
  const renderHeader = () => (
    <Space>
      <EyeOutlined />
      <span>{title || '历史记录详情'}</span>
      <Tag color={operationDisplay.color}>
        {operationDisplay.label}
      </Tag>
      <Text type="secondary">
        #{record.history_id}
      </Text>
    </Space>
  );

  // Render actions
  const renderActions = () => (
    <Space>
      {actions}
      <Tooltip title="复制记录">
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopyRecord}
        />
      </Tooltip>
      <Tooltip title="导出记录">
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          loading={exportLoading}
          onClick={handleExportRecord}
        />
      </Tooltip>
    </Space>
  );

  // Render content
  const renderContent = () => (
    <div>
      {/* Operation Summary */}
      <Alert
        message={
          <Space>
            <span>操作类型: {operationDisplay.label}</span>
            <Divider type="vertical" />
            <span>实例: {record.name}</span>
            <Divider type="vertical" />
            <span>时间: {HistoryService.getRelativeTime(record.operation_timestamp)}</span>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Field Groups */}
      {fieldGroups.map((group, index) => (
        <FieldGroup
          key={group.title}
          title={group.title}
          icon={group.icon}
          fields={group.fields}
          compact={compact}
          searchTerm={searchTerm}
          searchHighlight={searchHighlight}
          defaultCollapsed={index > 2} // Collapse less important groups by default
        />
      ))}

      {/* Complex Data Sections */}
      {(record.priorities && record.priorities.length > 0) && (
        <JsonViewer
          data={record.priorities}
          title="优先级配置"
          compact={compact}
          searchTerm={searchTerm}
          searchHighlight={searchHighlight}
        />
      )}

      {(record.envs && record.envs.length > 0) && (
        <JsonViewer
          data={record.envs}
          title="环境变量"
          compact={compact}
          searchTerm={searchTerm}
          searchHighlight={searchHighlight}
        />
      )}

      {/* Raw Record Data */}
      <Collapse ghost style={{ marginTop: 16 }}>
        <Panel
          header={
            <Space>
              <FileTextOutlined />
              <span>完整记录数据</span>
              <Text type="secondary">(JSON格式)</Text>
            </Space>
          }
          key="raw-data"
        >
          <JsonViewer
            data={record}
            title="完整历史记录"
            compact={false}
            searchTerm={searchTerm}
            searchHighlight={searchHighlight}
          />
        </Panel>
      </Collapse>
    </div>
  );

  // Render in drawer mode
  if (drawerMode) {
    return (
      <Drawer
        title={renderHeader()}
        placement="right"
        width={isMobile ? '100%' : isTablet ? '80%' : '60%'}
        open={visible}
        onClose={onClose}
        extra={renderActions()}
        styles={{
          body: {
            padding: compact ? '16px' : '24px'
          }
        }}
      >
        {renderContent()}
      </Drawer>
    );
  }

  // Render as card
  return (
    <Card
      title={renderHeader()}
      extra={renderActions()}
      size={compact ? 'small' : 'default'}
      style={{ width: '100%' }}
      styles={{
        body: {
          padding: compact ? '16px' : '24px'
        }
      }}
    >
      {renderContent()}
    </Card>
  );
};

export default HistoryDetail;