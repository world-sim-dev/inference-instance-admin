#!/bin/bash

# Docker Startup Script for CRUD Application
# This script provides easy commands to start the application in different modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  CRUD Application Docker Setup${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status ".env file created. Please review and update the configuration."
        else
            print_error ".env.example file not found. Please create .env file manually."
            exit 1
        fi
    fi
}

# Function to start production environment
start_production() {
    print_status "Starting production environment..."
    check_env_file
    
    print_status "Building and starting services..."
    docker-compose up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    print_status "Production environment started successfully!"
    print_status "Frontend is available at: http://localhost:3000"
    print_status "Backend API is available at: http://localhost:8000"
    print_status "API Documentation: http://localhost:8000/docs"
    
    echo ""
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
}

# Function to start development environment
start_development() {
    print_status "Starting development environment..."
    
    print_status "Building and starting development services..."
    docker-compose -f docker-compose.dev.yml up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    print_status "Development environment started successfully!"
    print_status "Frontend (Dev Server) is available at: http://localhost:3000"
    print_status "Frontend (Vite) is available at: http://localhost:5173"
    print_status "Backend API is available at: http://localhost:8000"
    print_status "API Documentation: http://localhost:8000/docs"
    
    echo ""
    print_status "To view frontend logs: docker-compose -f docker-compose.dev.yml logs -f frontend"
    print_status "To view backend logs: docker-compose -f docker-compose.dev.yml logs -f backend"
    print_status "To stop: docker-compose -f docker-compose.dev.yml down"
}

# Function to start with external services (just the app containers)
start_minimal() {
    print_status "Starting minimal environment (app containers only)..."
    check_env_file
    
    print_status "Building and starting app services..."
    docker-compose up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    print_status "Minimal environment started successfully!"
    print_status "Frontend is available at: http://localhost:3000"
    print_status "Backend API is available at: http://localhost:8000"
    print_status "Note: Make sure external database is running and accessible"
    
    echo ""
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    if docker-compose ps -q > /dev/null 2>&1; then
        docker-compose down
    fi
    
    if docker-compose -f docker-compose.dev.yml ps -q > /dev/null 2>&1; then
        docker-compose -f docker-compose.dev.yml down
    fi
    
    print_status "All services stopped."
}

# Function to clean up (remove containers, volumes, images)
cleanup() {
    print_warning "This will remove all containers, volumes, and images related to this project."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        
        # Stop and remove containers
        docker-compose down -v --remove-orphans 2>/dev/null || true
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
        
        # Remove images
        docker rmi $(docker images -q --filter "reference=crud*") 2>/dev/null || true
        
        # Remove volumes
        docker volume rm crud_postgres_data 2>/dev/null || true
        docker volume rm crud_postgres_dev_data 2>/dev/null || true
        
        print_status "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show logs
show_logs() {
    if docker-compose ps -q > /dev/null 2>&1; then
        docker-compose logs -f
    elif docker-compose -f docker-compose.dev.yml ps -q > /dev/null 2>&1; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        print_error "No running services found."
    fi
}

# Function to show status
show_status() {
    print_header
    
    print_status "Checking service status..."
    
    echo ""
    echo "Production services:"
    docker-compose ps 2>/dev/null || echo "No production services running"
    
    echo ""
    echo "Development services:"
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "No development services running"
}

# Function to show help
show_help() {
    print_header
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  prod, production     Start production environment (frontend + backend)"
    echo "  dev, development     Start development environment (with hot reload)"
    echo "  minimal             Start minimal environment (app containers only)"
    echo "  stop                Stop all services"
    echo "  logs                Show logs from running services"
    echo "  status              Show status of all services"
    echo "  cleanup             Remove all containers, volumes, and images"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 prod             # Start production environment"
    echo "  $0 dev              # Start development environment"
    echo "  $0 stop             # Stop all services"
    echo "  $0 logs             # View logs"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        "prod"|"production")
            start_production
            ;;
        "dev"|"development")
            start_development
            ;;
        "minimal")
            start_minimal
            ;;
        "stop")
            stop_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"