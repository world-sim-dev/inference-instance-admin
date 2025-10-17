/**
 * ErrorDisplay Component
 * Enhanced error display with detailed error information and user guidance
 */

import React, { useState, useCallback } from 'react';
import { 
  Alert, 
  Button, 
  Collapse, 
  Typography, 
  Space, 
  Tag, 
  Divider,
  List,
  Card
} from 'antd';
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  BugOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { classifyError, createUserErrorMessage, type StructuredError, ErrorSeverity, ErrorType } from '../../utils/errorUtils';
import { useNotification } from './NotificationSystem';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Props for ErrorDisplay component
 */
export interface ErrorDisplayProps {
  error: any;
  title?: string;
  showDetails?: boolean;
  showRetry?: boolean;
  showDismiss?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Props for FormErrorDisplay component
 */
export interface FormErrorDisplayProps {
  errors: Record<string, string[]>;
  title?: string;
  showFieldNames?: boolean;
  className?: string;
}

/**
 * Props for ValidationErrorDisplay component
 */
export interface ValidationErrorDisplayProps {
  validationErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  title?: string;
  onFieldFocus?: (field: string) => void;
}

/**
 * Get alert type based on error severity
 */
const getAlertType = (severity: ErrorSeverity): 'error' | 'warning' | 'info' => {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.LOW:
    default:
      return 'info';
  }
};

/**
 * Get error type color
 */
const getErrorTypeColor = (type: ErrorType): string => {
  const colors: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: 'red',
    [ErrorType.VALIDATION]: 'orange',
    [ErrorType.AUTHENTICATION]: 'purple',
    [ErrorType.AUTHORIZATION]: 'purple',
    [ErrorType.NOT_FOUND]: 'blue',
    [ErrorType.SERVER]: 'red',
    [ErrorType.CLIENT]: 'orange',
    [ErrorType.TIMEOUT]: 'yellow',
    [ErrorType.UNKNOWN]: 'gray'
  };
  
  return colors[type] || 'gray';
};

/**
 * Get error type label
 */
const getErrorTypeLabel = (type: ErrorType): string => {
  const labels: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: '网络错误',
    [ErrorType.VALIDATION]: '验证错误',
    [ErrorType.AUTHENTICATION]: '认证错误',
    [ErrorType.AUTHORIZATION]: '权限错误',
    [ErrorType.NOT_FOUND]: '资源不存在',
    [ErrorType.SERVER]: '服务器错误',
    [ErrorType.CLIENT]: '客户端错误',
    [ErrorType.TIMEOUT]: '超时错误',
    [ErrorType.UNKNOWN]: '未知错误'
  };
  
  return labels[type] || '未知错误';
};

/**
 * Main ErrorDisplay component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  showDetails = false,
  showRetry = false,
  showDismiss = false,
  onRetry,
  onDismiss,
  className,
  style
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const { showToast } = useNotification();
  
  if (!error) {
    return null;
  }
  
  const structuredError = classifyError(error);
  const userMessage = createUserErrorMessage(structuredError);
  const alertType = getAlertType(structuredError.severity);
  
  const handleCopyError = useCallback(() => {
    const errorText = JSON.stringify({
      message: structuredError.message,
      type: structuredError.type,
      timestamp: structuredError.timestamp,
      details: structuredError.details
    }, null, 2);
    
    navigator.clipboard.writeText(errorText).then(() => {
      showToast('success', '错误信息已复制到剪贴板');
    }).catch(() => {
      showToast('error', '复制失败');
    });
  }, [structuredError, showToast]);
  
  const actionButtons = (
    <Space>
      {showRetry && onRetry && structuredError.retryable && (
        <Button 
          size="small" 
          icon={<ReloadOutlined />} 
          onClick={onRetry}
          type="primary"
        >
          重试
        </Button>
      )}
      {showDetails && (
        <Button 
          size="small" 
          icon={<BugOutlined />} 
          onClick={() => setShowFullDetails(!showFullDetails)}
        >
          {showFullDetails ? '隐藏详情' : '查看详情'}
        </Button>
      )}
      <Button 
        size="small" 
        icon={<CopyOutlined />} 
        onClick={handleCopyError}
      >
        复制错误
      </Button>
      {showDismiss && onDismiss && (
        <Button 
          size="small" 
          icon={<CloseOutlined />} 
          onClick={onDismiss}
        >
          关闭
        </Button>
      )}
    </Space>
  );
  
  return (
    <div className={className} style={style}>
      <Alert
        type={alertType}
        showIcon
        message={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Space>
                <Text strong>{title || userMessage.title}</Text>
                <Tag color={getErrorTypeColor(structuredError.type)}>
                  {getErrorTypeLabel(structuredError.type)}
                </Tag>
                {structuredError.retryable && (
                  <Tag color="green">可重试</Tag>
                )}
              </Space>
            </div>
            
            <Text>{userMessage.message}</Text>
            
            {userMessage.suggestions.length > 0 && (
              <div>
                <Text type="secondary">建议解决方案：</Text>
                <List
                  size="small"
                  dataSource={userMessage.suggestions}
                  renderItem={(suggestion, index) => (
                    <List.Item style={{ padding: '2px 0' }}>
                      <Text type="secondary">• {suggestion}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Space>
        }
        action={actionButtons}
      />
      
      {showFullDetails && (
        <Card 
          size="small" 
          style={{ marginTop: 8 }}
          title={
            <Space>
              <InfoCircleOutlined />
              <Text>错误详情</Text>
            </Space>
          }
        >
          <Collapse ghost>
            <Panel header="基本信息" key="basic">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div><Text strong>错误类型：</Text>{structuredError.type}</div>
                <div><Text strong>严重程度：</Text>{structuredError.severity}</div>
                <div><Text strong>发生时间：</Text>{structuredError.timestamp.toLocaleString()}</div>
                <div><Text strong>可重试：</Text>{structuredError.retryable ? '是' : '否'}</div>
                {structuredError.code && (
                  <div><Text strong>错误代码：</Text>{structuredError.code}</div>
                )}
              </Space>
            </Panel>
            
            <Panel header="错误消息" key="message">
              <Paragraph copyable={{ text: structuredError.message }}>
                <Text code>{structuredError.message}</Text>
              </Paragraph>
            </Panel>
            
            {structuredError.details && (
              <Panel header="详细信息" key="details">
                <Paragraph copyable={{ text: JSON.stringify(structuredError.details, null, 2) }}>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(structuredError.details, null, 2)}
                  </pre>
                </Paragraph>
              </Panel>
            )}
          </Collapse>
        </Card>
      )}
    </div>
  );
};

/**
 * FormErrorDisplay component for form validation errors
 */
export const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
  errors,
  title = '表单验证错误',
  showFieldNames = true,
  className
}) => {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }
  
  const errorList = Object.entries(errors).flatMap(([field, messages]) =>
    messages.map(message => ({ field, message }))
  );
  
  return (
    <Alert
      type="error"
      showIcon
      className={className}
      message={title}
      description={
        <List
          size="small"
          dataSource={errorList}
          renderItem={({ field, message }) => (
            <List.Item style={{ padding: '2px 0' }}>
              <Text>
                {showFieldNames && <Text strong>{field}: </Text>}
                {message}
              </Text>
            </List.Item>
          )}
        />
      }
    />
  );
};

/**
 * ValidationErrorDisplay component for detailed validation errors
 */
export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  validationErrors,
  title = '数据验证失败',
  onFieldFocus
}) => {
  if (!validationErrors || validationErrors.length === 0) {
    return null;
  }
  
  return (
    <Alert
      type="warning"
      showIcon
      message={title}
      description={
        <List
          size="small"
          dataSource={validationErrors}
          renderItem={({ field, message, value }) => (
            <List.Item 
              style={{ padding: '4px 0' }}
              actions={onFieldFocus ? [
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => onFieldFocus(field)}
                >
                  定位字段
                </Button>
              ] : undefined}
            >
              <Space direction="vertical" size={0}>
                <Text>
                  <Text strong>{field}:</Text> {message}
                </Text>
                {value !== undefined && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    当前值: {JSON.stringify(value)}
                  </Text>
                )}
              </Space>
            </List.Item>
          )}
        />
      }
    />
  );
};

/**
 * NetworkErrorDisplay component for network-specific errors
 */
export const NetworkErrorDisplay: React.FC<{
  error: any;
  onRetry?: () => void;
  showOfflineStatus?: boolean;
}> = ({ error, onRetry, showOfflineStatus = true }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const structuredError = classifyError(error);
  
  if (structuredError.type !== ErrorType.NETWORK) {
    return <ErrorDisplay error={error} onRetry={onRetry} />;
  }
  
  return (
    <Alert
      type="error"
      showIcon
      message={
        <Space>
          <Text strong>网络连接失败</Text>
          {showOfflineStatus && !isOnline && (
            <Tag color="red">离线状态</Tag>
          )}
        </Space>
      }
      description={
        <Space direction="vertical" size="small">
          <Text>{structuredError.userMessage}</Text>
          {!isOnline && (
            <Text type="warning">
              检测到您当前处于离线状态，请检查网络连接后重试。
            </Text>
          )}
        </Space>
      }
      action={
        onRetry && (
          <Button 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={onRetry}
            disabled={!isOnline}
          >
            重试
          </Button>
        )
      }
    />
  );
};

export default ErrorDisplay;