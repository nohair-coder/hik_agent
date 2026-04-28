#!/bin/bash

# HIK Agent 监控脚本
# 用法: ./scripts/monitor.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

clear_screen() { clear; }

show_menu() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}       HIK Agent 监控和管理面板${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1) 查看进程状态"
    echo "2) 查看实时日志"
    echo "3) 查看后端日志"
    echo "4) 查看前端日志"
    echo "5) 重启所有服务"
    echo "6) 重启后端"
    echo "7) 重启前端"
    echo "8) 停止所有服务"
    echo "9) 查看资源使用"
    echo "10) 运行健康检查"
    echo "0) 退出"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

show_status() {
    clear_screen
    log "进程状态"
    pm2 list
    echo ""
    log "按 Enter 返回菜单..."
    read
}

show_logs() {
    clear_screen
    log "实时日志 (按 Ctrl+C 退出)"
    pm2 logs "hik-agent-backend" --lines 50
}

show_backend_logs() {
    clear_screen
    log "后端日志"
    if [ -f "/var/log/hik/backend-error.log" ]; then
        echo -e "${YELLOW}═══ 错误日志 ═══${NC}"
        tail -30 /var/log/hik/backend-error.log
    fi
    echo ""
    if [ -f "/var/log/hik/backend-out.log" ]; then
        echo -e "${YELLOW}═══ 输出日志 ═══${NC}"
        tail -30 /var/log/hik/backend-out.log
    fi
}

show_frontend_logs() {
    clear_screen
    log "前端日志"
    if [ -f "/var/log/hik/frontend-error.log" ]; then
        echo -e "${YELLOW}═══ 错误日志 ═══${NC}"
        tail -30 /var/log/hik/frontend-error.log
    fi
    echo ""
    if [ -f "/var/log/hik/frontend-out.log" ]; then
        echo -e "${YELLOW}═══ 输出日志 ═══${NC}"
        tail -30 /var/log/hik/frontend-out.log
    fi
}

show_resources() {
    clear_screen
    log "资源使用情况"
    pm2 monit
}

restart_all() {
    clear_screen
    log "重启所有服务..."
    pm2 restart all
    sleep 2
    success "所有服务已重启"
}

restart_backend() {
    clear_screen
    log "重启后端服务..."
    pm2 restart hik-agent-backend
    sleep 2
    success "后端已重启"
}

restart_frontend() {
    clear_screen
    log "重启前端服务..."
    pm2 restart hik-agent-frontend
    sleep 2
    success "前端已重启"
}

stop_all() {
    clear_screen
    log "停止所有服务..."
    pm2 stop all
    sleep 1
    success "所有服务已停止"
}

health_check() {
    clear_screen
    log "运行健康检查..."
    bash "$(dirname "$0")/health-check.sh"
}

# 主循环
while true; do
    show_menu
    read -p "请选择操作 [0-10]: " choice
    
    case $choice in
        1) show_status ;;
        2) show_logs ;;
        3) show_backend_logs ;;
        4) show_frontend_logs ;;
        5) restart_all ;;
        6) restart_backend ;;
        7) restart_frontend ;;
        8) stop_all ;;
        9) show_resources ;;
        10) health_check ;;
        0) 
            clear_screen
            success "再见！"
            exit 0
            ;;
        *)
            error "无效选项"
            sleep 1
            ;;
    esac
done
