# 退出登录功能说明

## 功能概述

新增了退出登录（Logout）功能，用户可以安全地退出系统，退出后自动停止所有自动刷新操作。

## 功能特性

### 1. 退出登录按钮

**位置：** 页面右上角用户头像下拉菜单

**操作流程：**
1. 点击右上角用户头像
2. 在下拉菜单中选择"退出登录"
3. 系统弹出确认对话框
4. 确认后退出登录并返回登录页面

**界面元素：**
- 📍 位置：Header 右侧用户菜单
- 🔴 样式：红色危险按钮
- ⚠️ 确认：退出前需要二次确认

### 2. 自动刷新控制

**自动停止场景：**
- ✅ 用户点击退出登录
- ✅ Session 过期（1小时）
- ✅ 页面关闭或组件卸载

**Dashboard 自动刷新：**
- 手动开启/关闭（默认关闭）
- 间隔：30秒
- 退出登录后自动停止

**WorkingDashboard 自动刷新：**
- 已关闭默认自动刷新
- 用户可手动点击刷新按钮

## 技术实现

### 代码变更

#### 1. AppHeader.tsx

**新增功能：**
- 导入 `useAuthContext` 获取认证状态
- 实现 `handleLogout` 函数
- 添加退出确认对话框
- 显示当前登录用户名

**关键代码：**

```typescript
import { useAuthContext } from '../../contexts/useAuthContext';

const { state: authState, logout } = useAuthContext();

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    icon: <ExclamationCircleOutlined />,
    content: '确定要退出登录吗？退出后将清除本地会话信息。',
    okText: '确定退出',
    cancelText: '取消',
    okType: 'danger',
    onOk: () => {
      return new Promise((resolve) => {
        try {
          logout();
          message.success('已成功退出登录');
          resolve(true);
        } catch (error) {
          message.error('退出登录失败');
          resolve(false);
        }
      });
    },
  });
};
```

#### 2. Dashboard.tsx

**新增功能：**
- 监听认证状态变化
- 退出登录时自动停止自动刷新
- 组件卸载时清理定时器

**关键代码：**

```typescript
import { useAuthContext } from '../contexts/useAuthContext';

const { state: authState } = useAuthContext();

// Clean up auto refresh interval when component unmounts
useEffect(() => {
  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };
}, [refreshInterval]);

// Stop auto refresh when user logs out
useEffect(() => {
  if (!authState.isAuthenticated && refreshInterval) {
    clearInterval(refreshInterval);
    setRefreshInterval(null);
    setAutoRefresh(false);
    console.log('Auto refresh stopped due to logout');
  }
}, [authState.isAuthenticated, refreshInterval]);
```

#### 3. WorkingDashboard.tsx

**变更：**
- 关闭默认自动刷新
- 用户可手动刷新

**变更代码：**

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['instances'],
  queryFn: fetchInstances,
  // Auto refresh disabled - users can manually refresh if needed
  // refetchInterval: 30000,
});
```

### 认证流程

```
┌─────────────────────────────────────────────────────────────┐
│                        用户点击退出                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    显示确认对话框                             │
│   "确定要退出登录吗？退出后将清除本地会话信息。"                │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
          取消│                    确定│
             │                       │
             ▼                       ▼
┌────────────────────┐   ┌─────────────────────────────────┐
│   关闭对话框        │   │  执行 logout()                  │
└────────────────────┘   └──────────┬──────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │  1. 清除认证状态              │
                         │  2. 清除 sessionStorage       │
                         │  3. 清除 API client 凭证      │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │  AuthGuard 检测到未认证       │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │  显示登录对话框                │
                         └──────────────────────────────┘
                                    │
                         ┌──────────▼───────────────────┐
                         │  停止所有自动刷新 (useEffect)  │
                         └──────────────────────────────┘
```

## 使用指南

### 管理员操作

#### 1. 正常退出登录

**步骤：**
1. 点击右上角用户头像（显示用户名）
2. 选择"退出登录"
3. 在确认对话框中点击"确定退出"
4. 系统显示"已成功退出登录"
5. 自动返回登录页面

#### 2. 自动刷新管理

**Dashboard 页面：**
- 默认不开启自动刷新
- 点击"自动刷新"按钮可手动开启
- 开启后每30秒自动刷新一次
- 退出登录后自动停止刷新

**注意事项：**
- ⚠️ 自动刷新会增加服务器负载
- ⚠️ 建议只在需要实时监控时开启
- ⚠️ 退出登录会自动关闭自动刷新

### 开发者说明

#### 在其他组件中使用 logout

```typescript
import { useAuthContext } from '../contexts/useAuthContext';

function MyComponent() {
  const { logout } = useAuthContext();
  
  const handleLogout = () => {
    logout();
    // 认证状态会自动更新
    // AuthGuard 会自动显示登录对话框
  };
  
  return (
    <button onClick={handleLogout}>退出</button>
  );
}
```

#### 监听认证状态

```typescript
import { useAuthContext } from '../contexts/useAuthContext';

function MyComponent() {
  const { state } = useAuthContext();
  
  useEffect(() => {
    if (!state.isAuthenticated) {
      // 用户已退出登录
      console.log('User logged out');
      // 清理资源、停止定时器等
    }
  }, [state.isAuthenticated]);
}
```

#### 自动清理资源

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    // 定期任务
  }, 30000);
  
  // 组件卸载时自动清理
  return () => {
    clearInterval(timer);
  };
}, []);

// 监听登出事件并清理
useEffect(() => {
  if (!authState.isAuthenticated && timer) {
    clearInterval(timer);
  }
}, [authState.isAuthenticated, timer]);
```

## 安全考虑

### Session 管理

**Session 超时：** 1小时

**存储位置：** sessionStorage（浏览器关闭后自动清除）

**包含信息：**
- 用户名
- 密码（加密传输）
- 最后认证时间

### 安全措施

1. **自动超时**
   - Session 超过1小时自动失效
   - 需要重新登录

2. **清除凭证**
   - 退出时清除所有本地存储
   - 清除 API client 中的凭证
   - 清除 sessionStorage

3. **停止后台任务**
   - 退出时停止所有自动刷新
   - 清理所有定时器
   - 释放资源

4. **二次确认**
   - 退出前需要确认
   - 防止误操作

## 测试指南

### 功能测试

#### 1. 退出登录测试

```bash
# 1. 启动服务
./run.sh -p

# 2. 打开浏览器
http://123.57.178.64:33000

# 3. 登录系统

# 4. 点击右上角用户头像

# 5. 选择"退出登录"

# 6. 确认退出

# 7. 验证：
#    - 是否返回登录页面
#    - sessionStorage 是否清空
#    - 是否停止自动刷新
```

#### 2. 自动刷新停止测试

```bash
# 1. 登录系统

# 2. 开启自动刷新（Dashboard页面）

# 3. 打开浏览器开发者工具 -> Network

# 4. 观察每30秒的请求

# 5. 点击退出登录

# 6. 验证：
#    - 请求是否停止
#    - console 是否输出 "Auto refresh stopped due to logout"
```

#### 3. Session 超时测试

```bash
# 1. 登录系统

# 2. 等待1小时（或修改 SESSION_TIMEOUT 为较短时间测试）

# 3. 刷新页面

# 4. 验证：
#    - 是否自动显示登录对话框
#    - sessionStorage 是否清空
```

### 浏览器测试

**Chrome DevTools：**

```javascript
// 检查 sessionStorage
sessionStorage.getItem('auth_session')

// 检查认证状态
// 在 React DevTools 中查看 AuthContext

// 清除 session（测试）
sessionStorage.clear()
```

**Network 监控：**
1. 打开 Network 标签
2. 筛选 XHR 请求
3. 观察 `/api/instances/` 请求频率
4. 退出登录后验证请求停止

## 故障排查

### 问题：退出后仍然自动刷新

**检查：**
```bash
# 查看浏览器 console
# 应该看到："Auto refresh stopped due to logout"

# 检查 Network 标签
# 应该没有新的 /api/instances/ 请求
```

**解决：**
- 清除浏览器缓存
- 强制刷新页面（Ctrl+Shift+R）
- 检查是否有多个标签页打开

### 问题：退出登录失败

**检查：**
```bash
# 查看浏览器 console 错误信息

# 检查 sessionStorage
sessionStorage.getItem('auth_session')
```

**解决：**
```javascript
// 手动清除（在浏览器 console 中）
sessionStorage.clear()
location.reload()
```

### 问题：Session 超时但未自动显示登录框

**检查：**
```bash
# 查看 AuthProvider.tsx 中的 SESSION_TIMEOUT
# 默认：60 * 60 * 1000 = 1小时

# 查看 sessionStorage 中的 lastAuthTime
const auth = JSON.parse(sessionStorage.getItem('auth_session'))
console.log(new Date(auth.lastAuthTime))
console.log(Date.now() - auth.lastAuthTime)
```

**解决：**
- 刷新页面触发检查
- 或手动清除 sessionStorage

## 更新记录

### v1.0.0 (2024-12-02)

**新增功能：**
- ✅ 退出登录按钮
- ✅ 退出确认对话框
- ✅ 显示当前登录用户名
- ✅ 退出时自动停止自动刷新
- ✅ 组件卸载时清理定时器
- ✅ 关闭 WorkingDashboard 默认自动刷新

**技术改进：**
- ✅ 添加 useEffect 监听认证状态
- ✅ 添加资源清理机制
- ✅ 改进错误处理
- ✅ 添加日志记录

**文档：**
- ✅ 创建 LOGOUT_FEATURE.md
- ✅ 更新操作指南
- ✅ 添加测试说明

## 相关文档

- [认证系统文档](./AUTHENTICATION.md)
- [自动刷新优化指南](./AUTO_REFRESH_OPTIMIZATION.md)
- [数据库连接监控](./DATABASE_CONNECTION_MONITORING.md)
- [API 文档](../frontend/docs/API_GUIDE.md)

## 总结

✅ **核心改进：**
1. 用户可以安全退出登录
2. 退出后自动停止所有自动刷新
3. 完善的资源清理机制
4. 良好的用户体验（确认对话框、消息提示）

✅ **安全性：**
1. Session 自动超时（1小时）
2. 退出时清除所有凭证
3. 二次确认防止误操作

✅ **性能优化：**
1. 关闭不必要的自动刷新
2. 退出时释放资源
3. 组件卸载时清理定时器

用户现在可以安全地退出系统，系统会自动停止所有后台任务和自动刷新，避免不必要的资源浪费和服务器负载。

