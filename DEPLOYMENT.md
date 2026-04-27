# CI/CD 部署指南

## 概述

本项目已配置自动 CI/CD 流程，在代码 merge 到 `main` 分支时自动部署到阿里云服务器。

## 架构

- **GitHub Actions**：监听 main 分支的推送，自动构建和部署
- **Docker + Docker Compose**：容器化部署
- **SSH + sshpass**：安全连接到阿里云服务器
- **Nginx**：反向代理前端和后端

## 环境变量配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加以下密钥：

| 环境变量 | 值 | 说明 |
|---------|-----|------|
| `ALIYUN_HOST` | `8.136.151.205` | 阿里云服务器公网 IP |
| `ALIYUN_USER` | `root` | SSH 用户名 |
| `ALIYUN_PASSWORD` | `Wangxuezhishi32!` | SSH 密码 |

### 添加步骤

1. 打开 GitHub 仓库主页
2. 点击 **Settings**（设置）
3. 左侧菜单选择 **Secrets and variables** > **Actions**
4. 点击 **New repository secret**（新建仓库密钥）
5. 分别添加上述三个密钥及其值

**注意**：不要在代码中提交密码，使用 GitHub Secrets 来安全存储。

## 服务器初始化

首次部署前，需要在阿里云服务器上初始化环境：

```bash
# 本地运行
sshpass -p "Wangxuezhishi32!" ssh root@8.136.151.205 'bash -s' < scripts/init-server.sh
```

或者手动登录服务器后运行：

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/hik_agent/main/scripts/init-server.sh | bash
```

## 部署流程

### 自动部署（推荐）

1. 在本地开发并提交代码
2. 创建 Pull Request 到 `main` 分支
3. PR 被 merge 后，GitHub Actions 自动触发
4. 系统自动构建、测试并部署到阿里云

### 查看部署状态

在 GitHub 仓库页面：
- 点击 **Actions** 标签
- 查看最新的工作流运行状态
- 点击具体运行查看详细日志

## 访问部署的应用

部署完成后，可以访问：

- **前端**：http://8.136.151.205:1420
- **后端 API**：http://8.136.151.205:8000
- **Ollama**：http://8.136.151.205:11434
- **ChromaDB**：http://8.136.151.205:8001

## 文件说明

### `.github/workflows/deploy.yml`
GitHub Actions 工作流配置，定义了完整的 CI/CD 流程。

### `backend/Dockerfile`
后端 Node.js 应用容器化配置。

### `frontend/Dockerfile`
前端 React 应用容器化配置（使用多阶段构建 + Nginx）。

### `frontend/nginx.conf`
Nginx 反向代理配置，处理前端路由和 API 代理。

### `docker-compose.prod.yml`
生产环境 Docker Compose 配置，编排所有服务。

### `scripts/init-server.sh`
服务器初始化脚本，自动安装 Docker 和 Docker Compose。

## 手动部署

如果需要手动部署，连接到服务器后运行：

```bash
# SSH 连接
sshpass -p "Wangxuezhishi32!" ssh root@8.136.151.205

# 在服务器上
cd /opt/hik-agent

# 拉取最新代码
git pull

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 故障排查

### 部署失败

1. 检查 GitHub Actions 日志：仓库 > Actions > 失败的工作流
2. 常见问题：
   - SSH 连接失败：检查 IP、用户名、密码是否正确
   - Docker 未安装：运行初始化脚本
   - 端口被占用：检查防火墙规则

### 服务无法访问

1. 检查防火墙规则：
   ```bash
   # 在服务器上
   sudo ufw allow 1420/tcp
   sudo ufw allow 8000/tcp
   sudo ufw allow 11434/tcp
   sudo ufw allow 8001/tcp
   ```

2. 检查容器状态：
   ```bash
   docker ps -a
   docker-compose -f docker-compose.prod.yml logs
   ```

### 删除/更新部署

```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 删除所有数据卷
docker-compose -f docker-compose.prod.yml down -v

# 重新启动
docker-compose -f docker-compose.prod.yml up -d
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

在 `backend/.env` 中配置：

```env
NODE_ENV=production
PORT=8000
CHROMA_HOST=chroma
CHROMA_PORT=8000
OLLAMA_HOST=http://ollama:11434
```

### 前端环境变量

在 `frontend/.env` 中配置：

```env
REACT_APP_API_BASE_URL=http://8.136.151.205:8000/api
```

## 更新部署

1. 在本地开发并测试
2. 提交代码并创建 PR
3. Merge 到 main 后自动部署
4. 或者手动触发工作流：
   ```bash
   # 使用 GitHub CLI
   gh workflow run deploy.yml
   ```

## 支持和反馈

如有问题，请提交 Issue 或检查日志了解详细错误信息。
