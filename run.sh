#!/bin/bash

# Inference Instances 管理系统启动脚本
# 支持启动后端API服务器和React前端开发服务器

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "Inference Instances 管理系统启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -b, --backend-only  仅启动后端API服务器"
    echo "  -f, --frontend-only 仅启动React前端开发服务器"
    echo "  -p, --production    生产模式启动（构建前端并使用nginx）"
    echo "  -d, --dev           开发模式启动（默认，同时启动前后端）"
    echo "  --no-install        跳过依赖安装"
    echo "  --port PORT         指定后端端口（默认8000）"
    echo "  --frontend-port PORT 指定前端端口（默认5173）"
    echo ""
    echo "示例:"
    echo "  $0                  # 开发模式启动前后端"
    echo "  $0 -b               # 仅启动后端"
    echo "  $0 -f               # 仅启动前端"
    echo "  $0 -p               # 生产模式启动"
}

# 默认参数
BACKEND_ONLY=false
FRONTEND_ONLY=false
PRODUCTION_MODE=false
SKIP_INSTALL=false
BACKEND_PORT=8000
FRONTEND_PORT=5173

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -b|--backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        -f|--frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        -p|--production)
            PRODUCTION_MODE=true
            shift
            ;;
        -d|--dev)
            # 默认就是开发模式
            shift
            ;;
        --no-install)
            SKIP_INSTALL=true
            shift
            ;;
        --port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查必要的命令
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装，请先安装Python3"
        exit 1
    fi
    
    # 检查Node.js（如果需要启动前端）
    if [[ "$FRONTEND_ONLY" == true ]] || [[ "$BACKEND_ONLY" == false ]]; then
        if ! command -v node &> /dev/null; then
            log_error "Node.js 未安装，请先安装Node.js 18+"
            exit 1
        fi
        
        # 检查Node.js版本
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -lt 18 ]]; then
            log_error "Node.js 版本过低，需要18+，当前版本: $(node -v)"
            exit 1
        fi
    fi
    
    log_success "系统依赖检查完成"
}

# 设置后端环境
setup_backend() {
    log_info "设置后端环境..."
    
    # 检查并创建虚拟环境
    if [ ! -d "venv" ]; then
        log_info "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    log_info "激活虚拟环境..."
    source venv/bin/activate
    
    if [[ "$SKIP_INSTALL" == false ]]; then
        log_info "安装Python依赖..."
        pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/
        pip config set global.trusted-host mirrors.aliyun.com
        pip install --upgrade pip
        pip install --only-binary=all -r requirements.txt || pip install -r requirements.txt
    fi
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_info "复制环境变量文件..."
            cp .env.example .env
            log_warning "请检查并修改 .env 文件中的配置"
        else
            log_warning ".env 文件不存在，使用默认配置"
        fi
    fi
    
    # 数据库初始化
    log_info "检查数据库..."
    python -c "
import database
try:
    database.init_db()
    print('数据库初始化完成')
except Exception as e:
    print(f'数据库初始化失败: {e}')
    exit(1)
" || {
        log_error "数据库初始化失败"
        exit 1
    }
    
    log_success "后端环境设置完成"
}

# 设置前端环境
setup_frontend() {
    log_info "设置前端环境..."
    
    if [ ! -d "frontend" ]; then
        log_error "frontend 目录不存在"
        exit 1
    fi
    
    cd frontend
    
    if [[ "$SKIP_INSTALL" == false ]]; then
        log_info "安装前端依赖..."
        if [ ! -f "package.json" ]; then
            log_error "package.json 不存在"
            exit 1
        fi
        
        # 检查是否有package-lock.json或yarn.lock
        if [ -f "yarn.lock" ]; then
            yarn install
        else
            npm install
        fi
    fi
    
    # 检查前端环境变量
    if [ ! -f ".env.development" ]; then
        log_info "创建前端开发环境变量文件..."
        cat > .env.development << EOF
VITE_APP_TITLE=Inference Dashboard (Dev)
VITE_API_BASE_URL=http://localhost:${BACKEND_PORT}
VITE_ENABLE_MOCK_API=false
 _LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true
EOF
    fi
    
    cd ..
    log_success "前端环境设置完成"
}

# 启动后端服务器
start_backend() {
    log_info "启动后端API服务器 (端口: $BACKEND_PORT)..."
    
    source venv/bin/activate
    
    # 设置端口环境变量
    export PORT=$BACKEND_PORT
    
    if [[ "$PRODUCTION_MODE" == true ]]; then
        # 生产模式使用gunicorn
        if command -v gunicorn &> /dev/null; then
            gunicorn -w 4 -b 0.0.0.0:$BACKEND_PORT main:app
        else
            log_warning "gunicorn 未安装，使用开发服务器"
            python main.py
        fi
    else
        # 开发模式
        python main.py
    fi
}

# 启动前端服务器
start_frontend() {
    log_info "启动React前端开发服务器 (端口: $FRONTEND_PORT)..."
    
    cd frontend
    
    if [[ "$PRODUCTION_MODE" == true ]]; then
        # 生产模式：构建并使用nginx或静态服务器
        log_info "构建前端应用..."
        if [ -f "yarn.lock" ]; then
            yarn build
        else
            npm run build
        fi
        
        # 使用简单的静态服务器
        if command -v serve &> /dev/null; then
            serve -s dist -l $FRONTEND_PORT
        elif command -v python3 &> /dev/null; then
            cd dist
            python3 -m http.server $FRONTEND_PORT
        else
            log_error "无法启动静态服务器，请安装 serve 或确保 python3 可用"
            exit 1
        fi
    else
        # 开发模式
        if [ -f "yarn.lock" ]; then
            yarn dev --port $FRONTEND_PORT --host 0.0.0.0
        else
            npm run dev -- --port $FRONTEND_PORT --host 0.0.0.0
        fi
    fi
}

# 清理函数
cleanup() {
    log_info "正在停止服务..."
    
    # 杀死所有子进程
    jobs -p | xargs -r kill
    
    log_info "服务已停止"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo "=========================================="
    echo "  Inference Instances 管理系统启动脚本"
    echo "=========================================="
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 根据参数决定启动什么
    if [[ "$BACKEND_ONLY" == true ]]; then
        log_info "仅启动后端模式"
        setup_backend
        start_backend
    elif [[ "$FRONTEND_ONLY" == true ]]; then
        log_info "仅启动前端模式"
        setup_frontend
        start_frontend
    else
        log_info "全栈开发模式 - 启动前后端"
        
        # 设置环境
        setup_backend
        setup_frontend
        
        # 并行启动服务
        log_info "启动后端服务器..."
        start_backend &
        BACKEND_PID=$!
        
        # 等待后端启动
        sleep 3
        
        # 检查后端是否启动成功
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            log_error "后端启动失败"
            exit 1
        fi
        
        log_info "启动前端服务器..."
        start_frontend &
        FRONTEND_PID=$!
        
        # 显示访问信息
        echo ""
        log_success "服务启动完成！"
        echo "=========================================="
        echo "  后端API服务器: http://localhost:$BACKEND_PORT"
        echo "  前端开发服务器: http://localhost:$FRONTEND_PORT"
        echo "  API文档: http://localhost:$BACKEND_PORT/docs"
        echo "=========================================="
        echo ""
        log_info "按 Ctrl+C 停止所有服务"
        
        # 等待所有后台进程
        wait
    fi
}

# 运行主函数
main "$@"
