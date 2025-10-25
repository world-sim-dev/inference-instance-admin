"""
Simplified FastAPI application for inference instance management.
Provides core CRUD operations with web interface and API endpoints.
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import init_db
from api.instances import router as instances_router
from api.history import router as history_router
from api.auth import router as auth_router
from middleware import SecurityMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log') if os.getenv('LOG_TO_FILE', 'false').lower() == 'true' else logging.NullHandler()
    ]
)

logger = logging.getLogger(__name__)

from auth import authenticate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events for the FastAPI application.
    
    This function is called when the application starts up and shuts down,
    allowing us to perform initialization and cleanup tasks.
    
    Startup tasks:
    - Initialize database tables
    - Set up logging
    - Validate configuration
    
    Shutdown tasks:
    - Clean up resources
    - Log shutdown completion
    
    Args:
        app: FastAPI application instance
        
    Yields:
        None: Control back to FastAPI during application runtime
        
    Raises:
        Exception: If database initialization fails during startup
    """
    # Startup
    logger.info("Starting up application...")
    try:
        # Initialize database tables - creates all tables defined in models
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Inference Instances Management",
    description="Simplified inference instance management system with core CRUD operations",
    version="2.0.0",
    lifespan=lifespan,
    redirect_slashes=True  # Automatically handle trailing slashes
)


# Add security middleware first (order matters)
app.add_middleware(SecurityMiddleware)

# Configure CORS
# Get allowed origins from environment or use defaults
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount React frontend static files (if available)
import os
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="react-assets")

# Configure templates
templates = Jinja2Templates(directory="templates")

# Include API routers - these must be registered before the catch-all SPA handler
app.include_router(auth_router)
app.include_router(instances_router)
app.include_router(history_router)


# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Global HTTP exception handler for FastAPI HTTPExceptions.
    
    Provides different response formats based on the request type:
    - API requests (paths starting with /api/): Returns JSON error response
    - Web requests: Returns HTML error page with user-friendly message
    
    This ensures consistent error handling across both API and web interfaces
    while providing appropriate response formats for each client type.
    
    Args:
        request: The incoming HTTP request
        exc: The HTTPException that was raised
        
    Returns:
        JSONResponse: For API requests with structured error data
        TemplateResponse: For web requests with HTML error page
    """
    from fastapi.responses import JSONResponse
    
    if request.url.path.startswith("/api/"):
        # API requests get JSON error responses
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "type": "HTTPException",
                    "message": exc.detail,
                    "status_code": exc.status_code
                }
            }
        )
    else:
        # Web requests get HTML error pages
        return templates.TemplateResponse(
            "dashboard.html",
            {
                "request": request,
                "error_message": exc.detail
            },
            status_code=exc.status_code
        )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled exceptions.
    """
    from fastapi.responses import JSONResponse
    
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "type": "InternalServerError",
                    "message": "Internal server error",
                    "details": str(exc) if os.getenv('DEBUG', 'false').lower() == 'true' else None
                }
            }
        )
    else:
        return templates.TemplateResponse(
            "dashboard.html",
            {
                "request": request,
                "error_message": "An unexpected error occurred"
            },
            status_code=500
        )


# Web interface routes
@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """
    Main dashboard page for managing inference instances.
    
    Serves the React frontend if available, otherwise falls back to the legacy template.
    The React app provides a modern single-page application experience with:
    - View all inference instances in a responsive table/grid format
    - Create new instances through modal forms with validation
    - Edit existing instances with real-time updates
    - Delete instances with confirmation dialogs
    - View instance history and audit trail with comparison features
    - Advanced search and filtering capabilities
    - Responsive design for mobile and desktop
    
    Args:
        request: The incoming HTTP request object
        
    Returns:
        FileResponse: React app HTML file if available
        TemplateResponse: Legacy HTML template as fallback
        
    Raises:
        HTTPException: 500 error if both React app and template fail to load
    """
    import os
    from fastapi.responses import FileResponse
    
    # Try to serve React app first
    react_index = "frontend/dist/index.html"
    if os.path.exists(react_index):
        try:
            return FileResponse(react_index, media_type="text/html")
        except Exception as e:
            logger.warning(f"Failed to serve React app: {str(e)}, falling back to legacy template")
    
    # Fallback to legacy template
    try:
        return templates.TemplateResponse(
            "dashboard.html",
            {"request": request}
        )
    except Exception as e:
        logger.error(f"Error rendering dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard")


@app.get("/legacy", response_class=HTMLResponse)
async def legacy_dashboard(request: Request):
    """
    Legacy dashboard page using the old template system.
    
    This endpoint provides access to the original HTML template-based interface
    for backwards compatibility or as a fallback option.
    
    Args:
        request: The incoming HTTP request object
        
    Returns:
        TemplateResponse: HTML response with the legacy dashboard template
    """
    try:
        return templates.TemplateResponse(
            "dashboard.html",
            {"request": request}
        )
    except Exception as e:
        logger.error(f"Error rendering legacy dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load legacy dashboard")


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and load balancer probes.
    
    This endpoint provides a simple way to verify that the application
    is running and responsive. It can be used by:
    - Load balancers to determine if the instance is healthy
    - Monitoring systems to track application availability
    - Container orchestrators for health checks
    - CI/CD pipelines to verify deployment success
    
    The endpoint performs minimal processing to ensure fast response times
    and doesn't test database connectivity to avoid false negatives.
    
    Returns:
        dict: Health status information including:
            - status: "healthy" if the application is running
            - service: Service name identifier
            - version: Current application version
    """
    return {
        "status": "healthy",
        "service": "inference-instances-api",
        "version": "2.0.0"
    }


@app.get("/{path:path}", response_class=HTMLResponse)
async def spa_handler(request: Request, path: str):
    """
    Single Page Application (SPA) handler for React Router.
    
    This catch-all route ensures that client-side routing works properly
    by serving the React app's index.html for any unmatched routes.
    This allows React Router to handle navigation on the frontend.
    
    The handler:
    - Serves the React app for any non-API routes
    - Excludes API routes (handled by other routers)
    - Excludes static file routes
    - Falls back to 404 if React app is not available
    
    Args:
        request: The incoming HTTP request object
        path: The requested path
        
    Returns:
        FileResponse: React app HTML file for SPA routing
        HTTPException: 404 if path should not be handled by SPA
    """
    import os
    from fastapi.responses import FileResponse
    
    # Don't handle API routes, static files, or specific endpoints
    if (path.startswith("api/") or 
        path.startswith("static/") or 
        path.startswith("assets/") or
        path.startswith("health") or
        path in ["legacy", "docs", "redoc", "openapi.json"]):
        raise HTTPException(status_code=404, detail="Not found")
    
    # Serve React app for SPA routing
    react_index = "frontend/dist/index.html"
    if os.path.exists(react_index):
        return FileResponse(react_index, media_type="text/html")
    
    # If React app is not available, return 404
    raise HTTPException(status_code=404, detail="Page not found")


@app.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check endpoint that includes database connectivity.
    
    This endpoint provides comprehensive health information including
    database connectivity status. Use this for detailed monitoring
    but be aware it may be slower than the basic health check.
    
    Returns:
        dict: Detailed health information including:
            - application: Application health status
            - database: Database connectivity and pool information
            - timestamp: Current timestamp
    """
    from database import check_db_health
    from datetime import datetime
    
    app_health = {
        "status": "healthy",
        "service": "inference-instances-api",
        "version": "2.0.0"
    }
    
    db_health = check_db_health()
    
    overall_status = "healthy" if db_health["status"] == "healthy" else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "application": app_health,
        "database": db_health
    }


if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level="info"
    )