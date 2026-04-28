#!/bin/bash

# HIK Agent 停止脚本
# 用法: ./scripts/stop.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

log "停止 HIK Agent 服务..."

# 检查是否有运行的进程
if ! pm2 list 2>/dev/null | grep -q "hik-agent"; then
    warn "没有运行中的服务"
    exit 0
fi

# 停止进程
pm2 stop all
sleep 2

log "删除 PM2 进程..."
pm2 delete all

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "所有服务已停止"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
