# 启动脚本和自动化工具使用指南

## 文件树

```
hik_agent/
├── start-all.sh                    # 🚀 一键启动脚本（包含所有 Unix 系统支持）
├── Makefile                        # 📋 Makefile 命令配置（推荐）
├── docker-compose.yml              # 🐳 Docker 容器编排配置
├── QUICKSTART.md                   # 🚀 快速启动指南（详细）
├── PLATFORM.md                     # 💻 平台特定配置
├── scripts/
│   ├── start-ollama.sh             # 启动 Ollama
│   ├── start-chroma.sh             # 启动 ChromaDB
│   ├── start-backend.sh            # 启动后端服务
│   ├── start-frontend.sh           # 启动前端服务
│   └── check-status.sh             # 🔍 服务状态检查工具
├── backend/
│   ├── .env.example                # 配置文件示例
│   └── ...
└── ...
```

---

## 快速启动（三种方式）

### 方式 1️⃣：Makefile（⭐ 推荐）

**最快最简单的方式：**

```bash
cd ~/Desktop/hik_agent
make start
```

**其他有用的命令：**

```bash
make help              # 显示所有可用命令
make status            # 检查服务状态
make logs              # 查看服务日志
make stop              # 停止所有服务
make clean             # 清理临时文件
```

完整列表：
```bash
make install           # 安装依赖
make start             # 快速启动（推荐）
make start-all         # 完整启动脚本
make start-ollama      # 仅启动 Ollama
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
bash scripts/start-ollama.sh

# 终端 2
bash scripts/start-chroma.sh

# 终端 3
bash scripts/start-backend.sh

# 终端 4
bash scripts/start-frontend.sh
```

---

### 方式 3️⃣：Docker Compose

**使用 Docker 启动容器化服务：**

```bash
docker-compose up -d     # 启动 Ollama 和 ChromaDB
docker-compose ps        # 查看运行状态
docker-compose logs -f   # 查看日志
docker-compose down      # 停止服务
```

然后启动应用：
```bash
cd backend && yarn start
cd frontend && yarn dev
```

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
tail -f /tmp/ollama.log    # Ollama 日志
tail -f /tmp/chroma.log    # ChromaDB 日志
tail -f /tmp/backend.log   # 后端日志
tail -f /tmp/frontend.log  # 前端日志
```

### 测试网络连接

```bash
# 测试各服务的连通性
curl http://localhost:11434/api/tags      # Ollama
curl http://localhost:8001/api/v1/heartbeat  # ChromaDB
curl http://localhost:8000/health         # 后端
```

---

## 常见错误和解决方案

### ❌ "Ollama 未安装" 或 "ollama: command not found"

**原因：** Ollama 未安装或路径不正确

**解决方案：**
```bash
# macOS
brew install ollama
# 或访问 https://ollama.ai 下载

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 下载 https://ollama.ai/download
```

### ❌ "Port 11434 already in use"

**原因：** Ollama 已经在运行或其他进程占用了端口

**解决方案：**
```bash
# 查找占用的进程
lsof -i :11434

# 停止该进程（替换 PID）
kill -9 <PID>

# 或者修改 .env 中的 OLLAMA_BASE_URL
```

### ❌ "ChromaDB connection refused"

**原因：** ChromaDB 未启动

**解决方案：**
```bash
# 检查是否运行
curl http://localhost:8001/api/v1/heartbeat

# 启动 ChromaDB
make start-chroma
# 或
docker run -p 8001:8000 -v $(pwd)/data/chroma_db:/chroma/chroma chromadb/chroma
```

### ❌ "模型预热失败"

**原因：** Ollama 服务未启动或模型未下载

**解决方案：**
```bash
# 1. 启动 Ollama
ollama serve

# 2. 在另一个终端中下载模型
ollama pull qwen2.5:7b
ollama pull bge-m3

# 3. 验证模型
ollama list

# 4. 重启后端
make start-backend
```

---

## 高级用法

### 环境变量配置

创建 `backend/.env` 文件：

```env
PORT=8000
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=qwen2.5:7b
EMBEDDING_MODEL=bge-m3
CHROMA_URL=http://localhost:8001
NUM_CTX=8192
TECH_RETRIEVER_K=5
STYLE_RETRIEVER_K=3
```

参考 `backend/.env.example` 了解完整配置。

### 性能优化

**启用 GPU 加速（Docker）：**

编辑 `docker-compose.yml`：
```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

**调整并发处理：**

编辑 `backend/.env`：
```env
NUM_CTX=8192          # 增加上下文窗口
TEMPERATURE=0.3       # 降低随机性（0-1）
```

### 后台持久运行

**使用 tmux：**
```bash
tmux new-session -d -s hik -c ~/Desktop/hik_agent
tmux send-keys -t hik "make start" Enter

# 查看
tmux ls

# 停止
tmux kill-session -t hik
```

**使用 nohup：**
```bash
nohup make start > ~/hik.log 2>&1 &
```

**使用 systemd（Linux）：**

创建 `~/.config/systemd/user/hik-agent.service`：
```ini
[Unit]
Description=HIK Agent
After=network.target

[Service]
WorkingDirectory=%h/Desktop/hik_agent
ExecStart=/usr/bin/make start
Restart=on-failure

[Install]
WantedBy=default.target
```

启动：
```bash
systemctl --user enable hik-agent
systemctl --user start hik-agent
```

---

## 平台特定说明

详见 [PLATFORM.md](./PLATFORM.md)：
- 🍎 macOS 用户指南
- 🪟 Windows PowerShell 命令
- 🐧 Linux 及 GPU 加速
- ☁️ 云服务器部署

---

## 完整启动流程示例

```bash
# 1. 进入项目目录
cd ~/Desktop/hik_agent

# 2. 安装依赖（首次）
make install

# 3. 启动所有服务
make start

# 4. 检查服务状态
make status

# 5. 访问应用
# 前端: http://localhost:1420
# 后端: http://localhost:8000

# 6. 如果出现问题，检查日志
make logs

# 7. 完成后停止服务
make stop
```

---

## 常用快捷命令总结

| 操作 | 命令 |
|------|------|
| 🚀 快速启动 | `make start` |
| ❌ 停止服务 | `make stop` |
| 📊 检查状态 | `make status` 或 `bash scripts/check-status.sh` |
| 📝 查看日志 | `make logs` |
| 🔧 查看帮助 | `make help` |
| 🏗️ 安装依赖 | `make install` |
| 🧹 清理临时 | `make clean` |

---

## 获取帮助

- **快速启动指南**：[QUICKSTART.md](./QUICKSTART.md)
- **平台特定配置**：[PLATFORM.md](./PLATFORM.md)
- **项目规划文档**：[docs/plans/](./docs/plans/)
- **技术栈支持**：参见 README.md

---

## 版本信息

- Node.js: v20+ (推荐)
- Yarn: v1.22+
- Docker: 20.10+ (可选)
- Ollama: 最新版
- chromadb: 0.5.0+
