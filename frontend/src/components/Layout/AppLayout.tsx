import React from 'react';
import { Layout, Spin, Alert } from 'antd';
import { AppHeader } from './AppHeader';
import { useAppContext } from '../../contexts';
import './AppLayout.css';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { state } = useAppContext();
  const { loading, error } = state.instances;

  return (
    <Layout className="app-layout">
      <AppHeader />
      <Content className="app-content">
        <div className="app-content-inner">
          {error && (
            <Alert
              message="数据加载失败"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
              action={
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1890ff',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  重试
                </button>
              }
            />
          )}
          <Spin spinning={loading} size="large" tip="加载中...">
            <div className="content-wrapper">
              {children}
            </div>
          </Spin>
        </div>
      </Content>
    </Layout>
  );
};