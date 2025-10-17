# Inference Instances Management System

A simplified FastAPI-based system for managing inference instances with core CRUD operations, history tracking, and a clean web interface.

## Features

### 🎯 Core Functionality
- 📊 **Complete CRUD Operations**: Create, read, update, and delete inference instances
- 📝 **Comprehensive History Tracking**: Automatic audit trail with detailed change tracking
- 🔍 **Advanced Search & Filtering**: Real-time search with multiple filter options
- 📊 **History Comparison**: Side-by-side comparison of instance versions
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### 🚀 Modern Architecture
- ⚛️ **React Frontend**: Modern, component-based UI with TypeScript
- 🎨 **Ant Design**: Professional UI components and design system
- 🔌 **REST API**: Well-documented FastAPI backend with automatic OpenAPI docs
- 🏗️ **Clean Architecture**: Separation of concerns with service layers

### 🛠️ Developer Experience
- 🔥 **Hot Reload**: Instant feedback during development
- 📚 **Comprehensive Documentation**: Component guides, API docs, and migration guides
- ✅ **Full Test Coverage**: Unit, integration, and E2E tests
- 🔧 **Easy Setup**: One-command startup for full development environment

### 🌟 User Experience
- ⚡ **Fast Performance**: Optimized loading with skeleton screens and lazy loading
- 🎯 **Intuitive Interface**: Clean, modern design with consistent interactions
- 🔔 **Real-time Feedback**: Toast notifications and loading states
- ♿ **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

### 🐳 Deployment & Operations
- 🐳 **Docker Support**: Containerized deployment with Docker Compose
- 🚀 **Production Ready**: Optimized builds with code splitting and caching
- 📊 **Monitoring**: Built-in error tracking and performance monitoring
- 🔄 **CI/CD Ready**: GitHub Actions workflows included

## Quick Start

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

### Docker Deployment

1. **Build and start with Docker Compose:**
```bash
docker-compose up -d
```

2. **Access the application:**
- Web Interface: http://localhost:8000

3. **View logs:**
```bash
docker-compose logs -f
```

4. **Stop the application:**
```bash
docker-compose down
```

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

### Database

- **Default**: SQLite database (`inference_instances.db`)
- **Production**: PostgreSQL recommended (MySQL also supported)
- **Automatic Setup**: Database tables are created automatically on startup

#### PostgreSQL Configuration

For production deployments, PostgreSQL is recommended:

1. **Install PostgreSQL driver:**
```bash
pip install psycopg2-binary
```

2. **Set DATABASE_URL in .env:**
```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
```

3. **Example with special characters in password:**

4. **Test connection:**
```bash
python test_db_connection.py
```

#### Connection Pool Settings

For PostgreSQL, you can configure connection pooling:

```bash
# .env file
DB_POOL_SIZE=10          # Number of connections to maintain
DB_MAX_OVERFLOW=20       # Additional connections when needed
DB_POOL_RECYCLE=3600     # Recycle connections every hour
DB_CONNECT_TIMEOUT=10    # Connection timeout in seconds
```

## Testing

### Run All Tests

```bash
# Run unit and integration tests
python run_tests.py

# Run browser integration tests
python run_integration_tests.py

# Run specific test file
pytest tests/test_instance_service.py -v
```

### Test Coverage

The test suite includes:
- **Unit Tests**: Models, services, and API endpoints
- **Integration Tests**: End-to-end workflows
- **Browser Tests**: Web interface functionality

## Project Structure

```
inference-instances/
├── 🚀 Startup Scripts
│   ├── run.sh                  # Main startup script (Linux/macOS)
│   ├── run.bat                 # Windows startup script
│   └── start-dev.sh            # Simple development startup
│
├── 🔧 Backend (FastAPI)
│   ├── main.py                 # FastAPI application setup
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── services/               # Business logic layer
│   │   ├── instance_service.py # Instance CRUD operations
│   │   ├── history_service.py  # History tracking
│   │   └── exceptions.py       # Custom exceptions
│   └── api/                    # API endpoints
│       ├── instances.py        # Instance management endpoints
│       └── history.py          # History access endpoints
│
├── ⚛️ Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── common/         # Reusable UI components
│   │   │   ├── forms/          # Form components
│   │   │   ├── modals/         # Modal dialogs
│   │   │   ├── tables/         # Data display components
│   │   │   └── Layout/         # Layout components
│   │   ├── pages/              # Page-level components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API integration
│   │   ├── contexts/           # React Context providers
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Utility functions
│   │   ├── styles/             # Global styles
│   │   └── test/               # Frontend tests
│   ├── docs/                   # Frontend documentation
│   │   ├── DEVELOPMENT.md      # Development guide
│   │   ├── COMPONENT_GUIDE.md  # Component documentation
│   │   ├── API_GUIDE.md        # API integration guide
│   │   ├── DEPLOYMENT_GUIDE.md # Deployment instructions
│   │   └── MIGRATION_GUIDE.md  # Migration from legacy
│   ├── package.json            # Node.js dependencies
│   ├── vite.config.ts          # Vite configuration
│   └── playwright.config.ts    # E2E test configuration
│
├── 🧪 Testing
│   ├── tests/                  # Backend tests
│   └── run_tests.py            # Test runner
│
├── 📚 Documentation
│   ├── README.md               # This file
│   ├── API_DOCUMENTATION.md    # API reference
│   ├── MIGRATION_GUIDE.md      # Migration instructions
│   └── docs/                   # Additional documentation
│
├── 📋 History Interface Documentation
│   ├── frontend/docs/HISTORY_INTERFACE_GUIDE.md      # User guide
│   ├── frontend/docs/HISTORY_COMPONENT_INTEGRATION.md # Developer guide
│   ├── frontend/docs/COMPONENT_GUIDE.md              # Updated component docs
│   └── frontend/docs/API_GUIDE.md                    # Updated API integration
│
├── 🐳 Deployment
│   ├── Dockerfile              # Container configuration
│   ├── docker-compose.yml      # Multi-service deployment
│   ├── nginx.conf              # Nginx configuration
│   └── deploy.py               # Deployment scripts
│
└── 🔧 Configuration
    ├── .env.example            # Environment variables template
    ├── requirements.txt        # Python dependencies
    └── .kiro/                  # Kiro AI specifications
```

## Architecture

The system follows a clean layered architecture:

- **Web Layer**: HTML templates and JavaScript for user interface
- **API Layer**: FastAPI endpoints for REST API
- **Service Layer**: Business logic and data validation
- **Data Layer**: SQLAlchemy models and database operations

Key design principles:
- **Single Responsibility**: Each file has one clear purpose
- **File Size Limits**: Maximum 500 lines per file for maintainability
- **Minimal Dependencies**: Reduced coupling between components
- **Core Functionality**: Focus on essential features only
#
# API Documentation

### Base URL
```
http://localhost:8000/api
```

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error Response:**
```json
{
  "error": {
    "type": "ErrorType",
    "message": "Error description",
    "details": { ... }
  }
}
```

### Instance Management Endpoints

#### List Instances
```http
GET /api/instances
```

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Number of records to return (default: 100, max: 1000)
- `name` (string, optional): Filter by instance name (partial match)
- `model_name` (string, optional): Filter by model name
- `cluster_name` (string, optional): Filter by cluster name
- `status` (string, optional): Filter by status (active, inactive, pending, error)
- `priority` (string, optional): Filter by priority (low, medium, high, critical)

**Example Request:**
```bash
curl "http://localhost:8000/api/instances?limit=10&status=active"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "llama-7b-chat",
    "model_name": "llama-7b",
    "model_version": "latest",
    "cluster_name": "gpu-cluster-1",
    "image_tag": "llama:7b-latest",
    "replicas": 2,
    "pp": 1,
    "cp": 8,
    "tp": 1,
    "status": "active",
    "priority": "medium",
    "description": "LLaMA 7B chat model for production",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Instance
```http
POST /api/instances
```

**Request Body:**
```json
{
  "name": "gpt-3.5-turbo",
  "model_name": "gpt-3.5-turbo",
  "model_version": "latest",
  "cluster_name": "gpu-cluster-2",
  "image_tag": "openai:gpt-3.5-latest",
  "replicas": 3,
  "pp": 1,
  "cp": 16,
  "tp": 2,
  "status": "active",
  "priority": "high",
  "description": "GPT-3.5 Turbo for high-priority requests"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/instances" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "gpt-3.5-turbo",
    "model_name": "gpt-3.5-turbo",
    "cluster_name": "gpu-cluster-2",
    "image_tag": "openai:gpt-3.5-latest"
  }'
```

#### Get Instance by ID
```http
GET /api/instances/{id}
```

**Path Parameters:**
- `id` (int): Instance ID

**Example Request:**
```bash
curl "http://localhost:8000/api/instances/1"
```

#### Update Instance
```http
PUT /api/instances/{id}
```

**Path Parameters:**
- `id` (int): Instance ID

**Request Body:** Same as create, but all fields are optional

**Example Request:**
```bash
curl -X PUT "http://localhost:8000/api/instances/1" \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 4,
    "status": "inactive"
  }'
```

#### Delete Instance
```http
DELETE /api/instances/{id}
```

**Path Parameters:**
- `id` (int): Instance ID

**Example Request:**
```bash
curl -X DELETE "http://localhost:8000/api/instances/1"
```

**Response:**
```json
{
  "message": "Instance deleted successfully"
}
```

### History Endpoints

#### Get Instance History
```http
GET /api/instances/{instance_id}/history
```

**Path Parameters:**
- `instance_id` (int): Instance ID

**Query Parameters:**
- `limit` (int, optional): Number of records to return (default: 50, max: 1000)
- `offset` (int, optional): Number of records to skip (default: 0)
- `operation_type` (string, optional): Filter by operation type (create, update, delete)
- `start_date` (datetime, optional): Filter records after this date
- `end_date` (datetime, optional): Filter records before this date

**Example Request:**
```bash
curl "http://localhost:8000/api/instances/1/history?limit=10&operation_type=update"
```

**Example Response:**
```json
{
  "items": [
    {
      "history_id": 123,
      "original_id": 1,
      "operation_type": "update",
      "operation_timestamp": "2024-01-15T14:30:00Z",
      "name": "llama-7b-chat",
      "model_name": "llama-7b",
      "replicas": 2,
      "status": "active",
      "changes": {
        "replicas": {"old": 1, "new": 2},
        "updated_at": {"old": "2024-01-15T10:30:00Z", "new": "2024-01-15T14:30:00Z"}
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### Get Specific History Record
```http
GET /api/history/{history_id}
```

**Path Parameters:**
- `history_id` (int): History record ID

**Example Request:**
```bash
curl "http://localhost:8000/api/history/123"
```

### Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Field Validation

#### Instance Fields

- `name`: Required, 1-255 characters, must be unique
- `model_name`: Required, 1-255 characters
- `model_version`: Optional, max 50 characters (default: "latest")
- `cluster_name`: Required, 1-255 characters
- `image_tag`: Required, 1-255 characters
- `replicas`: Optional, 1-100 (default: 1)
- `pp`: Optional, 1-16 (default: 1)
- `cp`: Optional, 1-64 (default: 8)
- `tp`: Optional, 1-16 (default: 1)
- `status`: Optional, one of: active, inactive, pending, error (default: "active")
- `priority`: Optional, one of: low, medium, high, critical (default: "medium")
- `description`: Optional, max 2000 characters

## Migration Guide

### From Previous Version

If you're migrating from the previous complex version of this system, follow these steps:

#### 1. Data Migration

**Backup your existing data:**
```bash
# For SQLite
cp inference_instances.db inference_instances_backup.db

# For PostgreSQL
pg_dump your_database > backup.sql
```

**Extract core data:**
The new system uses only core fields. Map your existing data as follows:

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `name` | `name` | Direct mapping |
| `model_name` | `model_name` | Direct mapping |
| `model_version` | `model_version` | Default to "latest" if null |
| `cluster_name` | `cluster_name` | Direct mapping |
| `image_tag` | `image_tag` | Direct mapping |
| `replicas` | `replicas` | Direct mapping |
| `pp` | `pp` | Direct mapping |
| `cp` | `cp` | Direct mapping |
| `tp` | `tp` | Direct mapping |
| `status` | `status` | Map to simplified status values |
| `priority` | `priority` | Map to simplified priority values |
| `description` | `description` | Truncate if > 2000 characters |
| `created_at` | `created_at` | Direct mapping |
| `updated_at` | `updated_at` | Direct mapping |

**Migration Script Example:**
```python
# migration_script.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import InferenceInstance, InferenceInstanceHistory

# Connect to old and new databases
old_engine = create_engine("sqlite:///old_database.db")
new_engine = create_engine("sqlite:///inference_instances.db")

# Migrate core data
# (Add your specific migration logic here)
```

#### 2. API Changes

**Removed Endpoints:**
- `/api/login` - Authentication removed
- `/api/instances/{name}` - Now uses ID instead of name
- Complex filtering endpoints

**Changed Endpoints:**
- Instance access now uses ID instead of name
- Simplified query parameters
- Removed authentication headers

**Update your API calls:**
```python
# Old way
response = requests.get("/api/instances/my-instance-name")

# New way
response = requests.get("/api/instances/1")  # Use ID
```

#### 3. Configuration Changes

**Removed Environment Variables:**
- `SECRET_KEY` - No authentication
- `ACCESS_TOKEN_EXPIRE_MINUTES` - No tokens
- Complex field configuration variables

**Simplified Configuration:**
```bash
# .env file
DATABASE_URL=sqlite:///./inference_instances.db
DEBUG=false
LOG_TO_FILE=false
PORT=8000
```

#### 4. Feature Removals

The following features have been removed in the simplified version:

- **Authentication System**: No user login required
- **Complex Field System**: Simplified to core fields only
- **Copy Functionality**: Instance copying removed
- **Advanced Filtering**: Basic filtering only
- **Field Display Configuration**: Fixed field display
- **Validation Service**: Basic validation only
- **Performance Monitoring**: Removed metrics
- **Rollback Functionality**: Use history for audit only
- **Ephemeral Instances**: All instances are persistent

#### 5. Testing Migration

**Update your tests:**
- Remove authentication-related tests
- Update API endpoint URLs
- Simplify test data to match new schema
- Update assertions for simplified responses

#### 6. Deployment Changes

**Docker Configuration:**
The new system has simplified Docker configuration. Update your `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./inference_instances.db
    volumes:
      - ./data:/app/data
```

### Rollback Plan

If you need to rollback to the previous version:

1. **Restore database backup**
2. **Revert to previous codebase**
3. **Restore previous configuration**
4. **Update API clients to use old endpoints**

## Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check database file permissions
ls -la inference_instances.db

# Recreate database
rm inference_instances.db
python main.py  # Will recreate tables
```

**Port Already in Use:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process or use different port
PORT=8001 python main.py
```

**Import Errors:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Logging

Enable detailed logging for debugging:
```bash
DEBUG=true LOG_TO_FILE=true python main.py
```

Check the `app.log` file for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (ensure files stay under 500 lines)
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check existing issues in the repository
4. Create a new issue with detailed information