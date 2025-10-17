"""
Custom exception classes for instance operations.
Provides specific error types for better error handling and user feedback.
"""

import logging

logger = logging.getLogger(__name__)


class InstanceError(Exception):
    """
    Base exception for instance operations.
    All instance-related exceptions inherit from this class.
    """
    
    def __init__(self, message: str, details: dict = None):
        """
        Initialize instance error.
        
        Args:
            message: Error message
            details: Optional additional error details
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}
        logger.error(f"InstanceError: {message}, Details: {details}")

    def to_dict(self) -> dict:
        """
        Convert exception to dictionary for API responses.
        
        Returns:
            dict: Exception data
        """
        return {
            "error": {
                "type": self.__class__.__name__,
                "message": self.message,
                "details": self.details
            }
        }


class InstanceNotFoundError(InstanceError):
    """
    Exception raised when an instance is not found.
    Used for GET, UPDATE, and DELETE operations on non-existent instances.
    """
    
    def __init__(self, message: str = "Instance not found", instance_id: int = None, instance_name: str = None):
        """
        Initialize instance not found error.
        
        Args:
            message: Error message
            instance_id: Optional instance ID that was not found
            instance_name: Optional instance name that was not found
        """
        details = {}
        if instance_id is not None:
            details["instance_id"] = instance_id
        if instance_name is not None:
            details["instance_name"] = instance_name
            
        super().__init__(message, details)


class InstanceValidationError(InstanceError):
    """
    Exception raised when instance validation fails.
    Used for CREATE and UPDATE operations with invalid data.
    """
    
    def __init__(self, message: str = "Instance validation failed", field: str = None, value: str = None):
        """
        Initialize instance validation error.
        
        Args:
            message: Error message
            field: Optional field name that failed validation
            value: Optional field value that failed validation
        """
        details = {}
        if field is not None:
            details["field"] = field
        if value is not None:
            details["value"] = str(value)
            
        super().__init__(message, details)


class InstanceConflictError(InstanceError):
    """
    Exception raised when an instance operation conflicts with existing data.
    Used for operations that would violate uniqueness constraints.
    """
    
    def __init__(self, message: str = "Instance operation conflicts with existing data", conflicting_field: str = None):
        """
        Initialize instance conflict error.
        
        Args:
            message: Error message
            conflicting_field: Optional field name that caused the conflict
        """
        details = {}
        if conflicting_field is not None:
            details["conflicting_field"] = conflicting_field
            
        super().__init__(message, details)


class InstanceOperationError(InstanceError):
    """
    Exception raised when an instance operation fails due to system issues.
    Used for database errors, network issues, or other operational problems.
    """
    
    def __init__(self, message: str = "Instance operation failed", operation: str = None, cause: str = None):
        """
        Initialize instance operation error.
        
        Args:
            message: Error message
            operation: Optional operation that failed (create, update, delete, etc.)
            cause: Optional underlying cause of the failure
        """
        details = {}
        if operation is not None:
            details["operation"] = operation
        if cause is not None:
            details["cause"] = cause
            
        super().__init__(message, details)


class HistoryError(Exception):
    """
    Base exception for history operations.
    All history-related exceptions inherit from this class.
    """
    
    def __init__(self, message: str, details: dict = None):
        """
        Initialize history error.
        
        Args:
            message: Error message
            details: Optional additional error details
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}
        logger.error(f"HistoryError: {message}, Details: {details}")

    def to_dict(self) -> dict:
        """
        Convert exception to dictionary for API responses.
        
        Returns:
            dict: Exception data
        """
        return {
            "error": {
                "type": self.__class__.__name__,
                "message": self.message,
                "details": self.details
            }
        }


class HistoryNotFoundError(HistoryError):
    """
    Exception raised when a history record is not found.
    Used for GET operations on non-existent history records.
    """
    
    def __init__(self, message: str = "History record not found", history_id: int = None, instance_id: int = None):
        """
        Initialize history not found error.
        
        Args:
            message: Error message
            history_id: Optional history ID that was not found
            instance_id: Optional instance ID for which history was not found
        """
        details = {}
        if history_id is not None:
            details["history_id"] = history_id
        if instance_id is not None:
            details["instance_id"] = instance_id
            
        super().__init__(message, details)


class HistoryOperationError(HistoryError):
    """
    Exception raised when a history operation fails due to system issues.
    Used for database errors or other operational problems with history records.
    """
    
    def __init__(self, message: str = "History operation failed", operation: str = None, cause: str = None):
        """
        Initialize history operation error.
        
        Args:
            message: Error message
            operation: Optional operation that failed (save, retrieve, etc.)
            cause: Optional underlying cause of the failure
        """
        details = {}
        if operation is not None:
            details["operation"] = operation
        if cause is not None:
            details["cause"] = cause
            
        super().__init__(message, details)


# Exception mapping for common SQLAlchemy errors
def map_sqlalchemy_error(error: Exception, operation: str = None) -> InstanceError:
    """
    Map SQLAlchemy errors to appropriate instance exceptions.
    
    Args:
        error: SQLAlchemy exception
        operation: Optional operation context
        
    Returns:
        InstanceError: Mapped exception
    """
    error_str = str(error).lower()
    
    if "unique constraint" in error_str or "duplicate key" in error_str:
        # Extract field name if possible
        field = None
        if "name" in error_str:
            field = "name"
        return InstanceConflictError(
            "Instance with this value already exists",
            conflicting_field=field
        )
    elif "not null constraint" in error_str or "null value" in error_str:
        # Extract field name if possible
        field = None
        for required_field in ["name", "model_name", "cluster_name", "image_tag"]:
            if required_field in error_str:
                field = required_field
                break
        return InstanceValidationError(
            f"Required field '{field}' cannot be null" if field else "Required field cannot be null",
            field=field
        )
    elif "foreign key constraint" in error_str:
        return InstanceValidationError("Invalid reference to related entity")
    else:
        return InstanceOperationError(
            "Database operation failed",
            operation=operation,
            cause=str(error)
        )


# Logging configuration for exceptions
def configure_exception_logging():
    """Configure logging for exception handling."""
    logging.getLogger(__name__).setLevel(logging.ERROR)