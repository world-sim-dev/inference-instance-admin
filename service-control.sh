#!/bin/bash

# Service Control Script for Inference Instance Admin
# Convenient commands to manage both backend and frontend services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_SERVICE="inference-admin.service"
FRONTEND_SERVICE="inference-admin-frontend.service"

# Functions
show_usage() {
    echo "Usage: $0 {start|stop|restart|status|logs|enable|disable} [backend|frontend|all]"
    echo ""
    echo "Commands:"
    echo "  start     - Start service(s)"
    echo "  stop      - Stop service(s)"
    echo "  restart   - Restart service(s)"
    echo "  status    - Show status of service(s)"
    echo "  logs      - Show logs of service(s)"
    echo "  enable    - Enable service(s) to start on boot"
    echo "  disable   - Disable service(s) from starting on boot"
    echo ""
    echo "Targets:"
    echo "  backend   - Backend API service (port 38000)"
    echo "  frontend  - Frontend service (port 33000)"
    echo "  all       - Both services (default)"
    echo ""
    echo "Examples:"
    echo "  $0 start              # Start both services"
    echo "  $0 stop frontend      # Stop only frontend"
    echo "  $0 restart backend    # Restart only backend"
    echo "  $0 logs all           # Show logs for both"
    echo "  $0 status             # Show status of both"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}Error: This script must be run as root${NC}"
        exit 1
    fi
}

get_services() {
    local target=${1:-all}
    case $target in
        backend)
            echo "$BACKEND_SERVICE"
            ;;
        frontend)
            echo "$FRONTEND_SERVICE"
            ;;
        all)
            echo "$BACKEND_SERVICE $FRONTEND_SERVICE"
            ;;
        *)
            echo -e "${RED}Error: Invalid target '$target'${NC}"
            show_usage
            exit 1
            ;;
    esac
}

service_start() {
    local target=${1:-all}
    echo -e "${BLUE}Starting services...${NC}"
    for service in $(get_services $target); do
        echo -e "  Starting ${GREEN}$service${NC}..."
        systemctl start $service
    done
    echo -e "${GREEN}✓ Done${NC}"
}

service_stop() {
    local target=${1:-all}
    echo -e "${BLUE}Stopping services...${NC}"
    for service in $(get_services $target); do
        echo -e "  Stopping ${YELLOW}$service${NC}..."
        systemctl stop $service
    done
    echo -e "${GREEN}✓ Done${NC}"
}

service_restart() {
    local target=${1:-all}
    echo -e "${BLUE}Restarting services...${NC}"
    for service in $(get_services $target); do
        echo -e "  Restarting ${GREEN}$service${NC}..."
        systemctl restart $service
    done
    echo -e "${GREEN}✓ Done${NC}"
}

service_status() {
    local target=${1:-all}
    for service in $(get_services $target); do
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}Status: $service${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        systemctl status $service --no-pager -l || true
        echo ""
    done
}

service_logs() {
    local target=${1:-all}
    local services=$(get_services $target)
    
    echo -e "${BLUE}Showing logs (Press Ctrl+C to exit)...${NC}"
    echo -e "${YELLOW}Services: $services${NC}"
    echo ""
    
    # Use journalctl to follow logs from both services
    if [[ "$target" == "all" ]]; then
        journalctl -u $BACKEND_SERVICE -u $FRONTEND_SERVICE -f
    else
        journalctl -u $services -f
    fi
}

service_enable() {
    local target=${1:-all}
    echo -e "${BLUE}Enabling services to start on boot...${NC}"
    for service in $(get_services $target); do
        echo -e "  Enabling ${GREEN}$service${NC}..."
        systemctl enable $service
    done
    echo -e "${GREEN}✓ Done${NC}"
}

service_disable() {
    local target=${1:-all}
    echo -e "${BLUE}Disabling services from starting on boot...${NC}"
    for service in $(get_services $target); do
        echo -e "  Disabling ${YELLOW}$service${NC}..."
        systemctl disable $service
    done
    echo -e "${GREEN}✓ Done${NC}"
}

# Main
check_root

COMMAND=${1:-}
TARGET=${2:-all}

case $COMMAND in
    start)
        service_start $TARGET
        ;;
    stop)
        service_stop $TARGET
        ;;
    restart)
        service_restart $TARGET
        ;;
    status)
        service_status $TARGET
        ;;
    logs)
        service_logs $TARGET
        ;;
    enable)
        service_enable $TARGET
        ;;
    disable)
        service_disable $TARGET
        ;;
    "")
        show_usage
        exit 0
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

