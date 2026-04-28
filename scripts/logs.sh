#!/bin/bash

# HIK Agent 日志管理脚本
# 用法: ./scripts/logs.sh [command] [args]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

LOG_DIR="/var/log/hik"
COMMAND="${1:-tail}"
LINES="${2:-50}"

case "$COMMAND" in
    backend-out)
        log "后端输出日志 (最后 $LINES 行)"
        tail -n "$LINES" "$LOG_DIR/backend-out.log" 2>/dev/null || error "日志文件不存在"
        ;;
    backend-err)
        log "后端错误日志 (最后 $LINES 行)"
        tail -n "$LINES" "$LOG_DIR/backend-error.log" 2>/dev/null || error "日志文件不存在"
        ;;
    backend-all)
        log "后端完整日志"
        echo -e "${YELLOW}═══ 输出 ═══${NC}"
        tail -n "$LINES" "$LOG_DIR/backend-out.log" 2>/dev/null
        echo -e "${YELLOW}═══ 错误 ═══${NC}"
        tail -n "$LINES" "$LOG_DIR/backend-error.log" 2>/dev/null
        ;;
    frontend-out)
        log "前端输出日志 (最后 $LINES 行)"
        tail -n "$LINES" "$LOG_DIR/frontend-out.log" 2>/dev/null || error "日志文件不存在"
        ;;
    frontend-err)
        log "前端错误日志 (最后 $LINES 行)"
        tail -n "$LINES" "$LOG_DIR/frontend-error.log" 2>/dev/null || error "日志文件不存在"
        ;;
    frontend-all)
        log "前端完整日志"
        echo -e "${YELLOW}═══ 输出 ═══${NC}"
        tail -n "$LINES" "$LOG_DIR/frontend-out.log" 2>/dev/null
        echo -e "${YELLOW}═══ 错误 ═══${NC}"
        tail -n "$LINES" "$LOG_DIR/frontend-error.log" 2>/dev/null
        ;;
    tail)
        log "实时日志流"
        tail -f "$LOG_DIR"/*.log 2>/dev/null || error "日志目录不存在"
        ;;
    clean)
        log "清理日志文件..."
        rm -f "$LOG_DIR"/*.log
        success "日志已清理"
        ;;
    size)
        log "日志文件大小"
        du -sh "$LOG_DIR"/* 2>/dev/null || error "日志目录不存在"
        ;;
    *)
        echo "用法: $0 [command] [lines]"
        echo ""
        echo "命令列表:"
        echo "  backend-out   - 后端输出日志"
        echo "  backend-err   - 后端错误日志"
        echo "  backend-all   - 后端完整日志"
        echo "  frontend-out  - 前端输出日志"
        echo "  frontend-err  - 前端错误日志"
        echo "  frontend-all  - 前端完整日志"
        echo "  tail          - 实时日志流 (默认)"
        echo "  size          - 日志文件大小"
        echo "  clean         - 清理所有日志"
        echo ""
        echo "示例:"
        echo "  $0 backend-err 100"
        echo "  $0 tail"
        echo "  $0 clean"
        ;;
esac
