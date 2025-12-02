# 自动刷新优化指南

## 当前状况分析

### 自动刷新位置

1. **Dashboard.tsx** - 用户可选
   - 间隔：30秒
   - 默认：关闭
   - 控制：用户手动开启

2. **WorkingDashboard.tsx** - 自动开启
   - 间隔：30秒
   - 默认：**开启** ⚠️
   - 控制：无法关闭

### 数据库影响评估

| 用户数 | 每秒请求 | 需要连接 | 连接池状态 |
|--------|----------|----------|------------|
| 10     | 0.33/s   | 0.03     | ✅ 安全    |
| 50     | 1.67/s   | 0.17     | ✅ 安全    |
| 100    | 3.33/s   | 0.33     | ✅ 安全    |
| 500    | 16.67/s  | 1.67     | ⚠️ 注意    |
| 1000   | 33.33/s  | 3.33     | ⚠️ 注意    |

**当前配置：**
- 连接池大小：10
- 最大溢出：20
- 总计：30个连接

**结论：**
- 30秒刷新间隔对于 < 100 用户是安全的
- 每个连接使用时间短（< 0.1秒）
- 连接池有 `try/finally` 保证释放

## 潜在问题

### 1. 连接泄漏风险（低）

**场景：** 如果代码有bug导致 session 未关闭

**检查现状：**
```python
# database.py 已有保护
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # ✅ 保证关闭
```

**风险：** ✅ 低 - 已有完善的保护机制

### 2. 峰值并发风险（中）

**场景：** 所有用户同时刷新

**触发条件：**
- 服务器重启后所有用户同时打开页面
- 网络恢复后批量请求

**影响：**
- 瞬间需要大量连接
- 可能超过连接池限制

**缓解措施：**
1. 添加随机延迟（抖动）
2. 请求队列控制
3. 增加连接池大小

### 3. 不必要的网络流量（中）

**影响：**
- 用户不活跃时仍在刷新
- 浪费带宽和服务器资源

## 优化方案

### 方案1：关闭 WorkingDashboard 的自动刷新（推荐）

**理由：**
- WorkingDashboard 可能不是主要使用的页面
- 用户可以手动刷新
- Dashboard 已有可选的自动刷新

**实施：** 移除或注释 `refetchInterval`

### 方案2：添加智能刷新

**特性：**
- 页面可见时才刷新
- 用户活跃时才刷新
- 添加随机延迟（抖动）

### 方案3：增加刷新间隔

**建议：**
- 将30秒增加到60秒或更长
- 降低服务器压力

### 方案4：添加刷新开关

**实现：**
- 让用户控制是否自动刷新
- 在设置中保存偏好

## 实施建议

### 立即实施（高优先级）

1. **关闭 WorkingDashboard 的自动刷新**
   ```typescript
   // 移除 refetchInterval
   const { data, isLoading, error, refetch } = useQuery({
     queryKey: ['instances'],
     queryFn: fetchInstances,
     // refetchInterval: 30000, // ❌ 移除此行
   });
   ```

2. **添加页面可见性检测**
   ```typescript
   // 只在页面可见时刷新
   refetchOnWindowFocus: true,
   enabled: !document.hidden,
   ```

### 短期实施（中优先级）

3. **添加随机延迟（抖动）**
   ```typescript
   // 防止所有用户同时刷新
   const jitter = Math.random() * 5000; // 0-5秒随机延迟
   refetchInterval: 30000 + jitter,
   ```

4. **监控连接池使用**
   ```bash
   # 定期检查
   curl http://localhost:38000/api/monitoring/db-pool
   ```

### 长期实施（低优先级）

5. **实现智能刷新策略**
   - 根据数据变化频率动态调整
   - 使用 WebSocket 推送更新
   - 添加用户活跃度检测

## 监控指标

### 关键指标

1. **连接池使用率**
   ```bash
   curl http://localhost:38000/api/monitoring/db-pool | jq '.utilization_percent'
   ```

2. **请求频率**
   ```bash
   # 查看访问日志
   sudo journalctl -u inference-admin.service | grep "GET /api/instances"
   ```

3. **响应时间**
   ```bash
   # 测试响应时间
   time curl http://localhost:38000/api/instances/
   ```

### 告警阈值

| 指标 | 正常 | 警告 | 危险 |
|------|------|------|------|
| 连接池使用率 | < 50% | 50-80% | > 80% |
| 平均响应时间 | < 100ms | 100-500ms | > 500ms |
| 每秒请求数 | < 10 | 10-50 | > 50 |

## 测试计划

### 压力测试

```bash
# 模拟50个并发用户，每30秒刷新一次，持续5分钟
ab -n 600 -c 50 -t 300 http://localhost:38000/api/instances/

# 查看连接池状态
watch -n 1 'curl -s http://localhost:38000/api/monitoring/db-pool'
```

### 连接泄漏测试

```bash
# 持续监控连接数
while true; do
  echo "$(date): $(curl -s http://localhost:38000/api/monitoring/db-pool | jq '.checked_out')"
  sleep 5
done
```

## 应急响应

### 如果发现连接池耗尽

**症状：**
- 请求超时
- 错误日志：`QueuePool limit exceeded`
- 连接池使用率 > 95%

**立即响应：**

1. **重启服务**
   ```bash
   sudo systemctl restart inference-admin.service
   ```

2. **临时增加连接池**
   ```bash
   # 编辑 .env
   DB_POOL_SIZE=20
   DB_MAX_OVERFLOW=40
   
   # 重启
   sudo systemctl restart inference-admin.service
   ```

3. **检查连接泄漏**
   ```bash
   # 查看数据库连接
   # PostgreSQL:
   SELECT count(*) FROM pg_stat_activity WHERE application_name = 'inference_instances_api';
   ```

## 配置建议

### 小型部署（< 10用户）

```bash
# .env
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
```

### 中型部署（10-50用户）

```bash
# .env
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
```

### 大型部署（50-100用户）

```bash
# .env
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
```

### 超大型部署（100+用户）

```bash
# .env
DB_POOL_SIZE=50
DB_MAX_OVERFLOW=100

# 考虑：
# - 使用 CDN 缓存静态内容
# - 添加 Redis 缓存层
# - 使用读写分离
# - 实施 WebSocket 推送
```

## 总结

### 当前状态

✅ **安全** - 30秒自动刷新不会造成数据库连接问题

**理由：**
1. 连接池配置充足
2. 有完善的连接管理机制
3. 请求频率低
4. 每个请求处理时间短

### 建议优化

1. ⭐ **关闭 WorkingDashboard 的自动刷新**
2. 🔧 **添加页面可见性检测**
3. 📊 **定期监控连接池状态**
4. 🚀 **根据实际使用情况调整间隔**

### 监控命令

```bash
# 快速检查连接池状态
./service-control.sh status

# 查看连接池详情
curl http://localhost:38000/api/monitoring/db-pool | jq

# 实时监控
watch -n 5 'curl -s http://localhost:38000/api/monitoring/db-pool | jq'
```

