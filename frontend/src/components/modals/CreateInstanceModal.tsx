import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { InstanceForm } from '../forms/InstanceForm';
import type { Instance, InstanceFormData, CreateInstanceData, UpdateInstanceData } from '../../types/instance';
import { InstanceService } from '../../services/instanceService';
import { useResponsive } from '../../hooks/useResponsive';

export interface CreateInstanceModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Instance data for editing mode (undefined for create mode) */
  instance?: Instance;
  /** Modal close handler */
  onClose: () => void;
  /** Success callback after create/update */
  onSuccess?: (instance: Instance) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * CreateInstanceModal Component
 * 
 * A modal dialog for creating new instances or editing existing ones.
 * Features:
 * - Integrates InstanceForm component
 * - Handles both create and edit modes
 * - Manages loading states and error handling
 * - Provides keyboard navigation and accessibility
 * - Auto-closes on successful submission
 */
export const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  visible,
  instance,
  onClose,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { isMobile, isTablet, screenWidth } = useResponsive();
  
  const isEditMode = !!instance;
  const modalTitle = isEditMode ? '编辑实例' : '创建新实例';

  // Reset form when modal opens/closes or instance changes
  useEffect(() => {
    if (visible) {
      setFormKey(prev => prev + 1);
    }
  }, [visible, instance?.id]);

  // Handle form submission
  const handleSubmit = async (formData: InstanceFormData) => {
    setLoading(true);
    
    try {
      let result: Instance;
      
      if (isEditMode && instance) {
        // Update existing instance
        const updateData: UpdateInstanceData = { ...formData };
        result = await InstanceService.updateInstance(instance.id, updateData);
        message.success('实例更新成功');
      } else {
        // Create new instance
        const createData: CreateInstanceData = { ...formData };
        result = await InstanceService.createInstance(createData);
        message.success('实例创建成功');
      }
      
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Instance operation failed:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      message.error(errorMessage);
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

  // Convert Instance to InstanceFormData for editing
  const getFormData = (): InstanceFormData | undefined => {
    if (!instance) return undefined;
    
    // Extract form-relevant fields from Instance
    const {
      id, created_at, updated_at, priority, // Remove non-form fields
      ...formData
    } = instance;
    
    return formData as InstanceFormData;
  };

  // Calculate responsive modal width
  const getModalWidth = () => {
    if (isMobile) {
      return '95vw';
    } else if (isTablet) {
      return '90vw';
    } else if (screenWidth < 1200) {
      return '80vw';
    } else {
      return 800;
    }
  };

  // Calculate responsive modal height
  const getModalBodyStyle = () => {
    const maxHeight = isMobile ? '85vh' : '70vh';
    const padding = isMobile ? '16px' : '24px';
    
    return {
      maxHeight,
      overflowY: 'auto' as const,
      padding
    };
  };

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={handleCancel}
      footer={null} // Form handles its own buttons
      width={getModalWidth()}
      centered={!isMobile} // Don't center on mobile for better keyboard handling
      destroyOnClose
      maskClosable={!loading}
      closable={!loading}
      keyboard={!loading}
      styles={{
        body: getModalBodyStyle(),
        mask: isMobile ? { backgroundColor: 'rgba(0, 0, 0, 0.8)' } : undefined
      }}
      style={isMobile ? { 
        top: 20,
        paddingBottom: 0,
        margin: '0 auto'
      } : undefined}
      aria-labelledby="create-instance-modal-title"
      aria-describedby="create-instance-modal-description"
    >
      <div id="create-instance-modal-description" className="sr-only">
        {isEditMode 
          ? `编辑实例 ${instance?.name || ''} 的配置信息`
          : '创建新的推理实例，填写必要的配置信息'
        }
      </div>
      
      <InstanceForm
        key={formKey}
        instance={getFormData()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode={isEditMode ? 'edit' : 'create'}
      />
    </Modal>
  );
};

export default CreateInstanceModal;