#!/bin/bash

# Ollama 自动安装脚本（macOS）

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Ollama 自动安装脚本 (macOS)        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 检查已安装
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama 已安装${NC}"
    ollama version
    exit 0
fi

echo -e "${YELLOW}⚠ Ollama 未安装，即将开始安装...${NC}"
echo ""

# 方式 1: 使用 Homebrew（如果已安装）
if command -v brew &> /dev/null; then
    echo -e "${BLUE}方式 1: 使用 Homebrew 安装${NC}"
    echo "运行: brew install ollama"
    brew install ollama
    echo -e "${GREEN}✓ Ollama 已通过 Homebrew 安装${NC}"
    
    # 启动服务
    echo ""
    echo -e "${BLUE}启动 Ollama 服务...${NC}"
    ollama serve &
    sleep 3
    
    echo -e "${GREEN}✓ Ollama 已启动${NC}"
    exit 0
fi

# 方式 2: 直接下载（无 Homebrew）
echo -e "${BLUE}方式 2: 从官方网站下载安装${NC}"
echo ""
echo -e "${YELLOW}Homebrew 未安装。我会为您安装 Homebrew，然后再安装 Ollama。${NC}"
echo ""
echo "正在安装 Homebrew..."
echo ""

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo ""
echo "Homebrew 安装完成！"
echo ""
echo "现在安装 Ollama..."
brew install ollama

echo ""
echo -e "${GREEN}✓ Ollama 已安装${NC}"
echo ""
echo "启动 Ollama 服务..."
ollama serve &
sleep 3

echo -e "${GREEN}✓ Ollama 已启动${NC}"
echo ""
echo "测试连接..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama 连接正常${NC}"
else
    echo -e "${YELLOW}⚠ 连接测试失败，Ollama 可能仍在启动中${NC}"
fi

echo ""
echo "下一步："
echo "  1. 下载模型: ollama pull qwen2.5:7b"
echo "  2. 启动应用: cd ~/Desktop/hik_agent && make start"
echo ""
