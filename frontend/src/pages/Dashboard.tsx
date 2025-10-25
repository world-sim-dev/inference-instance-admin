/**
 * Dashboard Component
 * Main dashboard page for instance management with integrated CRUD operations
 */

import React, { useCallback, useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Card, message, Button, Space, Typography, Row, Col } from 'antd';
import { 
  PlusOutlined, 
  ReloadOutlined,
  SettingOutlined,
  DashboardOutlined 
} from '@ant-design/icons';
import { 
  InstanceTable, 
  InstanceSearchBar
} from '../components';

// Lazy load heavy components
const CreateInstanceModal = lazy(() => import('../components/modals/CreateInstanceModal'));
const DeleteConfirmModal = lazy(() => import('../components/modals/DeleteConfirmModal'));
const HistoryModal = lazy(() => import('../components/modals/HistoryModal'));
const ViewDetailsModal = lazy(() => import('../components/modals/ViewDetailsModal'));
const VirtualizedInstanceTable = lazy(() => import('../components/tables/VirtualizedInstanceTable'));
import { useInstances } from '../hooks';
import { useAppContext, useAppActions } from '../contexts/useAppContext';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useKeyboardShortcuts, createCommonShortcuts } from '../hooks/useKeyboardShortcuts';
import { useNotification } from '../components/common/NotificationSystem';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { HelpSystem } from '../components/common/HelpSystem';
import { AccessibilityToolbar } from '../components/common/AccessibilityHelper';
import type { Instance } from '../types/instance';
import type { AppState } from '../contexts/types';

const { Title, Text } = Typography;

/**
 * Dashboard Component - Main page for instance management
 * Optimized with React.memo, lazy loading, and performance monitoring
 */
export const Dashboard: React.FC = React.memo(() => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const {
    filteredInstances,
    loading,
    error,
    filterOptions,
    refetch,
  } = useInstances();

  // Performance monitoring
  const performanceMetrics = usePerformanceMonitor({
    name: 'Dashboard',
    enableLogging: true,
    logThreshold: 20,
  });

  // Enhanced notifications
  const {
    showSuccess,
    showError,
    showLoading,
    updateLoadingSuccess,
    updateLoadingError,
  } = useNotification();

  const { ui, modals } = state;
  const { searchTerm, filters, pagination } = ui;

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Selected instance for operations - memoized for performance
  const selectedInstance = useMemo(() => 
    state.instances.data.find(instance => instance.id === ui.selectedInstanceId),
    [state.instances.data, ui.selectedInstanceId]
  );

  // Determine if virtualization should be used based on data size
  const shouldUseVirtualization = useMemo(() => 
    useVirtualization || filteredInstances.length > 100,
    [useVirtualization, filteredInstances.length]
  );

  // Keyboard shortcuts
  const shortcuts = useMemo(() => createCommonShortcuts({
    onCreate: handleCreateClick,
    onRefresh: handleRefresh,
    onSearch: () => {
      // Focus search input
      const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onHelp: () => setShowHelp(true),
  }), []);

  useKeyboardShortcuts(shortcuts);

  /**
   * Handle search term change
   */
  const handleSearchChange = useCallback((searchTerm: string) => {
    actions.setSearchTerm(searchTerm);
  }, [actions]);

  /**
   * Handle filters change
   */
  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    actions.setFilters(newFilters);
    // Reset pagination when filters change
    actions.setPagination({ current: 1 });
  }, [actions]);

  /**
   * Handle table change (pagination, sorting, filtering)
   */
  const handleTableChange = useCallback((paginationConfig: any, _filters: any, _sorter: any) => {
    if (paginationConfig) {
      actions.setPagination({
        current: paginationConfig.current,
        pageSize: paginationConfig.pageSize,
      });
    }
  }, [actions]);

  /**
   * Handle create instance click
   */
  const handleCreateClick = useCallback(() => {
    actions.setSelectedInstance(null);
    actions.toggleModal('createInstance', true);
  }, [actions]);

  /**
   * Handle edit instance
   */
  const handleEdit = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('editInstance', true);
  }, [actions]);

  /**
   * Handle delete instance
   */
  const handleDelete = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('deleteConfirm', true);
  }, [actions]);

  /**
   * Handle view history
   */
  const handleViewHistory = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('viewHistory', true);
  }, [actions]);

  /**
   * Handle view details
   */
  const handleViewDetails = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('viewDetails', true);
  }, [actions]);

  /**
   * Handle copy instance
   */
  const handleCopy = useCallback(async (instance: Instance) => {
    const loadingKey = showLoading(`正在复制实例 "${instance.name}"...`);
    try {
      // Import API client dynamically to avoid circular dependencies
      const { apiClient } = await import('../services/api');
      const copiedInstance = await apiClient.copyInstance(instance.id);
      updateLoadingSuccess(loadingKey, `实例复制成功`);
      showSuccess(`实例 "${copiedInstance.name}" 复制成功`, {
        description: `已从 "${instance.name}" 复制创建新实例`,
        duration: 5,
      });
      refetch();
    } catch (error: any) {
      updateLoadingError(loadingKey, '复制失败');
      showError(`复制实例失败: ${error.message}`, {
        description: '请检查网络连接或联系系统管理员',
        duration: 8,
      });
    }
  }, [showLoading, updateLoadingSuccess, updateLoadingError, showSuccess, showError, refetch]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    const loadingKey = showLoading('正在刷新数据...');
    try {
      await refetch();
      updateLoadingSuccess(loadingKey, '数据刷新成功');
    } catch (error) {
      updateLoadingError(loadingKey, '数据刷新失败');
    }
  }, [refetch, showLoading, updateLoadingSuccess, updateLoadingError]);

  /**
   * Handle reset filters
   */
  const handleResetFilters = useCallback(() => {
    actions.resetFilters();
    actions.setPagination({ current: 1 });
  }, [actions]);

  /**
   * Handle auto refresh toggle
   */
  const handleAutoRefreshToggle = useCallback(() => {
    if (autoRefresh) {
      // Stop auto refresh
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
      message.info('自动刷新已关闭');
    } else {
      // Start auto refresh (every 30 seconds)
      const interval = window.setInterval(() => {
        refetch();
      }, 30000);
      setRefreshInterval(interval);
      setAutoRefresh(true);
      message.info('自动刷新已开启 (30秒间隔)');
    }
  }, [autoRefresh, refreshInterval, refetch]);

  /**
   * Handle modal close
   */
  const handleModalClose = useCallback((modalName: keyof AppState['modals']) => {
    actions.toggleModal(modalName, false);
    actions.setSelectedInstance(null);
  }, [actions]);

  /**
   * Handle instance creation success
   */
  const handleCreateSuccess = useCallback((instance: Instance) => {
    showSuccess(`实例 "${instance.name}" 创建成功`, {
      description: '新实例已成功创建并添加到列表中',
      duration: 5,
    });
    refetch();
    actions.toggleModal('createInstance', false);
    actions.setSelectedInstance(null);
  }, [actions, refetch, showSuccess]);

  /**
   * Handle instance update success
   */
  const handleUpdateSuccess = useCallback((instance: Instance) => {
    showSuccess(`实例 "${instance.name}" 更新成功`, {
      description: '实例配置已成功更新',
      duration: 5,
    });
    refetch();
    actions.toggleModal('editInstance', false);
    actions.setSelectedInstance(null);
  }, [actions, refetch, showSuccess]);

  /**
   * Handle instance deletion success
   */
  const handleDeleteSuccess = useCallback((instance: Instance) => {
    showSuccess(`实例 "${instance.name}" 删除成功`, {
      description: '实例已从系统中移除',
      duration: 5,
    });
    refetch();
    actions.toggleModal('deleteConfirm', false);
    actions.setSelectedInstance(null);
  }, [actions, refetch, showSuccess]);

  /**
   * Handle operation error
   */
  const handleOperationError = useCallback((error: Error) => {
    showError(`操作失败: ${error.message}`, {
      description: '请检查网络连接或联系系统管理员',
      duration: 8,
    });
  }, [showError]);

  // Calculate pagination info - memoized for performance
  const paginationConfig = useMemo(() => ({
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: filteredInstances.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => 
      `${range[0]}-${range[1]} of ${total} instances`,
    pageSizeOptions: ['10', '20', '50', '100'],
  }), [pagination.current, pagination.pageSize, filteredInstances.length]);

  // Get current page data - memoized for performance
  const currentPageInstances = useMemo(() => {
    if (shouldUseVirtualization) {
      return filteredInstances; // Virtualized table handles its own pagination
    }
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredInstances.slice(startIndex, endIndex);
  }, [filteredInstances, pagination.current, pagination.pageSize, shouldUseVirtualization]);

  // Cleanup auto refresh on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        window.clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Load initial data
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Dashboard Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={2} style={{ margin: 0 }}>
              实例管理仪表板
            </Title>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            管理和监控推理实例的运行状态
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              type={autoRefresh ? 'primary' : 'default'}
              icon={<ReloadOutlined spin={autoRefresh} />}
              onClick={handleAutoRefreshToggle}
            >
              {autoRefresh ? '自动刷新中' : '自动刷新'}
            </Button>
            <Button
              type={useVirtualization ? 'primary' : 'default'}
              onClick={() => setUseVirtualization(!useVirtualization)}
            >
              {useVirtualization ? '标准视图' : '虚拟化视图'}
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowHelp(true)}
            >
              帮助
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card 
        title={
          <Space>
            <span>实例列表</span>
            <Text type="secondary">
              ({filteredInstances.length} / {state.instances.data.length})
            </Text>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateClick}
            >
              创建实例
            </Button>
          </Space>
        }
        style={{ minHeight: '600px' }}
      >
        {/* Search and Filter Bar */}
        <InstanceSearchBar
          searchTerm={searchTerm}
          filters={filters}
          filterOptions={filterOptions}
          loading={loading}
          resultsCount={filteredInstances.length}
          totalCount={state.instances.data.length}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
          onCreateClick={handleCreateClick}
          onRefresh={handleRefresh}
          onResetFilters={handleResetFilters}
        />

        {/* Instance Table */}
        {loading && filteredInstances.length === 0 ? (
          <SkeletonLoader type="table" count={5} />
        ) : shouldUseVirtualization ? (
          <Suspense fallback={<SkeletonLoader type="table" count={5} />}>
            <VirtualizedInstanceTable
              instances={currentPageInstances}
              loading={loading}
              height={600}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewHistory={handleViewHistory}
              onViewDetails={handleViewDetails}
              onCopy={handleCopy}
            />
          </Suspense>
        ) : (
          <InstanceTable
            instances={currentPageInstances}
            loading={loading}
            pagination={paginationConfig}
            onChange={handleTableChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewHistory={handleViewHistory}
            onViewDetails={handleViewDetails}
            onCopy={handleCopy}
          />
        )}

        {/* Error Display */}
        {error && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7',
            borderRadius: 6,
            color: '#ff4d4f'
          }}>
            <Space>
              <span>错误:</span>
              <span>{error}</span>
              <Button 
                type="link" 
                size="small" 
                onClick={handleRefresh}
              >
                重试
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* Lazy-loaded Modals */}
      <Suspense fallback={null}>
        {/* Create/Edit Instance Modal */}
        {(modals.createInstance || modals.editInstance) && (
          <CreateInstanceModal
            visible={modals.createInstance || modals.editInstance}
            instance={modals.editInstance ? selectedInstance : undefined}
            onClose={() => handleModalClose(modals.editInstance ? 'editInstance' : 'createInstance')}
            onSuccess={modals.editInstance ? handleUpdateSuccess : handleCreateSuccess}
            onError={handleOperationError}
          />
        )}

        {/* Delete Confirmation Modal */}
        {modals.deleteConfirm && (
          <DeleteConfirmModal
            visible={modals.deleteConfirm}
            instance={selectedInstance}
            onClose={() => handleModalClose('deleteConfirm')}
            onSuccess={handleDeleteSuccess}
            onError={handleOperationError}
          />
        )}

        {/* History Modal */}
        {modals.viewHistory && (
          <HistoryModal
            visible={modals.viewHistory}
            instance={selectedInstance}
            onClose={() => handleModalClose('viewHistory')}
            onError={handleOperationError}
          />
        )}

        {/* View Details Modal */}
        {modals.viewDetails && (
          <ViewDetailsModal
            visible={modals.viewDetails}
            instance={selectedInstance}
            onClose={() => handleModalClose('viewDetails')}
          />
        )}
        
        {/* Debug Info */}
        {modals.viewDetails && (
          <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            background: 'yellow', 
            padding: '10px', 
            zIndex: 9999,
            border: '2px solid red'
          }}>
            <div>Modal State: {String(modals.viewDetails)}</div>
            <div>Selected Instance ID: {ui.selectedInstanceId}</div>
            <div>Selected Instance: {selectedInstance ? 'Found' : 'Not Found'}</div>
            <div>Instance Name: {selectedInstance?.name || 'N/A'}</div>
          </div>
        )}
      </Suspense>

      {/* Accessibility Toolbar */}
      <AccessibilityToolbar position="top" />

      {/* Help System */}
      <HelpSystem
        shortcuts={shortcuts}
        showFloatingButton={true}
        defaultTab="help"
      />
    </div>
  );
});

// Add display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard;