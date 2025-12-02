#!/bin/bash

# Inference Instance Admin - Service Installation Script
# This script installs and configures systemd services for the application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
log_info "Working directory: $SCRIPT_DIR"

# Service files
BACKEND_SERVICE="inference-admin.service"
FRONTEND_SERVICE="inference-admin-frontend.service"
SYSTEMD_DIR="/etc/systemd/system"

echo "=========================================="
echo "  Inference Instance Admin Service Setup"
echo "=========================================="
echo ""

# 1. Check if services exist
log_info "Checking existing services..."
if systemctl list-units --full -all | grep -q "$BACKEND_SERVICE"; then
    log_warning "Backend service already exists. Stopping..."
    systemctl stop "$BACKEND_SERVICE" || true
fi

if systemctl list-units --full -all | grep -q "$FRONTEND_SERVICE"; then
    log_warning "Frontend service already exists. Stopping..."
    systemctl stop "$FRONTEND_SERVICE" || true
fi

# 2. Check if virtual environment exists
log_info "Checking Python virtual environment..."
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    log_error "Virtual environment not found at $SCRIPT_DIR/venv"
    log_info "Please run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi
log_success "Virtual environment found"

# 3. Check if frontend is built
log_info "Checking frontend build..."
if [ ! -d "$SCRIPT_DIR/frontend/dist" ]; then
    log_warning "Frontend not built. Building now..."
    cd "$SCRIPT_DIR/frontend"
    if [ -f "package.json" ]; then
        npm install
        npm run build:prod:fast
        log_success "Frontend built successfully"
    else
        log_error "Frontend package.json not found"
        exit 1
    fi
    cd "$SCRIPT_DIR"
else
    log_success "Frontend build found"
fi

# 4. Create .env file if it doesn't exist
log_info "Checking environment configuration..."
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    log_warning ".env file not found. Creating from example..."
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        log_warning "Please edit .env file with your configuration"
    else
        log_error ".env.example not found"
    fi
fi

# 5. Copy service files to systemd directory
log_info "Installing systemd service files..."

# Backend service
if [ -f "$SCRIPT_DIR/$BACKEND_SERVICE" ]; then
    cp "$SCRIPT_DIR/$BACKEND_SERVICE" "$SYSTEMD_DIR/"
    log_success "Backend service file installed: $SYSTEMD_DIR/$BACKEND_SERVICE"
else
    log_error "Backend service file not found: $SCRIPT_DIR/$BACKEND_SERVICE"
    exit 1
fi

# Frontend service
if [ -f "$SCRIPT_DIR/$FRONTEND_SERVICE" ]; then
    cp "$SCRIPT_DIR/$FRONTEND_SERVICE" "$SYSTEMD_DIR/"
    log_success "Frontend service file installed: $SYSTEMD_DIR/$FRONTEND_SERVICE"
else
    log_error "Frontend service file not found: $SCRIPT_DIR/$FRONTEND_SERVICE"
    exit 1
fi

# 6. Reload systemd daemon
log_info "Reloading systemd daemon..."
systemctl daemon-reload
log_success "Systemd daemon reloaded"

# 7. Enable services
log_info "Enabling services to start on boot..."
systemctl enable "$BACKEND_SERVICE"
systemctl enable "$FRONTEND_SERVICE"
log_success "Services enabled"

# 8. Start services
log_info "Starting services..."
systemctl start "$BACKEND_SERVICE"
sleep 2
systemctl start "$FRONTEND_SERVICE"
log_success "Services started"

# 9. Check service status
echo ""
log_info "Checking service status..."
echo ""

echo "Backend Service Status:"
systemctl status "$BACKEND_SERVICE" --no-pager -l || true
echo ""

echo "Frontend Service Status:"
systemctl status "$FRONTEND_SERVICE" --no-pager -l || true
echo ""

# 10. Display useful commands
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
log_success "Services are now running!"
echo ""
echo "Useful commands:"
echo ""
echo "  View backend logs:"
echo "    sudo journalctl -u $BACKEND_SERVICE -f"
echo ""
echo "  View frontend logs:"
echo "    sudo journalctl -u $FRONTEND_SERVICE -f"
echo ""
echo "  Restart services:"
echo "    sudo systemctl restart $BACKEND_SERVICE"
echo "    sudo systemctl restart $FRONTEND_SERVICE"
echo ""
echo "  Stop services:"
echo "    sudo systemctl stop $BACKEND_SERVICE"
echo "    sudo systemctl stop $FRONTEND_SERVICE"
echo ""
echo "  Check status:"
echo "    sudo systemctl status $BACKEND_SERVICE"
echo "    sudo systemctl status $FRONTEND_SERVICE"
echo ""
echo "  Disable auto-start:"
echo "    sudo systemctl disable $BACKEND_SERVICE"
echo "    sudo systemctl disable $FRONTEND_SERVICE"
echo ""
echo "Access URLs:"
echo "  Backend API:  http://localhost:38000"
echo "  Frontend:     http://localhost:33000"
echo "  API Docs:     http://localhost:38000/docs"
echo "=========================================="

