/**
 * Enhanced Feedback System Component
 * Comprehensive user feedback with success, error, and progress notifications
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  message, 
  notification, 
  Modal, 
  Progress, 
  Card, 
  Typography, 
  Space, 
  Button,
  Alert,
  Tag,
  Tooltip
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  BugOutlined,
  CopyOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNotification } from './NotificationSystem';

const { Text, Paragraph } = Typography;

/**
 * Feedback types
 */
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'progress';

/**
 * Feedback severity levels
 */
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Feedback configuration
 */
export interface FeedbackConfig {
  type: FeedbackType;
  severity?: FeedbackSeverity;
  title?: string;
  message: string;
  description?: string;
  duration?: number;
  showProgress?: boolean;
  progress?: number;
  showActions?: boolean;
  actions?: FeedbackAction[];
  persistent?: boolean;
  closable?: boolean;
  showDetails?: boolean;
  details?: any;
  onClose?: () => void;
}

/**
 * Feedback action
 */
export interface FeedbackAction {
  label: string;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Operation feedback configuration
 */
export interface OperationFeedback {
  loading?: {
    message: string;
    description?: string;
    showProgress?: boolean;
  };
  success?: {
    message: string;
    description?: string;
    duration?: number;
  };
  error?: {
    message: string;
    description?: string;
    showRetry?: boolean;
    showDetails?: boolean;
  };
}

/**
 * Enhanced feedback component
 */
export const FeedbackDisplay: React.FC<FeedbackConfig> = ({
  type,
  severity = 'medium',
  title,
  message,
  description,
  duration = 4.5,
  showProgress = false,
  progress,
  showActions = false,
  actions = [],
  persistent = false,
  closable = true,
  showDetails = false,
  details,
  onClose
}) => {
  const [visible, setVisible] = useState(true);
  const [currentProgress, setCurrentProgress] = useState(progress || 0);

  useEffect(() => {
    if (showProgress && typeof progress === 'number') {
      setCurrentProgress(progress);
    }
  }, [progress, showProgress]);

  useEffect(() => {
    if (!persistent && duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [persistent, duration, type, onClose]);

  const getIcon = () => {
    const iconStyle = { fontSize: 16 };
    
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'loading':
      case 'progress':
        return <LoadingOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      default:
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return '#ff4d4f';
      case 'high':
        return '#fa8c16';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#1890ff';
      default:
        return '#1890ff';
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Alert
      type={type === 'loading' || type === 'progress' ? 'info' : type}
      showIcon
      icon={getIcon()}
      message={
        <Space>
          {title || message}
          {severity !== 'medium' && (
            <Tag color={getSeverityColor()} size="small">
              {severity.toUpperCase()}
            </Tag>
          )}
        </Space>
      }
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          {description && <Text>{description}</Text>}
          
          {showProgress && (
            <Progress 
              percent={currentProgress} 
              size="small"
              strokeColor={getSeverityColor()}
              showInfo={type !== 'loading'}
            />
          )}
          
          {showActions && actions.length > 0 && (
            <Space>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  type={action.type || 'default'}
                  size="small"
                  icon={action.icon}
                  loading={action.loading}
                  disabled={action.disabled}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          )}
          
          {showDetails && details && (
            <details>
              <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                查看详情
              </summary>
              <pre style={{ 
                marginTop: 8, 
                padding: 8, 
                background: '#f5f5f5', 
                borderRadius: 4,
                fontSize: 12,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
              </pre>
            </details>
          )}
        </Space>
      }
      closable={closable}
      onClose={() => {
        setVisible(false);
        onClose?.();
      }}
      style={{ marginBottom: 16 }}
    />
  );
};

/**
 * Operation feedback hook
 */
export const useOperationFeedback = () => {
  const { showSuccess, showError, showLoading, updateLoadingSuccess, updateLoadingError } = useNotification();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const showOperationFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    feedback: OperationFeedback,
    options?: {
      showProgress?: boolean;
      onProgress?: (progress: number) => void;
      onRetry?: () => Promise<T>;
    }
  ): Promise<T> => {
    const { showProgress = false, onProgress, onRetry } = options || {};
    
    // Show loading state
    const key = showLoading(
      feedback.loading?.message || '处理中...',
      {
        description: feedback.loading?.description,
        duration: 0
      }
    );
    setLoadingKey(key);

    try {
      // Execute operation with progress tracking
      let result: T;
      
      if (showProgress && onProgress) {
        // Simulate progress for demonstration
        const progressInterval = setInterval(() => {
          const progress = Math.min(90, Math.random() * 100);
          onProgress(progress);
        }, 500);

        try {
          result = await operation();
          clearInterval(progressInterval);
          onProgress(100);
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      } else {
        result = await operation();
      }

      // Show success feedback
      updateLoadingSuccess(
        key,
        feedback.success?.message || '操作成功',
        {
          description: feedback.success?.description,
          duration: feedback.success?.duration
        }
      );

      setLoadingKey(null);
      return result;

    } catch (error) {
      // Show error feedback with retry option
      const errorMessage = feedback.error?.message || '操作失败';
      const errorDescription = feedback.error?.description || 
        (error instanceof Error ? error.message : String(error));

      if (feedback.error?.showRetry && onRetry) {
        updateLoadingError(key, errorMessage, {
          description: (
            <Space direction="vertical">
              <Text>{errorDescription}</Text>
              <Button 
                type="primary" 
                size="small"
                onClick={async () => {
                  try {
                    const retryResult = await showOperationFeedback(onRetry, feedback, options);
                    return retryResult;
                  } catch (retryError) {
                    console.error('Retry failed:', retryError);
                  }
                }}
              >
                重试
              </Button>
            </Space>
          ),
          duration: 0
        });
      } else {
        updateLoadingError(key, errorMessage, {
          description: errorDescription,
          duration: feedback.error?.showDetails ? 0 : 4.5
        });
      }

      setLoadingKey(null);
      throw error;
    }
  }, [showSuccess, showError, showLoading, updateLoadingSuccess, updateLoadingError]);

  const cancelOperation = useCallback(() => {
    if (loadingKey) {
      notification.destroy(loadingKey);
      setLoadingKey(null);
    }
  }, [loadingKey]);

  return {
    showOperationFeedback,
    cancelOperation,
    isLoading: !!loadingKey
  };
};

/**
 * Batch operation feedback component
 */
export const BatchOperationFeedback: React.FC<{
  operations: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    progress?: number;
    error?: string;
  }>;
  onRetry?: (id: string) => void;
  onCancel?: () => void;
}> = ({ operations, onRetry, onCancel }) => {
  const totalOperations = operations.length;
  const completedOperations = operations.filter(op => 
    op.status === 'success' || op.status === 'error'
  ).length;
  const successfulOperations = operations.filter(op => op.status === 'success').length;
  const failedOperations = operations.filter(op => op.status === 'error').length;
  const overallProgress = Math.round((completedOperations / totalOperations) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  return (
    <Card title="批量操作进度" style={{ maxWidth: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>总体进度</Text>
          <Progress 
            percent={overallProgress} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary">
            {completedOperations} / {totalOperations} 已完成
            {successfulOperations > 0 && ` (${successfulOperations} 成功)`}
            {failedOperations > 0 && ` (${failedOperations} 失败)`}
          </Text>
        </div>

        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {operations.map(operation => (
            <div key={operation.id} style={{ 
              padding: '8px 0', 
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Space>
                {getStatusIcon(operation.status)}
                <Text>{operation.name}</Text>
                {operation.status === 'running' && operation.progress && (
                  <Text type="secondary">({operation.progress}%)</Text>
                )}
              </Space>
              
              {operation.status === 'error' && (
                <Space>
                  {operation.error && (
                    <Tooltip title={operation.error}>
                      <BugOutlined style={{ color: '#ff4d4f' }} />
                    </Tooltip>
                  )}
                  {onRetry && (
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<ReloadOutlined />}
                      onClick={() => onRetry(operation.id)}
                    >
                      重试
                    </Button>
                  )}
                </Space>
              )}
            </div>
          ))}
        </div>

        {onCancel && completedOperations < totalOperations && (
          <Button onClick={onCancel} style={{ width: '100%' }}>
            取消剩余操作
          </Button>
        )}
      </Space>
    </Card>
  );
};

/**
 * Success feedback component
 */
export const SuccessFeedback: React.FC<{
  title?: string;
  message: string;
  description?: string;
  showConfetti?: boolean;
  actions?: FeedbackAction[];
  onClose?: () => void;
}> = ({ 
  title = '操作成功', 
  message, 
  description, 
  showConfetti = false,
  actions = [],
  onClose 
}) => {
  useEffect(() => {
    if (showConfetti) {
      // Add confetti effect (would need a confetti library)
      console.log('🎉 Success with confetti!');
    }
  }, [showConfetti]);

  return (
    <FeedbackDisplay
      type="success"
      title={title}
      message={message}
      description={description}
      showActions={actions.length > 0}
      actions={actions}
      onClose={onClose}
    />
  );
};

/**
 * Error feedback component with recovery options
 */
export const ErrorFeedback: React.FC<{
  title?: string;
  message: string;
  error?: Error | string;
  showRetry?: boolean;
  showReport?: boolean;
  onRetry?: () => void;
  onReport?: () => void;
  onClose?: () => void;
}> = ({ 
  title = '操作失败', 
  message, 
  error,
  showRetry = false,
  showReport = false,
  onRetry,
  onReport,
  onClose 
}) => {
  const actions: FeedbackAction[] = [];

  if (showRetry && onRetry) {
    actions.push({
      label: '重试',
      type: 'primary',
      icon: <ReloadOutlined />,
      onClick: onRetry
    });
  }

  if (showReport && onReport) {
    actions.push({
      label: '报告问题',
      icon: <BugOutlined />,
      onClick: onReport
    });
  }

  const errorDetails = error ? (typeof error === 'string' ? error : error.message) : undefined;

  return (
    <FeedbackDisplay
      type="error"
      severity="high"
      title={title}
      message={message}
      description={errorDetails}
      showActions={actions.length > 0}
      actions={actions}
      showDetails={!!error}
      details={error}
      persistent={true}
      onClose={onClose}
    />
  );
};

export default {
  FeedbackDisplay,
  useOperationFeedback,
  BatchOperationFeedback,
  SuccessFeedback,
  ErrorFeedback
};