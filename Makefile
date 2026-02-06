# AI谋杀悬疑游戏 - Makefile
# 支持 macOS 和 Linux

SHELL := /bin/bash
.PHONY: help install start stop clean dev backend frontend status logs check-tools avatars clean-ports setup quick

# 默认目标
help:
	@echo "AI谋杀悬疑游戏 - 可用命令:"
	@echo ""
	@echo "  make install    - 一键安装前后端所有依赖"
	@echo "  make dev        - 一键启动前后端服务（开发模式，带热重载）"
	@echo "  make start      - 启动完整服务（启动前更新资源）"
	@echo "  make backend    - 仅启动后端服务"
	@echo "  make frontend   - 仅启动前端服务"
	@echo "  make stop       - 停止所有服务"
	@echo "  make clean-ports - 清理端口占用（强制释放5001和10000端口）"
	@echo "  make status     - 查看服务状态"
	@echo "  make logs       - 查看服务日志"
	@echo "  make clean      - 清理依赖和缓存"
	@echo "  make avatars    - 更新头像列表"
	@echo "  make backgrounds - 更新背景图片列表"
	@echo "  make update-assets - 更新所有资源列表（头像+背景）"
	@echo "  make setup      - 一键设置（安装工具+依赖）"
	@echo ""

# 一键设置
setup: install-tools install
	@echo "🎉 设置完成！现在可以运行 make dev"

# 安装系统工具
install-tools:
	@echo "🔧 检查并安装必要工具..."
	@command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 未安装，请先安装"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装，请先安装"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "❌ npm 未安装，请先安装"; exit 1; }
	@echo "✅ 工具检查完成"

# 一键安装前后端依赖
install: install-tools
	@echo "🔧 安装后端依赖..."
	cd api && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@echo "🔧 安装前端依赖..."
	cd web && npm install
	@echo "✅ 所有依赖安装完成"

# 启动完整服务（启动前自动更新资源列表）
start: clean-ports update-assets
	@echo "🚀 启动完整服务..."
	@echo "后端: http://localhost:10000"
	@echo "前端: http://localhost:5001"
	@echo ""
	@echo "按 Ctrl+C 停止服务"
	@echo ""
	@trap 'make stop' INT; \
	(cd api && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 10000 --reload) & \
	(cd web && npm start) & \
	wait

# 一键启动前后端服务（开发模式，带热重载）
dev: clean-ports
	@echo "💻 开发模式启动..."
	@echo "后端: http://localhost:10000"
	@echo "前端: http://localhost:5001"
	@echo ""
	@echo "按 Ctrl+C 停止所有服务"
	@trap 'make stop' INT; \
	(cd api && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 10000 --reload) & \
	(cd web && npm start) & \
	wait

# 启动后端
backend:
	@echo "🔧 启动后端服务..."
	@echo "后端: http://localhost:10000"
	@echo "按 Ctrl+C 停止"
	cd api && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 10000 --reload

# 启动前端（启动前自动更新头像列表）
frontend: avatars
	@echo "🎨 启动前端服务..."
	@echo "前端: http://localhost:5001"
	@echo "按 Ctrl+C 停止"
	cd web && npm start

# 清理端口占用
clean-ports:
	@echo "🧹 清理端口占用..."
	@lsof -ti:10000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5001 | xargs kill -9 2>/dev/null || true
	@echo "✅ 端口清理完成"

# 停止服务
stop:
	@echo "🛑 停止所有服务..."
	@pkill -f "uvicorn main:app" 2>/dev/null || true
	@pkill -f "react-scripts start" 2>/dev/null || true
	@pkill -f "npm start" 2>/dev/null || true
	@rm -f backend.pid frontend.pid
	@echo "✅ 服务已停止"

# 查看状态
status:
	@echo "📊 服务状态:"
	@echo ""
	@echo "后端服务:"
	@if lsof -i :10000 >/dev/null 2>&1; then \
		echo "  ✅ 运行中 (端口 10000)"; \
		lsof -i :10000 | grep LISTEN; \
	else \
		echo "  ❌ 未运行"; \
	fi
	@echo ""
	@echo "前端服务:"
	@if lsof -i :5001 >/dev/null 2>&1; then \
		echo "  ✅ 运行中 (端口 5001)"; \
		lsof -i :5001 | grep LISTEN; \
	else \
		echo "  ❌ 未运行"; \
	fi
	@echo ""

# 查看日志
logs:
	@echo "📋 服务日志:"
	@echo ""
	@if [ -f backend.log ]; then \
		echo "后端日志 (最后20行):"; \
		tail -20 backend.log; \
	else \
		echo "后端日志: 无"; \
	fi
	@echo ""
	@if [ -f frontend.log ]; then \
		echo "前端日志 (最后20行):"; \
		tail -20 frontend.log; \
	else \
		echo "前端日志: 无"; \
	fi

# 清理
clean:
	@echo "🧹 清理依赖和缓存..."
	cd api && rm -rf venv 2>/dev/null || true
	cd web && rm -rf node_modules package-lock.json 2>/dev/null || true
	rm -f backend.log frontend.log backend.pid frontend.pid
	@echo "✅ 清理完成"

# 更新头像列表
avatars:
	@echo "🖼️ 更新头像列表..."
	cp -r web/src/assets/character_avatars web/public/
	cd web && npm run generate-avatars
	@echo "✅ 头像列表已更新"

# 更新背景图片列表
backgrounds:
	@echo "🎨 更新背景图片列表..."
	cd web && npm run generate-backgrounds
	@echo "✅ 背景图片列表已更新"

# 更新所有资源列表（头像+背景）
update-assets: avatars backgrounds
	@echo "🎯 所有资源列表已更新"

# 快速启动（已安装依赖；启动前自动更新头像列表）
quick: clean-ports avatars
	@echo "⚡ 快速启动..."
	@trap 'make stop' INT; \
	(cd api && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 10000 --reload) & \
	(cd web && npm start) & \
	wait

# 测试连接
test:
	@echo "🧪 测试服务连接..."
	@if curl -s http://localhost:10000/health >/dev/null 2>&1; then \
		echo "✅ 后端连接正常"; \
	else \
		echo "❌ 后端连接失败"; \
	fi
	@if curl -s http://localhost:5001 >/dev/null 2>&1; then \
		echo "✅ 前端连接正常"; \
	else \
		echo "❌ 前端连接失败"; \
	fi

# 安装系统依赖（macOS）
install-macos:
	@echo "🍎 安装 macOS 系统依赖..."
	@command -v brew >/dev/null 2>&1 || { echo "安装 Homebrew..."; /bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; }
	brew install python pipenv node
	@echo "✅ 系统依赖安装完成"

# 重置项目
reset: clean install
	@echo "🔄 项目重置完成"

# 调试模式
debug:
	@echo "🐛 调试模式启动..."
	cd api && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 10000 --reload --log-level debug
