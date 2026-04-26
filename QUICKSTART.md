# 🚀 快速启动指南

## 一键启动所有服务

### 方式 1: 使用 Makefile（推荐）

**首次启动（包含依赖安装）：**
```bash
make start
```

**快速启动（仅启动服务）：**
```bash
make start
```

**查看命令帮助：**
```bash
make help
```

### 方式 2: 使用启动脚本

**完整启动全部服务：**
```bash
bash start-all.sh
```

**单独启动各个服务：**
```bash
# 终端 1: Ollama
bash scripts/start-ollama.sh

# 终端 2: ChromaDB
bash scripts/start-chroma.sh

# 终端 3: 后端
bash scripts/start-backend.sh

# 终端 4: 前端
bash scripts/start-frontend.sh
```

### 方式 3: 手动启动

```bash
# 终端 1: Ollama
ollama serve

# 终端 2: ChromaDB
docker run -p 8001:8000 -v $(pwd)/data/chroma_db:/chroma/chroma chromadb/chroma

# 终端 3: 后端
cd backend && yarn start

# 终端 4: 前端
cd frontend && yarn dev
```

---

## 常用 Makefile 命令

| 命令 | 说明 |
|------|------|
| `make help` | 显示所有可用命令 |
| `make install` | 安装前后端依赖 |
| `make start` | 🚀 快速启动所有服务 |
| `make start-all` | 完整启动脚本 |
| `make start-ollama` | 仅启动 Ollama |
| `make start-chroma` | 仅启动 ChromaDB |
| `make start-backend` | 仅启动后端 |
| `make start-frontend` | 仅启动前端 |
| `make status` | 检查所有服务状态 |
| `make logs` | 查看所有服务日志 |
| `make stop` | 停止所有服务 |
| `make clean` | 清理临时文件 |

---

## 访问地址

服务启动后，访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端界面 | http://localhost:1420 | React + Vite 应用 |
| 后端 API | http://localhost:8000 | Hono 服务器 |
| 健康检查 | http://localhost:8000/health | 后端健康状态 |
| Ollama | http://localhost:11434 | LLM 服务 |
| ChromaDB | http://localhost:8001 | 向量数据库 |

---

## 故障排查

### ❌ Ollama 启动失败

**问题：** `ollama serve: command not found`

**解决方案：**
1. 检查 Ollama 是否安装：`ollama version`
2. 未安装请访问 https://ollama.ai 下载
3. macOS 用户可以直接打开应用：`open -a Ollama`

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

### ❌ 后端模型预热失败

**问题：** `LLM 预热失败（请确认 Ollama 已启动）`

**解决方案：**
1. 确保 Ollama 已启动：`curl http://localhost:11434/api/tags`
2. 检查模型是否下载：`ollama list`
3. 如果模型缺失，下载：
   ```bash
   ollama pull qwen2.5:7b
   ollama pull bge-m3
   ```

### ❌ 端口被占用

**查找占用端口的进程：**
```bash
# macOS/Linux
lsof -i :1420    # 前端
lsof -i :8000    # 后端
lsof -i :11434   # Ollama
lsof -i :8001    # ChromaDB

# 杀死进程（替换 PID）
kill -9 <PID>
```

---

## 性能建议

- **首次启动较慢**：Ollama 和 bge-m3 首次加载需要 30-60 秒
- **模型下载**：qwen2.5:7b（4.7GB）和 bge-m3（1.2GB），总计 6GB
- **内存需求**：最低 8GB RAM，推荐 16GB（考虑 OS 开销）
- **GPU 加速**：无独显时 CPU 推理约 10-30 tokens/秒

---

## macOS 特定配置

### 方便快捷方式设置

在 `~/.zshrc` 或 `~/.bash_profile` 中添加别名：

```bash
alias hik-start='cd ~/Desktop/hik_agent && make start'
alias hik-stop='cd ~/Desktop/hik_agent && make stop'
alias hik-logs='cd ~/Desktop/hik_agent && make logs'
alias hik-status='cd ~/Desktop/hik_agent && make status'
```

然后就可以直接运行：
```bash
hik-start    # 启动所有服务
hik-stop     # 停止所有服务
hik-logs     # 查看日志
hik-status   # 检查状态
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

## 在后台长期运行

如果需要服务持续运行，可以使用以下方法：

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
