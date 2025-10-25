# Docker 部署指南

本项目提供了完整的 Docker 化解决方案，支持开发和生产环境的一键部署。

## 🚀 快速开始

### 1. 准备环境

确保已安装：
- Docker (20.10+)
- Docker Compose (2.0+)

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（可选）
nano .env
```

### 3. 启动应用

#### 生产环境（推荐）
```bash
# 使用启动脚本
chmod +x docker-start.sh
./docker-start.sh prod

# 或直接使用 docker-compose
docker-compose up --build -d
```

#### 开发环境
```bash
# 使用启动脚本
./docker-start.sh dev

# 或直接使用 docker-compose
docker-compose -f docker-compose.dev.yml up --build -d
```

#### 生产环境 + Nginx
```bash
./docker-start.sh nginx
```

## 📋 可用命令

### 启动脚本命令

```bash
./docker-start.sh [COMMAND]

# 可用命令：
prod, production     # 启动生产环境
dev, development     # 启动开发环境  
nginx               # 启动生产环境 + Nginx
stop                # 停止所有服务
logs                # 查看日志
status              # 查看服务状态
cleanup             # 清理所有容器和镜像
help                # 显示帮助信息
```

### Docker Compose 命令

```bash
# 生产环境
docker-compose up -d                    # 启动服务
docker-compose down                     # 停止服务
docker-compose logs -f                  # 查看日志
docker-compose ps                       # 查看状态

# 开发环境
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f backend

# 重新构建
docker-compose up --build -d
```

## 🏗️ 架构说明

### 生产环境架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Application   │    │   PostgreSQL    │
│  (Reverse Proxy)│────│  (Backend +     │────│   (Database)    │
│   Port: 80/443  │    │   Frontend)     │    │   Port: 5432    │
└─────────────────┘    │   Port: 8000    │    └─────────────────┘
                       └─────────────────┘
```

### 开发环境架构

```
┌─────────────────┐    ┌─────────────────┐
│   Backend API   │    │   PostgreSQL    │
│  (Hot Reload)   │────│   (Database)    │
│   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘
```

## 🔧 服务详情

### 应用服务 (app)
- **端口**: 8000
- **功能**: FastAPI 后端 + React 前端
- **健康检查**: `http://localhost:8000/health`
- **API 文档**: `http://localhost:8000/docs`

### 数据库服务 (postgres)
- **端口**: 5432
- **数据库**: inference_instances
- **用户**: postgres
- **密码**: 在 .env 文件中配置

### Nginx 服务 (nginx) - 仅生产环境
- **端口**: 80, 443
- **功能**: 反向代理，静态文件服务
- **配置**: production.conf

## 📁 重要文件

```
├── Dockerfile              # 生产环境镜像
├── Dockerfile.dev          # 开发环境镜像
├── docker-compose.yml      # 生产环境配置
├── docker-compose.dev.yml  # 开发环境配置
├── docker-start.sh         # 启动脚本
├── .dockerignore          # Docker 忽略文件
├── .env                   # 环境变量
└── production.conf        # Nginx 配置
```

## 🔍 监控和调试

### 查看日志
```bash
# 所有服务日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f app
docker-compose logs -f postgres

# 开发环境
docker-compose -f docker-compose.dev.yml logs -f backend
```

### 进入容器
```bash
# 进入应用容器
docker-compose exec app bash

# 进入数据库容器
docker-compose exec postgres psql -U postgres -d inference_instances

# 开发环境
docker-compose -f docker-compose.dev.yml exec backend bash
```

### 健康检查
```bash
# 基本健康检查
curl http://localhost:8000/health

# 详细健康检查（包含数据库）
curl http://localhost:8000/health/detailed

# 检查服务状态
./docker-start.sh status
```

## 🗄️ 数据管理

### 数据库迁移
```bash
# 生产环境
docker-compose exec app python migrate_database.py

# 开发环境
docker-compose -f docker-compose.dev.yml exec backend python migrate_database.py
```

### 数据备份
```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres inference_instances > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres inference_instances < backup.sql
```

### 数据持久化
- 生产环境数据存储在 Docker volume: `crud_postgres_data`
- 开发环境数据存储在 Docker volume: `crud_postgres_dev_data`

## 🚀 部署到生产环境

### 1. 服务器准备
```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 克隆项目
git clone <your-repo-url>
cd crud
```

### 2. 配置生产环境
```bash
# 配置环境变量
cp .env.example .env
nano .env

# 设置生产环境变量
export ENVIRONMENT=production
export DEBUG=false
export SECRET_KEY=your-production-secret-key
```

### 3. 启动生产服务
```bash
# 使用 Nginx (推荐)
./docker-start.sh nginx

# 或仅应用服务
./docker-start.sh prod
```

### 4. 配置域名和 SSL (可选)
```bash
# 修改 production.conf 中的域名
# 配置 SSL 证书
# 重启 Nginx 服务
docker-compose restart nginx
```

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :8000
   lsof -i :5432
   
   # 修改 .env 文件中的端口配置
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库服务状态
   docker-compose ps postgres
   
   # 查看数据库日志
   docker-compose logs postgres
   ```

3. **前端资源加载失败**
   ```bash
   # 重新构建前端
   docker-compose up --build -d
   
   # 检查静态文件
   docker-compose exec app ls -la /app/static
   ```

4. **权限问题**
   ```bash
   # 给启动脚本添加执行权限
   chmod +x docker-start.sh
   ```

### 清理和重置
```bash
# 停止所有服务
./docker-start.sh stop

# 完全清理（谨慎使用）
./docker-start.sh cleanup

# 重新开始
./docker-start.sh prod
```

## 📊 性能优化

### 生产环境优化
- 使用多阶段构建减少镜像大小
- 启用 Nginx 压缩和缓存
- 配置数据库连接池
- 使用非 root 用户运行容器

### 资源限制
```yaml
# 在 docker-compose.yml 中添加资源限制
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🔐 安全建议

1. **更改默认密码**
   - 修改 .env 文件中的数据库密码
   - 设置强密码策略

2. **网络安全**
   - 使用防火墙限制端口访问
   - 配置 SSL/TLS 证书

3. **容器安全**
   - 定期更新基础镜像
   - 使用非 root 用户
   - 扫描镜像漏洞

4. **数据安全**
   - 定期备份数据库
   - 加密敏感数据
   - 限制数据库访问权限

## 📞 支持

如果遇到问题，请：
1. 查看日志：`./docker-start.sh logs`
2. 检查服务状态：`./docker-start.sh status`
3. 查看本文档的故障排除部分
4. 提交 Issue 到项目仓库