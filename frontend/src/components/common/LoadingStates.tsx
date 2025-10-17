/**
 * Enhanced Loading States Component
 * Comprehensive loading states with progress indicators and user feedback
 */

import React, { useEffect, useState } from 'react';
import { 
  Spin, 
  Progress, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Result,
  Skeleton,
  Alert
} from 'antd';
import { 
  LoadingOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { SkeletonLoader } from './SkeletonLoader';

const { Text, Title } = Typography;

/**
 * Loading state types
 */
export type LoadingStateType = 
  | 'idle' 
  | 'loading' 
  | 'success' 
  | 'error' 
  | 'timeout' 
  | 'retrying';

/**
 * Loading configuration
 */
export interface LoadingConfig {
  showProgress?: boolean;
  showElapsedTime?: boolean;
  showCancelButton?: boolean;
  showRetryButton?: boolean;
  timeout?: number;
  progressSteps?: string[];
  estimatedDuration?: number;
}

/**
 * Loading state props
 */
export interface LoadingStateProps {
  state: LoadingStateType;
  message?: string;
  progress?: number;
  config?: LoadingConfig;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: Error | string;
  children?: React.ReactNode;
}

/**
 * Enhanced loading spinner with progress
 */
export const EnhancedSpin: React.FC<{
  spinning: boolean;
  tip?: string;
  progress?: number;
  showProgress?: boolean;
  children?: React.ReactNode;
}> = ({ 
  spinning, 
  tip = '加载中...', 
  progress, 
  showProgress = false,
  children 
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!spinning) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [spinning]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  if (!spinning) {
    return <>{children}</>;
  }

  return (
    <Spin
      spinning={spinning}
      indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
      tip={
        <Space direction="vertical" size="small" style={{ textAlign: 'center' }}>
          <Text>{tip}</Text>
          {showProgress && typeof progress === 'number' && (
            <Progress 
              percent={progress} 
              size="small" 
              style={{ width: 200 }}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          )}
          {elapsedTime > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined /> 已用时: {formatTime(elapsedTime)}
            </Text>
          )}
        </Space>
      }
    >
      {children}
    </Spin>
  );
};

/**
 * Progressive loading component with steps
 */
export const ProgressiveLoader: React.FC<{
  steps: string[];
  currentStep: number;
  progress?: number;
  error?: string;
  onRetry?: () => void;
}> = ({ steps, currentStep, progress, error, onRetry }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle={error}
        extra={
          onRetry && (
            <Button type="primary" onClick={onRetry}>
              重试
            </Button>
          )
        }
      />
    );
  }

  return (
    <Card style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <SyncOutlined spin style={{ fontSize: 32, color: '#1890ff' }} />
          <Title level={4} style={{ marginTop: 16 }}>
            {steps[currentStep] || '处理中...'}
          </Title>
        </div>

        <Progress
          type="circle"
          percent={progress || Math.round(((currentStep + 1) / steps.length) * 100)}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />

        <div>
          <Text type="secondary">
            步骤 {currentStep + 1} / {steps.length}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <ClockCircleOutlined /> 已用时: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </Text>
        </div>

        <div style={{ textAlign: 'left', width: '100%' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <Space>
                {index < currentStep ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : index === currentStep ? (
                  <LoadingOutlined style={{ color: '#1890ff' }} />
                ) : (
                  <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
                )}
                <Text 
                  type={index <= currentStep ? 'default' : 'secondary'}
                  style={{ 
                    textDecoration: index < currentStep ? 'line-through' : 'none',
                    fontWeight: index === currentStep ? 'bold' : 'normal'
                  }}
                >
                  {step}
                </Text>
              </Space>
            </div>
          ))}
        </div>
      </Space>
    </Card>
  );
};

/**
 * Loading state manager component
 */
export const LoadingStateManager: React.FC<LoadingStateProps> = ({
  state,
  message,
  progress,
  config = {},
  onCancel,
  onRetry,
  error,
  children
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);

  const {
    showProgress = false,
    showElapsedTime = true,
    showCancelButton = false,
    showRetryButton = true,
    timeout = 30000,
    progressSteps = [],
    estimatedDuration = 0
  } = config;

  useEffect(() => {
    if (state !== 'loading') {
      setElapsedTime(0);
      setIsTimeout(false);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        if (timeout && newTime * 1000 >= timeout) {
          setIsTimeout(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, timeout]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const getEstimatedRemaining = (): string => {
    if (!estimatedDuration || !progress) return '';
    const remaining = Math.max(0, estimatedDuration - elapsedTime);
    return `预计剩余: ${formatTime(remaining)}`;
  };

  // Render based on state
  switch (state) {
    case 'idle':
      return <>{children}</>;

    case 'loading':
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Space direction="vertical" size="large">
            <Spin 
              size="large" 
              indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            />
            
            <div>
              <Title level={4}>{message || '加载中...'}</Title>
              
              {showProgress && typeof progress === 'number' && (
                <Progress 
                  percent={progress} 
                  style={{ width: 300, margin: '16px 0' }}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              )}
              
              {showElapsedTime && (
                <Text type="secondary">
                  <ClockCircleOutlined /> 已用时: {formatTime(elapsedTime)}
                  {estimatedDuration > 0 && progress && (
                    <span style={{ marginLeft: 16 }}>
                      {getEstimatedRemaining()}
                    </span>
                  )}
                </Text>
              )}
            </div>

            {(showCancelButton || isTimeout) && (
              <Space>
                {showCancelButton && onCancel && (
                  <Button onClick={onCancel}>取消</Button>
                )}
                {isTimeout && onRetry && (
                  <Button type="primary" onClick={onRetry}>
                    重试
                  </Button>
                )}
              </Space>
            )}

            {isTimeout && (
              <Alert
                message="加载超时"
                description="操作耗时较长，您可以继续等待或重试"
                type="warning"
                showIcon
              />
            )}
          </Space>
        </div>
      );

    case 'retrying':
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Space direction="vertical" size="large">
            <Spin 
              size="large" 
              indicator={<SyncOutlined style={{ fontSize: 48 }} spin />}
            />
            <Title level={4}>重试中...</Title>
            <Text type="secondary">
              {message || '正在重新尝试，请稍候...'}
            </Text>
          </Space>
        </div>
      );

    case 'success':
      return (
        <Result
          status="success"
          title="加载成功"
          subTitle={message || '操作已成功完成'}
          extra={children}
        />
      );

    case 'error':
      return (
        <Result
          status="error"
          title="加载失败"
          subTitle={
            <Space direction="vertical">
              <Text>{typeof error === 'string' ? error : error?.message || message || '操作失败'}</Text>
              {showElapsedTime && elapsedTime > 0 && (
                <Text type="secondary">
                  失败前已尝试: {formatTime(elapsedTime)}
                </Text>
              )}
            </Space>
          }
          extra={
            <Space>
              {showRetryButton && onRetry && (
                <Button type="primary" onClick={onRetry}>
                  重试
                </Button>
              )}
              {onCancel && (
                <Button onClick={onCancel}>
                  取消
                </Button>
              )}
            </Space>
          }
        />
      );

    case 'timeout':
      return (
        <Result
          status="warning"
          title="操作超时"
          subTitle={
            <Space direction="vertical">
              <Text>{message || '操作耗时过长已超时'}</Text>
              <Text type="secondary">
                超时时间: {formatTime(Math.floor(timeout / 1000))}
              </Text>
            </Space>
          }
          extra={
            <Space>
              {onRetry && (
                <Button type="primary" onClick={onRetry}>
                  重试
                </Button>
              )}
              {onCancel && (
                <Button onClick={onCancel}>
                  取消
                </Button>
              )}
            </Space>
          }
        />
      );

    default:
      return <>{children}</>;
  }
};

/**
 * Empty state component
 */
export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  image?: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ 
  title = '暂无数据', 
  description = '当前没有可显示的内容',
  image,
  action,
  style 
}) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', ...style }}>
    <Result
      icon={image}
      title={title}
      subTitle={description}
      extra={action}
    />
  </div>
);

/**
 * Skeleton wrapper with enhanced loading states
 */
export const EnhancedSkeletonWrapper: React.FC<{
  loading: boolean;
  error?: Error | string;
  empty?: boolean;
  skeletonType?: 'table' | 'card' | 'form' | 'list' | 'details';
  skeletonCount?: number;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}> = ({
  loading,
  error,
  empty = false,
  skeletonType = 'table',
  skeletonCount = 5,
  onRetry,
  emptyTitle,
  emptyDescription,
  children
}) => {
  if (loading) {
    return <SkeletonLoader type={skeletonType} count={skeletonCount} />;
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle={typeof error === 'string' ? error : error.message}
        extra={
          onRetry && (
            <Button type="primary" onClick={onRetry}>
              重试
            </Button>
          )
        }
      />
    );
  }

  if (empty) {
    return (
      <EmptyState 
        title={emptyTitle}
        description={emptyDescription}
        action={
          onRetry && (
            <Button type="primary" onClick={onRetry}>
              刷新
            </Button>
          )
        }
      />
    );
  }

  return <>{children}</>;
};

export default {
  EnhancedSpin,
  ProgressiveLoader,
  LoadingStateManager,
  EmptyState,
  EnhancedSkeletonWrapper
};