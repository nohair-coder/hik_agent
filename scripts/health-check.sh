#!/bin/bash

# HIK Agent 健康检查脚本
# 用法: ./scripts/health-check.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
MAX_RETRIES=30
RETRY_INTERVAL=1

log "🔍 开始健康检查..."

# 检查后端
log "检查后端服务 ($BACKEND_URL)..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf "$BACKEND_URL/health" > /dev/null 2>&1 || curl -sf "$BACKEND_URL" > /dev/null 2>&1; then
        success "后端服务运行正常"
        BACKEND_OK=1
        break
    fi
    echo -n "."
    sleep $RETRY_INTERVAL
done

if [ -z "$BACKEND_OK" ]; then
    error "后端服务未响应"
    log "检查后端日志:"
    tail -20 /var/log/hik/backend-error.log 2>/dev/null || echo "日志文件不存在"
    exit 1
fi

# 检查前端
log "检查前端服务 ($FRONTEND_URL)..."
for i in $(seq 1 $MAX_RETRIES); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        success "前端服务运行正常"
        FRONTEND_OK=1
        break
    fi
    echo -n "."
    sleep $RETRY_INTERVAL
done

if [ -z "$FRONTEND_OK" ]; then
    warn "前端服务未完全响应（HTTP $HTTP_CODE），但可能仍在启动"
fi

# 检查 PM2 进程
log "检查 PM2 进程状态..."
if pm2 list | grep -q "hik-agent-backend"; then
    BACKEND_STATUS=$(pm2 list | grep "hik-agent-backend" | awk '{print $12}')
    if [ "$BACKEND_STATUS" = "online" ]; then
        success "后端进程状态: online"
    else
        error "后端进程状态异常: $BACKEND_STATUS"
        exit 1
    fi
else
    error "后端进程未找到"
    exit 1
fi

if pm2 list | grep -q "hik-agent-frontend"; then
    FRONTEND_STATUS=$(pm2 list | grep "hik-agent-frontend" | awk '{print $12}')
    if [ "$FRONTEND_STATUS" = "online" ]; then
        success "前端进程状态: online"
    else
        warn "前端进程状态异常: $FRONTEND_STATUS"
    fi
else
    warn "前端进程未找到"
fi

# 检查内存使用
log "检查资源使用情况..."
pm2 list

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "✅ 健康检查通过！"
success "服务已就绪："
success "  前端: $FRONTEND_URL"
success "  后端: $BACKEND_URL"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
