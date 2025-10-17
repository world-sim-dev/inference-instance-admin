import React, { useState } from 'react';
import { Typography, Space, Tag, Button, Tooltip, Row, Col } from 'antd';
import { 
  MinusCircleOutlined, 
  PlusCircleOutlined, 
  EditOutlined,
  ArrowRightOutlined,
  ExpandOutlined,
  CompressOutlined,
  CopyOutlined
} from '@ant-design/icons';
import type { HistoryComparison } from '../../types/history';

const { Text } = Typography;

export interface FieldDiffProps {
  /** Field comparison data */
  comparison: HistoryComparison;
  /** Whether to show unchanged fields */
  showUnchanged?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Side-by-side comparison mode */
  sideBySide?: boolean;
  /** Unified comparison mode */
  unified?: boolean;
}

/**
 * FieldDiff Component
 * 
 * Displays the difference between old and new values for a single field.
 * Features:
 * - Visual indicators for added, removed, and changed values
 * - JSON formatting for complex objects
 * - Expandable view for large values
 * - Type-aware value rendering
 */
export const FieldDiff: React.FC<FieldDiffProps> = ({
  comparison,
  showUnchanged = false,
  compact = false,
  sideBySide = false,
  unified = false
}) => {
  const { field, oldValue, newValue, changed } = comparison;

  // State for expanded JSON views - must be called before any early returns
  const [expandedJson, setExpandedJson] = useState<{ [key: string]: boolean }>({});
  const [isLargeObject, setIsLargeObject] = useState(false);

  // Don't render unchanged fields unless explicitly requested
  if (!changed && !showUnchanged) {
    return null;
  }

  // Format field name for display
  const formatFieldName = (fieldName: string): string => {
    const fieldLabels: Record<string, string> = {
      name: '实例名称',
      model_name: '模型名称',
      model_version: '模型版本',
      cluster_name: '集群名称',
      image_tag: '镜像标签',
      description: '描述',
      status: '状态',
      pipeline_mode: '管道模式',
      quant_mode: '量化模式',
      distill_mode: '蒸馏模式',
      m405_mode: 'M405模式',
      fps: 'FPS',
      checkpoint_path: '检查点路径',
      nonce: 'Nonce',
      pp: 'Pipeline Parallelism',
      cp: 'Context Parallelism',
      tp: 'Tensor Parallelism',
      n_workers: '工作进程数',
      replicas: '副本数',
      priorities: '优先级列表',
      envs: '环境变量',
      separate_video_encode: '独立视频编码',
      separate_video_decode: '独立视频解码',
      separate_t5_encode: '独立T5编码',
      ephemeral: '临时实例',
      ephemeral_min_period_seconds: '最小周期(秒)',
      ephemeral_to: '结束时间',
      ephemeral_from: '开始时间',
      vae_store_type: 'VAE存储类型',
      t5_store_type: 'T5存储类型',
      enable_cuda_graph: '启用CUDA图',
      task_concurrency: '任务并发数',
      celery_task_concurrency: 'Celery任务并发数'
    };
    
    return fieldLabels[fieldName] || fieldName;
  };

  // Toggle JSON expansion
  const toggleJsonExpansion = (key: string) => {
    setExpandedJson(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Copy JSON to clipboard
  const copyToClipboard = (value: unknown) => {
    const jsonString = JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      // Could add a toast notification here
    });
  };

  // Performance optimization: Check if object is large
  const checkObjectSize = (value: unknown): boolean => {
    try {
      const jsonString = JSON.stringify(value);
      return jsonString.length > 5000; // Consider objects > 5KB as large
    } catch {
      return false;
    }
  };

  // Optimized JSON formatting with lazy loading for large objects
  const formatJsonValue = (value: unknown, key: string, isExpanded: boolean = false, isOldValue: boolean = false): React.ReactNode => {
    const jsonString = JSON.stringify(value, null, 2);
    const isLarge = jsonString.length > 200;
    const isVeryLarge = jsonString.length > 5000;
    const shouldTruncate = !isExpanded && isLarge;
    
    // For very large objects, use lazy loading
    if (isVeryLarge && !isExpanded) {
      return (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 8 
          }}>
            <Space>
              <Button
                size="small"
                type="text"
                icon={<ExpandOutlined />}
                onClick={() => toggleJsonExpansion(key)}
              >
                展开大型对象 ({Math.round(jsonString.length / 1024)}KB)
              </Button>
              <Tooltip title="复制到剪贴板">
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(value)}
                />
              </Tooltip>
            </Space>
          </div>
          <div style={{ 
            background: isOldValue ? '#fff2f0' : '#f6ffed', 
            padding: '12px', 
            borderRadius: '6px',
            border: isOldValue ? '1px solid #ffccc7' : '1px solid #b7eb8f',
            borderLeft: isOldValue ? '4px solid #ff4d4f' : '4px solid #52c41a',
            textAlign: 'center',
            color: '#8c8c8c'
          }}>
            大型JSON对象 - 点击展开查看详情
          </div>
        </div>
      );
    }
    
    const displayValue = shouldTruncate 
      ? jsonString.substring(0, 200) + '...' 
      : jsonString;

    // Enhanced syntax highlighting for JSON
    const highlightJson = (json: string): React.ReactNode => {
      // More comprehensive JSON syntax highlighting
      const highlighted = json
        .replace(/"([^"]+)":/g, '<span style="color: #d73a49; font-weight: bold;">"$1":</span>')
        .replace(/: "([^"]+)"/g, ': <span style="color: #032f62;">"$1"</span>')
        .replace(/: (\d+\.?\d*)/g, ': <span style="color: #005cc5;">$1</span>')
        .replace(/: (true|false)/g, ': <span style="color: #d73a49;">$1</span>')
        .replace(/: null/g, ': <span style="color: #6f42c1;">null</span>')
        .replace(/(\{|\}|\[|\])/g, '<span style="color: #24292e; font-weight: bold;">$1</span>')
        .replace(/,$/gm, '<span style="color: #24292e;">,</span>');
      
      return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
    };

    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8 
        }}>
          <Space>
            {isLarge && (
              <Button
                size="small"
                type="text"
                icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => toggleJsonExpansion(key)}
              >
                {isExpanded ? '折叠' : '展开'}
              </Button>
            )}
            <Tooltip title="复制到剪贴板">
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(value)}
              />
            </Tooltip>
            {isVeryLarge && (
              <Tag color="orange" size="small">
                大型对象 ({Math.round(jsonString.length / 1024)}KB)
              </Tag>
            )}
          </Space>
        </div>
        <pre style={{ 
          background: isOldValue ? '#fff2f0' : '#f6ffed', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '12px',
          margin: 0,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          lineHeight: '1.4',
          overflow: 'auto',
          maxHeight: isExpanded ? (isVeryLarge ? '600px' : 'none') : '300px',
          border: isOldValue ? '1px solid #ffccc7' : '1px solid #b7eb8f',
          borderLeft: isOldValue ? '4px solid #ff4d4f' : '4px solid #52c41a'
        }}>
          {highlightJson(displayValue)}
        </pre>
      </div>
    );
  };

  // Format value for display with enhanced JSON support
  const formatValue = (value: unknown, suffix: string = '', isOldValue: boolean = false): React.ReactNode => {
    if (value === null || value === undefined) {
      return <Text type="secondary" italic>null</Text>;
    }

    if (typeof value === 'boolean') {
      return (
        <Tag color={value ? 'success' : 'default'}>
          {value ? '是' : '否'}
        </Tag>
      );
    }

    if (typeof value === 'string') {
      if (value === '') {
        return <Text type="secondary" italic>(空字符串)</Text>;
      }
      
      // Check if string looks like JSON
      if ((value.startsWith('{') && value.endsWith('}')) || 
          (value.startsWith('[') && value.endsWith(']'))) {
        try {
          const parsed = JSON.parse(value);
          const key = `${field}_${suffix}_json`;
          return formatJsonValue(parsed, key, expandedJson[key], isOldValue);
        } catch {
          // Not valid JSON, treat as regular string
        }
      }
      
      return <Text code style={{ 
        backgroundColor: isOldValue ? '#fff2f0' : '#f6ffed',
        borderLeft: isOldValue ? '3px solid #ff4d4f' : '3px solid #52c41a',
        paddingLeft: '8px'
      }}>{value}</Text>;
    }

    if (typeof value === 'number') {
      return <Text code style={{ 
        backgroundColor: isOldValue ? '#fff2f0' : '#f6ffed',
        borderLeft: isOldValue ? '3px solid #ff4d4f' : '3px solid #52c41a',
        paddingLeft: '8px'
      }}>{value}</Text>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <Text type="secondary" italic>(空数组)</Text>;
      }
      
      // Handle simple arrays (all strings or numbers)
      if (value.every(item => typeof item === 'string' || typeof item === 'number')) {
        if (value.length <= 5) {
          return (
            <Space wrap>
              {value.map((item, index) => (
                <Tag key={index} color={isOldValue ? 'red' : 'green'}>
                  {String(item)}
                </Tag>
              ))}
            </Space>
          );
        }
      }
      
      // Handle complex arrays or large simple arrays
      const key = `${field}_${suffix}_array`;
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag color={isOldValue ? 'red' : 'green'}>数组 ({value.length} 项)</Tag>
          </div>
          {formatJsonValue(value, key, expandedJson[key], isOldValue)}
        </div>
      );
    }

    if (typeof value === 'object') {
      const key = `${field}_${suffix}_object`;
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag color={isOldValue ? 'red' : 'green'}>对象</Tag>
          </div>
          {formatJsonValue(value, key, expandedJson[key], isOldValue)}
        </div>
      );
    }

    return <Text style={{ 
      backgroundColor: isOldValue ? '#fff2f0' : '#f6ffed',
      borderLeft: isOldValue ? '3px solid #ff4d4f' : '3px solid #52c41a',
      paddingLeft: '8px'
    }}>{String(value)}</Text>;
  };

  // Get change indicator
  const getChangeIndicator = () => {
    if (!changed) {
      return null;
    }

    if (oldValue === null || oldValue === undefined) {
      return <PlusCircleOutlined style={{ color: '#52c41a' }} />;
    }

    if (newValue === null || newValue === undefined) {
      return <MinusCircleOutlined style={{ color: '#ff4d4f' }} />;
    }

    return <EditOutlined style={{ color: '#faad14' }} />;
  };

  // Render compact view
  if (compact) {
    return (
      <div style={{ 
        padding: '8px 12px',
        border: changed ? '1px solid #d9d9d9' : '1px solid #f0f0f0',
        borderRadius: '4px',
        backgroundColor: changed ? '#fafafa' : '#f9f9f9'
      }}>
        <Space align="start" style={{ width: '100%' }}>
          {getChangeIndicator()}
          <div style={{ flex: 1 }}>
            <Text strong>{formatFieldName(field)}</Text>
            {changed ? (
              <div style={{ marginTop: 4 }}>
                <Space align="center">
                  {formatValue(oldValue, 'old', true)}
                  <ArrowRightOutlined style={{ color: '#8c8c8c' }} />
                  {formatValue(newValue, 'new', false)}
                </Space>
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                {formatValue(newValue, 'current', false)}
              </div>
            )}
          </div>
        </Space>
      </div>
    );
  }

  // Render unified view (Git-style diff)
  if (unified && changed) {
    return (
      <div style={{ 
        padding: '16px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        backgroundColor: '#fafafa',
        marginBottom: '8px'
      }}>
        <div style={{ marginBottom: 12 }}>
          <Space>
            {getChangeIndicator()}
            <Text strong>{formatFieldName(field)}</Text>
            <Tag color="blue" size="small">统一视图</Tag>
          </Space>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f8f8',
          border: '1px solid #e1e4e8',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {/* Old value with deletion styling */}
          <div style={{ 
            backgroundColor: '#ffeef0',
            borderLeft: '4px solid #ff4d4f',
            padding: '8px 12px',
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute',
              left: '8px',
              top: '8px',
              color: '#ff4d4f',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              -
            </div>
            <div style={{ marginLeft: '16px' }}>
              {formatValue(oldValue, 'old', true)}
            </div>
          </div>
          
          {/* New value with addition styling */}
          <div style={{ 
            backgroundColor: '#e6ffed',
            borderLeft: '4px solid #52c41a',
            padding: '8px 12px',
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute',
              left: '8px',
              top: '8px',
              color: '#52c41a',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              +
            </div>
            <div style={{ marginLeft: '16px' }}>
              {formatValue(newValue, 'new', false)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render side-by-side view
  if (sideBySide && changed) {
    return (
      <div style={{ 
        padding: '16px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        backgroundColor: '#fafafa',
        marginBottom: '8px'
      }}>
        <div style={{ marginBottom: 12 }}>
          <Space>
            {getChangeIndicator()}
            <Text strong>{formatFieldName(field)}</Text>
            <Tag color="purple" size="small">并排对比</Tag>
          </Space>
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ 
              padding: '12px',
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '4px',
              borderLeft: '4px solid #ff4d4f'
            }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" strong>原值</Text>
              </div>
              {formatValue(oldValue, 'old', true)}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ 
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '4px',
              borderLeft: '4px solid #52c41a'
            }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" strong>新值</Text>
              </div>
              {formatValue(newValue, 'new', false)}
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  // Render full view
  return (
    <div style={{ 
      padding: '16px',
      border: changed ? '1px solid #d9d9d9' : '1px solid #f0f0f0',
      borderRadius: '6px',
      backgroundColor: changed ? '#fafafa' : '#f9f9f9',
      marginBottom: '8px'
    }}>
      <Space align="start" style={{ width: '100%' }}>
        {getChangeIndicator()}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>{formatFieldName(field)}</Text>
            {!changed && (
              <Tag color="default" style={{ marginLeft: 8 }}>
                未变更
              </Tag>
            )}
          </div>
          
          {changed ? (
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">原值:</Text>
                <div style={{ marginTop: 4, marginLeft: 16 }}>
                  {formatValue(oldValue, 'old', true)}
                </div>
              </div>
              
              <div>
                <Text type="secondary">新值:</Text>
                <div style={{ marginTop: 4, marginLeft: 16 }}>
                  {formatValue(newValue, 'new', false)}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Text type="secondary">值:</Text>
              <div style={{ marginTop: 4, marginLeft: 16 }}>
                {formatValue(newValue, 'current', false)}
              </div>
            </div>
          )}
        </div>
      </Space>
    </div>
  );
};