# HIK Agent 部署脚本文档

本目录包含 HIK Agent 的部署和管理脚本。

## 快速开始

### 1. 首次部署

```bash
# 使用完整部署脚本（包括构建）
./scripts/deploy.sh production yes

# 仅启动已构建的服务
./scripts/start.sh
```

### 2. 日常管理

```bash
# 启动服务
./scripts/start.sh

# 进入监控面板（交互式）
./scripts/monitor.sh

# 查看服务状态
pm2 list

# 查看日志
./scripts/logs.sh [command]

# 停止服务
./scripts/stop.sh
```

## 脚本说明

### `deploy.sh` - 部署脚本

完整的部署流程，包括环境验证、依赖检查、构建、启动和健康检查。

**用法：**
```bash
./scripts/deploy.sh [env] [rebuild]
```

**参数：**
- `env`: 部署环境（production/staging/dev，默认: production）
- `rebuild`: 是否重新构建（yes/no，默认: yes）

**示例：**
```bash
# 完整构建和部署
./scripts/deploy.sh production yes

# 快速部署（使用已有构建）
./scripts/deploy.sh production no
```

### `start.sh` - 启动脚本

快速启动服务（用于已构建的项目）。

**用法：**
```bash
./scripts/start.sh
```

**功能：**
- ✓ 检查构建文件是否存在
- ✓ 如果缺失，自动构建
- ✓ 创建日志目录
- ✓ 启动所有服务
- ✓ 显示状态

### `stop.sh` - 停止脚本

停止所有运行中的服务。

**用法：**
```bash
./scripts/stop.sh
```

### `monitor.sh` - 监控面板

交互式监控和管理面板（推荐使用）。

**用法：**
```bash
./scripts/monitor.sh
```

**功能：**
- 查看进程状态
- 查看实时日志
- 查看后端/前端详细日志
- 重启服务（全部/后端/前端）
- 停止服务
- 查看资源使用
- 运行健康检查

### `logs.sh` - 日志管理

查看和管理日志文件。

**用法：**
```bash
./scripts/logs.sh [command] [lines]
```

**命令：**
- `backend-out` - 后端输出日志
- `backend-err` - 后端错误日志
- `backend-all` - 后端完整日志
- `frontend-out` - 前端输出日志
- `frontend-err` - 前端错误日志
- `frontend-all` - 前端完整日志
- `tail` - 实时日志流（默认）
- `size` - 日志文件大小
- `clean` - 清理所有日志

**示例：**
```bash
# 查看最后 100 行后端错误
./scripts/logs.sh backend-err 100

# 查看实时日志
./scripts/logs.sh tail

# 查看日志文件大小
./scripts/logs.sh size

# 清理日志
./scripts/logs.sh clean
```

### `health-check.sh` - 健康检查

验证服务是否正常运行。

**用法：**
```bash
./scripts/health-check.sh
```

**检查项：**
- ✓ 后端服务响应（/health 或首页）
- ✓ 前端服务响应（HTTP 200/304）
- ✓ PM2 进程状态
- ✓ 资源使用情况

## PM2 常用命令

```bash
# 查看所有进程
pm2 list

# 查看进程详情
pm2 show hik-agent-backend
pm2 show hik-agent-frontend

# 查看日志
pm2 logs                          # 实时日志
pm2 logs --lines 100              # 最后 100 行
pm2 logs hik-agent-backend        # 特定进程日志

# 管理进程
pm2 start ecosystem.config.cjs    # 启动
pm2 restart all                   # 重启
pm2 stop all                      # 停止
pm2 delete all                    # 删除

# 监控
pm2 monit                         # 资源监控
pm2 save                          # 保存配置
pm2 resurrect                     # 恢复保存的进程

# 日志轮转
pm2 install pm2-logrotate         # 安装日志轮转模块
```

## 日志位置

所有日志存储在 `/var/log/hik/` 目录：

- `backend-out.log` - 后端输出日志
- `backend-error.log` - 后端错误日志
- `frontend-out.log` - 前端输出日志
- `frontend-error.log` - 前端错误日志
- `pm2-out.log` - PM2 输出日志
- `pm2-error.log` - PM2 错误日志
- `pm2-combined.log` - 合并日志

## 故障排查

### 后端不响应

```bash
# 1. 查看后端日志
./scripts/logs.sh backend-err 50

# 2. 查看后端进程状态
pm2 show hik-agent-backend

# 3. 重启后端
pm2 restart hik-agent-backend

# 4. 查看健康检查
./scripts/health-check.sh
```

### 前端无法访问

```bash
# 1. 查看前端日志
./scripts/logs.sh frontend-err 50

# 2. 检查端口是否被占用
lsof -i :3000

# 3. 重启前端
pm2 restart hik-agent-frontend
```

### 服务频繁重启

```bash
# 查看重启日志
pm2 logs --err

# 检查资源使用
pm2 monit

# 查看完整的进程信息
pm2 show hik-agent-backend
```

## 配置说明

PM2 配置文件位于项目根目录：`ecosystem.config.cjs`

### 关键设置

- **instances**: 进程实例数（生产环境建议为 CPU 核心数）
- **exec_mode**: 执行模式（fork/cluster）
- **max_memory_restart**: 内存限制，超出自动重启
- **autorestart**: 进程退出后自动重启
- **watch**: 文件变更自动重启（生产环境禁用）
- **error_file/out_file**: 日志文件路径

## 安装依赖

### PM2 全局安装

```bash
npm install -g pm2
pm2 startup
pm2 save
```

### 前端依赖

```bash
cd frontend
npm install
npm run build
```

### 后端依赖

```bash
cd backend
npm install
npm run build
```

## 性能优化建议

1. **调整 instances**：根据 CPU 核心数设置，充分利用多核
   ```javascript
   instances: 'max',  // 自动检测 CPU 核心数
   ```

2. **启用日志轮转**：防止日志文件过大
   ```bash
   pm2 install pm2-logrotate
   ```

3. **设置内存限制**：防止内存泄漏导致崩溃
   ```javascript
   max_memory_restart: '1G',
   ```

4. **启用优雅重启**：
   ```javascript
   kill_timeout: 5000,
   listen_timeout: 3000,
   ```

## 监控和告警

### 推荐工具

- **pm2-auto-pull**: 自动拉取更新
- **pm2-logrotate**: 日志自动轮转
- **pm2-auto-restart**: 异常自动重启
- **pm2-web**: Web 管理面板

```bash
pm2 install pm2-logrotate
pm2 web                          # 启动 Web 面板 (http://localhost:9615)
```

## 备份和恢复

### 备份进程配置

```bash
pm2 save
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.bak
```

### 恢复进程配置

```bash
pm2 resurrect
```

## 常见问题

**Q: 部署后后端仍无响应？**
A: 检查后端日志 `./scripts/logs.sh backend-err`，可能是依赖缺失或配置错误。

**Q: 如何在服务器启动时自动启动 PM2？**
A: 运行 `pm2 startup` 和 `pm2 save`

**Q: 如何查看实时监控？**
A: 运行 `pm2 monit` 或使用 `./scripts/monitor.sh`

**Q: 如何清理旧日志？**
A: 运行 `./scripts/logs.sh clean` 或安装 `pm2-logrotate` 自动轮转

## 支持

如有问题，请检查：
1. 日志文件：`./scripts/logs.sh backend-err`
2. 进程状态：`pm2 list`
3. 资源使用：`pm2 monit`
4. 健康检查：`./scripts/health-check.sh`
