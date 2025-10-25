"""
Instance management API endpoints.
Provides CRUD operations for InferenceInstance entities.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBasicCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from schemas import (
    InferenceInstanceCreate,
    InferenceInstanceUpdate,
    InferenceInstanceResponse,
    InferenceInstanceCopyRequest,
    ErrorResponse
)
from services.instance_service import InstanceService
from auth import authenticate
from services.exceptions import (
    InstanceNotFoundError,
    InstanceValidationError,
    InstanceError,
    InstanceConflictError
)

router = APIRouter(prefix="/api/instances", tags=["instances"])


@router.get("/", response_model=List[InferenceInstanceResponse])
async def list_instances(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    name: Optional[str] = Query(None, description="Filter by instance name (partial match)"),
    model_name: Optional[str] = Query(None, description="Filter by model name"),
    cluster_name: Optional[str] = Query(None, description="Filter by cluster name"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    List instances with optional filtering and pagination.
    
    Returns a list of instances matching the specified filters.
    """
    try:
        filters = {}
        if name:
            filters['name'] = name
        if model_name:
            filters['model_name'] = model_name
        if cluster_name:
            filters['cluster_name'] = cluster_name
        if status:
            filters['status'] = status
        if priority:
            filters['priority'] = priority
            
        instances = InstanceService.list_instances(
            db, 
            filters=filters, 
            offset=skip, 
            limit=limit
        )
        return instances
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list instances: {str(e)}"
        )


@router.post("/", response_model=InferenceInstanceResponse, status_code=201)
async def create_instance(
    instance_data: InferenceInstanceCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Create a new inference instance.
    
    Creates a new instance with the provided data and returns the created instance.
    """
    try:
        instance = InstanceService.create(db, instance_data.model_dump())
        return instance
        
    except IntegrityError as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=409,
                detail=f"Instance with name '{instance_data.name}' already exists"
            )
        raise HTTPException(
            status_code=400,
            detail=f"Database constraint violation: {str(e)}"
        )
        
    except InstanceValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Validation error: {str(e)}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create instance: {str(e)}"
        )


@router.get("/{instance_id}", response_model=InferenceInstanceResponse)
async def get_instance(
    instance_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Get a specific instance by ID.
    
    Returns the instance details for the specified ID.
    """
    try:
        instance = InstanceService.get_by_id(db, instance_id)
        if not instance:
            raise HTTPException(
                status_code=404,
                detail=f"Instance with id {instance_id} not found"
            )
        
        # Convert to dict and ensure all fields are present
        instance_dict = instance.to_dict()
        
        # Ensure description field is mapped from desc
        if 'desc' in instance_dict:
            instance_dict['description'] = instance_dict['desc']
        
        # Ensure all expected fields are present with defaults
        defaults = {
            'model_version': 'latest',
            'pipeline_mode': 'default',
            'quant_mode': False,
            'distill_mode': False,
            'm405_mode': False,
            'fps': None,
            'checkpoint_path': None,
            'nonce': None,
            'pp': 1,
            'cp': 8,
            'tp': 1,
            'n_workers': 1,
            'replicas': 1,
            'priorities': ['high', 'normal', 'low', 'very_low'],
            'envs': [],
            'description': '',
            'separate_video_encode': True,
            'separate_video_decode': True,
            'separate_t5_encode': True,
            'ephemeral': False,
            'ephemeral_min_period_seconds': 300,
            'ephemeral_to': '',
            'ephemeral_from': '',
            'vae_store_type': 'redis',
            't5_store_type': 'redis',
            'enable_cuda_graph': False,
            'task_concurrency': 1,
            'celery_task_concurrency': None,
            'status': 'active'
        }
        
        # Apply defaults for missing fields
        for key, default_value in defaults.items():
            if key not in instance_dict or instance_dict[key] is None:
                instance_dict[key] = default_value
        
        return instance_dict
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get instance: {str(e)}"
        )


@router.put("/{instance_id}", response_model=InferenceInstanceResponse)
async def update_instance(
    instance_id: int,
    instance_data: InferenceInstanceUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Update an existing instance.
    
    Updates the instance with the provided data and returns the updated instance.
    Only provided fields will be updated.
    """
    try:
        # Filter out None values to only update provided fields
        update_data = {k: v for k, v in instance_data.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No valid fields provided for update"
            )
        
        instance = InstanceService.update(db, instance_id, update_data)
        return instance
        
    except InstanceNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Instance with id {instance_id} not found"
        )
        
    except IntegrityError as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=409,
                detail="Instance name already exists"
            )
        raise HTTPException(
            status_code=400,
            detail=f"Database constraint violation: {str(e)}"
        )
        
    except InstanceValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Validation error: {str(e)}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update instance: {str(e)}"
        )


@router.delete("/{instance_id}", status_code=204)
async def delete_instance(
    instance_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Delete an instance.
    
    Removes the instance from the system and creates a history record.
    """
    try:
        success = InstanceService.delete(db, instance_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Instance with id {instance_id} not found"
            )
        return None
        
    except InstanceNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Instance with id {instance_id} not found"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete instance: {str(e)}"
        )


@router.post("/copy", response_model=InferenceInstanceResponse, status_code=201)
async def copy_instance(
    copy_request: InferenceInstanceCopyRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Copy an existing instance with a new name.
    
    Creates a copy of the specified instance with all the same configuration
    but with a new name. If no name is provided, one will be auto-generated.
    """
    try:
        instance = InstanceService.copy_instance(
            db, 
            copy_request.source_instance_id, 
            copy_request.new_name
        )
        return instance
        
    except InstanceNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Source instance with id {copy_request.source_instance_id} not found"
        )
        
    except InstanceConflictError as e:
        raise HTTPException(
            status_code=409,
            detail=str(e)
        )
        
    except InstanceValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Validation error: {str(e)}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to copy instance: {str(e)}"
        )


@router.get("/name/{instance_name}", response_model=InferenceInstanceResponse)
async def get_instance_by_name(
    instance_name: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(authenticate)
):
    """
    Get a specific instance by name.
    
    Returns the instance details for the specified name.
    """
    try:
        instance = InstanceService.get_by_name(db, instance_name)
        if not instance:
            raise HTTPException(
                status_code=404,
                detail=f"Instance with name '{instance_name}' not found"
            )
        return instance
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get instance: {str(e)}"
        )