#!/bin/bash

# 工程文档生成助手 - 一键启动脚本
# 快速启动所有服务: Ollama + ChromaDB + 后端 + 前端

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   工程文档生成助手 - 自动启动系统        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 检查依赖 ────────────────────────────────────────────

echo -e "${BLUE}[1/5] 检查依赖...${NC}"

# 检查 Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}✗ Ollama 未安装${NC}"
    echo "   请访问 https://ollama.ai 下载安装"
    exit 1
fi
echo -e "${GREEN}✓ Ollama 已安装${NC}"

# 检查 Docker（ChromaDB 推荐用 Docker）
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 已安装${NC}"
    USE_DOCKER=true
else
    echo -e "${YELLOW}⚠ Docker 未安装，将尝试本地 ChromaDB${NC}"
    if ! command -v chroma &> /dev/null; then
        echo -e "${RED}✗ ChromaDB 未安装${NC}"
        echo "   请运行: pip install chromadb"
        exit 1
    fi
    echo -e "${GREEN}✓ ChromaDB (pip) 已安装${NC}"
    USE_DOCKER=false
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安装${NC}"
    echo "   请访问 https://nodejs.org 下载安装"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 已安装${NC}"

# 检查 Yarn
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}✗ Yarn 未安装${NC}"
    echo "   请运行: npm install -g yarn"
    exit 1
fi
echo -e "${GREEN}✓ Yarn 已安装${NC}"

echo ""

# ── 创建数据目录 ────────────────────────────────────────

echo -e "${BLUE}[2/5] 初始化数据目录...${NC}"
mkdir -p ./data/chroma_db
echo -e "${GREEN}✓ 数据目录已就绪${NC}"
echo ""

# ── 启动服务 ────────────────────────────────────────────

echo -e "${BLUE}[3/5] 启动 Ollama...${NC}"

# 检查 Ollama 是否已在运行
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama 已在运行 (端口 11434)${NC}"
else
    echo "   启动 Ollama 服务中..."
    # macOS: 使用 launchctl 或直接启动
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # 尝试通过标准方式启动
        ollama serve > /tmp/ollama.log 2>&1 &
        OLLAMA_PID=$!
        echo "   PID: $OLLAMA_PID"
        # 等待服务就绪
        sleep 5
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Ollama 已启动${NC}"
        else
            echo -e "${RED}✗ Ollama 启动失败，请查看 /tmp/ollama.log${NC}"
            exit 1
        fi
    else
        ollama serve > /tmp/ollama.log 2>&1 &
        OLLAMA_PID=$!
        sleep 5
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Ollama 已启动${NC}"
        else
            echo -e "${RED}✗ Ollama 启动失败${NC}"
            exit 1
        fi
    fi
fi

echo ""

# 检查模型是否已下载
echo -e "${BLUE}[4/5] 验证模型...${NC}"
if ollama list | grep -q "qwen2.5:7b"; then
    echo -e "${GREEN}✓ qwen2.5:7b 已下载${NC}"
else
    echo "   正在下载 qwen2.5:7b（约 4.7GB，首次较慢）..."
    ollama pull qwen2.5:7b
fi

if ollama list | grep -q "bge-m3"; then
    echo -e "${GREEN}✓ bge-m3 已下载${NC}"
else
    echo "   正在下载 bge-m3（约 1.2GB）..."
    ollama pull bge-m3
fi

echo ""
echo -e "${BLUE}[5/5] 启动 ChromaDB...${NC}"

if [ "$USE_DOCKER" = true ]; then
    # 检查容器是否已运行
    if docker ps | grep -q "chromadb"; then
        echo -e "${GREEN}✓ ChromaDB 已在运行 (Docker)${NC}"
    else
        echo "   启动 ChromaDB Docker 容器..."
        docker run -d \
            --name chroma-hik-agent \
            -p 8001:8000 \
            -v "$(pwd)/data/chroma_db:/chroma/chroma" \
            chromadb/chroma > /dev/null 2>&1 || true
        sleep 2
        if curl -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1; then
            echo -e "${GREEN}✓ ChromaDB 已启动${NC}"
        else
            echo -e "${YELLOW}⚠ ChromaDB 启动中，请稍候...${NC}"
        fi
    fi
else
    # 使用本地 ChromaDB
    if curl -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ChromaDB 已在运行${NC}"
    else
        echo "   启动本地 ChromaDB..."
        chroma run --host localhost --port 8001 --path ./data/chroma_db > /tmp/chroma.log 2>&1 &
        CHROMA_PID=$!
        sleep 3
        if curl -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1; then
            echo -e "${GREEN}✓ ChromaDB 已启动${NC}"
        else
            echo -e "${YELLOW}⚠ ChromaDB 启动中...${NC}"
        fi
    fi
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ 基础服务已就绪！${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# ── 打开新终端启动后端和前端 ────────────────────────────

echo -e "${YELLOW}提示：将在新终端中启动后端和前端服务...${NC}"
echo ""

# 创建启动后端的脚本
cat > /tmp/start-backend.sh << 'EOF'
#!/bin/bash
cd "/Users/x/Desktop/hik_agent/backend"
echo "启动后端服务 (Hono)..."
yarn start
EOF

# 创建启动前端的脚本
cat > /tmp/start-frontend.sh << 'EOF'
#!/bin/bash
cd "/Users/x/Desktop/hik_agent/frontend"
echo "启动前端服务 (React)..."
yarn dev
EOF

chmod +x /tmp/start-backend.sh /tmp/start-frontend.sh

# 使用 macOS 特定的方式打开新终端
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: 使用 open with osascript
    osascript << APPLESCRIPT
tell application "Terminal"
    do script "$(/tmp/start-backend.sh)"
    do script "$(/tmp/start-frontend.sh)"
end tell
APPLESCRIPT
    echo -e "${GREEN}✓ 后端和前端将在新终端中启动${NC}"
else
    # Linux: 使用 gnome-terminal 或 xterm
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- /tmp/start-backend.sh &
        gnome-terminal -- /tmp/start-frontend.sh &
    elif command -v xterm &> /dev/null; then
        xterm -e /tmp/start-backend.sh &
        xterm -e /tmp/start-frontend.sh &
    fi
    echo -e "${GREEN}✓ 后端和前端已启动${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 所有服务正在启动！${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo "访问地址："
echo -e "  前端: ${BLUE}http://localhost:1420${NC}"
echo -e "  后端 API: ${BLUE}http://localhost:8000${NC}"
echo -e "  Ollama: ${BLUE}http://localhost:11434${NC}"
echo -e "  ChromaDB: ${BLUE}http://localhost:8001${NC}"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 保持脚本运行
wait
