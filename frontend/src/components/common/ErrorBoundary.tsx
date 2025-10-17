/**
 * Enhanced Error Boundary Component
 * Comprehensive error boundary with recovery mechanisms and user feedback
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Result, Button, Card, Collapse, Typography, Space } from 'antd';
import { 
  ReloadOutlined, 
  BugOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { globalErrorHandler } from '../../services/errorHandlingService';
import { classifyError, type StructuredError } from '../../utils/errorUtils';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableRecovery?: boolean;
  componentName?: string;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  structuredError: StructuredError | null;
  retryCount: number;
  isRecovering: boolean;
}

/**
 * Enhanced Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      structuredError: null,
      retryCount: 0,
      isRecovering: false
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const structuredError = classifyError(error);
    
    return {
      hasError: true,
      error,
      structuredError
    };
  }

  /**
   * Component did catch error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const structuredError = classifyError(error);
    
    this.setState({
      errorInfo,
      structuredError
    });

    // Handle error through global error handler
    globalErrorHandler.handleError(error, {
      component: this.props.componentName || 'ErrorBoundary',
      action: 'render',
      metadata: {
        errorInfo,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      }
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Handle retry action
   */
  private handleRetry = (): void => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ 
      isRecovering: true,
      retryCount: this.state.retryCount + 1
    });

    // Simulate recovery delay
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        structuredError: null,
        isRecovering: false
      });
    }, 1000);
  };

  /**
   * Handle page refresh
   */
  private handleRefresh = (): void => {
    window.location.reload();
  };

  /**
   * Handle error reporting
   */
  private handleReportError = (): void => {
    if (this.state.structuredError) {
      // Copy error details to clipboard
      const errorDetails = this.getErrorDetails();
      navigator.clipboard.writeText(errorDetails).then(() => {
        // Show success message
        console.log('Error details copied to clipboard');
      });
    }
  };

  /**
   * Get formatted error details
   */
  private getErrorDetails = (): string => {
    const { error, errorInfo, structuredError } = this.state;
    
    const details = {
      timestamp: new Date().toISOString(),
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      },
      structuredError: structuredError ? {
        type: structuredError.type,
        severity: structuredError.severity,
        message: structuredError.message,
        userMessage: structuredError.userMessage,
        retryable: structuredError.retryable
      } : null,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    return JSON.stringify(details, null, 2);
  };

  /**
   * Get error icon based on severity
   */
  private getErrorIcon = (): ReactNode => {
    const { structuredError } = this.state;
    
    if (!structuredError) {
      return <BugOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />;
    }

    switch (structuredError.severity) {
      case 'critical':
        return <ExclamationCircleOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />;
      case 'high':
        return <ExclamationCircleOutlined style={{ fontSize: 64, color: '#fa8c16' }} />;
      case 'medium':
        return <InfoCircleOutlined style={{ fontSize: 64, color: '#faad14' }} />;
      default:
        return <BugOutlined style={{ fontSize: 64, color: '#1890ff' }} />;
    }
  };

  /**
   * Get error title based on error type
   */
  private getErrorTitle = (): string => {
    const { structuredError } = this.state;
    
    if (!structuredError) {
      return '应用程序出现错误';
    }

    const titles = {
      network: '网络连接错误',
      validation: '数据验证错误',
      authentication: '身份验证错误',
      authorization: '权限错误',
      not_found: '资源未找到',
      server: '服务器错误',
      client: '客户端错误',
      timeout: '请求超时',
      unknown: '未知错误'
    };

    return titles[structuredError.type] || '应用程序出现错误';
  };

  /**
   * Get error description
   */
  private getErrorDescription = (): string => {
    const { structuredError } = this.state;
    
    if (structuredError?.userMessage) {
      return structuredError.userMessage;
    }

    return '应用程序遇到了一个意外错误。您可以尝试刷新页面或稍后重试。';
  };

  /**
   * Get action buttons
   */
  private getActionButtons = (): ReactNode[] => {
    const { structuredError, retryCount, isRecovering } = this.state;
    const { enableRecovery = true } = this.props;
    
    const buttons: ReactNode[] = [];

    // Retry button (if retryable and under retry limit)
    if (enableRecovery && structuredError?.retryable && retryCount < this.maxRetries) {
      buttons.push(
        <Button
          key="retry"
          type="primary"
          icon={<ReloadOutlined />}
          loading={isRecovering}
          onClick={this.handleRetry}
        >
          重试 ({this.maxRetries - retryCount} 次剩余)
        </Button>
      );
    }

    // Refresh button
    buttons.push(
      <Button
        key="refresh"
        icon={<ReloadOutlined />}
        onClick={this.handleRefresh}
      >
        刷新页面
      </Button>
    );

    // Report error button
    if (this.props.showErrorDetails) {
      buttons.push(
        <Button
          key="report"
          icon={<CopyOutlined />}
          onClick={this.handleReportError}
        >
          复制错误信息
        </Button>
      );
    }

    return buttons;
  };

  /**
   * Render error details panel
   */
  private renderErrorDetails = (): ReactNode => {
    if (!this.props.showErrorDetails) {
      return null;
    }

    const { error, errorInfo, structuredError } = this.state;

    return (
      <Card style={{ marginTop: 16, textAlign: 'left' }}>
        <Collapse ghost>
          <Panel header="错误详情" key="details">
            <Space direction="vertical" style={{ width: '100%' }}>
              {structuredError && (
                <div>
                  <Text strong>错误类型：</Text>
                  <Text code>{structuredError.type}</Text>
                  <br />
                  <Text strong>严重程度：</Text>
                  <Text code>{structuredError.severity}</Text>
                  <br />
                  <Text strong>可重试：</Text>
                  <Text code>{structuredError.retryable ? '是' : '否'}</Text>
                </div>
              )}
              
              {error && (
                <div>
                  <Text strong>错误消息：</Text>
                  <Paragraph code copyable>
                    {error.message}
                  </Paragraph>
                </div>
              )}
              
              {error?.stack && (
                <div>
                  <Text strong>错误堆栈：</Text>
                  <Paragraph code copyable style={{ whiteSpace: 'pre-wrap' }}>
                    {error.stack}
                  </Paragraph>
                </div>
              )}
              
              {errorInfo?.componentStack && (
                <div>
                  <Text strong>组件堆栈：</Text>
                  <Paragraph code copyable style={{ whiteSpace: 'pre-wrap' }}>
                    {errorInfo.componentStack}
                  </Paragraph>
                </div>
              )}
              
              <div>
                <Text strong>重试次数：</Text>
                <Text code>{this.state.retryCount}</Text>
              </div>
            </Space>
          </Panel>
        </Collapse>
      </Card>
    );
  };

  /**
   * Component will unmount
   */
  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Render method
   */
  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Render default error UI
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center' }}>
        <Result
          icon={this.getErrorIcon()}
          title={this.getErrorTitle()}
          subTitle={this.getErrorDescription()}
          extra={this.getActionButtons()}
        />
        {this.renderErrorDetails()}
      </div>
    );
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

/**
 * Hook for creating error boundary handler
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;