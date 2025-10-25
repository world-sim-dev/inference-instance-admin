import React, { useState } from 'react';
import { Modal, Typography, Alert, Space, Button } from 'antd';
import { ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Instance } from '../../types/instance';
import { InstanceService } from '../../services/instanceService';
import { useResponsive } from '../../hooks/useResponsive';

const { Text } = Typography;

export interface DeleteConfirmModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Instance to be deleted */
  instance?: Instance;
  /** Modal close handler */
  onClose: () => void;
  /** Success callback after deletion */
  onSuccess?: (deletedInstance: Instance) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * DeleteConfirmModal Component
 * 
 * A confirmation dialog for deleting instances.
 * Features:
 * - Shows instance details and deletion warnings
 * - Prevents accidental deletions with confirmation
 * - Handles loading states during deletion
 * - Provides clear visual indicators for dangerous operations
 * - Supports keyboard navigation and accessibility
 */
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  instance,
  onClose,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  // Handle deletion confirmation
  const handleConfirm = async () => {
    if (!instance) return;
    
    setLoading(true);
    
    try {
      await InstanceService.deleteInstance(instance.id);
      onSuccess?.(instance);
      onClose();
    } catch (error) {
      console.error('Instance deletion failed:', error);
      const errorMessage = error instanceof Error ? error.message : '删除失败';
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    if (loading) {
      return; // Prevent closing while loading
    }
    onClose();
  };

  if (!instance) {
    return null;
  }

  // Calculate responsive modal width
  const getModalWidth = () => {
    if (isMobile) {
      return '90vw';
    } else if (isTablet) {
      return '80vw';
    } else {
      return 500;
    }
  };

  return (
    <Modal
      title={
        <Space size={isMobile ? 'small' : 'middle'}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <span style={{ fontSize: isMobile ? '14px' : '16px' }}>
            确认删除实例
          </span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      maskClosable={!loading}
      closable={!loading}
      keyboard={!loading}
      width={getModalWidth()}
      centered={!isMobile}
      footer={[
        <Button 
          key="cancel" 
          onClick={handleCancel} 
          disabled={loading}
          size={isMobile ? 'large' : 'middle'}
          style={{ minWidth: isMobile ? '80px' : '60px' }}
        >
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          loading={loading}
          onClick={handleConfirm}
          icon={<DeleteOutlined />}
          size={isMobile ? 'large' : 'middle'}
          style={{ minWidth: isMobile ? '100px' : '80px' }}
        >
          {loading ? '删除中...' : '确认删除'}
        </Button>
      ]}
      style={isMobile ? { 
        top: 50,
        paddingBottom: 0,
        margin: '0 auto'
      } : undefined}
      styles={{
        body: {
          padding: isMobile ? '16px' : '24px'
        },
        mask: isMobile ? { backgroundColor: 'rgba(0, 0, 0, 0.8)' } : undefined
      }}
      aria-labelledby="delete-confirm-modal-title"
      aria-describedby="delete-confirm-modal-description"
    >
      <div id="delete-confirm-modal-description">
        <Alert
          message="危险操作警告"
          description="此操作不可撤销，删除后将无法恢复实例数据。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>即将删除的实例：</Text>
          </div>
          
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#fafafa', 
            border: '1px solid #d9d9d9',
            borderRadius: '6px'
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text strong>名称：</Text>
                <Text code>{instance.name}</Text>
              </div>
              
              <div>
                <Text strong>模型：</Text>
                <Text>{instance.model_name} ({instance.model_version})</Text>
              </div>
              
              <div>
                <Text strong>集群：</Text>
                <Text>{instance.cluster_name}</Text>
              </div>
              
              <div>
                <Text strong>状态：</Text>
                <Text 
                  style={{ 
                    color: instance.status === 'active' ? '#52c41a' : 
                           instance.status === 'inactive' ? '#faad14' : '#1890ff'
                  }}
                >
                  {instance.status}
                </Text>
              </div>
              
              {instance.description && (
                <div>
                  <Text strong>描述：</Text>
                  <Text>{instance.description}</Text>
                </div>
              )}
            </Space>
          </div>

          <Alert
            message="确认删除"
            description={
              <div>
                <p>请确认您要删除实例 <Text code strong>{instance.name}</Text>。</p>
                <p>删除后：</p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>实例将立即停止运行</li>
                  <li>所有相关配置将被清除</li>
                  <li>历史记录将被保留用于审计</li>
                  <li>此操作无法撤销</li>
                </ul>
              </div>
            }
            type="error"
            showIcon
          />
        </Space>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;