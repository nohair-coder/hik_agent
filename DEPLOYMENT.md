# CI/CD 部署指南

## 概述

本项目已配置自动 CI/CD 流程，在代码 merge 到 `main` 分支时自动部署到阿里云服务器。

使用 **PM2 进程管理器** 在生产环境中运行应用。

**详细文档：** [PM2_DEPLOYMENT.md](./PM2_DEPLOYMENT.md)

## 环境变量配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加以下密钥：

| 环境变量 | 值 | 说明 |
|---------|-----|------|
| `ALIYUN_HOST` | `8.136.151.205` | 阿里云服务器公网 IP |
| `ALIYUN_USER` | `root` | SSH 用户名 |
| `ALIYUN_PASSWORD` | `Wangxuezhishi32!` | SSH 密码 |

详见：[GITHUB_SECRETS.md](./GITHUB_SECRETS.md)

---

## 部署架构

- **GitHub Actions**：监听 main 分支的推送，自动构建和部署
- **PM2**：进程管理和自动重启
- **SSH + sshpass**：安全连接到阿里云服务器

## 服务器初始化

首次部署时，CI/CD 流程会自动检查服务器环境并初始化（如果需要）。

初始化脚本会自动：
- ✅ 安装 Node.js 20 和 Yarn
- ✅ 安装 PM2 全局
- ✅ 创建日志目录
- ✅ 配置开机自启

**如需手动初始化服务器：**

```bash
sshpass -p "Wangxuezhishi32!" ssh root@8.136.151.205 'bash -s' < scripts/init-server-pm2.sh
```

## 部署流程

### 自动部署（推荐）

1. 在本地开发并提交代码
2. Push 到 `main` 分支（或创建 PR merge 到 main）
3. GitHub Actions 自动触发：
   - ✅ 构建后端和前端
   - ✅ 初始化服务器（如需要）
   - ✅ 上传代码到服务器
   - ✅ 使用 PM2 启动/重启服务
   - ✅ 验证服务状态

### 查看部署状态

在 GitHub 仓库页面：
- 点击 **Actions** 标签
- 查看最新的工作流运行状态
- 点击具体运行查看详细日志

## 访问部署的应用

部署完成后，可以访问：

- **前端**：http://8.136.151.205:1420
- **后端 API**：http://8.136.151.205:8000
- **ChromaDB**：http://8.136.151.205:8001

## 文件说明

### `.github/workflows/deploy.yml`
GitHub Actions 工作流配置，定义了完整的 CI/CD 流程（构建、初始化、部署）。

### `ecosystem.config.js`
PM2 进程管理配置，定义了后端和前端应用的启动参数和日志位置。

### `scripts/init-server-pm2.sh`
服务器初始化脚本，自动安装 Node.js、PM2、ChromaDB 等依赖。

## 手动部署

如果需要手动部署，可以按以下步骤操作：

### 第一步：构建应用

```bash
cd backend && yarn build
cd ../frontend && yarn build
```

### 第二步：上传代码

```bash
# 上传后端
sshpass -p "Wangxuezhishi32!" scp -r backend/dist root@8.136.151.205:/opt/hik-agent/backend/

# 上传前端
sshpass -p "Wangxuezhishi32!" scp -r frontend/dist root@8.136.151.205:/opt/hik-agent/frontend/

# 上传 PM2 配置
sshpass -p "Wangxuezhishi32!" scp ecosystem.config.js root@8.136.151.205:/opt/hik-agent/
```

### 第三步：重启服务

```bash
sshpass -p "Wangxuezhishi32!" ssh root@8.136.151.205 << 'EOF'
cd /opt/hik-agent
pm2 restart all
pm2 list
EOF
```

详见：[PM2_DEPLOYMENT.md](./PM2_DEPLOYMENT.md)

## 故障排查

### 部署失败

1. 检查 GitHub Actions 日志：仓库 > Actions > 失败的工作流
2. 常见问题：
   - SSH 连接失败：检查 IP、用户名、密码是否正确
   - 权限错误：确保 root 用户可以访问 /opt/hik-agent 目录
   - PM2 启动失败：查看 `/var/log/hik/` 目录的日志文件

### 应用无法启动

在服务器上查看日志：

```bash
pm2 logs hik-backend --lines 50
pm2 logs hik-frontend --lines 50
```

### 服务无法访问

1. 检查应用是否运行：

```bash
pm2 list
```

2. 检查防火墙规则：

```bash
#在服务器上
sudo ufw allow 1420/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 8001/tcp
```

3. 检查进程状态：

```bash
curl http://localhost:8000/health        # 后端
curl http://localhost:1420               # 前端
```

## 安全建议

1. **更改密码**：建议定期更改阿里云服务器 root 密码
2. **使用 SSH 密钥**：配置 SSH 公钥认证（比密码更安全）
   ```bash
   # 生成本地密钥对
   ssh-keygen -t ed25519

   # 添加到 GitHub Secrets
   # ALIYUN_SSH_PRIVATE_KEY
   ```

3. **配置防火墙**：只开放必要的端口
4. **使用反向代理**：配置 SSL/TLS 证书进行 HTTPS 访问

## 环境变量

### 后端环境变量

在 `backend/.env` 或 `ecosystem.config.js` 中配置：

```env
NODE_ENV=production
PORT=8000
CHROMA_URL=http://localhost:8001
EMBEDDING_MODEL=bge-m3
```

### 前端环境变量

在 `frontend/.env` 中配置（如需要）：

```env
VITE_API_BASE_URL=http://8.136.151.205:8000/api
```

## PM2 管理

在服务器上可以使用以下命令管理应用：

```bash
# 查看进程列表
pm2 list

# 查看实时监控
pm2 monit

# 查看日志
pm2 logs hik-backend
pm2 logs hik-frontend

# 重启应用
pm2 restart all
pm2 restart hik-backend

# 停止应用
pm2 stop all
pm2 delete all
```

详见：[PM2_DEPLOYMENT.md](./PM2_DEPLOYMENT.md)

---

## 支持和反馈

如有问题，请：

1. 检查 GitHub Actions 日志
2. 查看服务器上的日志文件：`/var/log/hik/`
3. 使用 `pm2 logs` 查看实时日志
4. 提交 Issue 提供详细错误信息
