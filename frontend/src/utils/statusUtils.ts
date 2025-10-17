/**
 * Status utilities for instance and history management
 * Provides status text mapping, styling, and formatting functions
 */

import { Status, Priority, OperationType, StoreType, PipelineMode } from '../types/enums';

/**
 * Status configuration interface
 */
export interface StatusConfig {
  label: string;
  color: string;
  bgColor?: string;
  icon?: string;
  description?: string;
}

/**
 * Instance status configurations
 */
export const INSTANCE_STATUS_CONFIG: Record<string, StatusConfig> = {
  [Status.ACTIVE]: {
    label: '活跃',
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'check-circle',
    description: '实例正在运行'
  },
  [Status.INACTIVE]: {
    label: '非活跃',
    color: '#d9d9d9',
    bgColor: '#fafafa',
    icon: 'pause-circle',
    description: '实例已停止'
  },
  [Status.PENDING]: {
    label: '等待中',
    color: '#faad14',
    bgColor: '#fffbe6',
    icon: 'clock-circle',
    description: '实例正在启动'
  },
  [Status.ERROR]: {
    label: '错误',
    color: '#f5222d',
    bgColor: '#fff2f0',
    icon: 'exclamation-circle',
    description: '实例运行出错'
  },

};

/**
 * Priority configurations
 */
export const PRIORITY_CONFIG: Record<string, StatusConfig> = {
  [Priority.HIGH]: {
    label: '高',
    color: '#f5222d',
    bgColor: '#fff2f0',
    icon: 'arrow-up',
    description: '高优先级'
  },
  [Priority.NORMAL]: {
    label: '普通',
    color: '#1890ff',
    bgColor: '#e6f7ff',
    icon: 'minus',
    description: '普通优先级'
  },
  [Priority.LOW]: {
    label: '低',
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'arrow-down',
    description: '低优先级'
  },
  [Priority.VERY_LOW]: {
    label: '很低',
    color: '#d9d9d9',
    bgColor: '#fafafa',
    icon: 'double-arrow-down',
    description: '很低优先级'
  }
};

/**
 * Operation type configurations
 */
export const OPERATION_TYPE_CONFIG: Record<string, StatusConfig> = {
  [OperationType.CREATE]: {
    label: '创建',
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'plus-circle',
    description: '创建实例'
  },
  [OperationType.UPDATE]: {
    label: '更新',
    color: '#faad14',
    bgColor: '#fffbe6',
    icon: 'edit',
    description: '更新实例'
  },
  [OperationType.DELETE]: {
    label: '删除',
    color: '#f5222d',
    bgColor: '#fff2f0',
    icon: 'delete',
    description: '删除实例'
  },
  [OperationType.ROLLBACK]: {
    label: '回滚',
    color: '#1890ff',
    bgColor: '#e6f7ff',
    icon: 'undo',
    description: '回滚实例'
  }
};

/**
 * Store type configurations
 */
export const STORE_TYPE_CONFIG: Record<string, StatusConfig> = {
  [StoreType.REDIS]: {
    label: 'Redis',
    color: '#dc382d',
    bgColor: '#fff2f0',
    icon: 'database',
    description: 'Redis 存储'
  },
  [StoreType.MEMORY]: {
    label: '内存',
    color: '#722ed1',
    bgColor: '#f9f0ff',
    icon: 'thunderbolt',
    description: '内存存储'
  },
  [StoreType.DISK]: {
    label: '磁盘',
    color: '#13c2c2',
    bgColor: '#e6fffb',
    icon: 'hdd',
    description: '磁盘存储'
  }
};

/**
 * Pipeline mode configurations
 */
export const PIPELINE_MODE_CONFIG: Record<string, StatusConfig> = {
  [PipelineMode.DEFAULT]: {
    label: '默认',
    color: '#1890ff',
    bgColor: '#e6f7ff',
    icon: 'branches',
    description: '默认管道模式'
  },
  [PipelineMode.FAST]: {
    label: '快速',
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'rocket',
    description: '快速管道模式'
  },
  [PipelineMode.QUALITY]: {
    label: '高质量',
    color: '#faad14',
    bgColor: '#fffbe6',
    icon: 'star',
    description: '高质量管道模式'
  },
  [PipelineMode.BALANCED]: {
    label: '平衡',
    color: '#722ed1',
    bgColor: '#f9f0ff',
    icon: 'balance',
    description: '平衡管道模式'
  }
};

/**
 * Get status configuration
 */
export const getStatusConfig = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
): StatusConfig => {
  let config: Record<string, StatusConfig>;
  
  switch (type) {
    case 'priority':
      config = PRIORITY_CONFIG;
      break;
    case 'operation':
      config = OPERATION_TYPE_CONFIG;
      break;
    case 'store':
      config = STORE_TYPE_CONFIG;
      break;
    case 'pipeline':
      config = PIPELINE_MODE_CONFIG;
      break;
    case 'instance':
    default:
      config = INSTANCE_STATUS_CONFIG;
      break;
  }
  
  return config[status] || {
    label: status,
    color: '#d9d9d9',
    bgColor: '#fafafa',
    icon: 'question-circle',
    description: '未知状态'
  };
};

/**
 * Get status label
 */
export const getStatusLabel = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
): string => {
  return getStatusConfig(status, type).label;
};

/**
 * Get status color
 */
export const getStatusColor = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
): string => {
  return getStatusConfig(status, type).color;
};

/**
 * Get status background color
 */
export const getStatusBgColor = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
): string => {
  return getStatusConfig(status, type).bgColor || '#fafafa';
};

/**
 * Get status icon
 */
export const getStatusIcon = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
): string => {
  return getStatusConfig(status, type).icon || 'question-circle';
};

/**
 * Get status description
 */
export const getStatusDescription = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
): string => {
  return getStatusConfig(status, type).description || '未知状态';
};

/**
 * Check if status is active/positive
 */
export const isActiveStatus = (status: string): boolean => {
  return status === Status.ACTIVE;
};

/**
 * Check if status is error/negative
 */
export const isErrorStatus = (status: string): boolean => {
  return status === Status.ERROR;
};

/**
 * Check if status is pending/transitional
 */
export const isPendingStatus = (status: string): boolean => {
  return status === Status.PENDING;
};

/**
 * Get all available statuses for a type
 */
export const getAvailableStatuses = (
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
): Array<{ value: string; label: string; config: StatusConfig }> => {
  let config: Record<string, StatusConfig>;
  
  switch (type) {
    case 'priority':
      config = PRIORITY_CONFIG;
      break;
    case 'operation':
      config = OPERATION_TYPE_CONFIG;
      break;
    case 'store':
      config = STORE_TYPE_CONFIG;
      break;
    case 'pipeline':
      config = PIPELINE_MODE_CONFIG;
      break;
    case 'instance':
    default:
      config = INSTANCE_STATUS_CONFIG;
      break;
  }
  
  return Object.entries(config).map(([value, statusConfig]) => ({
    value,
    label: statusConfig.label,
    config: statusConfig
  }));
};

/**
 * Format priority array to display string
 */
export const formatPriorities = (priorities: string[]): string => {
  if (!priorities || priorities.length === 0) {
    return '无';
  }
  
  return priorities
    .map(priority => getStatusLabel(priority, 'priority'))
    .join(', ');
};

/**
 * Get priority order for sorting
 */
export const getPriorityOrder = (priority: string): number => {
  const order: Record<string, number> = {
    [Priority.HIGH]: 1,
    [Priority.NORMAL]: 2,
    [Priority.LOW]: 3,
    [Priority.VERY_LOW]: 4
  };
  
  return order[priority] || 999;
};

/**
 * Sort priorities by importance
 */
export const sortPriorities = (priorities: string[]): string[] => {
  return [...priorities].sort((a, b) => getPriorityOrder(a) - getPriorityOrder(b));
};

/**
 * Get status badge props for Ant Design Badge component
 */
export const getStatusBadgeProps = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
) => {
  const config = getStatusConfig(status, type);
  
  let antdStatus: 'success' | 'processing' | 'error' | 'warning' | 'default' = 'default';
  
  if (type === 'instance') {
    switch (status) {
      case Status.ACTIVE:
        antdStatus = 'success';
        break;
      case Status.PENDING:
        antdStatus = 'processing';
        break;
      case Status.ERROR:
        antdStatus = 'error';
        break;
      case Status.INACTIVE:
        antdStatus = 'warning';
        break;
      default:
        antdStatus = 'default';
    }
  }
  
  return {
    status: antdStatus,
    text: config.label,
    color: config.color
  };
};

/**
 * Get status tag props for Ant Design Tag component
 */
export const getStatusTagProps = (
  status: string,
  type: 'instance' | 'priority' | 'operation' | 'store' | 'pipeline' = 'instance'
) => {
  const config = getStatusConfig(status, type);
  
  return {
    color: config.color,
    style: {
      backgroundColor: config.bgColor,
      borderColor: config.color,
      color: config.color
    },
    children: config.label
  };
};