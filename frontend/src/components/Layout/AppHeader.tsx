import React, { useState } from 'react';
import { Layout, Typography, Space, Button, Dropdown, Avatar, Drawer, Modal, message } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  ReloadOutlined,
  MenuOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { APP_CONFIG } from '../../constants';
import { useAppContext } from '../../contexts';
import { useAuthContext } from '../../contexts/useAuthContext';
import { useResponsive } from '../../hooks';

const { Header } = Layout;
const { Title } = Typography;

export const AppHeader: React.FC = () => {
  const { dispatch, state } = useAppContext();
  const { state: authState, logout } = useAuthContext();
  const { isMobile } = useResponsive();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const handleRefresh = () => {
    dispatch({ type: 'LOAD_INSTANCES_START' });
    // This will trigger a refetch in the Dashboard component
    window.location.reload();
  };

  /**
   * Handle logout action with confirmation
   */
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '确定要退出登录吗？退出后将清除本地会话信息。',
      okText: '确定退出',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        return new Promise((resolve) => {
          try {
            logout();
            message.success('已成功退出登录');
            resolve(true);
          } catch (error) {
            message.error('退出登录失败');
            resolve(false);
          }
        });
      },
    });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'settings':
        // TODO: Open settings modal
        message.info('设置功能开发中...');
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  const renderDesktopHeader = () => (
    <div className="app-header-content">
      <div className="app-header-left">
        <div className="app-logo">
          <Title level={3} className="app-title">
            {APP_CONFIG.NAME}
          </Title>
        </div>
      </div>
      
      <div className="app-header-right">
        <Space size="middle">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            className="header-action-btn"
            title="刷新数据"
            loading={state.instances.loading}
            aria-label="刷新数据"
          />
          
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              className="header-user-btn"
              icon={<Avatar size="small" icon={<UserOutlined />} />}
              title={authState.credentials?.username || '管理员'}
            >
              <span className="header-user-text">
                {authState.credentials?.username || '管理员'}
              </span>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="app-header-content">
      <div className="app-header-left">
        <div className="app-logo">
          <Title level={4} className="app-title">
            {APP_CONFIG.NAME}
          </Title>
        </div>
      </div>
      
      <div className="app-header-right">
        <Space size="small">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            className="header-action-btn"
            title="刷新数据"
            loading={state.instances.loading}
            aria-label="刷新数据"
          />
          
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuVisible(true)}
            className="header-action-btn"
            title="菜单"
            aria-label="打开菜单"
          />
        </Space>
      </div>
    </div>
  );

  const renderMobileDrawer = () => (
    <Drawer
      title="菜单"
      placement="right"
      onClose={() => setMobileMenuVisible(false)}
      open={mobileMenuVisible}
      width={Math.min(280, window.innerWidth * 0.8)}
      className="mobile-menu-drawer"
      styles={{
        body: { padding: 0 },
        header: { 
          borderBottom: '1px solid #f0f0f0',
          fontSize: '16px',
          fontWeight: 600
        }
      }}
    >
      <div className="mobile-menu-content">
        <div className="mobile-user-info">
          <Avatar size={48} icon={<UserOutlined />} />
          <div className="mobile-user-details">
            <div className="mobile-user-name">管理员</div>
            <div className="mobile-user-role">系统管理员</div>
          </div>
        </div>
        
        <div className="mobile-menu-section">
          <div className="mobile-menu-section-title">快速操作</div>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={() => {
              handleRefresh();
              setMobileMenuVisible(false);
            }}
            className="mobile-menu-item"
            block
            size="large"
          >
            刷新数据
          </Button>
        </div>
        
        <div className="mobile-menu-section">
          <div className="mobile-menu-section-title">系统设置</div>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => {
              handleUserMenuClick({ key: 'settings' } as any);
              setMobileMenuVisible(false);
            }}
            className="mobile-menu-item"
            block
            size="large"
          >
            设置
          </Button>
          
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              handleUserMenuClick({ key: 'logout' } as any);
              setMobileMenuVisible(false);
            }}
            className="mobile-menu-item"
            danger
            block
            size="large"
          >
            退出登录
          </Button>
        </div>
      </div>
    </Drawer>
  );

  return (
    <>
      <Header className="app-header">
        {isMobile ? renderMobileHeader() : renderDesktopHeader()}
      </Header>
      {isMobile && renderMobileDrawer()}
    </>
  );
};