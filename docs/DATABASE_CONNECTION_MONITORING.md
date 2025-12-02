# 数据库连接监控指南

## 概述

本应用使用 SQLAlchemy 的连接池管理数据库连接，已经过代码审查，**不存在明显的连接泄漏问题**。

## 连接管理机制

### ✅ 安全的连接管理

```python
# FastAPI 依赖注入自动管理连接
@app.get("/api/instances")
async def list_instances(db: Session = Depends(get_db)):
    # 连接会在请求结束后自动关闭
    pass
```

### 连接池配置

**PostgreSQL/MySQL:**
- `pool_size`: 10 (基础连接数)
- `max_overflow`: 20 (额外连接数)
- `pool_pre_ping`: True (使用前验证)
- `pool_recycle`: 3600秒 (1小时回收)

**SQLite:**
- 使用 `StaticPool`
- 不需要连接池管理

## 监控端点

### 1. 查看连接池状态

```bash
curl http://localhost:38000/api/monitoring/db-pool
```

**响应示例:**
```json
{
  "database_type": "postgresql",
  "pool_type": "QueuePool",
  "pool_size": 10,
  "checked_in": 8,
  "checked_out": 2,
  "overflow": 0,
  "total_connections": 10,
  "utilization_percent": 20.0,
  "status": "healthy"
}
```

**字段说明:**
- `pool_size`: 配置的基础连接池大小
- `checked_in`: 可用的空闲连接数
- `checked_out`: 正在使用的活跃连接数
- `overflow`: 超出基础池大小的溢出连接数
- `utilization_percent`: 连接池使用率
- `status`: 
  - `healthy`: 使用率 < 80%
  - `warning`: 使用率 80-95%
  - `critical`: 使用率 >= 95%

### 2. 健康检查

```bash
curl http://localhost:38000/api/monitoring/db-pool/warning-threshold
```

**响应示例:**
```json
{
  "database_type": "postgresql",
  "pool_size": 10,
  "checked_out": 2,
  "utilization_percent": 20.0,
  "status": "healthy",
  "warnings": [],
  "recommendations": [
    "Connection pool configuration seems adequate"
  ]
}
```

## 问题诊断

### 连接泄漏迹象

1. **连接池耗尽**
   - `utilization_percent` 持续 > 95%
   - `overflow` 接近 `max_overflow` 配置值
   - 出现 "TimeoutError: QueuePool limit exceeded" 错误

2. **连接增长不释放**
   - `checked_out` 持续增长不下降
   - 请求完成后连接数不减少

### 诊断步骤

1. **检查当前连接状态**
```bash
# 查看实时连接状态
watch -n 5 'curl -s http://localhost:38000/api/monitoring/db-pool | jq'
```

2. **在负载测试时监控**
```bash
# 运行负载测试
ab -n 1000 -c 10 http://localhost:38000/api/instances/

# 同时监控连接池
watch -n 1 'curl -s http://localhost:38000/api/monitoring/db-pool'
```

3. **检查数据库级别的连接**

**PostgreSQL:**
```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity 
WHERE application_name = 'inference_instances_api';

-- 查看详细连接信息
SELECT pid, usename, application_name, state, query_start 
FROM pg_stat_activity 
WHERE application_name = 'inference_instances_api';
```

**MySQL:**
```sql
-- 查看连接数
SHOW PROCESSLIST;

-- 查看连接统计
SHOW STATUS LIKE 'Threads_connected';
```

## 性能调优

### 增加连接池大小

编辑 `.env` 或环境变量：

```bash
# 增加基础连接数
DB_POOL_SIZE=20

# 增加最大溢出连接数
DB_MAX_OVERFLOW=40

# 调整连接回收时间（秒）
DB_POOL_RECYCLE=1800
```

### 连接池配置建议

**轻量级应用（< 100 并发）:**
```
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
```

**中等负载（100-500 并发）:**
```
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
```

**高负载（> 500 并发）:**
```
DB_POOL_SIZE=50
DB_MAX_OVERFLOW=100
```

## 代码审查结论

### ✅ 无泄漏风险的模式

1. **FastAPI 依赖注入**
   ```python
   async def handler(db: Session = Depends(get_db)):
       # ✅ 自动管理
   ```

2. **Context Manager**
   ```python
   with engine.connect() as connection:
       # ✅ 自动关闭
   ```

3. **服务层设计**
   ```python
   class InstanceService:
       @staticmethod
       def create(session: Session, data):
           # ✅ 不创建或关闭 session
   ```

### ❌ 需要避免的模式

```python
# ❌ 错误：手动创建session但忘记关闭
session = SessionLocal()
# ... 使用 session
# 忘记调用 session.close()

# ✅ 正确：使用 try/finally
session = SessionLocal()
try:
    # ... 使用 session
finally:
    session.close()

# 更好：使用 context manager (需要实现)
with get_db_context() as session:
    # ... 使用 session
```

## 总结

当前代码库的数据库连接管理是**安全的**，主要原因：

1. ✅ 所有 API 端点使用 FastAPI 的依赖注入
2. ✅ `get_db()` 使用 try/finally 确保关闭
3. ✅ 服务层不直接管理连接
4. ✅ 使用连接池和预检机制
5. ✅ 适当的错误处理和回滚

建议定期使用监控端点检查连接池状态，特别是在生产环境或高负载情况下。

