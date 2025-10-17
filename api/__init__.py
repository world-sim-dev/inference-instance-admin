"""
API package for inference instance management.
Contains routers for instances and history endpoints.
"""

from .instances import router as instances_router
from .history import router as history_router

__all__ = ["instances_router", "history_router"]