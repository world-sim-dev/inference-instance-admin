"""
Authentication utilities for the application.
Provides Basic Authentication functionality.
"""

import secrets
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from config import settings
from middleware import validate_auth_input, security_logger
from password_utils import verify_password

# Basic Authentication setup
security = HTTPBasic()


def authenticate(credentials: HTTPBasicCredentials = Depends(security), request: Request = None):
    """
    Basic Authentication dependency.
    
    Validates the provided credentials against the configured admin credentials.
    Uses constant-time comparison to prevent timing attacks.
    Includes input validation and security logging.
    
    Args:
        credentials: HTTP Basic credentials from the request
        request: HTTP request object for logging
        
    Returns:
        str: Username if authentication is successful
        
    Raises:
        HTTPException: 401 Unauthorized if credentials are invalid
    """
    # Get client IP for logging
    client_ip = "unknown"
    if request:
        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if not client_ip:
            client_ip = request.headers.get("X-Real-IP", "")
        if not client_ip and hasattr(request, "client") and request.client:
            client_ip = request.client.host
    
    # Validate input format
    is_valid, error_msg = validate_auth_input(credentials.username, credentials.password)
    if not is_valid:
        security_logger.log_auth_attempt(client_ip, credentials.username, False, error_msg)
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials format",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    # Perform authentication
    is_correct_username = secrets.compare_digest(credentials.username, settings.auth_username)
    is_correct_password = verify_password(credentials.password, settings.auth_password_hash)
    
    if not (is_correct_username and is_correct_password):
        security_logger.log_auth_attempt(client_ip, credentials.username, False, "Invalid credentials")
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    # Log successful authentication
    security_logger.log_auth_attempt(client_ip, credentials.username, True)
    
    return credentials.username