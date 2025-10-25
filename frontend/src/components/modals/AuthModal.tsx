import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useResponsive } from '../../hooks/useResponsive';
import { 
  sanitizeInput, 
  validateUsername, 
  validatePassword, 
  authRateLimiter, 
  secureLog 
} from '../../utils/securityUtils';

export interface AuthModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Loading state during authentication */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Success callback after authentication */
  onSuccess: (username: string, password: string) => Promise<void>;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Clear error callback */
  onClearError?: () => void;
}

interface AuthFormData {
  username: string;
  password: string;
}

/**
 * AuthModal Component
 * 
 * A modal dialog for user authentication with username and password.
 * Features:
 * - Form validation for required fields
 * - Loading states during authentication
 * - Error display and handling
 * - Prevents modal dismissal until authentication succeeds
 * - Responsive design for mobile and desktop
 * - Keyboard navigation and accessibility
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  loading = false,
  error,
  onSuccess,
  onError,
  onClearError
}) => {
  const [form] = Form.useForm<AuthFormData>();
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const { isMobile, isTablet, screenWidth } = useResponsive();

  // Clear error when form values change
  useEffect(() => {
    if (error && onClearError) {
      const handleFormChange = () => {
        onClearError();
      };

      form.getFieldsValue();
      // Listen for form field changes
      const unsubscribe = form.getFieldsValue;
      
      return () => {
        // Cleanup if needed
      };
    }
  }, [error, onClearError, form]);

  // Handle form submission
  const handleSubmit = async (values: AuthFormData) => {
    if (submitting || loading) return;

    // Clear previous errors
    setSubmitting(true);
    setRateLimitError(null);
    onClearError?.();

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(values.username);
    const sanitizedPassword = values.password; // Don't sanitize password as it might contain special chars

    // Validate inputs
    const usernameValidation = validateUsername(sanitizedUsername);
    if (!usernameValidation.isValid) {
      onError?.(new Error(usernameValidation.error));
      setSubmitting(false);
      secureLog.securityEvent('invalid_username_format', { 
        username: sanitizedUsername,
        error: usernameValidation.error 
      });
      return;
    }

    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.isValid) {
      onError?.(new Error(passwordValidation.error));
      setSubmitting(false);
      secureLog.securityEvent('invalid_password_format', { 
        username: sanitizedUsername,
        error: passwordValidation.error 
      });
      return;
    }

    // Check rate limiting
    const rateLimitKey = `auth_${sanitizedUsername}`;
    if (!authRateLimiter.isAllowed(rateLimitKey)) {
      const timeUntilReset = authRateLimiter.getTimeUntilReset(rateLimitKey);
      const minutesUntilReset = Math.ceil(timeUntilReset / 60000);
      const errorMsg = `登录尝试过于频繁，请在 ${minutesUntilReset} 分钟后重试`;
      setRateLimitError(errorMsg);
      setSubmitting(false);
      secureLog.securityEvent('rate_limit_exceeded', { 
        username: sanitizedUsername,
        timeUntilReset,
        remainingAttempts: authRateLimiter.getRemainingAttempts(rateLimitKey)
      });
      return;
    }

    // Record the attempt
    authRateLimiter.recordAttempt(rateLimitKey);

    try {
      await onSuccess(sanitizedUsername, sanitizedPassword);
      // Clear rate limit on successful authentication
      authRateLimiter.clearAttempts(rateLimitKey);
      secureLog.authAttempt(sanitizedUsername, true);
      // Modal will be closed by parent component on success
    } catch (error) {
      console.error('Authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      secureLog.authAttempt(sanitizedUsername, false, errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form validation failure
  const handleSubmitFailed = (errorInfo: any) => {
    console.log('Form validation failed:', errorInfo);
    // Focus on first error field
    const firstErrorField = errorInfo.errorFields?.[0]?.name?.[0];
    if (firstErrorField) {
      form.getFieldInstance(firstErrorField)?.focus();
    }
  };

  // Calculate responsive modal width
  const getModalWidth = () => {
    if (isMobile) {
      return '90vw';
    } else if (isTablet) {
      return '400px';
    } else {
      return '400px';
    }
  };

  // Calculate responsive modal body style
  const getModalBodyStyle = () => {
    const padding = isMobile ? '16px' : '24px';
    
    return {
      padding
    };
  };

  const isLoading = loading || submitting;

  return (
    <Modal
      title="身份验证"
      open={visible}
      onCancel={undefined} // Prevent closing until authentication succeeds
      footer={null} // Form handles its own buttons
      width={getModalWidth()}
      centered={!isMobile}
      destroyOnClose={false} // Keep form state
      maskClosable={false} // Prevent closing by clicking mask
      closable={false} // Prevent closing with X button
      keyboard={false} // Prevent closing with ESC key
      styles={{
        body: getModalBodyStyle(),
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
      }}
      style={isMobile ? { 
        top: 20,
        paddingBottom: 0,
        margin: '0 auto'
      } : undefined}
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
    >
      <div id="auth-modal-description" className="sr-only">
        请输入用户名和密码进行身份验证以访问系统
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ 
          textAlign: 'center', 
          color: '#666', 
          margin: 0,
          fontSize: isMobile ? '14px' : '16px'
        }}>
          请输入您的凭据以访问系统
        </p>
      </div>

      {(error || rateLimitError) && (
        <Alert
          message={rateLimitError ? "访问受限" : "认证失败"}
          description={rateLimitError || error}
          type="error"
          showIcon
          closable
          onClose={() => {
            setRateLimitError(null);
            onClearError?.();
          }}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        name="auth-form"
        onFinish={handleSubmit}
        onFinishFailed={handleSubmitFailed}
        autoComplete="off"
        layout="vertical"
        size={isMobile ? 'middle' : 'large'}
        disabled={isLoading}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 1, message: '用户名不能为空' },
            { max: 50, message: '用户名长度不能超过50个字符' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const sanitized = sanitizeInput(value);
                const validation = validateUsername(sanitized);
                return validation.isValid 
                  ? Promise.resolve() 
                  : Promise.reject(new Error(validation.error));
              }
            }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入用户名"
            autoComplete="username"
            autoFocus
            maxLength={50}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 1, message: '密码不能为空' },
            { max: 200, message: '密码长度不能超过200个字符' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const validation = validatePassword(value);
                return validation.isValid 
                  ? Promise.resolve() 
                  : Promise.reject(new Error(validation.error));
              }
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            autoComplete="current-password"
            maxLength={200}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size={isMobile ? 'middle' : 'large'}
            >
              {isLoading ? '验证中...' : '登录'}
            </Button>
            
            {isMobile && (
              <div style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#999',
                marginTop: 16
              }}>
                需要验证身份才能继续使用系统
              </div>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AuthModal;