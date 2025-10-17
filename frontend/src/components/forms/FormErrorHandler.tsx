/**
 * FormErrorHandler Component
 * Enhanced form error handling with field-specific error display and validation
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Space, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import { 
  FormErrorDisplay, 
  ValidationErrorDisplay
} from '../common/ErrorDisplay';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { validateFormData } from '../../utils/formUtils';
import type { InstanceFormData } from '../../types/instance';

const { Text } = Typography;

/**
 * Form error context
 */
export interface FormErrorContext {
  fieldErrors: Record<string, string[]>;
  generalErrors: string[];
  validationErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  hasErrors: boolean;
  isSubmitting: boolean;
}

/**
 * Props for FormErrorHandler
 */
export interface FormErrorHandlerProps {
  form: FormInstance;
  formName?: string;
  onErrorChange?: (errorContext: FormErrorContext) => void;
  showFieldErrors?: boolean;
  showValidationErrors?: boolean;
  showGeneralErrors?: boolean;
  autoValidate?: boolean;
  children?: React.ReactNode;
}

/**
 * FormErrorHandler component
 */
export const FormErrorHandler: React.FC<FormErrorHandlerProps> = ({
  form,
  formName = 'form',
  onErrorChange,
  showFieldErrors = true,
  showValidationErrors = true,
  showGeneralErrors = true,
  autoValidate = true,
  children
}) => {
  const [errorContext, setErrorContext] = useState<FormErrorContext>({
    fieldErrors: {},
    generalErrors: [],
    validationErrors: [],
    hasErrors: false,
    isSubmitting: false
  });

  const { handleFormError } = useErrorHandler({
    component: 'FormErrorHandler',
    action: 'form_validation',
    metadata: { formName }
  });

  /**
   * Update error context
   */
  const updateErrorContext = useCallback((newContext: Partial<FormErrorContext>) => {
    setErrorContext(prev => {
      const updated = { ...prev, ...newContext };
      updated.hasErrors = 
        Object.keys(updated.fieldErrors).length > 0 ||
        updated.generalErrors.length > 0 ||
        updated.validationErrors.length > 0;
      
      onErrorChange?.(updated);
      return updated;
    });
  }, [onErrorChange]);

  /**
   * Handle form field errors
   */
  const handleFieldErrors = useCallback((errors: any) => {
    const fieldErrors: Record<string, string[]> = {};
    
    if (errors && Array.isArray(errors)) {
      errors.forEach(error => {
        if (error.name && error.errors) {
          const fieldName = Array.isArray(error.name) ? error.name.join('.') : error.name;
          fieldErrors[fieldName] = error.errors;
        }
      });
    }
    
    updateErrorContext({ fieldErrors });
  }, [updateErrorContext]);

  /**
   * Handle validation errors
   */
  const handleValidationErrors = useCallback((formData: any) => {
    if (!autoValidate) return;
    
    try {
      const validationErrors = validateFormData(formData as InstanceFormData);
      const validationErrorObjects = validationErrors.map(error => ({
        field: 'general',
        message: error,
        value: undefined
      }));
      
      updateErrorContext({ validationErrors: validationErrorObjects });
    } catch (error) {
      console.warn('Form validation failed:', error);
    }
  }, [autoValidate, updateErrorContext]);

  /**
   * Handle submission errors
   */
  const handleSubmissionError = useCallback((error: any) => {
    const { hasErrors, fieldErrors, generalErrors } = handleFormError(error, formName);
    
    if (hasErrors) {
      updateErrorContext({ fieldErrors, generalErrors });
      
      // Focus on first error field
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        form.scrollToField(firstErrorField);
      }
    }
  }, [handleFormError, formName, updateErrorContext, form]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    updateErrorContext({
      fieldErrors: {},
      generalErrors: [],
      validationErrors: [],
      hasErrors: false
    });
  }, [updateErrorContext]);

  /**
   * Clear specific field error
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrorContext(prev => {
      const newFieldErrors = { ...prev.fieldErrors };
      delete newFieldErrors[fieldName];
      
      const updated = {
        ...prev,
        fieldErrors: newFieldErrors
      };
      
      updated.hasErrors = 
        Object.keys(updated.fieldErrors).length > 0 ||
        updated.generalErrors.length > 0 ||
        updated.validationErrors.length > 0;
      
      onErrorChange?.(updated);
      return updated;
    });
  }, [onErrorChange]);

  /**
   * Handle field focus for error navigation
   */
  const handleFieldFocus = useCallback((fieldName: string) => {
    form.scrollToField(fieldName);
    
    // Clear field error when user focuses on it
    setTimeout(() => {
      clearFieldError(fieldName);
    }, 100);
  }, [form, clearFieldError]);

  /**
   * Set up form event listeners
   */
  useEffect(() => {
    const handleFieldsChange = () => {
      const formErrors = form.getFieldsError();
      handleFieldErrors(formErrors);
    };

    const handleValuesChange = () => {
      const formData = form.getFieldsValue();
      handleValidationErrors(formData);
    };

    // Initial validation
    handleFieldsChange();
    handleValuesChange();

    // Note: Ant Design Form doesn't have setCallbacks method
    // We'll handle this through form props instead
  }, [form, handleFieldErrors, handleValidationErrors]);

  /**
   * Expose methods to parent components
   */
  useEffect(() => {
    // Add methods to form instance for external access
    (form as any).errorHandler = {
      handleSubmissionError,
      clearErrors,
      clearFieldError,
      getErrorContext: () => errorContext
    };
  }, [form, handleSubmissionError, clearErrors, clearFieldError, errorContext]);

  return (
    <div>
      {/* General Errors */}
      {showGeneralErrors && errorContext.generalErrors.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="error"
            showIcon
            message="表单提交失败"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {errorContext.generalErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
          />
        </div>
      )}

      {/* Field Errors */}
      {showFieldErrors && Object.keys(errorContext.fieldErrors).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <FormErrorDisplay
            errors={errorContext.fieldErrors}
            title="字段验证错误"
            showFieldNames={true}
          />
        </div>
      )}

      {/* Validation Errors */}
      {showValidationErrors && errorContext.validationErrors.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <ValidationErrorDisplay
            validationErrors={errorContext.validationErrors}
            title="数据验证失败"
            onFieldFocus={handleFieldFocus}
          />
        </div>
      )}

      {/* Error Summary */}
      {errorContext.hasErrors && (
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message={
              <Space>
                <Text>发现 {
                  Object.keys(errorContext.fieldErrors).length + 
                  errorContext.generalErrors.length + 
                  errorContext.validationErrors.length
                } 个错误</Text>
              </Space>
            }
            description="请修正上述错误后重新提交表单"
          />
        </div>
      )}

      {children}
    </div>
  );
};

/**
 * Hook for using form error handler
 */
export const useFormErrorHandler = (form: FormInstance, formName?: string) => {
  const { handleFormError } = useErrorHandler({
    component: 'useFormErrorHandler',
    action: 'form_handling',
    metadata: { formName }
  });

  const handleSubmissionError = useCallback((error: any) => {
    const errorResult = handleFormError(error, formName);
    
    // Set form fields errors
    if (errorResult.fieldErrors && Object.keys(errorResult.fieldErrors).length > 0) {
      const formErrors = Object.entries(errorResult.fieldErrors).map(([field, errors]) => ({
        name: field,
        errors
      }));
      
      form.setFields(formErrors);
    }
    
    return errorResult;
  }, [form, handleFormError, formName]);

  const clearFormErrors = useCallback(() => {
    form.setFields(
      form.getFieldsError().map(({ name }) => ({
        name,
        errors: []
      }))
    );
  }, [form]);

  const validateAndSubmit = useCallback(async (
    submitFn: (values: any) => Promise<any>
  ) => {
    try {
      const values = await form.validateFields();
      return await submitFn(values);
    } catch (error: any) {
      if (error.errorFields) {
        // Ant Design validation errors
        return Promise.reject(error);
      } else {
        // Submission errors
        handleSubmissionError(error);
        return Promise.reject(error);
      }
    }
  }, [form, handleSubmissionError]);

  return {
    handleSubmissionError,
    clearFormErrors,
    validateAndSubmit
  };
};

export default FormErrorHandler;