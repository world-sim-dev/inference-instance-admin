# Systemd Service Files

本目录包含用于通过 systemd 管理 Inference Instance Admin 应用的服务文件和脚本。

## 📁 文件说明

### Service 单元文件

| 文件 | 说明 | 端口 |
|------|------|------|
| `inference-admin.service` | 后端 API 服务 | 38000 |
| `inference-admin-frontend.service` | 前端静态文件服务 | 33000 |

### 安装脚本

| 文件 | 说明 |
|------|------|
| `install-service.sh` | 自动安装和配置 systemd 服务 |
| `uninstall-service.sh` | 卸载 systemd 服务 |

### 文档

| 文件 | 说明 |
|------|------|
| `docs/SYSTEMD_SERVICE_GUIDE.md` | 完整的使用指南和故障排查 |

## 🚀 快速开始

### 1. 安装服务

```bash
# 进入项目目录
cd /root/inference-instance-admin

# 运行安装脚本（需要 root 权限）
sudo ./install-service.sh
```

### 2. 验证服务状态

```bash
# 检查后端服务
sudo systemctl status inference-admin.service

# 检查前端服务
sudo systemctl status inference-admin-frontend.service
```

### 3. 查看日志

```bash
# 实时查看后端日志
sudo journalctl -u inference-admin.service -f

# 实时查看前端日志
sudo journalctl -u inference-admin-frontend.service -f
```

### 4. 访问应用

- 前端: http://123.57.178.64:33000
- 后端 API: http://123.57.178.64:38000
- API 文档: http://123.57.178.64:38000/docs

## 📋 常用命令

```bash
# 启动服务
sudo systemctl start inference-admin.service
sudo systemctl start inference-admin-frontend.service

# 停止服务
sudo systemctl stop inference-admin.service
sudo systemctl stop inference-admin-frontend.service

# 重启服务
sudo systemctl restart inference-admin.service
sudo systemctl restart inference-admin-frontend.service

# 查看状态
sudo systemctl status inference-admin.service
sudo systemctl status inference-admin-frontend.service

# 查看日志
sudo journalctl -u inference-admin.service -n 100
sudo journalctl -u inference-admin-frontend.service -n 100
```

## ⚙️ 服务特性

### 后端服务 (inference-admin.service)

- ✅ 4个 Uvicorn worker 进程
- ✅ 自动重启（崩溃后10秒重启）
- ✅ 从 `.env` 文件加载环境变量
- ✅ 依赖 PostgreSQL 服务（如果使用）
- ✅ 资源限制和安全配置
- ✅ Systemd journal 日志集成

### 前端服务 (inference-admin-frontend.service)

- ✅ 使用 Python http.server 提供静态文件
- ✅ 依赖后端服务
- ✅ 只读文件系统保护
- ✅ 自动重启支持

## 🔧 配置修改

### 修改端口

编辑 service 文件：

```bash
sudo nano /etc/systemd/system/inference-admin.service
```

修改 `--port` 参数，然后：

```bash
sudo systemctl daemon-reload
sudo systemctl restart inference-admin.service
```

### 修改 Worker 数量

根据 CPU 核心数调整：

```bash
# 查看核心数
nproc

# 编辑 service 文件
sudo nano /etc/systemd/system/inference-admin.service

# 修改 --workers 参数
--workers 4  # 改为合适的数值
```

### 修改环境变量

编辑 `.env` 文件：

```bash
nano /root/inference-instance-admin/.env
```

修改后重启服务：

```bash
sudo systemctl restart inference-admin.service
```

## 🐛 故障排查

### 服务无法启动

1. 查看详细错误：
```bash
sudo systemctl status inference-admin.service -l
sudo journalctl -u inference-admin.service -n 50
```

2. 检查虚拟环境：
```bash
ls -la /root/inference-instance-admin/venv/
```

3. 测试手动启动：
```bash
cd /root/inference-instance-admin
source venv/bin/activate
python main.py
```

### 端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep 38000
sudo lsof -i :38000

# 停止占用进程
sudo kill -9 <PID>
```

### 服务频繁重启

查看崩溃日志：
```bash
sudo journalctl -u inference-admin.service | grep -i error
```

### 前端无法访问

检查构建文件：
```bash
ls -la /root/inference-instance-admin/frontend/dist/
```

如果缺失，重新构建：
```bash
cd /root/inference-instance-admin/frontend
npm run build:prod:fast
```

## 🔄 更新应用

### 更新后端

```bash
cd /root/inference-instance-admin
git pull  # 如果使用 Git

# 更新依赖
source venv/bin/activate
pip install -r requirements.txt

# 重启服务
sudo systemctl restart inference-admin.service
```

### 更新前端

```bash
cd /root/inference-instance-admin/frontend
git pull  # 如果使用 Git

# 重新构建
npm install
npm run build:prod:fast

# 重启服务
sudo systemctl restart inference-admin-frontend.service
```

## 🗑️ 卸载服务

```bash
cd /root/inference-instance-admin
sudo ./uninstall-service.sh
```

这将：
- 停止服务
- 禁用开机自启
- 删除 systemd 服务文件
- 重载 systemd 配置

**注意**：应用文件不会被删除，只是移除 systemd 服务。

## 📚 详细文档

更多详细信息，请参阅：
- [Systemd Service 使用指南](docs/SYSTEMD_SERVICE_GUIDE.md)
- [数据库连接监控](docs/DATABASE_CONNECTION_MONITORING.md)

## 🆘 获取帮助

如果遇到问题：

1. 查看日志：`sudo journalctl -u inference-admin.service -f`
2. 检查状态：`sudo systemctl status inference-admin.service`
3. 查看文档：`docs/SYSTEMD_SERVICE_GUIDE.md`
4. 测试手动运行：`./run.sh`

## 📊 监控

### 健康检查

```bash
# 基础健康检查
curl http://localhost:38000/health

# 详细健康检查（包含数据库）
curl http://localhost:38000/health/detailed

# 数据库连接池状态
curl http://localhost:38000/api/monitoring/db-pool
```

### 服务监控

```bash
# 查看服务运行时间
systemctl show inference-admin.service -p ActiveEnterTimestamp

# 查看重启次数
systemctl show inference-admin.service -p NRestarts

# 查看内存使用
systemctl status inference-admin.service | grep Memory
```

## 🔐 安全建议

生产环境部署建议：

1. **使用专用用户**（而不是 root）
2. **配置防火墙**（只开放必要端口）
3. **使用 HTTPS**（配置 Nginx + SSL）
4. **定期备份数据库**
5. **监控日志和资源使用**
6. **定期更新依赖**

## ✅ 检查清单

安装完成后，确认以下事项：

- [ ] 后端服务正常运行
- [ ] 前端服务正常运行
- [ ] 可以访问前端页面
- [ ] 可以访问 API 文档
- [ ] 日志正常输出
- [ ] 开机自启已启用
- [ ] 数据库连接正常
- [ ] 监控端点可访问

## 🎯 性能优化

- **Workers**: 根据 CPU 核心数调整
- **数据库连接池**: 根据并发调整 `DB_POOL_SIZE`
- **资源限制**: 在 service 文件中配置
- **日志级别**: 生产环境使用 `info` 或 `warning`
- **前端**: 考虑使用 Nginx 替代 Python http.server

---

**版本**: 1.0.0  
**更新日期**: 2024-12-02

