# 🚀 快速启动指南

## 一键启动所有服务

### 方式 1️⃣：Makefile（⭐ 推荐）

```bash
cd ~/Desktop/hik_agent
make start                  # 启动所有服务
make help                   # 显示所有可用命令
make status                 # 检查服务状态
make logs                   # 查看服务日志
make stop                   # 停止所有服务
make clean                  # 清理临时文件
```

完整命令列表：
```bash
make install           # 安装依赖
make start             # 快速启动（推荐）
make start-all         # 完整启动脚本
make start-chroma      # 仅启动 ChromaDB  
make start-backend     # 仅启动后端
make start-frontend    # 仅启动前端
```

---

### 方式 2️⃣：启动脚本

**在单个终端中运行全部服务：**
```bash
bash start-all.sh
```

**或在不同终端运行各个服务：**
```bash
# 终端 1
bash scripts/start-chroma.sh

# 终端 2
bash scripts/start-backend.sh

# 终端 3
bash scripts/start-frontend.sh
```

---

### 方式 3️⃣：手动启动

```bash
# 终端 1: ChromaDB
docker run -p 8001:8000 -v $(pwd)/data/chroma_db:/chroma/chroma chromadb/chroma

# 终端 2: 后端
cd backend && yarn start

# 终端 3: 前端
cd frontend && yarn dev
```

---

## 访问地址

服务启动后，访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端界面 | http://localhost:1420 | React + Vite 应用 |
| 后端 API | http://localhost:8000 | Hono 服务器 |
| 健康检查 | http://localhost:8000/health | 后端健康状态 |
| ChromaDB | http://localhost:8001 | 向量数据库 |

---

## 诊断工具

### 检查服务状态

```bash
bash scripts/check-status.sh
```

这个脚本会检查：
- ✓ 所有基础服务是否运行
- ✓ 模型是否已下载
- ✓ 依赖是否已安装
- ✓ 端口是否被占用

### 查看服务日志

```bash
make logs                  # 查看所有服务日志

# 或单独查看
tail -f /tmp/chroma.log    # ChromaDB 日志
tail -f /tmp/backend.log   # 后端日志
tail -f /tmp/frontend.log  # 前端日志
```

### 测试网络连接

```bash
# 测试各服务的连通性
curl http://localhost:8001/api/v1/heartbeat  # ChromaDB
curl http://localhost:8000/health         # 后端
```

---

## 故障排查

### ❌ ChromaDB 连接失败

**问题：** `connection refused` 或端口 8001 已被占用

**解决方案：**
1. 检查 Docker 是否运行：`docker ps`
2. 如果使用 Docker 失败，尝试本地版本：
   ```bash
   pip install chromadb
   chroma run --host localhost --port 8001
   ```
3. 或更改端口：`CHROMA_URL=http://localhost:8002 yarn start`

---

### ❌ 后端模型预热失败

**问题：** `LLM 预热失败`

**解决方案：**
1. 检查后端服务是否正常运行：`curl http://localhost:8000/health`
2. 查看后端日志：`tail -f /tmp/backend.log`

---

### ❌ 端口被占用

**查找占用端口的进程：**
```bash
# macOS/Linux
lsof -i :1420    # 前端
lsof -i :8000    # 后端
lsof -i :8001    # ChromaDB

# 杀死进程（替换 PID）
kill -9 <PID>
```

---

## 性能建议

- **内存需求**：最低 8GB RAM，推荐 16GB（考虑 OS 开销）

---

## macOS 快捷别名设置

在 `~/.zshrc` 或 `~/.bash_profile` 中添加别名：

```bash
alias hik='cd ~/Desktop/hik_agent'
alias hik-start='hik && make start'
alias hik-stop='hik && make stop'
alias hik-logs='hik && make logs'
alias hik-status='hik && make status'
```

然后重新加载：
```bash
source ~/.zshrc
```

使用：
```bash
hik-start    # 启动所有服务
hik-stop     # 停止所有服务
hik-logs     # 查看日志
hik-status   # 检查状态
```

---

## 后台持久运行

### 方法 1: 使用 tmux（推荐）
```bash
tmux new-session -d -s hik -c ~/Desktop/hik_agent
tmux send-keys -t hik "make start" Enter

# 查看状态
tmux list-sessions

# 停止
tmux kill-session -t hik
```

### 方法 2: 使用 screen
```bash
screen -d -m -S hik bash -c "cd ~/Desktop/hik_agent && make start"
```

### 方法 3: 使用 systemd（Linux）
创建 `~/.config/systemd/user/hik-agent.service`：
```ini
[Unit]
Description=HIK Agent Services
After=network.target

[Service]
Type=simple
WorkingDirectory=/Users/x/Desktop/hik_agent
ExecStart=/usr/bin/make start
Restart=on-failure

[Install]
WantedBy=default.target
```

然后启动：
```bash
systemctl --user start hik-agent
```

---

## 完整启动流程示例

```bash
# 1. 进入项目目录
cd ~/Desktop/hik_agent

# 2. 一键启动（推荐）
make start

# 3. 检查服务状态
make status

# 4. 访问应用
open http://localhost:1420

# 5. 查看日志（如需排查问题）
make logs

# 6. 完成工作后停止服务
make stop
```

---

## 更多信息

- **平台特定配置**：[PLATFORM.md](./PLATFORM.md)（Windows/Linux/macOS）
- **部署指南**：[DEPLOYMENT.md](./DEPLOYMENT.md)
- **GitHub Secrets 配置**：[GITHUB_SECRETS.md](./GITHUB_SECRETS.md)
