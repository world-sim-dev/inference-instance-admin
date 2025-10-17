import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Result, Button, Card, Typography, Space, Tag, Collapse } from 'antd';
import { 
  ReloadOutlined, 
  HomeOutlined, 
  BugOutlined,
  CopyOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { classifyError, formatErrorForLogging, type StructuredError } from '../utils/errorUtils';
import { globalErrorHandler } from '../services/errorHandlingService';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  structuredError: StructuredError | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      structuredError: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const structuredError = classifyError(error);
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      structuredError,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const structuredError = classifyError(error);
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle error through global error handler
    globalErrorHandler.handleError(error, {
      component: this.props.componentName || 'ErrorBoundary',
      action: 'render',
      metadata: {
        errorId,
        errorInfo,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      }
    });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      structuredError,
      errorId,
    });
  }

  private reportError = (errorData: any) => {
    // This would integrate with error reporting services like Sentry
    // For now, we'll just log to console
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary] Error reported:', errorData);
      // Example: Sentry.captureException(errorData);
    }
  };

  handleReset = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      structuredError: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    if (!this.state.structuredError || !this.state.errorInfo) return;
    
    const errorData = {
      errorId: this.state.errorId,
      message: this.state.structuredError.message,
      type: this.state.structuredError.type,
      severity: this.state.structuredError.severity,
      timestamp: this.state.structuredError.timestamp,
      componentStack: this.state.errorInfo.componentStack,
      stack: this.state.error?.stack,
    };
    
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2)).then(() => {
      console.log('Error information copied to clipboard');
    }).catch(() => {
      console.error('Failed to copy error information');
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { structuredError, errorId, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;
      const showDetails = this.props.showDetails ?? import.meta.env.DEV;

      return (
        <div style={{ padding: '50px', textAlign: 'center', minHeight: '400px' }}>
          <Result
            status="error"
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="应用程序出现错误"
            subTitle={
              <Space direction="vertical" size="small">
                <Text>抱歉，应用程序遇到了意外错误。</Text>
                {structuredError && (
                  <Space>
                    <Tag color="red">{structuredError.type}</Tag>
                    <Tag color="orange">{structuredError.severity}</Tag>
                    {errorId && (
                      <Tag color="blue">ID: {errorId.slice(-8)}</Tag>
                    )}
                  </Space>
                )}
                {retryCount > 0 && (
                  <Text type="secondary">已重试 {retryCount} 次</Text>
                )}
              </Space>
            }
            extra={[
              canRetry && (
                <Button 
                  type="primary" 
                  key="retry" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReset}
                >
                  重试 {retryCount > 0 && `(${this.maxRetries - retryCount} 次剩余)`}
                </Button>
              ),
              <Button 
                key="reload" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                刷新页面
              </Button>,
              <Button 
                key="home" 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                返回首页
              </Button>,
              <Button 
                key="copy" 
                icon={<CopyOutlined />}
                onClick={this.handleCopyError}
              >
                复制错误信息
              </Button>,
            ].filter(Boolean)}
          />
          
          {showDetails && structuredError && (
            <Card 
              style={{ 
                marginTop: '20px', 
                textAlign: 'left',
                maxWidth: '800px',
                margin: '20px auto 0'
              }}
              title={
                <Space>
                  <BugOutlined />
                  <Text>错误详情 ({import.meta.env.DEV ? '开发模式' : '详细信息'})</Text>
                </Space>
              }
              size="small"
            >
              <Collapse ghost>
                <Panel header="基本信息" key="basic">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div><Text strong>错误ID：</Text><Text code>{errorId}</Text></div>
                    <div><Text strong>组件：</Text>{this.props.componentName || 'Unknown'}</div>
                    <div><Text strong>错误类型：</Text>{structuredError.type}</div>
                    <div><Text strong>严重程度：</Text>{structuredError.severity}</div>
                    <div><Text strong>发生时间：</Text>{structuredError.timestamp.toLocaleString()}</div>
                    <div><Text strong>可重试：</Text>{structuredError.retryable ? '是' : '否'}</div>
                  </Space>
                </Panel>
                
                <Panel header="错误消息" key="message">
                  <Paragraph copyable={{ text: structuredError.message }}>
                    <Text code>{structuredError.message}</Text>
                  </Paragraph>
                </Panel>
                
                {this.state.error?.stack && (
                  <Panel header="错误堆栈" key="stack">
                    <Paragraph copyable={{ text: this.state.error.stack }}>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {this.state.error.stack}
                      </pre>
                    </Paragraph>
                  </Panel>
                )}
                
                {this.state.errorInfo?.componentStack && (
                  <Panel header="组件堆栈" key="componentStack">
                    <Paragraph copyable={{ text: this.state.errorInfo.componentStack }}>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </Paragraph>
                  </Panel>
                )}
                
                {structuredError.suggestions && structuredError.suggestions.length > 0 && (
                  <Panel header="建议解决方案" key="suggestions">
                    <ul>
                      {structuredError.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </Panel>
                )}
              </Collapse>
            </Card>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}