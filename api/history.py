"""
History API endpoints.
Provides access to InferenceInstanceHistory records for audit trail.
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    InferenceInstanceHistoryResponse,
    HistoryQueryRequest,
    HistoryListResponse,
    ErrorResponse
)
from services.history_service import HistoryService
from services.exceptions import HistoryNotFoundError
from auth import authenticate

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/instances/{instance_id}/history", response_model=HistoryListResponse)
async def get_instance_history(
    instance_id: int,
    limit: int = Query(50, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    operation_type: Optional[str] = Query(None, description="Filter by operation type"),
    start_date: Optional[datetime] = Query(None, description="Filter records after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter records before this date"),
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Get history records for a specific instance.
    
    Returns paginated history records for the specified instance ID,
    with optional filtering by operation type and date range.
    """
    try:
        # Validate date range
        if start_date and end_date and end_date <= start_date:
            raise HTTPException(
                status_code=400,
                detail="end_date must be after start_date"
            )
        
        # Build filters
        filters = {}
        if operation_type:
            filters['operation_type'] = operation_type
        if start_date:
            filters['date_from'] = start_date
        if end_date:
            filters['date_to'] = end_date
        
        # Get history records
        history_records = HistoryService.get_history(
            db, 
            instance_id, 
            filters=filters,
            limit=limit,
            offset=offset
        )
        
        # Get total count for pagination
        total_count = HistoryService.count_history(
            db, 
            instance_id, 
            filters=filters
        )
        
        # Calculate if there are more records
        has_more = (offset + len(history_records)) < total_count
        
        return HistoryListResponse(
            total_count=total_count,
            history_records=history_records,
            limit=limit,
            offset=offset,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get instance history: {str(e)}"
        )


@router.get("/history/{history_id}", response_model=InferenceInstanceHistoryResponse)
async def get_history_record(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Get a specific history record by ID.
    
    Returns the detailed history record for the specified history ID.
    """
    try:
        history_record = HistoryService.get_history_by_id(db, history_id)
        if not history_record:
            raise HTTPException(
                status_code=404,
                detail=f"History record with id {history_id} not found"
            )
        return history_record
        
    except HTTPException:
        raise
    except HistoryNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"History record with id {history_id} not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get history record: {str(e)}"
        )


@router.get("/history", response_model=HistoryListResponse)
async def list_all_history(
    limit: int = Query(50, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    operation_type: Optional[str] = Query(None, description="Filter by operation type"),
    start_date: Optional[datetime] = Query(None, description="Filter records after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter records before this date"),
    original_id: Optional[int] = Query(None, description="Filter by original instance ID"),
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Get all history records with optional filtering.
    
    Returns paginated history records across all instances,
    with optional filtering by operation type, date range, and instance ID.
    """
    try:
        # Validate date range
        if start_date and end_date and end_date <= start_date:
            raise HTTPException(
                status_code=400,
                detail="end_date must be after start_date"
            )
        
        # Build filters
        filters = {}
        if operation_type:
            filters['operation_type'] = operation_type
        if start_date:
            filters['date_from'] = start_date
        if end_date:
            filters['date_to'] = end_date
        if original_id:
            filters['original_id'] = original_id
        
        # Get history records
        history_records = HistoryService.get_all_history(
            db, 
            filters=filters,
            limit=limit,
            offset=offset
        )
        
        # Get total count for pagination
        total_count = HistoryService.count_history(
            db, 
            filters=filters
        )
        
        # Calculate if there are more records
        has_more = (offset + len(history_records)) < total_count
        
        return HistoryListResponse(
            total_count=total_count,
            history_records=history_records,
            limit=limit,
            offset=offset,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get history records: {str(e)}"
        )


@router.get("/instances/{instance_id}/history/latest", response_model=InferenceInstanceHistoryResponse)
async def get_latest_history(
    instance_id: int,
    operation_type: Optional[str] = Query(None, description="Filter by operation type"),
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Get the most recent history record for an instance.
    
    Returns the latest history record for the specified instance,
    optionally filtered by operation type.
    """
    try:
        filters = {}
        if operation_type:
            filters['operation_type'] = operation_type
        
        history_records = HistoryService.get_history(
            db, 
            instance_id, 
            filters=filters,
            limit=1,
            offset=0
        )
        
        if not history_records:
            raise HTTPException(
                status_code=404,
                detail=f"No history records found for instance {instance_id}"
            )
        
        return history_records[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get latest history: {str(e)}"
        )


@router.get("/instances/{instance_id}/history/count")
async def get_instance_history_count(
    instance_id: int,
    operation_type: Optional[str] = Query(None, description="Filter by operation type"),
    start_date: Optional[datetime] = Query(None, description="Filter records after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter records before this date"),
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Get the count of history records for an instance.
    
    Returns the total number of history records for the specified instance,
    with optional filtering.
    """
    try:
        # Validate date range
        if start_date and end_date and end_date <= start_date:
            raise HTTPException(
                status_code=400,
                detail="end_date must be after start_date"
            )
        
        # Build filters
        filters = {}
        if operation_type:
            filters['operation_type'] = operation_type
        if start_date:
            filters['date_from'] = start_date
        if end_date:
            filters['date_to'] = end_date
        
        count = HistoryService.count_history(
            db, 
            instance_id, 
            filters=filters
        )
        
        return {"instance_id": instance_id, "count": count}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get history count: {str(e)}"
        )