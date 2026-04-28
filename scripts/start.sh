#!/bin/bash

# HIK Agent 启动脚本
# 用法: ./scripts/start.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

log "启动 HIK Agent..."

# 检查是否已运行
if pm2 list 2>/dev/null | grep -q "hik-agent-backend"; then
    warn "服务已在运行中"
    log "使用以下命令操作:"
    log "  pm2 stop all      # 停止服务"
    log "  pm2 restart all   # 重启服务"
    log "  pm2 logs          # 查看日志"
    log "  ./scripts/monitor.sh  # 进入监控面板"
    exit 0
fi

# 检查依赖
if [ ! -d "$PROJECT_ROOT/backend/dist" ]; then
    log "后端未构建，现在构建..."
    cd "$PROJECT_ROOT/backend"
    npm install --silent
    npm run build
    success "后端构建完成"
fi

if [ ! -d "$PROJECT_ROOT/frontend/dist" ]; then
    log "前端未构建，现在构建..."
    cd "$PROJECT_ROOT/frontend"
    npm install --silent
    npm run build
    success "前端构建完成"
fi

# 检查日志目录
LOG_DIR="/var/log/hik"
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    success "创建日志目录"
fi

# 启动服务
cd "$PROJECT_ROOT"
log "启动 PM2 进程..."
pm2 start ecosystem.config.cjs

sleep 5

# 验证
log "验证服务状态..."
pm2 list

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "✅ 服务已启动！"
log "前端: http://localhost:3000"
log "后端: http://localhost:3001"
log ""
log "常用命令:"
log "  pm2 stop all       - 停止所有服务"
log "  pm2 restart all    - 重启所有服务"
log "  pm2 logs           - 查看日志"
log "  ./scripts/monitor.sh  - 进入监控面板"
log "  ./scripts/logs.sh      - 查看详细日志"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
