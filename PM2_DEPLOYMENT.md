# PM2 部署指南

## 概述

本项目使用 PM2 进程管理器在生产服务器上运行后端和前端应用。

## 自动部署流程

### 1. 首次部署

在 GitHub 上配置好 Secrets 后，任何 push 到 `main` 分支的代码都会自动触发以下流程：

1. ✅ 检查服务器环境（PM2 是否已安装）
2. ✅ 如需要，自动初始化服务器（安装 Node.js、Yarn、PM2、ChromaDB）
3. ✅ 构建后端和前端
4. ✅ 上传代码和配置文件到服务器
5. ✅ 使用 PM2 启动服务
6. ✅ 验证服务状态

### 2. 后续部署

只需 push 代码到 `main` 分支，CI/CD 流程会自动：
- 构建新版本
- 上传到服务器
- 重启 PM2 进程

---

## 手动部署

如果需要手动部署到服务器：

### 第一步：初始化服务器（首次运行）

```bash
# 本地运行（连接到服务器并运行初始化脚本）
sshpass -p "Wangxuezhishi32!" ssh root@8.136.151.205 'bash -s' < scripts/init-server-pm2.sh
```

或者手动登录服务器后运行：

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/hik_agent/main/scripts/init-server-pm2.sh | bash
```

### 第二步：上传代码

```bash
# 本地构建
cd backend && yarn build
cd ../frontend && yarn build

# 上传到服务器
sshpass -p "Wangxuezhishi32!" scp -r backend/dist root@8.136.151.205:/opt/hik-agent/backend/
sshpass -p "Wangxuezhishi32!" scp -r frontend/dist root@8.136.151.205:/opt/hik-agent/frontend/
sshpass -p "Wangxuezhishi32!" scp ecosystem.config.cjs root@8.136.151.205:/opt/hik-agent/
```

### 第三步：启动服务

```bash
sshpass -p "Wangxuezhishi32!" ssh root@8.136.151.205 << 'EOF'
cd /opt/hik-agent
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 list
EOF
```

---

## PM2 配置说明

`ecosystem.config.cjs` 文件配置了两个应用：

### 后端应用（hik-backend）

```javascript
{
  name: 'hik-backend',
  script: 'dist/index.js',           // 入口文件
  cwd: '/opt/hik-agent/backend',    // 工作目录
  instances: 1,                       // 单个实例
  exec_mode: 'fork',                  // fork 模式
  autorestart: true,                  // 自动重启
  max_memory_restart: '500M',         // 内存限制
  env: {                              // 环境变量
    NODE_ENV: 'production',
    PORT: 8000,
  }
}
```

### 前端应用（hik-frontend）

```javascript
{
  name: 'hik-frontend',
  script: 'yarn',
  args: 'preview --port 1420',        // Vite preview 模式
  cwd: '/opt/hik-agent/frontend',
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
}
```

---

## 常用 PM2 命令

### 在服务器上运行

```bash
# 启动应用
pm2 start ecosystem.config.cjs

# 停止应用
pm2 stop all              # 停止所有
pm2 stop hik-backend      # 停止指定应用

# 重启应用
pm2 restart all           # 重启所有
pm2 restart hik-backend   # 重启指定应用

# 查看进程列表
pm2 list

# 查看进程状态和资源占用
pm2 monit

# 查看日志
pm2 logs                          # 查看所有日志
pm2 logs hik-backend              # 查看后端日志
pm2 logs hik-backend --lines 100  # 查看最后 100 行

# 删除应用
pm2 delete all            # 删除所有
pm2 delete hik-backend    # 删除指定应用

# 保存配置（用于开机自启）
pm2 save

# 设置开机自启
pm2 startup

# 查看开机自启状态
pm2 status

# 禁用开机自启
pm2 unstartup
```

---

## 访问部署的应用

部署完成后，可以访问：

| 服务 | 网址 |
|------|------|
| 🖥️ 前端 | http://8.136.151.205:1420 |
| 🔧 API | http://8.136.151.205:8000 |

---

## 故障排查

### 应用无法启动

```bash
# 检查日志
pm2 logs hik-backend --lines 50

# 检查进程状态
pm2 list

# 如果日志显示错误，可能是：
# 1. 依赖未安装：cd /opt/hik-agent/backend && yarn install
# 2. 端口已被占用：lsof -i :8000
# 3. 环境变量错误：检查 ecosystem.config.cjs
```

### 内存持续增长

如果应用内存持续增长：

1. 在 `ecosystem.config.cjs` 中设置 `max_memory_restart`
2. 或定期重启应用：

```bash
# 每天凌晨 2 点重启后端
pm2 cron-restart "0 2 * * *" hik-backend
```

### 查看详细的进程信息

```bash
pm2 show hik-backend    # 显示后端应用的详细信息
pm2 info hik-backend    # 同上
```

---

## 日志文件位置

日志文件存储在 `/var/log/hik/` 目录：

```
/var/log/hik/
├── backend.log          # 后端应用日志
├── backend-out.log      # 后端标准输出
├── backend-error.log    # 后端错误日志
├── frontend.log         # 前端应用日志
├── frontend-out.log     # 前端标准输出
├── frontend-error.log   # 前端错误日志
└── chroma.log           # ChromaDB 日志
```

查看日志：

```bash
# 实时查看
tail -f /var/log/hik/backend.log

# 查看最后 100 行
tail -n 100 /var/log/hik/backend.log

# 搜索错误
grep ERROR /var/log/hik/backend.log
```

---

## GitHub Actions 部署日志

每次部署时，可以在 GitHub Actions 中查看详细日志：

1. 打开仓库 → **Actions** 标签
2. 点击最新的工作流运行
3. 点击 "Deploy to Aliyun server" 步骤查看详细输出

---

## 更新应用

### 更新后端

1. 修改代码
2. 提交并 push 到 `main` 分支
3. GitHub Actions 自动部署

或手动更新：

```bash
# 本地
cd backend && yarn build
sshpass -p "PASSWORD" scp -r dist root@IP:/opt/hik-agent/backend/

# 服务器上
pm2 restart hik-backend
```

### 更新前端

```bash
# 本地
cd frontend && yarn build
sshpass -p "PASSWORD" scp -r dist root@IP:/opt/hik-agent/frontend/

# 服务器上
pm2 restart hik-frontend
```

---

## 安全建议

1. **定期检查日志**，查看是否有异常
2. **定期重启应用**，防止内存泄漏
3. **监控磁盘空间**，日志文件会持续增长
4. **定期清理日志**：

```bash
# 清理 7 天前的日志
find /var/log/hik -type f -mtime +7 -delete

# 或者限制日志大小
pm2 start ecosystem.config.cjs --max-log-size 10M
```

5. **更新 PM2**：

```bash
npm install -g pm2@latest
pm2 update
```

---

## 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - CI/CD 部署概览
- [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) - GitHub Secrets 配置
- [README.md](./README.md) - 项目概览
