#!/bin/bash

# HIK Agent 部署脚本
# 用法: ./scripts/deploy.sh [env] [rebuild]
# 参数: env (dev|staging|production), rebuild (yes|no)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${1:-production}"
REBUILD="${2:-yes}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

log "开始部署: $DEPLOY_ENV 环境"

# 1. 验证环境
log "1️⃣  验证部署环境..."
if [ ! -d "$PROJECT_ROOT/backend" ] || [ ! -d "$PROJECT_ROOT/frontend" ]; then
    error "项目结构不完整"
fi
success "项目结构验证通过"

# 2. 检查依赖
log "2️⃣  检查依赖..."
if ! command -v node &> /dev/null; then
    error "Node.js 未安装"
fi
if ! command -v pm2 &> /dev/null; then
    error "PM2 未安装，请先运行: npm install -g pm2"
fi
success "依赖检查通过 (Node: $(node -v), PM2: $(pm2 -v))"

# 3. 停止旧进程
log "3️⃣  停止旧的进程..."
if pm2 list | grep -q "hik-agent"; then
    pm2 stop all --silent
    pm2 delete all --silent
    sleep 2
    success "旧进程已停止"
else
    log "没有运行中的进程"
fi

# 4. 构建后端
if [ "$REBUILD" == "yes" ]; then
    log "4️⃣  构建后端..."
    cd "$PROJECT_ROOT/backend"
    npm install --production --silent
    npm run build
    success "后端构建完成"
    
    # 5. 构建前端
    log "5️⃣  构建前端..."
    cd "$PROJECT_ROOT/frontend"
    npm install --production --silent
    npm run build
    success "前端构建完成"
else
    warn "跳过构建 (使用 rebuild=yes 强制重建)"
fi

# 6. 启动服务
cd "$PROJECT_ROOT"
log "6️⃣  启动服务..."

# 检查日志目录
LOG_DIR="/var/log/hik"
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    success "创建日志目录: $LOG_DIR"
fi

# 启动应用
pm2 start ecosystem.config.cjs --name "hik-agent-deployment"

# 等待启动
sleep 5

# 7. 验证服务状态
log "7️⃣  验证服务状态..."
bash "$SCRIPT_DIR/health-check.sh" || error "服务健康检查失败"

# 8. 保存 PM2 配置
log "8️⃣  保存配置..."
pm2 save
success "PM2 配置已保存"

# 9. 显示摘要
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "部署完成！"
log "前端地址: http://localhost:3000"
log "后端地址: http://localhost:3001"
log "查看日志: tail -f $LOG_DIR/*.log"
log "停止服务: pm2 stop all"
log "重启服务: pm2 restart all"
