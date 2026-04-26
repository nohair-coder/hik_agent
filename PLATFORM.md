# 平台特定配置指南

## macOS 用户

### 前置要求

1. **安装 Ollama（必须）**
   ```bash
   # 访问 https://ollama.ai 下载 macOS 版本
   # 或使用 Homebrew：
   brew install ollama
   ```

2. **安装 Docker（可选，用于 ChromaDB）**
   ```bash
   brew install docker docker-compose
   # 或下载 Docker Desktop: https://www.docker.com/products/docker-desktop
   ```

3. **安装 Node.js**
   ```bash
   brew install node yarn
   # 或从 https://nodejs.org 下载
   ```

### 推荐启动方式

**方式 1：Makefile（最简单）**
```bash
cd ~/Desktop/hik_agent
make start
```

**方式 2：打开应用 + 命令行**
```bash
# 1. 从 Applications 打开 Ollama 应用
open -a Ollama

# 2. 在终端启动后端和前端
cd ~/Desktop/hik_agent
bash scripts/start-backend.sh &
bash scripts/start-frontend.sh &
```

**方式 3：Docker Compose**
```bash
docker-compose up -d  # 启动 Ollama 和 ChromaDB
cd ~/Desktop/hik_agent
yarn dev  # 前端（或后端）
```

### Zsh 别名（可选快捷方式）

将以下内容添加到 `~/.zshrc`：

```bash
# HIK Agent 快捷方式
alias hik='cd ~/Desktop/hik_agent'
alias hik-start='hik && make start'
alias hik-stop='hik && make stop'
alias hik-logs='hik && make logs'
alias hik-status='hik && make status'
alias hik-dev='hik && make start-backend & make start-frontend &'
```

然后重新加载：
```bash
source ~/.zshrc
```

使用：
```bash
hik-start   # 启动所有服务
hik-status  # 检查运行状态
```

### 性能建议

- **M1/M2 Mac**：Ollama 自动使用 GPU 加速，性能最佳
- **内存**：建议至少 8GB，16GB+ 推荐
- **磁盘**：预留 20GB 以上空间（模型 + Docker 镜像）

---

## Windows 用户

### 前置要求

1. **安装 Ollama**
   - 下载：https://ollama.ai
   - 或使用 Windows Package Manager：`winget install Ollama.Ollama`

2. **安装 Docker Desktop**
   - 下载：https://www.docker.com/products/docker-desktop
   - 启用 WSL 2 后端

3. **安装 Node.js**
   - 下载：https://nodejs.org
   - 包含 npm，推荐也安装 Yarn：`npm install -g yarn`

### 推荐启动方式

**方式 1：使用 PowerShell**
```powershell
cd C:\Users\<YourUsername>\Desktop\hik_agent
# 安装 make（如果没有）：choco install make

make start
```

**方式 2：Docker Compose（推荐）**
```powershell
docker-compose up -d
# 在另一个 PowerShell 窗口
cd C:\Users\<YourUsername>\Desktop\hik_agent
yarn install
yarn dev
```

**方式 3：PowerShell 脚本**

创建 `start-all.ps1`：
```powershell
# 启动 Ollama
Start-Process "ollama" -ArgumentList "serve"
Start-Sleep -Seconds 3

# 启动 ChromaDB (Docker)
docker run -d -p 8001:8000 -v ./data/chroma_db:/chroma/chroma chromadb/chroma

# 启动后端
Start-Process powershell -ArgumentList "-Command `"cd backend; yarn start`""

# 启动前端
Start-Process powershell -ArgumentList "-Command `"cd frontend; yarn dev`""
```

运行：
```powershell
.\start-all.ps1
```

### 常见问题

**问题：Ollama 启动失败**
- 确保 Ollama 应用已打开（在系统托盘中）
- 检查防火墙是否阻止了端口 11434

**问题：Docker 容器无法启动**
- 确保 Docker Desktop 正在运行
- 检查磁盘空间是否足够

---

## Linux 用户

### 前置要求（Ubuntu/Debian 示例）

```bash
# 更新包管理器
sudo apt update && sudo apt upgrade -y

# 安装 curl 和其他工具
sudo apt install -y curl git

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Yarn
npm install -g yarn

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

### 推荐启动方式

**方式 1：Systemd 服务（服务器建议）**

创建 `~/.config/systemd/user/hik-backend.service`：
```ini
[Unit]
Description=HIK Agent Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/Desktop/hik_agent/backend
ExecStart=/usr/bin/yarn start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

创建 `~/.config/systemd/user/hik-frontend.service`：
```ini
[Unit]
Description=HIK Agent Frontend
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/Desktop/hik_agent/frontend
ExecStart=/usr/bin/yarn dev
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

启动：
```bash
systemctl --user start hik-backend
systemctl --user start hik-frontend

# 查看状态
systemctl --user status hik-backend
systemctl --user status hik-frontend

# 开机自启
systemctl --user enable hik-backend hik-frontend
```

**方式 2：Docker Compose（最简单）**
```bash
cd ~/Desktop/hik_agent
docker-compose up -d
yarn install
yarn dev
```

**方式 3：Makefile**
```bash
cd ~/Desktop/hik_agent
make start
```

### GPU 加速（NVIDIA）

如果有 NVIDIA GPU，可以加速模型推理：

1. 安装 NVIDIA Container Toolkit：
```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
```

2. 修改 `docker-compose.yml` 启用 GPU：
```yaml
ollama:
  image: ollama/ollama:latest
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

3. 启动：
```bash
docker-compose up -d
```

### Nohup 后台运行

```bash
# 后端
nohup bash scripts/start-backend.sh > ~/hik_backend.log 2>&1 &

# 前端
nohup bash scripts/start-frontend.sh > ~/hik_frontend.log 2>&1 &

# 查看日志
tail -f ~/hik_backend.log
tail -f ~/hik_frontend.log
```

---

## Docker Compose 多合一启动

对于所有平台，最简单的方式是使用 Docker Compose：

```bash
# 启动 Ollama 和 ChromaDB
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 清理卷数据
docker-compose down -v
```

---

## 远程服务器部署

如果在云服务器上部署，建议使用 Nginx 反向代理：

**Nginx 配置** (`/etc/nginx/sites-available/hik-agent`):

```nginx
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:1420;
}

server {
    listen 80;
    server_name your-domain.com;

    # 后端 API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 前端
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用：
```bash
sudo ln -s /etc/nginx/sites-available/hik-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 故障排查工具

### 检查端口占用
```bash
# macOS/Linux
lsof -i :8000    # 后端
lsof -i :1420    # 前端
lsof -i :11434   # Ollama
lsof -i :8001    # ChromaDB
```

### 查看进程
```bash
ps aux | grep ollama
ps aux | grep chroma
ps aux | grep yarn
```

### 网络诊断
```bash
# 测试连接
curl http://localhost:11434/api/tags
curl http://localhost:8001/api/v1/heartbeat
curl http://localhost:8000/health
```

### 资源监控
```bash
# 实时监控
watch -n 1 'docker ps && docker stats --no-stream'

# macOS
top -l 1 | head -20
```
