import React, { useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Typography,
  Tooltip,
  Alert
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { InstanceFormData } from '../../types/instance';
import { DEFAULT_INSTANCE_VALUES } from '../../types/instance';
import { Status, StoreType, PipelineMode, Priority } from '../../types/enums';
import { JsonEditor } from './JsonEditor';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export interface InstanceFormProps {
  /** Instance data for editing mode (undefined for create mode) */
  instance?: InstanceFormData;
  /** Form submission handler */
  onSubmit: (data: InstanceFormData) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state during form submission */
  loading?: boolean;
  /** Form mode - create or edit */
  mode?: 'create' | 'edit';
}

/**
 * InstanceForm Component
 * 
 * A comprehensive form for creating and editing inference instances.
 * Features:
 * - Grouped form fields (Basic Info, Resource Config, Advanced Options)
 * - Real-time validation
 * - Support for both create and edit modes
 * - Field dependencies (ephemeral-related fields)
 * - JSON field editors for complex data
 */
export const InstanceForm: React.FC<InstanceFormProps> = ({
  instance,
  onSubmit,
  onCancel,
  loading = false,
  mode = instance ? 'edit' : 'create'
}) => {
  const [form] = Form.useForm<InstanceFormData>();

  // Serialize form data for API submission
  const serializeFormData = useCallback((values: InstanceFormData): InstanceFormData => {
    const serialized = { ...values };

    // Ensure arrays are properly formatted
    if (!Array.isArray(serialized.priorities)) {
      serialized.priorities = [];
    }
    if (!Array.isArray(serialized.envs)) {
      // If it's already an object, keep it as is
      if (typeof serialized.envs !== 'object' || serialized.envs === null) {
        serialized.envs = {};
      }
    } else {
      // Convert from form format [{name: key, value: value}] to API format {key: value}
      const envDict = {};
      serialized.envs
        .filter(env => env && typeof env === 'object' && env.name && env.value !== undefined)
        .forEach(env => {
          // Try to parse the value to maintain proper data types
          let parsedValue = env.value;

          // Handle boolean values
          if (env.value === 'true') {
            parsedValue = true;
          } else if (env.value === 'false') {
            parsedValue = false;
          } else if (env.value === 'null') {
            parsedValue = null;
          } else if (env.value === 'undefined') {
            parsedValue = undefined;
          } else if (!isNaN(Number(env.value)) && env.value.trim() !== '') {
            // Handle numeric values (but keep strings that look like numbers as strings if they have leading zeros)
            const numValue = Number(env.value);
            if (env.value === String(numValue)) {
              parsedValue = numValue;
            }
          }

          (envDict as any)[env.name] = parsedValue;
        });
      serialized.envs = envDict;
    }

    // Convert null/undefined numeric values
    if (serialized.fps === null || serialized.fps === undefined) {
      serialized.fps = null;
    }
    if (serialized.celery_task_concurrency === null || serialized.celery_task_concurrency === undefined) {
      serialized.celery_task_concurrency = null;
    }
    if (serialized.ephemeral_min_period_seconds === null || serialized.ephemeral_min_period_seconds === undefined) {
      serialized.ephemeral_min_period_seconds = null;
    }

    // Clean up ephemeral fields if not ephemeral
    if (!serialized.ephemeral) {
      serialized.ephemeral_min_period_seconds = null;
      // Keep ephemeral_from and ephemeral_to values even when ephemeral is false
    }

    return serialized;
  }, []);

  // Deserialize instance data for form initialization
  const deserializeInstanceData = useCallback((instanceData: InstanceFormData): InstanceFormData => {
    const deserialized = { ...instanceData };

    // Ensure priorities is an array
    if (!Array.isArray(deserialized.priorities)) {
      deserialized.priorities = [];
    }

    // Convert envs from dict format to form format
    if (typeof deserialized.envs === 'object' && deserialized.envs !== null && !Array.isArray(deserialized.envs)) {
      // Convert from API format {key: value} to form format [{name: key, value: value}]
      deserialized.envs = Object.entries(deserialized.envs).map(([key, value]) => ({
        name: key,
        // Convert value to string for form display, but preserve the original type information
        value: value === null ? 'null' :
          value === undefined ? 'undefined' :
            typeof value === 'boolean' ? String(value) :
              typeof value === 'number' ? String(value) :
                String(value)
      }));
    } else if (!Array.isArray(deserialized.envs)) {
      deserialized.envs = [];
    }

    // Handle null values for optional numeric fields
    if (deserialized.fps === null) {
      deserialized.fps = undefined;
    }
    if (deserialized.celery_task_concurrency === null) {
      deserialized.celery_task_concurrency = undefined;
    }
    if (deserialized.ephemeral_min_period_seconds === null) {
      deserialized.ephemeral_min_period_seconds = undefined;
    }

    return deserialized;
  }, []);

  // Initialize form with default values or instance data
  useEffect(() => {
    const initialValues = instance
      ? deserializeInstanceData(instance)
      : { ...DEFAULT_INSTANCE_VALUES };
    form.setFieldsValue(initialValues);
  }, [form, instance, deserializeInstanceData]);

  // Handle form submission
  const handleSubmit = async (values: InstanceFormData) => {
    try {
      const serializedData = serializeFormData(values);
      await onSubmit(serializedData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Handle ephemeral field changes to show/hide related fields
  const handleEphemeralChange = (checked: boolean) => {
    if (!checked) {
      // Only clear the minimum period, keep ephemeral_to and ephemeral_from values
      form.setFieldsValue({
        ephemeral_min_period_seconds: null
      });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      scrollToFirstError
      size="middle"
    >
      {/* Basic Information Section */}
      <Card title="基础信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="实例名称"
              rules={[
                { required: true, message: '请输入实例名称' },
                { min: 1, max: 100, message: '实例名称长度应在1-100字符之间' },
                { pattern: /^[a-zA-Z0-9_-]+$/, message: '实例名称只能包含字母、数字、下划线和连字符' }
              ]}
            >
              <Input placeholder="输入实例名称" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="选择状态">
                <Option value={Status.ACTIVE}>活跃</Option>
                <Option value={Status.INACTIVE}>非活跃</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="model_name"
              label="模型名称"
              rules={[
                { required: true, message: '请输入模型名称' },
                { min: 1, max: 100, message: '模型名称长度应在1-100字符之间' }
              ]}
            >
              <Input placeholder="输入模型名称" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="replicas"
              label={
                <span>
                  副本数
                  <Tooltip title="实例副本数量，用于负载均衡">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: '请输入副本数' },
                { type: 'number', min: 1, message: '副本数不能小于1' }
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="cluster_name"
              label="集群名称"
              rules={[
                { required: true, message: '请输入集群名称' },
                { min: 1, max: 100, message: '集群名称长度应在1-100字符之间' }
              ]}
            >
              <Input placeholder="输入集群名称" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="image_tag"
              label="镜像标签"
              rules={[
                { required: true, message: '请输入镜像标签' },
                { min: 1, max: 100, message: '镜像标签长度应在1-100字符之间' }
              ]}
            >
              <Input placeholder="输入镜像标签" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ max: 500, message: '描述长度不能超过500字符' }]}
        >
          <TextArea
            rows={3}
            placeholder="输入实例描述（可选）"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Divider />

        {/* Priority and Environment Configuration */}
        <Title level={5}>优先级和环境配置</Title>
        <Form.Item
          name="priorities"
          label="优先级列表"
          rules={[
            { required: true, message: '请选择至少一个优先级' },
            {
              validator: (_, value) => {
                if (!Array.isArray(value) || value.length === 0) {
                  return Promise.reject(new Error('请选择至少一个优先级'));
                }
                const validPriorities = Object.values(Priority);
                const invalidPriorities = value.filter(p => !validPriorities.includes(p));
                if (invalidPriorities.length > 0) {
                  return Promise.reject(new Error(`无效的优先级: ${invalidPriorities.join(', ')}`));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <JsonEditor fieldType="priorities" placeholder="选择优先级" />
        </Form.Item>

        <Form.Item
          name="envs"
          label="环境变量"
          rules={[
            {
              validator: (_, value) => {
                if (!Array.isArray(value)) {
                  return Promise.reject(new Error('环境变量必须是数组格式'));
                }
                for (let i = 0; i < value.length; i++) {
                  const env = value[i];
                  if (!env.name || typeof env.name !== 'string') {
                    return Promise.reject(new Error(`环境变量 ${i + 1} 缺少有效的名称`));
                  }
                  if (env.value === undefined || env.value === null) {
                    return Promise.reject(new Error(`环境变量 ${i + 1} 缺少值`));
                  }
                  // Check for duplicate names
                  const duplicates = value.filter(e => e.name === env.name);
                  if (duplicates.length > 1) {
                    return Promise.reject(new Error(`环境变量名称重复: ${env.name}`));
                  }
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <JsonEditor fieldType="envs" placeholder="配置环境变量" />
        </Form.Item>
      </Card>

      {/* Pipeline Configuration Section */}
      <Card title="管道配置" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="pipeline_mode"
              label="管道模式"
              rules={[{ required: true, message: '请选择管道模式' }]}
            >
              <Select placeholder="选择管道模式">
                <Option value={PipelineMode.DEFAULT}>默认</Option>
                <Option value={PipelineMode.FAST}>快速</Option>
                <Option value={PipelineMode.QUALITY}>高质量</Option>
                <Option value={PipelineMode.BALANCED}>平衡</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fps"
              label={
                <span>
                  FPS
                  <Tooltip title="每秒帧数，留空使用默认值">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
            >
              <InputNumber
                min={1}
                max={120}
                placeholder="FPS（可选）"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="quant_mode"
              label="量化模式"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="distill_mode"
              label="蒸馏模式"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="m405_mode"
              label="M405模式"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="checkpoint_path"
          label={
            <span>
              检查点路径
              <Tooltip title="模型检查点文件路径，留空使用默认路径">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
        >
          <Input placeholder="检查点路径（可选）" />
        </Form.Item>
      </Card>

      {/* Resource Configuration Section */}
      <Card title="资源配置" style={{ marginBottom: 16 }}>


        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="pp"
              label={
                <span>
                  PP (Pipeline Parallelism)
                  <Tooltip title="管道并行度，将模型分割到多个GPU上">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: '请输入PP值' },
                { type: 'number', min: 1, max: 64, message: 'PP值应在1-64之间' }
              ]}
            >
              <InputNumber min={1} max={64} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="cp"
              label={
                <span>
                  CP (Context Parallelism)
                  <Tooltip title="上下文并行度，处理长序列时的并行度">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: '请输入CP值' },
                { type: 'number', min: 1, max: 64, message: 'CP值应在1-64之间' }
              ]}
            >
              <InputNumber min={1} max={64} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="tp"
              label={
                <span>
                  TP (Tensor Parallelism)
                  <Tooltip title="张量并行度，在多个GPU上并行计算">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: '请输入TP值' },
                { type: 'number', min: 1, max: 64, message: 'TP值应在1-64之间' }
              ]}
            >
              <InputNumber min={1} max={64} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>



        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="n_workers"
              label={
                <span>
                  工作进程数
                  <Tooltip title="处理请求的工作进程数量">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: '请输入工作进程数' },
                { type: 'number', min: 1, message: '工作进程数不能小于1' }
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="model_version"
              label="模型版本"
              rules={[
                { required: true, message: '请输入模型版本' },
                { min: 1, max: 50, message: '模型版本长度应在1-50字符之间' }
              ]}
            >
              <Input placeholder="输入模型版本" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="task_concurrency"
              label={
                <span>
                  任务并发数
                  <Tooltip title="同时处理的任务数量">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: '请输入任务并发数' },
                { type: 'number', min: 1, max: 100, message: '任务并发数应在1-100之间' }
              ]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="celery_task_concurrency"
              label={
                <span>
                  Celery任务并发数
                  <Tooltip title="Celery任务并发数，留空使用默认值">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { type: 'number', min: 1, max: 100, message: 'Celery任务并发数应在1-100之间' }
              ]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Advanced Options Section */}
      <Card title="高级选项" style={{ marginBottom: 16 }}>
        {/* Video Processing Options */}
        <Title level={5}>视频处理选项</Title>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="separate_video_encode"
              label="独立视频编码"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="separate_video_decode"
              label="独立视频解码"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="separate_t5_encode"
              label="独立T5编码"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Storage Configuration */}
        <Title level={5}>存储配置</Title>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="vae_store_type"
              label="VAE存储类型"
              rules={[{ required: true, message: '请选择VAE存储类型' }]}
            >
              <Select placeholder="选择VAE存储类型">
                <Option value={StoreType.REDIS}>Redis</Option>
                <Option value={StoreType.MEMORY}>内存</Option>
                <Option value={StoreType.DISK}>磁盘</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="t5_store_type"
              label="T5存储类型"
              rules={[{ required: true, message: '请选择T5存储类型' }]}
            >
              <Select placeholder="选择T5存储类型">
                <Option value={StoreType.REDIS}>Redis</Option>
                <Option value={StoreType.MEMORY}>内存</Option>
                <Option value={StoreType.DISK}>磁盘</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Performance Options */}
        <Title level={5}>性能选项</Title>
        <Form.Item
          name="enable_cuda_graph"
          label="启用CUDA图"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider />

        {/* Ephemeral Configuration */}
        <Title level={5}>临时实例配置</Title>
        <Form.Item
          name="ephemeral"
          label={
            <span>
              临时实例
              <Tooltip title="临时实例会在指定时间段内自动启动和停止">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          valuePropName="checked"
        >
          <Switch onChange={handleEphemeralChange} />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
          prevValues.ephemeral !== currentValues.ephemeral
        }>
          {({ getFieldValue }) => {
            const isEphemeral = getFieldValue('ephemeral');
            return isEphemeral ? (
              <>
                <Alert
                  message="临时实例配置"
                  description="配置临时实例的相关参数，包括最小运行周期和相关标识。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="ephemeral_min_period_seconds"
                      label={
                        <span>
                          最小周期（秒）
                          <Tooltip title="实例运行的最小时间，防止频繁启停">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                        </span>
                      }
                      rules={[
                        { type: 'number', min: 60, max: 86400, message: '最小周期应在60-86400秒之间（1分钟到24小时）' }
                      ]}
                    >
                      <InputNumber
                        min={60}
                        max={86400}
                        style={{ width: '100%' }}
                        addonAfter="秒"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="ephemeral_from"
                      label="ephemeral来源"
                      rules={[
                        { required: false, message: '请输入ephemeral来源' }
                      ]}
                    >
                      <Input placeholder="请输入ephemeral来源标识" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="ephemeral_to"
                      label="ephemeral目标"
                      rules={[
                        { required: false, message: '请输入ephemeral目标' }
                      ]}
                    >
                      <Input placeholder="请输入ephemeral目标标识" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          name="nonce"
          label={
            <span>
              Nonce
              <Tooltip title="随机数，用于唯一标识，留空自动生成">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
        >
          <Input placeholder="Nonce（可选）" />
        </Form.Item>
      </Card>

      {/* Form Actions */}
      <Card>
        <Row justify="end">
          <Col>
            <Space>
              <Button onClick={onCancel} disabled={loading}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {mode === 'create' ? '创建实例' : '更新实例'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};