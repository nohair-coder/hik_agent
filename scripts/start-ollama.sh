#!/bin/bash

# 启动 Ollama 服务（独立脚本）

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}启动 Ollama 服务...${NC}"

# 检查是否已运行
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama 已在运行${NC}"
    exit 0
fi

# macOS 优先使用应用
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "/Applications/Ollama.app" ]; then
        open -a Ollama
        echo "已打开 Ollama 应用"
        sleep 3
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Ollama 已启动${NC}"
            exit 0
        fi
    fi
fi

# 命令行启动
ollama serve
