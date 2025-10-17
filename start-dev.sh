#!/bin/bash

# 简化的开发环境启动脚本

echo "🚀 启动开发环境..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python3"
    exit 1
fi

# 启动后端
echo "📡 启动后端API服务器..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# 后台启动后端
python main.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
echo "⚛️  启动React前端..."
cd frontend

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    npm install
fi

# 创建开发环境变量
if [ ! -f ".env.development" ]; then
    cat > .env.development << EOF
VITE_APP_TITLE=Inference Dashboard (Dev)
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MOCK_API=false
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true
EOF
fi

# 启动前端开发服务器
npm run dev &
FRONTEND_PID=$!

# 清理函数
cleanup() {
    echo ""
    echo "🛑 停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "✅ 服务启动完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 前端: http://localhost:5173"
echo "🔧 后端: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "按 Ctrl+C 停止所有服务"

# 等待进程
wait