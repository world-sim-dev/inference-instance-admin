/**
 * Working Dashboard Component
 * Simplified version of the main dashboard with real API integration
 */

import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Space, Typography, Alert, Spin, Table, Tag, Input, Modal, Descriptions, Divider, Form, InputNumber, Select, Switch, message } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, SearchOutlined, CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { CreateInstanceModal } from '../components/modals/CreateInstanceModal';
import { useAppContext } from '../contexts/useAppContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { HistoryModal } from '../components/modals/HistoryModal';

const { Header, Content } = Layout;
const { Title } = Typography;

// API function to fetch instances
const fetchInstances = async () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await axios.get(`${apiBaseUrl}/api/instances/`);
  return response.data;
};

export const WorkingDashboard: React.FC = () => {
  const { state } = useAppContext();
  const [searchText, setSearchText] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  
  // Use React Query to fetch instances
  const { 
    data: instances, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['instances'],
    queryFn: fetchInstances,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter instances based on search text
  const filteredInstances = instances?.filter((instance: any) =>
    instance.name.toLowerCase().includes(searchText.toLowerCase()) ||
    instance.model_name.toLowerCase().includes(searchText.toLowerCase()) ||
    instance.cluster_name.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateInstance = () => {
    setCreateModalVisible(true);
  };

  const handleCreateSuccess = (instance: any) => {
    // 刷新数据
    refetch();
    
    // 关闭模态框
    setCreateModalVisible(false);
    
    message.success(`实例 "${instance.name}" 创建成功！`);
  };

  const handleCreateError = (error: Error) => {
    console.error('创建实例失败:', error);
    message.error('创建实例失败，请重试');
  };

  const handleViewInstance = (instance: any) => {
    setSelectedInstance(instance);
    setDetailsModalVisible(true);
  };

  const handleEditInstance = (instance: any) => {
    setSelectedInstance(instance);
    setDetailsModalVisible(false);
    setEditModalVisible(true);
  };

  const handleEditSuccess = (updatedInstance: any) => {
    // 刷新数据
    refetch();
    setEditModalVisible(false);
    message.success(`实例 "${updatedInstance.name}" 更新成功！`);
  };

  const handleEditError = (error: Error) => {
    console.error('更新实例失败:', error);
    message.error('更新实例失败，请重试');
  };

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<any>(null);

  const handleDeleteInstance = (instance: any) => {
    console.log('删除按钮被点击，实例:', instance);
    setInstanceToDelete(instance);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!instanceToDelete) return;
    
    try {
      console.log('开始删除实例:', instanceToDelete.id);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      await axios.delete(`${apiBaseUrl}/api/instances/${instanceToDelete.id}`);
      
      // 刷新数据
      refetch();
      
      message.success(`实例 "${instanceToDelete.name}" 删除成功！`);
      setDeleteModalVisible(false);
      setInstanceToDelete(null);
    } catch (error) {
      console.error('删除实例失败:', error);
      message.error('删除实例失败，请重试');
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setInstanceToDelete(null);
  };

  const handleViewHistory = (instance: any) => {
    setSelectedInstance(instance);
    setHistoryModalVisible(true);
  };

  // Table columns configuration
  const columns = [
    {
      title: '实例名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 150,
      ellipsis: true,
      sorter: (a: any, b: any) => a.model_name.localeCompare(b.model_name),
    },
    {
      title: '版本',
      dataIndex: 'model_version',
      key: 'model_version',
      width: 80,
      ellipsis: true,
    },
    {
      title: '集群',
      dataIndex: 'cluster_name',
      key: 'cluster_name',
      width: 150,
      ellipsis: true,
      sorter: (a: any, b: any) => a.cluster_name.localeCompare(b.cluster_name),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: '资源配置',
      key: 'resources',
      width: 120,
      render: (_: any, record: any) => (
        <div style={{ fontSize: '12px' }}>
          <div>PP:{record.pp} CP:{record.cp} TP:{record.tp}</div>
          <div>Workers:{record.n_workers} × {record.replicas}</div>
        </div>
      ),
    },
    {
      title: '模式',
      key: 'modes',
      width: 100,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={2}>
          {record.quant_mode && <Tag size="small" color="purple">量化</Tag>}
          {record.distill_mode && <Tag size="small" color="cyan">蒸馏</Tag>}
          {record.m405_mode && <Tag size="small" color="orange">M405</Tag>}
          {record.ephemeral && <Tag size="small" color="blue">临时</Tag>}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
      sorter: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewInstance(record)}
            title="查看详情"
          />
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditInstance(record)}
            title="编辑"
          />
          <Button 
            type="text" 
            size="small" 
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
            title="查看历史"
            style={{ color: '#1890ff' }}
          />
          <Button 
            type="text" 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              console.log('删除按钮点击事件触发');
              handleDeleteInstance(record);
            }}
            danger
            title="删除"
          />
        </Space>
      ),
    },
  ];

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
            onClick={handleRefresh}
            loading={isLoading}
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
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateInstance}
              >
                创建实例
              </Button>
            </div>
            
            {error && (
              <Alert
                message="API连接错误"
                description={`无法连接到后端API: ${error instanceof Error ? error.message : '未知错误'}`}
                type="error"
                showIcon
                style={{ marginBottom: '16px' }}
                action={
                  <Button size="small" onClick={handleRefresh}>
                    重试
                  </Button>
                }
              />
            )}
            
            {!error && (
              <Alert
                message="系统状态"
                description={`React前端应用已成功启动并运行。已连接到后端API，共加载 ${instances?.length || 0} 个实例。`}
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            
            <Card 
              title={
                <Space>
                  <span>{`实例列表 (${filteredInstances.length}/${instances?.length || 0})`}</span>
                  <Input
                    placeholder="搜索实例名称、模型或集群..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                  />
                </Space>
              }
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={isLoading}
                >
                  刷新
                </Button>
              }
            >
              <Table
                columns={columns}
                dataSource={filteredInstances}
                loading={isLoading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
                scroll={{ x: 1200 }}
                size="small"
              />
            </Card>
          </Space>
        </Card>
      </Content>

      {/* 实例详情模态框 */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>实例详情</span>
            {selectedInstance && (
              <Tag color={selectedInstance.status === 'active' ? 'green' : 'red'}>
                {selectedInstance.status?.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={() => handleEditInstance(selectedInstance)}>
            编辑实例
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {selectedInstance && (
          <div>
            <Descriptions title="基本信息" bordered column={2} size="small">
              <Descriptions.Item label="实例名称" span={2}>
                <strong>{selectedInstance.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="模型名称">
                {selectedInstance.model_name}
              </Descriptions.Item>
              <Descriptions.Item label="模型版本">
                {selectedInstance.model_version || 'latest'}
              </Descriptions.Item>
              <Descriptions.Item label="集群名称">
                {selectedInstance.cluster_name}
              </Descriptions.Item>
              <Descriptions.Item label="镜像标签">
                {selectedInstance.image_tag}
              </Descriptions.Item>
              <Descriptions.Item label="管道模式">
                {selectedInstance.pipeline_mode || 'default'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedInstance.status === 'active' ? 'green' : 'red'}>
                  {selectedInstance.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="资源配置" bordered column={2} size="small">
              <Descriptions.Item label="管道并行度 (PP)">
                {selectedInstance.pp}
              </Descriptions.Item>
              <Descriptions.Item label="上下文并行度 (CP)">
                {selectedInstance.cp}
              </Descriptions.Item>
              <Descriptions.Item label="张量并行度 (TP)">
                {selectedInstance.tp}
              </Descriptions.Item>
              <Descriptions.Item label="工作进程数">
                {selectedInstance.n_workers}
              </Descriptions.Item>
              <Descriptions.Item label="副本数">
                {selectedInstance.replicas}
              </Descriptions.Item>
              <Descriptions.Item label="任务并发数">
                {selectedInstance.task_concurrency}
              </Descriptions.Item>
              {selectedInstance.fps && (
                <Descriptions.Item label="FPS">
                  {selectedInstance.fps}
                </Descriptions.Item>
              )}
              {selectedInstance.celery_task_concurrency && (
                <Descriptions.Item label="Celery任务并发">
                  {selectedInstance.celery_task_concurrency}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions title="模式配置" bordered column={2} size="small">
              <Descriptions.Item label="量化模式">
                <Tag color={selectedInstance.quant_mode ? 'purple' : 'default'}>
                  {selectedInstance.quant_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="蒸馏模式">
                <Tag color={selectedInstance.distill_mode ? 'cyan' : 'default'}>
                  {selectedInstance.distill_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="M405模式">
                <Tag color={selectedInstance.m405_mode ? 'orange' : 'default'}>
                  {selectedInstance.m405_mode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="临时实例">
                <Tag color={selectedInstance.ephemeral ? 'blue' : 'default'}>
                  {selectedInstance.ephemeral ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="CUDA图优化">
                <Tag color={selectedInstance.enable_cuda_graph ? 'green' : 'default'}>
                  {selectedInstance.enable_cuda_graph ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分离视频编码">
                <Tag color={selectedInstance.separate_video_encode ? 'green' : 'default'}>
                  {selectedInstance.separate_video_encode ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedInstance.priorities && selectedInstance.priorities.length > 0 && (
              <>
                <Divider />
                <Descriptions title="优先级配置" bordered size="small">
                  <Descriptions.Item label="优先级列表" span={2}>
                    <Space wrap>
                      {selectedInstance.priorities.map((priority: string, index: number) => (
                        <Tag key={index} color="blue">{priority}</Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            <>
              <Divider />
              <Descriptions title="环境变量" bordered size="small">
                <Descriptions.Item label="环境变量" span={2}>
                  {(() => {
                    if (!selectedInstance.envs) {
                      return <span style={{ color: '#999' }}>无环境变量</span>;
                    }
                    
                    // Handle both array and object formats
                    if (Array.isArray(selectedInstance.envs)) {
                      if (selectedInstance.envs.length === 0) {
                        return <span style={{ color: '#999' }}>无环境变量</span>;
                      }
                      return (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {selectedInstance.envs.map((env: any, index: number) => (
                            <div key={index} style={{ 
                              background: '#f5f5f5', 
                              padding: '8px', 
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '12px'
                            }}>
                              {typeof env === 'object' ? 
                                Object.entries(env).map(([key, value]) => (
                                  <div key={key}><strong>{key}</strong>: {String(value)}</div>
                                )) :
                                String(env)
                              }
                            </div>
                          ))}
                        </Space>
                      );
                    } else if (typeof selectedInstance.envs === 'object') {
                      const envEntries = Object.entries(selectedInstance.envs);
                      if (envEntries.length === 0) {
                        return <span style={{ color: '#999' }}>无环境变量</span>;
                      }
                      return (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {envEntries.map(([key, value], index) => (
                            <div key={index} style={{ 
                              background: '#f5f5f5', 
                              padding: '8px', 
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '12px'
                            }}>
                              <strong>{key}</strong>: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                        </Space>
                      );
                    }
                    
                    return <span style={{ color: '#999' }}>无环境变量</span>;
                  })()}
                </Descriptions.Item>
              </Descriptions>
            </>

            <Divider />

            <Descriptions title="时间信息" bordered column={2} size="small">
              <Descriptions.Item label="创建时间">
                {new Date(selectedInstance.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedInstance.updated_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>

            {selectedInstance.description && (
              <>
                <Divider />
                <Descriptions title="描述信息" bordered size="small">
                  <Descriptions.Item label="描述" span={2}>
                    {selectedInstance.description}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 编辑实例模态框 - 使用复用的CreateInstanceModal组件 */}
      <CreateInstanceModal
        visible={editModalVisible}
        instance={selectedInstance}
        onClose={() => setEditModalVisible(false)}
        onSuccess={handleEditSuccess}
        onError={handleEditError}
      />

      {/* 创建实例模态框 */}
      <CreateInstanceModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        onError={handleCreateError}
      />

      {/* 历史记录模态框 */}
      <HistoryModal
        visible={historyModalVisible}
        instance={selectedInstance}
        onClose={() => setHistoryModalVisible(false)}
        onError={(error) => {
          console.error('History modal error:', error);
          message.error(`加载历史记录失败: ${error.message}`);
        }}
      />

      {/* 删除确认模态框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="确定删除"
        cancelText="取消"
        okType="danger"
        centered
      >
        <p>
          确定要删除实例 <strong>"{instanceToDelete?.name}"</strong> 吗？
        </p>
        <p style={{ color: '#ff4d4f', marginBottom: 0 }}>
          此操作不可撤销，请谨慎操作。
        </p>
      </Modal>
    </Layout>
  );
};