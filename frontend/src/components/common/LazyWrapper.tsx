/**
 * LazyWrapper Component
 * Provides lazy loading functionality with loading states and error boundaries
 */

import React, { Suspense, ComponentType } from 'react';
import { Spin, Alert, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

/**
 * Props for LazyWrapper component
 */
export interface LazyWrapperProps {
  /** The lazy-loaded component */
  children: React.ReactNode;
  /** Loading fallback component */
  fallback?: React.ReactNode;
  /** Error fallback component */
  errorFallback?: React.ReactNode;
  /** Minimum loading time in ms to prevent flash */
  minLoadingTime?: number;
}

/**
 * Default loading fallback
 */
const DefaultLoadingFallback: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <Spin size="large" />
    <span style={{ color: '#666' }}>Loading component...</span>
  </div>
);

/**
 * Default error fallback
 */
const DefaultErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div style={{ padding: '24px' }}>
    <Alert
      message="Component Loading Error"
      description="Failed to load the component. Please try again."
      type="error"
      showIcon
      action={
        onRetry && (
          <Button size="small" danger onClick={onRetry} icon={<ReloadOutlined />}>
            Retry
          </Button>
        )
      }
    />
  </div>
);

/**
 * Error boundary for lazy components
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode; onRetry?: () => void }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ReactNode; onRetry?: () => void }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyWrapper Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * LazyWrapper Component
 */
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  minLoadingTime = 0,
}) => {
  const [showLoading, setShowLoading] = React.useState(true);

  React.useEffect(() => {
    if (minLoadingTime > 0) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [minLoadingTime]);

  const loadingFallback = React.useMemo(() => {
    if (showLoading && minLoadingTime > 0) {
      return fallback || <DefaultLoadingFallback />;
    }
    return fallback || <DefaultLoadingFallback />;
  }, [fallback, showLoading, minLoadingTime]);

  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

/**
 * Higher-order component for lazy loading
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    minLoadingTime?: number;
  }
) {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));

  const WrappedComponent: React.FC<P> = (props) => (
    <LazyWrapper {...options}>
      <LazyComponent {...props} />
    </LazyWrapper>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for creating lazy components
 */
export function useLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    minLoadingTime?: number;
  }
) {
  const LazyComponent = React.useMemo(() => React.lazy(importFn), [importFn]);

  const WrappedComponent: React.FC<P> = React.useCallback((props) => (
    <LazyWrapper {...options}>
      <LazyComponent {...props} />
    </LazyWrapper>
  ), [LazyComponent, options]);

  return WrappedComponent;
}

export default LazyWrapper;