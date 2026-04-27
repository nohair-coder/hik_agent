.PHONY: help install start start-all start-chroma start-backend start-frontend logs clean

# 默认帮助
help:
	@echo ""
	@echo "╔════════════════════════════════════════════════╗"
	@echo "║   工程文档生成助手 - Makefile 命令             ║"
	@echo "╚════════════════════════════════════════════════╝"
	@echo ""
	@echo "📦 安装命令:"
	@echo "  make install        - 安装前后端依赖"
	@echo ""
	@echo "🚀 启动命令:"
	@echo "  make start          - 快速启动（推荐）"
	@echo "  make start-all      - 完整启动所有服务"
	@echo "  make start-chroma   - 仅启动 ChromaDB"
	@echo "  make start-backend  - 仅启动后端"
	@echo "  make start-frontend - 仅启动前端"
	@echo ""
	@echo "🛠️  工具命令:"
	@echo "  make logs           - 查看服务日志"
	@echo "  make clean          - 清理临时文件和容器"
	@echo "  make status         - 检查服务状态"
	@echo ""

# 安装依赖
install:
	@echo "安装后端依赖..."
	@cd backend && yarn install
	@echo "安装前端依赖..."
	@cd frontend && yarn install
	@echo "✓ 依赖安装完成"

# 快速启动（使用 tmux 如果可用，否则使用背景进程）
start: install
	@echo ""
	@echo "╔════════════════════════════════════════════════╗"
	@echo "║   🚀 快速启动所有服务                           ║"
	@echo "╚════════════════════════════════════════════════╝"
	@echo ""
	@sleep 2
	@bash ./scripts/start-chroma.sh > /tmp/chroma.log 2>&1 &
	@sleep 2
	@bash ./scripts/start-backend.sh > /tmp/backend.log 2>&1 &
	@bash ./scripts/start-frontend.sh > /tmp/frontend.log 2>&1 &
	@echo ""
	@echo "✓ 所有服务已启动（后台运行）"
	@echo ""
	@echo "访问地址:"
	@echo "  前端:     http://localhost:1420"
	@echo "  后端:     http://localhost:8000"
	@echo "  ChromaDB: http://localhost:8001"
	@echo ""
	@echo "查看日志: make logs"
	@echo "停止所有: make stop"
	@echo ""

# 完整启动脚本
start-all: install
	@bash ./start-all.sh

# 单独启动服务
start-chroma:
	@bash ./scripts/start-chroma.sh

start-backend:
	@cd backend && yarn start

start-frontend:
	@cd frontend && yarn dev

# 查看日志
logs:
	@echo ""
	@echo "=== ChromaDB 日志 ==="
	@tail -20 /tmp/chroma.log 2>/dev/null || echo "暂无日志"
	@echo ""
	@echo "=== 后端日志 ==="
	@tail -20 /tmp/backend.log 2>/dev/null || echo "暂无日志"
	@echo ""
	@echo "=== 前端日志 ==="
	@tail -20 /tmp/frontend.log 2>/dev/null || echo "暂无日志"
	@echo ""

# 服务状态检查
status:
	@echo ""
	@echo "检查服务状态..."
	@echo ""
	@if curl -s http://localhost:8001/api/v1/heartbeat > /dev/null 2>&1; then \
		echo "✓ ChromaDB 运行中 (8001)"; \
	else \
		echo "✗ ChromaDB 未运行"; \
	fi
	@if curl -s http://localhost:8000/health > /dev/null 2>&1; then \
		echo "✓ 后端运行中 (8000)"; \
	else \
		echo "✗ 后端未运行"; \
	fi
	@if curl -s http://localhost:1420 > /dev/null 2>&1; then \
		echo "✓ 前端运行中 (1420)"; \
	else \
		echo "✗ 前端未运行"; \
	fi
	@echo ""

# 清理
clean:
	@echo "清理临时文件..."
	@rm -f /tmp/chroma.log /tmp/backend.log /tmp/frontend.log
	@if command -v docker > /dev/null; then \
		docker rm -f chroma-hik-agent > /dev/null 2>&1 || true; \
		echo "✓ Docker 容器已清理"; \
	fi
	@echo "✓ 清理完成"

# 停止所有服务
stop:
	@echo "停止所有服务..."
	@pkill -f "chroma run" || true
	@pkill -f "yarn start" || true
	@pkill -f "yarn dev" || true
	@docker rm -f chroma-hik-agent > /dev/null 2>&1 || true
	@echo "✓ 所有服务已停止"
