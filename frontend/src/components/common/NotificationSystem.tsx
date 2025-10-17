/**
 * NotificationSystem Component
 * Enhanced notification system with better user feedback
 */

import React, { useCallback, useEffect } from 'react';
import { notification, message, Modal } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';

/**
 * Notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Notification options
 */
export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  showProgress?: boolean;
  closable?: boolean;
  onClick?: () => void;
  onClose?: () => void;
  key?: string;
}

/**
 * Toast notification options
 */
export interface ToastOptions {
  duration?: number;
  onClose?: () => void;
  key?: string;
}

/**
 * Confirmation dialog options
 */
export interface ConfirmOptions {
  title: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okButtonProps?: any;
  cancelButtonProps?: any;
}

/**
 * NotificationSystem class
 */
class NotificationSystemClass {
  private loadingKeys = new Set<string>();

  /**
   * Show notification
   */
  notify(type: NotificationType, message: string, options: NotificationOptions = {}) {
    const {
      title,
      description = message,
      duration = 4.5,
      placement = 'topRight',
      showProgress = false,
      closable = true,
      onClick,
      onClose,
      key,
    } = options;

    const icons = {
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      loading: <LoadingOutlined style={{ color: '#1890ff' }} />,
    };

    const config = {
      message: title || this.getDefaultTitle(type),
      description,
      icon: icons[type],
      duration: type === 'loading' ? 0 : duration,
      placement,
      closable: type === 'loading' ? false : closable,
      onClick,
      onClose,
      key,
      style: showProgress ? {
        background: 'linear-gradient(90deg, #f0f0f0 0%, #ffffff 100%)',
      } : undefined,
    };

    if (type === 'loading' && key) {
      this.loadingKeys.add(key);
    }

    notification[type === 'loading' ? 'info' : type](config);
  }

  /**
   * Show success notification
   */
  success(message: string, options?: NotificationOptions) {
    this.notify('success', message, options);
  }

  /**
   * Show error notification
   */
  error(message: string, options?: NotificationOptions) {
    this.notify('error', message, options);
  }

  /**
   * Show warning notification
   */
  warning(message: string, options?: NotificationOptions) {
    this.notify('warning', message, options);
  }

  /**
   * Show info notification
   */
  info(message: string, options?: NotificationOptions) {
    this.notify('info', message, options);
  }

  /**
   * Show loading notification
   */
  loading(message: string, options?: NotificationOptions) {
    const key = options?.key || `loading_${Date.now()}`;
    this.notify('loading', message, { ...options, key });
    return key;
  }

  /**
   * Update loading notification to success
   */
  loadingSuccess(key: string, message: string, options?: NotificationOptions) {
    if (this.loadingKeys.has(key)) {
      this.loadingKeys.delete(key);
      notification.destroy(key);
      this.success(message, { ...options, key: `${key}_success` });
    }
  }

  /**
   * Update loading notification to error
   */
  loadingError(key: string, message: string, options?: NotificationOptions) {
    if (this.loadingKeys.has(key)) {
      this.loadingKeys.delete(key);
      notification.destroy(key);
      this.error(message, { ...options, key: `${key}_error` });
    }
  }

  /**
   * Show toast message
   */
  toast(type: NotificationType, content: string, options: ToastOptions = {}) {
    const { duration = 3, onClose, key } = options;

    const config = {
      content,
      duration,
      onClose,
      key,
    };

    switch (type) {
      case 'success':
        message.success(config);
        break;
      case 'error':
        message.error(config);
        break;
      case 'warning':
        message.warning(config);
        break;
      case 'info':
        message.info(config);
        break;
      case 'loading':
        message.loading(config);
        break;
    }
  }

  /**
   * Show confirmation dialog
   */
  confirm(options: ConfirmOptions) {
    const {
      title,
      content,
      okText = '确认',
      cancelText = '取消',
      type = 'confirm',
      onOk,
      onCancel,
      okButtonProps,
      cancelButtonProps,
    } = options;

    const config = {
      title,
      content,
      okText,
      cancelText,
      onOk,
      onCancel,
      okButtonProps,
      cancelButtonProps,
      centered: true,
    };

    switch (type) {
      case 'info':
        Modal.info(config);
        break;
      case 'success':
        Modal.success(config);
        break;
      case 'error':
        Modal.error(config);
        break;
      case 'warning':
        Modal.warning(config);
        break;
      default:
        Modal.confirm(config);
        break;
    }
  }

  /**
   * Close notification by key
   */
  close(key: string) {
    notification.destroy(key);
    this.loadingKeys.delete(key);
  }

  /**
   * Close all notifications
   */
  closeAll() {
    notification.destroy();
    this.loadingKeys.clear();
  }

  /**
   * Get default title for notification type
   */
  private getDefaultTitle(type: NotificationType): string {
    const titles = {
      success: '操作成功',
      error: '操作失败',
      warning: '警告',
      info: '提示',
      loading: '处理中',
    };
    return titles[type];
  }
}

// Create singleton instance
export const NotificationSystem = new NotificationSystemClass();

/**
 * Hook for using notification system
 */
export const useNotification = () => {
  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    NotificationSystem.success(message, options);
  }, []);

  const showError = useCallback((message: string, options?: NotificationOptions) => {
    NotificationSystem.error(message, options);
  }, []);

  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    NotificationSystem.warning(message, options);
  }, []);

  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    NotificationSystem.info(message, options);
  }, []);

  const showLoading = useCallback((message: string, options?: NotificationOptions) => {
    return NotificationSystem.loading(message, options);
  }, []);

  const updateLoadingSuccess = useCallback((key: string, message: string, options?: NotificationOptions) => {
    NotificationSystem.loadingSuccess(key, message, options);
  }, []);

  const updateLoadingError = useCallback((key: string, message: string, options?: NotificationOptions) => {
    NotificationSystem.loadingError(key, message, options);
  }, []);

  const showToast = useCallback((type: NotificationType, content: string, options?: ToastOptions) => {
    NotificationSystem.toast(type, content, options);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    NotificationSystem.confirm(options);
  }, []);

  const closeNotification = useCallback((key: string) => {
    NotificationSystem.close(key);
  }, []);

  const closeAllNotifications = useCallback(() => {
    NotificationSystem.closeAll();
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    updateLoadingSuccess,
    updateLoadingError,
    showToast,
    showConfirm,
    closeNotification,
    closeAllNotifications,
  };
};

/**
 * NotificationProvider Component
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Configure global notification settings
    notification.config({
      placement: 'topRight',
      duration: 4.5,
      rtl: false,
    });

    message.config({
      duration: 3,
      maxCount: 3,
    });

    // Cleanup on unmount
    return () => {
      NotificationSystem.closeAll();
    };
  }, []);

  return <>{children}</>;
};

export default NotificationSystem;