"""
Database connection pool monitoring endpoint.
"""

from fastapi import APIRouter, HTTPException
from database import engine, DATABASE_URL
from sqlalchemy.pool import QueuePool

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/db-pool")
async def get_db_pool_stats():
    """
    Get database connection pool statistics.
    Useful for monitoring connection usage and detecting leaks.
    
    Returns:
        dict: Connection pool statistics including:
            - pool_size: Configured pool size
            - checked_in: Available connections
            - checked_out: Active connections in use
            - overflow: Overflow connections created
            - total_connections: Total connections (checked_in + checked_out)
            - utilization: Connection pool utilization percentage
    """
    db_type = DATABASE_URL.split("://")[0]
    
    # Only PostgreSQL and MySQL use connection pooling
    if db_type not in ["postgresql", "mysql"]:
        return {
            "database_type": db_type,
            "message": "Connection pooling not enabled for this database type"
        }
    
    try:
        pool = engine.pool
        
        if not isinstance(pool, QueuePool):
            return {
                "database_type": db_type,
                "pool_type": type(pool).__name__,
                "message": "Not using QueuePool"
            }
        
        # Get pool statistics
        pool_size = pool.size()
        checked_in = pool.checkedin()
        checked_out = pool.checkedout()
        overflow = pool.overflow()
        total = checked_in + checked_out
        
        # Calculate utilization
        max_connections = pool_size + overflow
        utilization = (checked_out / max_connections * 100) if max_connections > 0 else 0
        
        stats = {
            "database_type": db_type,
            "pool_type": "QueuePool",
            "pool_size": pool_size,
            "checked_in": checked_in,
            "checked_out": checked_out,
            "overflow": overflow,
            "total_connections": total,
            "utilization_percent": round(utilization, 2),
            "status": "healthy" if utilization < 80 else "warning" if utilization < 95 else "critical"
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get pool statistics: {str(e)}"
        )


@router.get("/db-pool/warning-threshold")
async def check_pool_health():
    """
    Check if connection pool usage is within healthy limits.
    
    Returns:
        dict: Health status with warnings if usage is high
    """
    stats = await get_db_pool_stats()
    
    if "utilization_percent" not in stats:
        return stats
    
    utilization = stats["utilization_percent"]
    checked_out = stats["checked_out"]
    
    warnings = []
    recommendations = []
    
    if utilization >= 95:
        warnings.append("Connection pool almost exhausted!")
        recommendations.append("Consider increasing DB_POOL_SIZE or DB_MAX_OVERFLOW")
    elif utilization >= 80:
        warnings.append("Connection pool usage is high")
        recommendations.append("Monitor for potential connection leaks")
    
    if checked_out > 0 and utilization < 50:
        recommendations.append("Connection pool configuration seems adequate")
    
    return {
        **stats,
        "warnings": warnings,
        "recommendations": recommendations
    }

