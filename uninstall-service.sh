#!/bin/bash

# Inference Instance Admin - Service Uninstallation Script
# This script removes systemd services for the application

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

# Service files
BACKEND_SERVICE="inference-admin.service"
FRONTEND_SERVICE="inference-admin-frontend.service"
SYSTEMD_DIR="/etc/systemd/system"

echo "=========================================="
echo "  Uninstall Inference Instance Admin"
echo "=========================================="
echo ""

# 1. Stop services
log_info "Stopping services..."
systemctl stop "$BACKEND_SERVICE" 2>/dev/null || log_warning "Backend service not running"
systemctl stop "$FRONTEND_SERVICE" 2>/dev/null || log_warning "Frontend service not running"
log_success "Services stopped"

# 2. Disable services
log_info "Disabling services..."
systemctl disable "$BACKEND_SERVICE" 2>/dev/null || log_warning "Backend service not enabled"
systemctl disable "$FRONTEND_SERVICE" 2>/dev/null || log_warning "Frontend service not enabled"
log_success "Services disabled"

# 3. Remove service files
log_info "Removing service files..."
if [ -f "$SYSTEMD_DIR/$BACKEND_SERVICE" ]; then
    rm "$SYSTEMD_DIR/$BACKEND_SERVICE"
    log_success "Removed $BACKEND_SERVICE"
else
    log_warning "Backend service file not found"
fi

if [ -f "$SYSTEMD_DIR/$FRONTEND_SERVICE" ]; then
    rm "$SYSTEMD_DIR/$FRONTEND_SERVICE"
    log_success "Removed $FRONTEND_SERVICE"
else
    log_warning "Frontend service file not found"
fi

# 4. Reload systemd daemon
log_info "Reloading systemd daemon..."
systemctl daemon-reload
systemctl reset-failed 2>/dev/null || true
log_success "Systemd daemon reloaded"

echo ""
log_success "Uninstallation complete!"
echo ""
log_info "Note: Application files are still in place. To completely remove:"
echo "  rm -rf /root/inference-instance-admin"

