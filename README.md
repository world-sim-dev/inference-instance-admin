### generate auth password
./venv/bin/python3  manage_password.py generate
Password Hash Generator
==============================
Enter password to hash: 
Confirm password: 

Generated hash:
AUTH_PASSWORD_HASH=<>

Add this to your .env file or update config.py

### Prerequisites

- Python 3.8+
- Node.js 18+ (for React frontend)
- pip (Python package manager)
- npm or yarn (Node.js package manager)
- Optional: Docker and Docker Compose for containerized deployment

### 🚀 One-Click Development Setup

The easiest way to start the full-stack application:

#### Linux/macOS:
```bash
# Clone and navigate to the project
git clone <repository-url>
cd inference-instances

# Start both backend and frontend
./run.sh
```

#### Windows:
```cmd
# Clone and navigate to the project
git clone <repository-url>
cd inference-instances

# Start both backend and frontend
run.bat
```

#### Alternative Simple Start:
```bash
# Quick development start (Linux/macOS)
./start-dev.sh
```

### 📋 Startup Script Options

The `run.sh` script supports various options:

```bash
# Show help
./run.sh --help

# Start both backend and frontend (default)
./run.sh

# Start only backend API server
./run.sh --backend-only

# Start only React frontend
./run.sh --frontend-only

# Production mode (build frontend, use optimized settings)
./run.sh --production

# Skip dependency installation
./run.sh --no-install

# Custom ports
./run.sh --port 8080 --frontend-port 3000
```

### 🔧 Manual Setup

If you prefer manual setup or need more control:

#### Backend Setup:

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Start backend server:**
```bash
python main.py
```

#### Frontend Setup:

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install Node.js dependencies:**
```bash
npm install
# or
yarn install
```

3. **Start development server:**
```bash
npm run dev
# or
yarn dev
```

### 🌐 Access the Application

After starting the services:

- **React Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Documentation

### 📚 Comprehensive Documentation

The system includes extensive documentation for users and developers:

#### User Guides
- **[Main README](README.md)**: Complete system overview and quick start
- **[History Interface Guide](frontend/docs/HISTORY_INTERFACE_GUIDE.md)**: Comprehensive user guide for history features
- **[API Documentation](API_DOCUMENTATION.md)**: Complete API reference
- **[Migration Guide](MIGRATION_GUIDE.md)**: Upgrading from previous versions

#### Developer Guides  
- **[Component Guide](frontend/docs/COMPONENT_GUIDE.md)**: React component documentation
- **[History Component Integration](frontend/docs/HISTORY_COMPONENT_INTEGRATION.md)**: Developer integration guide
- **[API Integration Guide](frontend/docs/API_GUIDE.md)**: Frontend API integration
- **[Deployment Guide](frontend/docs/DEPLOYMENT_GUIDE.md)**: Production deployment instructions

#### Implementation Details
- **[History Interface Summary](frontend/docs/HISTORY_INTERFACE_SUMMARY.md)**: Complete implementation overview
- **[Architecture Decisions](ARCHITECTURE_DECISIONS.md)**: Technical decision documentation

## Usage

### React Frontend Interface

The modern React-based web interface provides a rich, interactive experience:

#### 🎯 Main Features
1. **Dashboard Overview**: Real-time instance status with visual indicators
2. **Advanced Table**: Sortable, filterable table with pagination and search
3. **Instance Management**: 
   - Create instances with comprehensive form validation
   - Edit instances with inline editing capabilities
   - Bulk operations for multiple instances
   - Delete with confirmation dialogs
4. **Advanced History Interface**: 
   - View detailed change history with timeline visualization
   - Compare different versions with side-by-side diff view
   - Filter and search through historical changes
   - Export history data in multiple formats
   - Real-time history updates via WebSocket
   - Performance-optimized for large history datasets
5. **Responsive Design**: Optimized for desktop, tablet, and mobile devices

#### 🎨 User Experience
- **Real-time Updates**: Live data synchronization without page refresh
- **Loading States**: Skeleton screens and progress indicators
- **Error Handling**: User-friendly error messages with retry options
- **Notifications**: Toast notifications for actions and status updates
- **Keyboard Shortcuts**: Power user features with keyboard navigation
- **Accessibility**: Full WCAG compliance with screen reader support

#### 🔧 Developer Features
- **Component Library**: Reusable components with TypeScript interfaces
- **State Management**: Efficient state handling with React Context
- **API Integration**: Type-safe API client with error handling
- **Testing**: Comprehensive test coverage with React Testing Library
- **Hot Reload**: Instant development feedback

#### 📱 Mobile Experience
- **Touch-Friendly**: Optimized touch targets and gestures
- **Responsive Tables**: Adaptive layouts for small screens
- **Swipe Actions**: Mobile-specific interaction patterns
- **Offline Support**: Basic offline functionality with service workers

### API Usage

The REST API provides programmatic access to all functionality. See the [API Documentation](#api-documentation) section below for detailed endpoint information.

## Configuration

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Database Configuration
DATABASE_URL=sqlite:///./inference_instances.db

# Application Settings
DEBUG=false
LOG_TO_FILE=false
PORT=8000

# Optional: For production deployments
# DATABASE_URL=postgresql://user:password@localhost/dbname
# DATABASE_URL=mysql://user:password@localhost/dbname
```
