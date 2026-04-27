#!/bin/bash

# PM2 服务器初始化脚本
# 在服务器上运行此脚本以设置 PM2 环境

set -e

echo "🔧 正在初始化服务器环境..."

# 更新系统
echo "📦 更新系统..."
apt-get update || true
apt-get upgrade -y || true

# 安装必要的工具
echo "📦 安装基础工具..."
apt-get install -y curl wget git build-essential || true

# 安装 Node.js（如果未安装）
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || {
        echo "⚠️  使用备选方式安装 Node.js..."
        apt-get install -y nodejs || true
    }
    apt-get install -y nodejs || true
fi

# 验证 Node.js 安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 安装失败，尝试使用系统包管理器..."
    apt-get install -y nodejs npm || true
fi

# 安装 Yarn（如果未安装）
echo "📦 检查 Yarn..."
if ! command -v yarn &> /dev/null; then
    echo "📦 安装 Yarn..."
    npm install -g yarn || true
fi

# 安装 PM2（全局）
echo "📦 安装 PM2..."
npm install -g pm2 || true

# 检查 PM2 是否成功安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 安装失败，正在重试..."
    npm install -g pm2 --force || true
fi

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p /var/log/hik
chmod 755 /var/log/hik

# 创建部署目录
echo "📁 创建部署目录..."
mkdir -p /opt/hik-agent
cd /opt/hik-agent

# 创建前端和后端目录
mkdir -p /opt/hik-agent/frontend
mkdir -p /opt/hik-agent/backend

# 创建 .env 文件（如果不存在）
echo "⚙️  检查环境变量..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
NODE_ENV=production
PORT=8000
EOF
    echo "✓ .env 文件已创建"
fi

# 设置 PM2 开机自启
if command -v pm2 &> /dev/null; then
    echo "⚙️  配置 PM2 开机自启..."
    pm2 startup systemd -u root --hp /root || true
    sleep 1
fi

echo ""
echo "✅ 服务器初始化完成！"
echo ""
echo "📝 当前状态:"
echo "   ✓ Node.js 版本: $(node -v || echo '未安装')"
echo "   ✓ Yarn 版本: $(yarn -v || echo '未安装')"
echo "   ✓ PM2 版本: $(pm2 -v || echo '未安装')"
echo ""

