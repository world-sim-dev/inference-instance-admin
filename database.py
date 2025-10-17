"""
Database configuration module for inference instance management.
Provides database connection and session management with PostgreSQL optimization.
"""

import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool, QueuePool
from typing import Generator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inference_instances.db")

# Create engine with appropriate configuration
if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=os.getenv("DB_ECHO", "false").lower() == "true"
    )
    logger.info("Using SQLite database")
elif DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),  # Recycle connections every hour
        echo=os.getenv("DB_ECHO", "false").lower() == "true",
        connect_args={
            "connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", "10")),
            "application_name": "inference_instances_api"
        }
    )
    logger.info("Using PostgreSQL database with connection pooling")
else:
    # Other database configuration (MySQL, etc.)
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
        pool_pre_ping=True,
        echo=os.getenv("DB_ECHO", "false").lower() == "true"
    )
    logger.info(f"Using database: {DATABASE_URL.split('://')[0]}")

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI dependency injection.
    
    This function creates a database session for each request and ensures
    it's properly closed after the request completes. It's designed to be
    used with FastAPI's dependency injection system.
    
    Usage:
        @app.get("/api/instances")
        def get_instances(db: Session = Depends(get_db)):
            # Use db session here
            pass
    
    The session is automatically:
    - Created at the start of each request
    - Committed if no exceptions occur
    - Rolled back if exceptions occur
    - Closed when the request completes
    
    Yields:
        Session: SQLAlchemy database session for the current request
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database by creating all tables defined in models.
    
    This function should be called during application startup to ensure
    all required database tables exist. It's idempotent - calling it
    multiple times won't cause issues.
    
    The function:
    - Creates all tables defined in the models module
    - Handles both SQLite and PostgreSQL databases
    - Is safe to call multiple times (won't recreate existing tables)
    - Tests database connectivity before table creation
    - Logs any errors that occur during table creation
    
    Raises:
        Exception: If table creation fails (database connection issues, etc.)
    """
    try:
        # Test database connectivity
        with engine.connect() as connection:
            logger.info("Database connection successful")
        
        # Create tables
        from models import create_tables
        create_tables(engine)
        logger.info("Database tables initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        if "password authentication failed" in str(e).lower():
            logger.error("PostgreSQL authentication failed. Please check your DATABASE_URL credentials.")
        elif "could not connect to server" in str(e).lower():
            logger.error("Could not connect to PostgreSQL server. Please check if the server is running and accessible.")
        elif "database" in str(e).lower() and "does not exist" in str(e).lower():
            logger.error("PostgreSQL database does not exist. Please create the database first.")
        raise


def get_db_session() -> Session:
    """
    Get a database session for direct use outside of FastAPI request context.
    
    This function is useful for:
    - Command-line scripts that need database access
    - Background tasks or scheduled jobs
    - Testing scenarios where you need direct database access
    - Migration scripts or data import/export tools
    
    Important: Unlike get_db(), this function returns a session that the
    caller is responsible for managing. You must call session.close()
    when finished to avoid connection leaks.
    
    Usage:
        session = get_db_session()
        try:
            # Use session here
            instances = session.query(InferenceInstance).all()
            session.commit()
        finally:
            session.close()
    
    Returns:
        Session: SQLAlchemy database session (caller must close)
    """
    return SessionLocal()


def check_db_health() -> dict:
    """
    Check database connectivity and health.
    
    This function tests the database connection and returns health information.
    Useful for health check endpoints and monitoring.
    
    Returns:
        dict: Database health information including:
            - status: "healthy" or "unhealthy"
            - database_type: Type of database (postgresql, sqlite, etc.)
            - connection_pool_info: Pool statistics (for PostgreSQL)
            - error: Error message if unhealthy
    """
    try:
        with engine.connect() as connection:
            # Test basic connectivity
            from sqlalchemy import text
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
            
            # Get database type
            db_type = DATABASE_URL.split("://")[0]
            
            health_info = {
                "status": "healthy",
                "database_type": db_type,
                "database_url_host": DATABASE_URL.split("@")[-1].split("/")[0] if "@" in DATABASE_URL else "local"
            }
            
            # Add connection pool info for PostgreSQL
            if db_type == "postgresql":
                pool = engine.pool
                health_info["connection_pool_info"] = {
                    "pool_size": pool.size(),
                    "checked_in": pool.checkedin(),
                    "checked_out": pool.checkedout(),
                    "overflow": pool.overflow()
                }
            
            return health_info
            
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database_type": DATABASE_URL.split("://")[0],
            "error": str(e)
        }