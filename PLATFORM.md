# 平台特定配置指南

## macOS 用户

### 前置要求

1. **安装 Docker（可选，用于 ChromaDB）**
    ```bash
    brew install docker
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

**方式 2：命令行启动**
```bash
cd ~/Desktop/hik_agent
bash scripts/start-backend.sh &
bash scripts/start-frontend.sh &
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

- **内存**：建议至少 8GB，16GB+ 推荐
- **磁盘**：预留 20GB 以上空间（Docker 镜像）

---

## Windows 用户

### 前置要求

1. **安装 Docker Desktop**
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

**方式 2：PowerShell 脚本**

创建 `start-all.ps1`：
```powershell
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

**方式 2：Makefile**
```bash
cd ~/Desktop/hik_agent
make start
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
lsof -i :8001    # ChromaDB
```

### 查看进程
```bash
ps aux | grep chroma
ps aux | grep yarn
```

### 网络诊断
```bash
# 测试连接
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
