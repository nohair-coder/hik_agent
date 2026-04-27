#!/bin/bash

# PM2 服务器初始化脚本
# 在服务器上运行此脚本以设置 PM2 环境

set -e

echo "🔧 正在初始化服务器环境..."

# 更新系统
echo "📦 更新系统..."
apt-get update
apt-get upgrade -y || true

# 安装 Node.js（如果未安装）
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
fi

# 安装 Yarn（如果未安装）
echo "📦 检查 Yarn..."
if ! command -v yarn &> /dev/null; then
    echo "📦 安装 Yarn..."
    npm install -g yarn
fi

# 安装 PM2（全局）
echo "📦 安装 PM2..."
npm install -g pm2

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p /var/log/hik
chmod 755 /var/log/hik

# 创建部署目录
echo "📁 创建部署目录..."
mkdir -p /opt/hik-agent
cd /opt/hik-agent

# 安装 Ollama（如果未安装）
echo "🤖 检查 Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "🤖 安装 Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh || true
fi

# 启动 Ollama 服务（如果未启动）
echo "🤖 启动 Ollama 服务..."
systemctl start ollama || nohup ollama serve > /var/log/hik/ollama.log 2>&1 &

# 安装 ChromaDB
echo "📊 检查 ChromaDB..."
if ! command -v chroma &> /dev/null; then
    echo "📊 安装 ChromaDB..."
    pip3 install chromadb || true
fi

# 启动 ChromaDB（后台）
echo "📊 启动 ChromaDB..."
nohup chroma run --host localhost --port 8001 > /var/log/hik/chroma.log 2>&1 &

# 创建 .env 文件（如果不存在）
echo "⚙️  检查环境变量..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
NODE_ENV=production
PORT=8000
CHROMA_URL=http://localhost:8001
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=qwen2.5:7b
EMBEDDING_MODEL=bge-m3
EOF
    echo "✓ .env 文件已创建"
fi

# 设置 PM2 开机自启
echo "⚙️  配置 PM2 开机自启..."
pm2 startup systemd -u root --hp /root || true

echo ""
echo "✅ 服务器初始化完成！"
echo ""
echo "📝 后续步骤："
echo "   1. 上传代码到 /opt/hik-agent"
echo "   2. 运行: cd /opt/hik-agent && yarn install"
echo "   3. 运行: pm2 start ecosystem.config.js"
echo "   4. 运行: pm2 save"
echo ""
