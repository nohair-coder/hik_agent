#!/bin/bash

# 阿里云服务器初始化脚本
# 在服务器上运行此脚本以设置环境

set -e

echo "正在初始化阿里云服务器..."

# 更新系统
echo "更新系统..."
apt-get update
apt-get upgrade -y

# 安装 Docker
echo "安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 启动 Docker
echo "启动 Docker..."
systemctl start docker
systemctl enable docker

# 创建部署目录
echo "创建部署目录..."
mkdir -p /opt/hik-agent
cd /opt/hik-agent

# 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# 后端环境配置
NODE_ENV=production
PORT=8000

# ChromaDB 配置
CHROMA_HOST=localhost
CHROMA_PORT=8001

# API 配置
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:1420
EOF
    echo "✓ .env 文件已创建"
fi

echo ""
echo "✓ 服务器初始化完成！"
