import type { FC } from 'react';
import { useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './contexts';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorkingDashboard } from './pages/WorkingDashboard';
import './App.css';

// Create a client with basic settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Basic Ant Design theme
const antdTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};

const App: FC = () => {
  return (
    <ErrorBoundary 
      componentName="App"
      showDetails={import.meta.env.DEV}
      onError={(error, errorInfo) => {
        console.error('[App] Error boundary caught error:', { error, errorInfo });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ConfigProvider 
            locale={zhCN}
            theme={antdTheme}
          >
            <WorkingDashboard />
          </ConfigProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
