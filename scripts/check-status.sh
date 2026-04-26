#!/bin/bash

# 服务状态检查和诊断脚本

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   HIK Agent - 服务状态检查           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

SERVICES_OK=0
SERVICES_FAIL=0

check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    echo -n "检查 $name ... "
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((SERVICES_OK++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((SERVICES_FAIL++))
        echo "  提示: 请检查服务是否启动（端口 $port）"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}基础服务检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_service "Ollama" "http://localhost:11434/api/tags" "11434"
check_service "ChromaDB" "http://localhost:8001/api/v1/heartbeat" "8001"
check_service "后端 API" "http://localhost:8000/health" "8000"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}模型检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v ollama &> /dev/null; then
    echo "已安装的模型:"
    ollama list 2>/dev/null | tail -n +2 | while read -r line; do
        if [ -n "$line" ]; then
            model_name=$(echo "$line" | awk '{print $1}')
            model_size=$(echo "$line" | awk '{print $3}')
            
            if [[ "$model_name" == "qwen"* ]]; then
                echo -e "  ${GREEN}✓${NC} $model_name ($model_size)"
            elif [[ "$model_name" == "bge-m3"* ]]; then
                echo -e "  ${GREEN}✓${NC} $model_name ($model_size)"
            fi
        fi
    done
else
    echo -e "${RED}✗ Ollama 未安装${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}依赖检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_cmd() {
    local cmd=$1
    local name=$2
    
    if command -v "$cmd" &> /dev/null; then
        version=$($cmd --version 2>&1 | head -1)
        echo -e "${GREEN}✓${NC} $name - $version"
    else
        echo -e "${RED}✗${NC} $name - 未安装"
    fi
}

check_cmd "node" "Node.js"
check_cmd "yarn" "Yarn"
check_cmd "docker" "Docker"
check_cmd "ollama" "Ollama"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}磁盘空间检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "./data/chroma_db" ]; then
    chroma_size=$(du -sh ./data/chroma_db 2>/dev/null | awk '{print $1}')
    echo "ChromaDB 数据: $chroma_size"
else
    echo "ChromaDB 数据: 未初始化"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}网络端口检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_port() {
    local port=$1
    local name=$2
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if lsof -i ":$port" > /dev/null 2>&1; then
            pid=$(lsof -i ":$port" -t | head -1)
            echo -e "${GREEN}✓${NC} 端口 $port ($name) - PID: $pid"
        else
            echo -e "${RED}✗${NC} 端口 $port ($name) - 未使用"
        fi
    else
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${GREEN}✓${NC} 端口 $port ($name)"
        else
            echo -e "${RED}✗${NC} 端口 $port ($name) - 未使用"
        fi
    fi
}

check_port 11434 "Ollama"
check_port 8001 "ChromaDB"
check_port 8000 "后端"
check_port 1420 "前端"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}总体诊断${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SERVICES_FAIL" -eq 0 ]; then
    echo -e "${GREEN}✓ 所有基础服务运行正常！${NC}"
    echo -e "  访问地址: ${BLUE}http://localhost:1420${NC}"
else
    echo -e "${YELLOW}⚠ 部分服务未启动 ($SERVICES_FAIL/3)${NC}"
    echo ""
    echo "快速启动所有服务:"
    echo -e "  ${BLUE}make start${NC}"
    echo ""
    echo "或查看详细启动说明:"
    echo -e "  ${BLUE}cat QUICKSTART.md${NC}"
fi

echo ""
