# 错误处理系统文档

本文档描述了React前端应用程序的综合错误处理系统，包括错误分类、用户友好的消息显示、重试机制和表单验证错误处理。

## 系统概述

错误处理系统由以下几个核心部分组成：

1. **错误分类和结构化** (`errorUtils.ts`)
2. **重试机制** (`retryUtils.ts`)
3. **错误显示组件** (`ErrorDisplay.tsx`)
4. **表单错误处理** (`FormErrorHandler.tsx`)
5. **全局错误处理Hook** (`useErrorHandler.ts`)
6. **增强的错误边界** (`ErrorBoundary.tsx`)

## 核心功能

### 1. 错误分类

系统自动将错误分类为以下类型：

- **网络错误** (NETWORK) - 连接失败、DNS错误、SSL错误等
- **验证错误** (VALIDATION) - 表单验证失败、数据格式错误
- **认证错误** (AUTHENTICATION) - 401状态码，身份验证失败
- **授权错误** (AUTHORIZATION) - 403状态码，权限不足
- **资源不存在** (NOT_FOUND) - 404状态码
- **服务器错误** (SERVER) - 5xx状态码
- **客户端错误** (CLIENT) - 4xx状态码
- **超时错误** (TIMEOUT) - 请求超时
- **未知错误** (UNKNOWN) - 其他未分类错误

### 2. 错误严重程度

每个错误都会被分配一个严重程度级别：

- **LOW** - 低级别，通常是信息性错误
- **MEDIUM** - 中等级别，需要用户注意
- **HIGH** - 高级别，影响功能使用
- **CRITICAL** - 严重级别，系统关键错误

### 3. 重试机制

系统提供智能重试机制：

- **自动重试配置** - 基于错误类型自动配置重试参数
- **指数退避** - 避免服务器过载
- **抖动算法** - 减少重试风暴
- **最大重试限制** - 防止无限重试

## 使用指南

### 1. 基本错误处理

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleApiError } = useErrorHandler({
    component: 'MyComponent',
    action: 'data_loading'
  });

  const loadData = async () => {
    try {
      const data = await apiClient.getData();
      return data;
    } catch (error) {
      // 自动处理错误：分类、记录、显示用户友好消息
      handleApiError(error, '/api/data', 'GET');
      throw error;
    }
  };
};
```

### 2. 带重试的API调用

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';
import { RetryUtils } from '../utils/retryUtils';

const MyComponent = () => {
  const { handleApiError } = useErrorHandler();

  const loadDataWithRetry = async () => {
    try {
      const data = await RetryUtils.apiCall(() => apiClient.getData());
      return data;
    } catch (error) {
      handleApiError(error, '/api/data', 'GET');
      throw error;
    }
  };
};
```

### 3. 表单错误处理

```typescript
import { FormErrorHandler, useFormErrorHandler } from '../components/forms/FormErrorHandler';

const MyForm = () => {
  const [form] = Form.useForm();
  const { validateAndSubmit } = useFormErrorHandler(form, 'my-form');

  const handleSubmit = async () => {
    try {
      await validateAndSubmit(async (values) => {
        return await apiClient.submitForm(values);
      });
    } catch (error) {
      // 错误已由FormErrorHandler自动处理
      console.log('Form submission failed');
    }
  };

  return (
    <FormErrorHandler
      form={form}
      formName="my-form"
      showFieldErrors={true}
      showValidationErrors={true}
    >
      <Form form={form} onFinish={handleSubmit}>
        {/* 表单字段 */}
      </Form>
    </FormErrorHandler>
  );
};
```

### 4. 错误显示组件

```typescript
import { ErrorDisplay, NetworkErrorDisplay } from '../components/common/ErrorDisplay';

const MyComponent = () => {
  const [error, setError] = useState(null);

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          title="操作失败"
          showDetails={true}
          showRetry={true}
          onRetry={() => retryOperation()}
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  );
};
```

### 5. 网络错误特殊处理

```typescript
import { NetworkErrorDisplay } from '../components/common/ErrorDisplay';

const MyComponent = () => {
  const [networkError, setNetworkError] = useState(null);

  return (
    <div>
      {networkError && (
        <NetworkErrorDisplay
          error={networkError}
          onRetry={() => retryNetworkOperation()}
          showOfflineStatus={true}
        />
      )}
    </div>
  );
};
```

## 配置选项

### 错误处理器配置

```typescript
const { handleError } = useErrorHandler(
  // 错误上下文
  {
    component: 'MyComponent',
    action: 'data_operation',
    userId: 'user123',
    metadata: { additionalInfo: 'value' }
  },
  // 配置选项
  {
    showNotification: true,    // 显示通知
    showToast: false,         // 显示Toast消息
    logError: true,           // 记录错误日志
    reportError: true,        // 报告错误到监控服务
    autoRetry: false,         // 自动重试
    retryOptions: {           // 重试配置
      maxRetries: 3,
      delay: 1000,
      backoff: true
    }
  }
);
```

### 重试配置

```typescript
import { withRetry, withSmartRetry } from '../utils/retryUtils';

// 基本重试
const result = await withRetry(
  () => apiCall(),
  {
    maxRetries: 3,
    delay: 1000,
    backoff: true,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, error.message);
    }
  }
);

// 智能重试（基于错误类型自动配置）
const result = await withSmartRetry(
  () => apiCall(),
  {
    onRetry: (error, attempt) => {
      console.log(`Smart retry attempt ${attempt}`);
    }
  }
);
```

## 最佳实践

### 1. 错误处理层次

1. **组件级别** - 使用 `useErrorHandler` 处理组件特定错误
2. **表单级别** - 使用 `FormErrorHandler` 处理表单验证错误
3. **API级别** - 在API客户端中统一处理HTTP错误
4. **全局级别** - 使用 `ErrorBoundary` 捕获未处理的错误

### 2. 用户体验

- **友好的错误消息** - 避免技术术语，提供用户可理解的描述
- **解决方案建议** - 为用户提供可行的解决步骤
- **适当的重试机制** - 自动重试网络和服务器错误
- **错误状态指示** - 清楚地显示错误状态和严重程度

### 3. 开发体验

- **详细的错误信息** - 在开发模式下显示完整的错误详情
- **错误分类和统计** - 帮助开发者了解错误模式
- **错误报告** - 集成外部监控服务（如Sentry）
- **调试支持** - 提供错误复制和调试工具

### 4. 性能考虑

- **错误缓存** - 避免重复处理相同错误
- **批量错误处理** - 合并相似错误的显示
- **内存管理** - 及时清理错误状态和监听器
- **异步错误处理** - 避免阻塞UI渲染

## 扩展和自定义

### 1. 自定义错误类型

```typescript
// 扩展错误类型枚举
export enum CustomErrorType {
  BUSINESS_LOGIC = 'business_logic',
  PERMISSION_DENIED = 'permission_denied',
  QUOTA_EXCEEDED = 'quota_exceeded'
}

// 自定义错误分类器
const customClassifyError = (error: any): StructuredError => {
  // 自定义错误分类逻辑
  if (error.code === 'BUSINESS_ERROR') {
    return {
      type: CustomErrorType.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: '业务逻辑错误',
      // ...其他属性
    };
  }
  
  // 回退到默认分类器
  return classifyError(error);
};
```

### 2. 自定义重试策略

```typescript
// 自定义重试装饰器
export const customRetryable = (options: CustomRetryOptions) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return withRetry(
        () => originalMethod.apply(this, args),
        {
          ...options,
          shouldRetry: (error, attempt) => {
            // 自定义重试逻辑
            return customShouldRetry(error, attempt, options);
          }
        }
      );
    };
    
    return descriptor;
  };
};
```

### 3. 集成外部监控服务

```typescript
// Sentry集成示例
import * as Sentry from '@sentry/react';

const reportErrorToSentry = (structuredError: StructuredError, context: ErrorContext) => {
  if (shouldReportError(structuredError)) {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', structuredError.type);
      scope.setLevel(getSentryLevel(structuredError.severity));
      scope.setContext('errorContext', context);
      
      Sentry.captureException(structuredError.details?.originalError || new Error(structuredError.message));
    });
  }
};
```

## 故障排除

### 常见问题

1. **错误未被捕获**
   - 确保使用了 `ErrorBoundary` 包装组件
   - 检查异步操作是否正确处理错误

2. **重试机制不工作**
   - 验证错误是否被标记为可重试
   - 检查重试配置是否正确

3. **表单错误显示不正确**
   - 确保使用了 `FormErrorHandler` 包装表单
   - 检查表单字段名称是否与错误字段匹配

4. **性能问题**
   - 检查是否有内存泄漏（未清理的监听器）
   - 优化错误处理逻辑，避免过度处理

### 调试技巧

1. **启用详细日志**
   ```typescript
   const { handleError } = useErrorHandler(context, {
     logError: true,
     showDetails: true
   });
   ```

2. **使用错误统计**
   ```typescript
   const { getErrorStats } = useErrorHandler();
   console.log('Error statistics:', getErrorStats());
   ```

3. **错误重现**
   - 使用 `ErrorHandlingDemo` 组件测试不同错误场景
   - 复制错误信息进行调试

## 总结

这个错误处理系统提供了全面的错误管理解决方案，包括：

- 🔍 **智能错误分类** - 自动识别和分类不同类型的错误
- 🔄 **自动重试机制** - 基于错误类型的智能重试策略
- 👥 **用户友好界面** - 清晰的错误消息和解决方案建议
- 🛠️ **开发者工具** - 详细的错误信息和调试支持
- 📊 **错误监控** - 错误统计和外部服务集成
- 🎯 **高度可定制** - 支持自定义错误类型和处理策略

通过使用这个系统，可以显著提高应用程序的稳定性和用户体验，同时为开发者提供强大的错误诊断和调试工具。