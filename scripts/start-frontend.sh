#!/bin/bash

# 启动前端服务

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT/frontend"

echo -e "${BLUE}启动前端服务 (React + Vite)...${NC}"
echo -e "${GREEN}访问: http://localhost:1420${NC}"
echo ""

yarn dev
