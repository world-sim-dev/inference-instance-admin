import React from 'react';
import { Layout, Card, Button, Space, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

export const SimpleDashboard: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          Instance Manager
        </Title>
        <Space>
          <Button 
            type="text" 
            icon={<ReloadOutlined />} 
            style={{ color: 'white' }}
            onClick={() => window.location.reload()}
          >
            刷新
          </Button>
        </Space>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2} style={{ margin: 0 }}>实例管理</Title>
              <Button type="primary" icon={<PlusOutlined />}>
                创建实例
              </Button>
            </div>
            
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: '#fafafa', 
              borderRadius: '8px' 
            }}>
              <Title level={4}>应用正在加载中...</Title>
              <p>正在初始化实例管理系统</p>
            </div>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};