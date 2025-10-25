"""
Authentication API endpoints.
Provides authentication verification for the application.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBasicCredentials
from pydantic import BaseModel

from auth import authenticate, security

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class AuthResponse(BaseModel):
    """Response model for authentication verification."""
    authenticated: bool
    username: str
    message: str = "Authentication successful"


class AuthError(BaseModel):
    """Error response model for authentication failures."""
    authenticated: bool = False
    message: str
    error_code: str


@router.post("/verify", response_model=AuthResponse)
async def verify_credentials(
    request: Request,
    credentials: HTTPBasicCredentials = Depends(security)
):
    """
    Verify user credentials and return authentication status.
    
    This endpoint validates the provided Basic Authentication credentials
    against the configured authentication system. It leverages the existing
    authentication logic from the auth module with enhanced security features.
    
    Args:
        request: HTTP request object for security logging
        credentials: HTTP Basic credentials from the Authorization header
        
    Returns:
        AuthResponse: Authentication result with username and status
        
    Raises:
        HTTPException: 401 Unauthorized if credentials are invalid
        HTTPException: 500 Internal Server Error for unexpected errors
    """
    try:
        # Use existing authentication function with request for logging
        username = authenticate(credentials, request)
        
        return AuthResponse(
            authenticated=True,
            username=username,
            message="Authentication successful"
        )
        
    except HTTPException as e:
        # Re-raise authentication errors with consistent format
        if e.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail={
                    "authenticated": False,
                    "message": "Invalid credentials",
                    "error_code": "INVALID_CREDENTIALS"
                },
                headers={"WWW-Authenticate": "Basic"}
            )
        raise
        
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail={
                "authenticated": False,
                "message": "Authentication service error",
                "error_code": "SERVER_ERROR"
            }
        )


def get_authenticated_user(request: Request, credentials: HTTPBasicCredentials = Depends(security)):
    """Dependency to get authenticated user with request context."""
    return authenticate(credentials, request)

@router.get("/status")
async def auth_status(
    request: Request,
    current_user: str = Depends(get_authenticated_user)
):
    """
    Check current authentication status.
    
    This endpoint can be used to verify if the current request is authenticated
    without performing a new authentication. Useful for checking session validity.
    
    Args:
        request: HTTP request object for security logging
        current_user: Current authenticated user (injected by dependency)
        
    Returns:
        dict: Current authentication status and user information
        
    Raises:
        HTTPException: 401 Unauthorized if not authenticated
    """
    return {
        "authenticated": True,
        "username": current_user,
        "message": "Currently authenticated"
    }