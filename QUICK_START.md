# 🚀 Quick Start Guide

## One-Command Startup

### Linux/macOS
```bash
./run.sh
```

### Windows
```cmd
run.bat
```

## Startup Options

### Full Development Environment (Default)
```bash
./run.sh                    # Starts both backend and frontend
```
- Backend API: http://localhost:8000
- React Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

### Backend Only
```bash
./run.sh --backend-only     # API server only
```
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Frontend Only
```bash
./run.sh --frontend-only    # React dev server only
```
- React Frontend: http://localhost:5173
- Requires backend running separately

### Production Mode
```bash
./run.sh --production       # Optimized build
```
- Builds frontend for production
- Uses optimized server settings

### Custom Ports
```bash
./run.sh --port 8080 --frontend-port 3000
```
- Backend: http://localhost:8080
- Frontend: http://localhost:3000

### Skip Installation
```bash
./run.sh --no-install       # Skip dependency installation
```
- Useful for subsequent runs
- Assumes dependencies already installed

## Alternative Startup Methods

### Simple Development Script
```bash
./start-dev.sh              # Simplified startup
```

### Manual Backend
```bash
source venv/bin/activate
python main.py
```

### Manual Frontend
```bash
cd frontend
npm run dev
```

### Docker
```bash
docker-compose up -d
```

## Troubleshooting

### Port Already in Use
```bash
./run.sh --port 8001 --frontend-port 5174
```

### Permission Denied
```bash
chmod +x run.sh start-dev.sh
```

### Node.js Not Found
Install Node.js 18+ from https://nodejs.org

### Python Not Found
Install Python 3.8+ from https://python.org

## Help
```bash
./run.sh --help             # Show all options
```