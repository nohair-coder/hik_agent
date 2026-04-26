#!/bin/bash

# 启动 ChromaDB 服务（独立脚本）

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}启动 ChromaDB 服务...${NC}"

# 获取脚本所在目录的上级目录（项目根目录）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# 检查是否已运行
if curl -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ChromaDB 已在运行${NC}"
    exit 0
fi

# 优先使用 Docker
if command -v docker &> /dev/null && docker ps > /dev/null 2>&1; then
    echo "使用 Docker 启动 ChromaDB..."
    
    # 删除旧容器（如果存在）
    docker rm -f chroma-hik-agent > /dev/null 2>&1 || true
    
    # 创建数据目录
    mkdir -p "$PROJECT_ROOT/data/chroma_db"
    
    # 启动容器
    docker run -d \
        --name chroma-hik-agent \
        -p 8001:8000 \
        -v "$PROJECT_ROOT/data/chroma_db:/chroma/chroma" \
        chromadb/chroma
    
    sleep 2
    if curl -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ChromaDB (Docker) 已启动${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ ChromaDB 启动中，请稍候...${NC}"
        exit 0
    fi
fi

# 降级到本地 ChromaDB
if command -v chroma &> /dev/null; then
    echo "使用本地 ChromaDB 启动..."
    mkdir -p "$PROJECT_ROOT/data/chroma_db"
    chroma run --host localhost --port 8001 --path "$PROJECT_ROOT/data/chroma_db"
else
    echo -e "${RED}✗ ChromaDB 未安装${NC}"
    echo "   方式1: 安装 Docker，自动使用 Docker 版本"
    echo "   方式2: pip install chromadb"
    exit 1
fi
