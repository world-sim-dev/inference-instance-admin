# Systemd Service 使用指南

本指南介绍如何使用 systemd 管理 Inference Instance Admin 服务。

## 概述

应用提供了两个 systemd 服务：

1. **inference-admin.service** - 后端 API 服务（端口 38000）
2. **inference-admin-frontend.service** - 前端静态文件服务（端口 33000）

## 快速开始

### 安装服务

```bash
cd /root/inference-instance-admin
sudo ./install-service.sh
```

安装脚本会自动：
- ✅ 检查虚拟环境和依赖
- ✅ 构建前端（如果需要）
- ✅ 安装 systemd 服务文件
- ✅ 启用服务开机自启
- ✅ 启动服务

### 卸载服务

```bash
cd /root/inference-instance-admin
sudo ./uninstall-service.sh
```

## 服务管理

### 查看服务状态

```bash
# 后端服务
sudo systemctl status inference-admin.service

# 前端服务
sudo systemctl status inference-admin-frontend.service

# 简洁输出
sudo systemctl is-active inference-admin.service
```

### 启动/停止服务

```bash
# 启动
sudo systemctl start inference-admin.service
sudo systemctl start inference-admin-frontend.service

# 停止
sudo systemctl stop inference-admin.service
sudo systemctl stop inference-admin-frontend.service

# 重启
sudo systemctl restart inference-admin.service
sudo systemctl restart inference-admin-frontend.service
```

### 开机自启

```bash
# 启用开机自启
sudo systemctl enable inference-admin.service
sudo systemctl enable inference-admin-frontend.service

# 禁用开机自启
sudo systemctl disable inference-admin.service
sudo systemctl disable inference-admin-frontend.service

# 检查是否已启用
sudo systemctl is-enabled inference-admin.service
```

### 查看日志

```bash
# 实时查看后端日志
sudo journalctl -u inference-admin.service -f

# 实时查看前端日志
sudo journalctl -u inference-admin-frontend.service -f

# 查看最近100条日志
sudo journalctl -u inference-admin.service -n 100

# 查看指定时间范围的日志
sudo journalctl -u inference-admin.service --since "2024-01-01" --until "2024-01-02"

# 查看今天的日志
sudo journalctl -u inference-admin.service --since today

# 查看最近1小时的日志
sudo journalctl -u inference-admin.service --since "1 hour ago"
```

### 重载配置

```bash
# 修改 service 文件后需要重载
sudo systemctl daemon-reload

# 然后重启服务
sudo systemctl restart inference-admin.service
```

## 服务配置

### 后端服务配置 (inference-admin.service)

```ini
[Unit]
Description=Inference Instance Admin API Service
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/inference-instance-admin
Environment="PORT=38000"
ExecStart=/root/inference-instance-admin/venv/bin/uvicorn main:app \
    --host 0.0.0.0 \
    --port 38000 \
    --workers 4

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**关键配置项：**

- `--workers 4`: Uvicorn 工作进程数（根据 CPU 核心数调整）
- `--port 38000`: 监听端口
- `Restart=always`: 崩溃后自动重启
- `RestartSec=10`: 重启前等待10秒

### 前端服务配置 (inference-admin-frontend.service)

```ini
[Unit]
Description=Inference Instance Admin Frontend Service
After=network.target inference-admin.service

[Service]
Type=simple
WorkingDirectory=/root/inference-instance-admin/frontend/dist
ExecStart=/usr/bin/python3 -m http.server 33000 --bind 0.0.0.0

Restart=always

[Install]
WantedBy=multi-user.target
```

## 环境变量配置

### 方法1：.env 文件（推荐）

编辑 `/root/inference-instance-admin/.env`：

```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost/dbname

# 认证配置
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=...

# 端口配置
PORT=38000

# 数据库连接池
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
```

服务文件中已配置读取：
```ini
EnvironmentFile=-/root/inference-instance-admin/.env
```

### 方法2：直接在 service 文件中配置

编辑 `/etc/systemd/system/inference-admin.service`：

```ini
[Service]
Environment="DATABASE_URL=postgresql://user:password@localhost/dbname"
Environment="AUTH_USERNAME=admin"
Environment="PORT=38000"
```

修改后执行：
```bash
sudo systemctl daemon-reload
sudo systemctl restart inference-admin.service
```

## 性能优化

### 调整工作进程数

根据 CPU 核心数调整：

```bash
# 查看 CPU 核心数
nproc

# 编辑服务文件
sudo nano /etc/systemd/system/inference-admin.service

# 修改 workers 参数
--workers $(nproc)  # 使用所有核心
--workers 4         # 固定4个进程
```

**推荐配置：**
- **2核CPU**: `--workers 2`
- **4核CPU**: `--workers 4`
- **8核CPU**: `--workers 6-8`
- **16核+**: `--workers 12-16`

### 资源限制

在 service 文件中添加：

```ini
[Service]
# 限制最大文件描述符
LimitNOFILE=65535

# 限制最大进程数
LimitNPROC=4096

# 限制内存使用（单位：字节）
MemoryLimit=2G

# CPU 配额（50% = 0.5个核心）
CPUQuota=200%
```

## 故障排查

### 服务无法启动

1. **检查服务状态**
```bash
sudo systemctl status inference-admin.service -l
```

2. **查看详细日志**
```bash
sudo journalctl -u inference-admin.service -n 50 --no-pager
```

3. **常见问题**

**虚拟环境未找到：**
```bash
# 创建虚拟环境
cd /root/inference-instance-admin
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**端口被占用：**
```bash
# 查看端口占用
sudo netstat -tlnp | grep 38000
sudo lsof -i :38000

# 修改端口
sudo nano /etc/systemd/system/inference-admin.service
# 修改 --port 参数
```

**权限问题：**
```bash
# 检查文件权限
ls -la /root/inference-instance-admin/

# 修改所有者
sudo chown -R root:root /root/inference-instance-admin/
```

### 服务频繁重启

查看重启历史：
```bash
sudo journalctl -u inference-admin.service | grep "Started\|Stopped"
```

增加重启间隔：
```ini
[Service]
RestartSec=30  # 增加到30秒
StartLimitInterval=300
StartLimitBurst=5
```

### 性能问题

1. **查看资源使用**
```bash
# CPU和内存
top -p $(systemctl show -p MainPID inference-admin.service | cut -d= -f2)

# 详细信息
systemd-cgtop
```

2. **监控连接池**
```bash
# 检查数据库连接
curl http://localhost:38000/api/monitoring/db-pool
```

## 生产环境部署建议

### 1. 使用专用用户

创建专用用户（而不是 root）：

```bash
# 创建用户
sudo useradd -r -s /bin/false inference-admin

# 修改文件所有者
sudo chown -R inference-admin:inference-admin /opt/inference-admin

# 修改 service 文件
[Service]
User=inference-admin
Group=inference-admin
WorkingDirectory=/opt/inference-admin
```

### 2. 使用 Gunicorn（生产级 WSGI 服务器）

安装 Gunicorn：
```bash
pip install gunicorn
```

修改 service 文件：
```ini
ExecStart=/root/inference-instance-admin/venv/bin/gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:38000 \
    --access-logfile /var/log/inference-admin/access.log \
    --error-logfile /var/log/inference-admin/error.log
```

### 3. 使用 Nginx 反向代理

前端使用 Nginx 而不是 Python http.server：

```nginx
server {
    listen 33000;
    server_name _;
    
    root /root/inference-instance-admin/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:38000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 设置日志轮转

创建 `/etc/logrotate.d/inference-admin`：

```
/var/log/inference-admin/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 inference-admin inference-admin
    sharedscripts
    postrotate
        systemctl reload inference-admin.service > /dev/null 2>&1 || true
    endscript
}
```

## 监控和告警

### Systemd 内置监控

```bash
# 查看服务运行时间
systemctl show inference-admin.service -p ActiveEnterTimestamp

# 查看内存使用
systemctl status inference-admin.service | grep Memory

# 查看重启次数
systemctl show inference-admin.service -p NRestarts
```

### 集成 Prometheus

添加 Node Exporter 监控 systemd 服务：

```bash
# 安装 node_exporter
sudo apt install prometheus-node-exporter

# 启用 systemd collector
sudo systemctl enable prometheus-node-exporter
```

## 参考命令速查表

```bash
# 启动
sudo systemctl start inference-admin.service

# 停止
sudo systemctl stop inference-admin.service

# 重启
sudo systemctl restart inference-admin.service

# 状态
sudo systemctl status inference-admin.service

# 日志（实时）
sudo journalctl -u inference-admin.service -f

# 日志（最近100条）
sudo journalctl -u inference-admin.service -n 100

# 启用开机自启
sudo systemctl enable inference-admin.service

# 禁用开机自启
sudo systemctl disable inference-admin.service

# 重载配置
sudo systemctl daemon-reload

# 查看配置文件
sudo systemctl cat inference-admin.service

# 编辑配置
sudo systemctl edit --full inference-admin.service
```

## 访问地址

服务启动后，可以通过以下地址访问：

- 🌐 **前端**: http://123.57.178.64:33000
- 🔌 **后端API**: http://123.57.178.64:38000
- 📚 **API文档**: http://123.57.178.64:38000/docs
- ❤️ **健康检查**: http://123.57.178.64:38000/health
- 📊 **连接池监控**: http://123.57.178.64:38000/api/monitoring/db-pool

## 总结

使用 systemd 管理服务的优势：

✅ 开机自动启动  
✅ 崩溃自动重启  
✅ 标准化日志管理  
✅ 资源限制和监控  
✅ 依赖管理（数据库启动后再启动应用）  
✅ 统一的服务管理接口

