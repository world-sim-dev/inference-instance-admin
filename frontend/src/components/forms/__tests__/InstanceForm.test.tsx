/**
 * InstanceForm Component Tests
 * Tests for the instance creation and editing form
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockInstance, createMockCreateInstanceData } from '../../../test/utils';
import { InstanceForm } from '../InstanceForm';
import type { InstanceFormProps } from '../InstanceForm';
import { Status, StoreType, PipelineMode, Priority } from '../../../types/enums';

// Mock JsonEditor component
vi.mock('../JsonEditor', () => ({
  JsonEditor: ({ fieldType, placeholder, value, onChange }: any) => (
    <div data-testid={`json-editor-${fieldType}`}>
      <input
        data-testid={`json-editor-input-${fieldType}`}
        placeholder={placeholder}
        value={JSON.stringify(value || [])}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onChange?.(parsed);
          } catch {
            // Invalid JSON, ignore
          }
        }}
      />
    </div>
  ),
}));

describe('InstanceForm', () => {
  const mockHandlers = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  const defaultProps: InstanceFormProps = {
    ...mockHandlers,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render create form correctly', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Check form sections
      expect(screen.getByText('基础信息')).toBeInTheDocument();
      expect(screen.getByText('管道配置')).toBeInTheDocument();
      expect(screen.getByText('资源配置')).toBeInTheDocument();
      expect(screen.getByText('高级选项')).toBeInTheDocument();

      // Check submit button text for create mode
      expect(screen.getByText('创建实例')).toBeInTheDocument();
    });

    it('should render edit form correctly', () => {
      const instance = createMockCreateInstanceData();
      renderWithProviders(<InstanceForm {...defaultProps} instance={instance} />);

      // Check submit button text for edit mode
      expect(screen.getByText('更新实例')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      renderWithProviders(<InstanceForm {...defaultProps} loading={true} />);

      const submitButton = screen.getByText('创建实例');
      expect(submitButton).toBeDisabled();
      expect(submitButton.closest('.ant-btn')).toHaveClass('ant-btn-loading');
    });
  });

  describe('form fields', () => {
    it('should render all required basic fields', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Basic information fields
      expect(screen.getByLabelText('实例名称')).toBeInTheDocument();
      expect(screen.getByLabelText('状态')).toBeInTheDocument();
      expect(screen.getByLabelText('模型名称')).toBeInTheDocument();
      expect(screen.getByLabelText('模型版本')).toBeInTheDocument();
      expect(screen.getByLabelText('集群名称')).toBeInTheDocument();
      expect(screen.getByLabelText('镜像标签')).toBeInTheDocument();
      expect(screen.getByLabelText('描述')).toBeInTheDocument();
    });

    it('should render pipeline configuration fields', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      expect(screen.getByLabelText('管道模式')).toBeInTheDocument();
      expect(screen.getByLabelText('FPS')).toBeInTheDocument();
      expect(screen.getByLabelText('量化模式')).toBeInTheDocument();
      expect(screen.getByLabelText('蒸馏模式')).toBeInTheDocument();
      expect(screen.getByLabelText('M405模式')).toBeInTheDocument();
      expect(screen.getByLabelText('检查点路径')).toBeInTheDocument();
    });

    it('should render resource configuration fields', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      expect(screen.getByLabelText(/PP \(Pipeline Parallelism\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/CP \(Context Parallelism\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/TP \(Tensor Parallelism\)/)).toBeInTheDocument();
      expect(screen.getByLabelText('工作进程数')).toBeInTheDocument();
      expect(screen.getByLabelText('副本数')).toBeInTheDocument();
      expect(screen.getByLabelText('任务并发数')).toBeInTheDocument();
      expect(screen.getByLabelText('Celery任务并发数')).toBeInTheDocument();
    });

    it('should render advanced options fields', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      expect(screen.getByLabelText('独立视频编码')).toBeInTheDocument();
      expect(screen.getByLabelText('独立视频解码')).toBeInTheDocument();
      expect(screen.getByLabelText('独立T5编码')).toBeInTheDocument();
      expect(screen.getByLabelText('VAE存储类型')).toBeInTheDocument();
      expect(screen.getByLabelText('T5存储类型')).toBeInTheDocument();
      expect(screen.getByLabelText('启用CUDA图')).toBeInTheDocument();
      expect(screen.getByLabelText('临时实例')).toBeInTheDocument();
      expect(screen.getByLabelText('Nonce')).toBeInTheDocument();
    });
  });

  describe('form initialization', () => {
    it('should initialize with default values in create mode', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Check some default values
      const nameInput = screen.getByLabelText('实例名称') as HTMLInputElement;
      expect(nameInput.value).toBe('');

      const ppInput = screen.getByLabelText(/PP \(Pipeline Parallelism\)/) as HTMLInputElement;
      expect(ppInput.value).toBe('1');
    });

    it('should initialize with instance data in edit mode', () => {
      const instance = createMockCreateInstanceData({
        name: 'test-instance',
        model_name: 'test-model',
        pp: 2,
        cp: 1,
        tp: 4,
      });

      renderWithProviders(<InstanceForm {...defaultProps} instance={instance} />);

      const nameInput = screen.getByLabelText('实例名称') as HTMLInputElement;
      expect(nameInput.value).toBe('test-instance');

      const modelInput = screen.getByLabelText('模型名称') as HTMLInputElement;
      expect(modelInput.value).toBe('test-model');

      const ppInput = screen.getByLabelText(/PP \(Pipeline Parallelism\)/) as HTMLInputElement;
      expect(ppInput.value).toBe('2');
    });
  });

  describe('form validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      const submitButton = screen.getByText('创建实例');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入实例名称')).toBeInTheDocument();
        expect(screen.getByText('请选择状态')).toBeInTheDocument();
        expect(screen.getByText('请输入模型名称')).toBeInTheDocument();
        expect(screen.getByText('请输入模型版本')).toBeInTheDocument();
      });

      expect(mockHandlers.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate instance name format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('实例名称');
      await user.type(nameInput, 'invalid name with spaces');

      const submitButton = screen.getByText('创建实例');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('实例名称只能包含字母、数字、下划线和连字符')).toBeInTheDocument();
      });
    });

    it('should validate numeric field ranges', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      const ppInput = screen.getByLabelText(/PP \(Pipeline Parallelism\)/);
      await user.clear(ppInput);
      await user.type(ppInput, '100');

      const submitButton = screen.getByText('创建实例');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('PP值应在1-64之间')).toBeInTheDocument();
      });
    });

    it('should validate resource allocation warning', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Set high values that would require many GPUs
      const ppInput = screen.getByLabelText(/PP \(Pipeline Parallelism\)/);
      const cpInput = screen.getByLabelText(/CP \(Context Parallelism\)/);
      const tpInput = screen.getByLabelText(/TP \(Tensor Parallelism\)/);

      await user.clear(ppInput);
      await user.type(ppInput, '4');
      await user.clear(cpInput);
      await user.type(cpInput, '2');
      await user.clear(tpInput);
      await user.type(tpInput, '2');

      await waitFor(() => {
        expect(screen.getByText(/当前配置需要 16 个GPU/)).toBeInTheDocument();
      });
    });

    it('should validate worker and replica relationship', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      const workersInput = screen.getByLabelText('工作进程数');
      const replicasInput = screen.getByLabelText('副本数');

      await user.clear(workersInput);
      await user.type(workersInput, '32');
      await user.clear(replicasInput);
      await user.type(replicasInput, '3');

      const submitButton = screen.getByText('创建实例');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('工作进程数 × 副本数不应超过64')).toBeInTheDocument();
      });
    });
  });

  describe('ephemeral configuration', () => {
    it('should show ephemeral fields when ephemeral is enabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      const ephemeralSwitch = screen.getByLabelText('临时实例');
      await user.click(ephemeralSwitch);

      await waitFor(() => {
        expect(screen.getByLabelText('最小周期（秒）')).toBeInTheDocument();
        expect(screen.getByLabelText('ephemeral来源')).toBeInTheDocument();
        expect(screen.getByLabelText('ephemeral目标')).toBeInTheDocument();
      });
    });

    it('should hide ephemeral fields when ephemeral is disabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Ephemeral fields should not be visible initially
      expect(screen.queryByLabelText('最小周期（秒）')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('ephemeral来源')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('ephemeral目标')).not.toBeInTheDocument();
    });

    it('should show ephemeral configuration fields when enabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Enable ephemeral
      const ephemeralSwitch = screen.getByLabelText('临时实例');
      await user.click(ephemeralSwitch);

      await waitFor(() => {
        expect(screen.getByLabelText('ephemeral来源')).toBeInTheDocument();
        expect(screen.getByLabelText('ephemeral目标')).toBeInTheDocument();
        expect(screen.getByLabelText('最小周期（秒）')).toBeInTheDocument();
      });
    });

    it('should allow setting ephemeral source and target', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Enable ephemeral
      const ephemeralSwitch = screen.getByLabelText('临时实例');
      await user.click(ephemeralSwitch);

      await waitFor(() => {
        expect(screen.getByLabelText('ephemeral来源')).toBeInTheDocument();
      });

      // Set ephemeral source and target
      const fromInput = screen.getByLabelText('ephemeral来源');
      const toInput = screen.getByLabelText('ephemeral目标');

      await user.type(fromInput, 'source-identifier');
      await user.type(toInput, 'target-identifier');

      expect(fromInput).toHaveValue('source-identifier');
      expect(toInput).toHaveValue('target-identifier');
    });
  });

  describe('form submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      mockHandlers.onSubmit.mockResolvedValue(undefined);

      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText('实例名称'), 'test-instance');
      await user.selectOptions(screen.getByLabelText('状态'), Status.ACTIVE);
      await user.type(screen.getByLabelText('模型名称'), 'test-model');
      await user.type(screen.getByLabelText('模型版本'), '1.0.0');
      await user.type(screen.getByLabelText('集群名称'), 'test-cluster');
      await user.type(screen.getByLabelText('镜像标签'), 'latest');

      // Set priorities using JsonEditor mock
      const prioritiesInput = screen.getByTestId('json-editor-input-priorities');
      await user.clear(prioritiesInput);
      await user.type(prioritiesInput, '["normal"]');

      const submitButton = screen.getByText('创建实例');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'test-instance',
            status: Status.ACTIVE,
            model_name: 'test-model',
            model_version: '1.0.0',
            cluster_name: 'test-cluster',
            image_tag: 'latest',
            priorities: ['normal'],
          })
        );
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const error = new Error('Submission failed');
      mockHandlers.onSubmit.mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText('实例名称'), 'test-instance');
      await user.selectOptions(screen.getByLabelText('状态'), Status.ACTIVE);
      await user.type(screen.getByLabelText('模型名称'), 'test-model');
      await user.type(screen.getByLabelText('模型版本'), '1.0.0');
      await user.type(screen.getByLabelText('集群名称'), 'test-cluster');
      await user.type(screen.getByLabelText('镜像标签'), 'latest');

      const prioritiesInput = screen.getByTestId('json-editor-input-priorities');
      await user.clear(prioritiesInput);
      await user.type(prioritiesInput, '["normal"]');

      const submitButton = screen.getByText('创建实例');
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', error);
      });

      consoleSpy.mockRestore();
    });

    it('should serialize form data correctly', async () => {
      const user = userEvent.setup();
      mockHandlers.onSubmit.mockResolvedValue(undefined);

      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Fill form with various data types
      await user.type(screen.getByLabelText('实例名称'), 'test-instance');
      await user.selectOptions(screen.getByLabelText('状态'), Status.ACTIVE);
      await user.type(screen.getByLabelText('模型名称'), 'test-model');
      await user.type(screen.getByLabelText('模型版本'), '1.0.0');
      await user.type(screen.getByLabelText('集群名称'), 'test-cluster');
      await user.type(screen.getByLabelText('镜像标签'), 'latest');

      // Set numeric values
      const fpsInput = screen.getByLabelText('FPS');
      await user.clear(fpsInput);
      await user.type(fpsInput, '30');

      // Set boolean values
      const quantSwitch = screen.getByLabelText('量化模式');
      await user.click(quantSwitch);

      // Set priorities
      const prioritiesInput = screen.getByTestId('json-editor-input-priorities');
      await user.clear(prioritiesInput);
      await user.type(prioritiesInput, '["high", "normal"]');

      const submitButton = screen.getByText('创建实例');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'test-instance',
            fps: 30,
            quant_mode: true,
            priorities: ['high', 'normal'],
            envs: [],
          })
        );
      });
    });
  });

  describe('form actions', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InstanceForm {...defaultProps} />);

      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);

      expect(mockHandlers.onCancel).toHaveBeenCalled();
    });

    it('should disable cancel button when loading', () => {
      renderWithProviders(<InstanceForm {...defaultProps} loading={true} />);

      const cancelButton = screen.getByText('取消');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('tooltips and help text', () => {
    it('should show tooltips for complex fields', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Check for tooltip icons
      const tooltipIcons = screen.getAllByTestId('InfoCircleOutlined');
      expect(tooltipIcons.length).toBeGreaterThan(0);
    });

    it('should show alerts for important information', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      expect(screen.getByText('资源配置提示')).toBeInTheDocument();
      expect(screen.getByText(/PP × CP × TP 的乘积不应超过可用GPU数量/)).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should render form fields in responsive grid', () => {
      renderWithProviders(<InstanceForm {...defaultProps} />);

      // Check that form uses Ant Design's responsive grid system
      const rows = document.querySelectorAll('.ant-row');
      expect(rows.length).toBeGreaterThan(0);

      const cols = document.querySelectorAll('.ant-col');
      expect(cols.length).toBeGreaterThan(0);
    });
  });
});