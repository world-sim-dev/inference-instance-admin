"""
Middleware for security enhancements including rate limiting and logging
"""

import time
import logging
from typing import Dict, List, Optional
from collections import defaultdict, deque
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RateLimitInfo:
    """Information about rate limiting for a specific key"""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: deque = deque()
    
    def is_allowed(self) -> bool:
        """Check if a request is allowed based on rate limiting"""
        now = time.time()
        
        # Remove old requests outside the window
        while self.requests and self.requests[0] <= now - self.window_seconds:
            self.requests.popleft()
        
        # Check if we're under the limit
        return len(self.requests) < self.max_requests
    
    def add_request(self) -> None:
        """Record a new request"""
        self.requests.append(time.time())
    
    def get_remaining_requests(self) -> int:
        """Get the number of remaining requests in the current window"""
        now = time.time()
        
        # Remove old requests outside the window
        while self.requests and self.requests[0] <= now - self.window_seconds:
            self.requests.popleft()
        
        return max(0, self.max_requests - len(self.requests))
    
    def get_reset_time(self) -> float:
        """Get the time when the rate limit will reset"""
        if not self.requests:
            return 0
        
        return self.requests[0] + self.window_seconds

class RateLimiter:
    """Rate limiter implementation"""
    
    def __init__(self):
        self.limits: Dict[str, RateLimitInfo] = defaultdict(
            lambda: RateLimitInfo(settings.auth_rate_limit, 60)  # Default: 10 requests per minute
        )
    
    def is_allowed(self, key: str) -> bool:
        """Check if a request is allowed for the given key"""
        return self.limits[key].is_allowed()
    
    def add_request(self, key: str) -> None:
        """Record a request for the given key"""
        self.limits[key].add_request()
    
    def get_remaining_requests(self, key: str) -> int:
        """Get remaining requests for the given key"""
        return self.limits[key].get_remaining_requests()
    
    def get_reset_time(self, key: str) -> float:
        """Get reset time for the given key"""
        return self.limits[key].get_reset_time()

# Global rate limiter instance
rate_limiter = RateLimiter()

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware for rate limiting and logging"""
    
    def add_cors_headers(self, response: Response) -> Response:
        """Add CORS headers to allow all origins"""
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response

    async def dispatch(self, request: Request, call_next) -> Response:
        # Handle CORS preflight requests
        if request.method == "OPTIONS":
            response = Response(status_code=200)
            return self.add_cors_headers(response)
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Apply rate limiting to authentication endpoints
        if self.is_auth_endpoint(request):
            rate_limit_key = f"auth_{client_ip}"
            
            if not rate_limiter.is_allowed(rate_limit_key):
                # Rate limit exceeded
                reset_time = rate_limiter.get_reset_time(rate_limit_key)
                retry_after = max(1, int(reset_time - time.time()))
                
                logger.warning(
                    f"Rate limit exceeded for IP {client_ip} on {request.url.path}",
                    extra={
                        "ip": client_ip,
                        "path": request.url.path,
                        "method": request.method,
                        "user_agent": request.headers.get("user-agent", ""),
                        "retry_after": retry_after
                    }
                )
                
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "RateLimitExceeded",
                        "message": "Too many authentication attempts. Please try again later.",
                        "retry_after": retry_after
                    },
                    headers={"Retry-After": str(retry_after)}
                )
            
            # Record the request
            rate_limiter.add_request(rate_limit_key)
        
        # Log security-relevant requests
        if self.is_security_relevant(request):
            logger.info(
                f"Security request: {request.method} {request.url.path}",
                extra={
                    "ip": client_ip,
                    "path": request.url.path,
                    "method": request.method,
                    "user_agent": request.headers.get("user-agent", ""),
                    "timestamp": time.time()
                }
            )
        
        # Process the request
        try:
            response = await call_next(request)
            
            # Log authentication attempts
            if self.is_auth_endpoint(request):
                success = response.status_code == 200
                logger.info(
                    f"Authentication attempt: {'SUCCESS' if success else 'FAILED'}",
                    extra={
                        "ip": client_ip,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "success": success,
                        "user_agent": request.headers.get("user-agent", ""),
                        "timestamp": time.time()
                    }
                )
            
            # Add security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            
            # Add CORS headers to all responses
            self.add_cors_headers(response)
            
            return response
            
        except Exception as e:
            # Log security exceptions
            logger.error(
                f"Security exception: {str(e)}",
                extra={
                    "ip": client_ip,
                    "path": request.url.path,
                    "method": request.method,
                    "error": str(e),
                    "timestamp": time.time()
                },
                exc_info=True
            )
            raise
    
    def get_client_ip(self, request: Request) -> str:
        """Get the client IP address from the request"""
        # Check for forwarded headers (when behind a proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"
    
    def is_auth_endpoint(self, request: Request) -> bool:
        """Check if the request is to an authentication endpoint"""
        auth_paths = ["/api/auth/", "/auth/"]
        return any(request.url.path.startswith(path) for path in auth_paths)
    
    def is_security_relevant(self, request: Request) -> bool:
        """Check if the request is security-relevant and should be logged"""
        security_paths = ["/api/auth/", "/auth/", "/api/instances/"]
        return any(request.url.path.startswith(path) for path in security_paths)

def sanitize_input(input_str: str) -> str:
    """Sanitize input string to prevent injection attacks"""
    if not isinstance(input_str, str):
        return ""
    
    # Remove null bytes and control characters
    sanitized = input_str.replace('\x00', '').replace('\r', '').replace('\n', ' ')
    
    # Limit length to prevent buffer overflow
    sanitized = sanitized[:1000]
    
    # Remove potentially dangerous characters for logging
    dangerous_chars = ['<', '>', '"', "'", '&', '\x1b']
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()

def validate_auth_input(username: str, password: str) -> tuple[bool, str]:
    """Validate authentication input"""
    if not username or not password:
        return False, "Username and password are required"
    
    # Sanitize inputs
    username = sanitize_input(username)
    
    if len(username) < 1 or len(username) > 50:
        return False, "Username must be between 1 and 50 characters"
    
    if len(password) < 1 or len(password) > 200:
        return False, "Password must be between 1 and 200 characters"
    
    # Check for valid username characters
    import re
    if not re.match(r'^[a-zA-Z0-9._-]+$', username):
        return False, "Username contains invalid characters"
    
    # Check for null bytes and control characters in password
    if any(ord(c) < 32 for c in password if c not in ['\t']):
        return False, "Password contains invalid characters"
    
    return True, ""

# Security logging utilities
class SecurityLogger:
    """Utility class for security logging"""
    
    @staticmethod
    def log_auth_attempt(ip: str, username: str, success: bool, error: str = None):
        """Log authentication attempt"""
        logger.info(
            f"Auth attempt: {username} from {ip} - {'SUCCESS' if success else 'FAILED'}",
            extra={
                "event_type": "auth_attempt",
                "ip": sanitize_input(ip),
                "username": sanitize_input(username),
                "success": success,
                "error": sanitize_input(error) if error else None,
                "timestamp": time.time()
            }
        )
    
    @staticmethod
    def log_security_event(event_type: str, ip: str, details: dict):
        """Log security event"""
        # Sanitize details
        sanitized_details = {}
        for key, value in details.items():
            if isinstance(value, str):
                sanitized_details[key] = sanitize_input(value)
            else:
                sanitized_details[key] = value
        
        logger.warning(
            f"Security event: {event_type} from {ip}",
            extra={
                "event_type": event_type,
                "ip": sanitize_input(ip),
                "details": sanitized_details,
                "timestamp": time.time()
            }
        )
    
    @staticmethod
    def log_rate_limit_exceeded(ip: str, endpoint: str, retry_after: int):
        """Log rate limit exceeded event"""
        logger.warning(
            f"Rate limit exceeded: {ip} on {endpoint}",
            extra={
                "event_type": "rate_limit_exceeded",
                "ip": sanitize_input(ip),
                "endpoint": sanitize_input(endpoint),
                "retry_after": retry_after,
                "timestamp": time.time()
            }
        )

# Export the security logger instance
security_logger = SecurityLogger()