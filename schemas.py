"""
Pydantic schemas for API requests and responses.
Supports the complete InferenceInstance model structure.
"""

from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, validator
from models import Status, Priority, OperationType


class InferenceInstanceBase(BaseModel):
    """Base schema for InferenceInstance with all fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Unique instance name")
    model_name: str = Field(..., min_length=1, max_length=255, description="Model name to use")
    model_version: str = Field(default="latest", max_length=50, description="Model version")
    cluster_name: str = Field(..., min_length=1, max_length=255, description="Target cluster name")
    image_tag: str = Field(..., min_length=1, max_length=255, description="Docker image tag")
    
    # Pipeline configuration
    pipeline_mode: str = Field(default="default", max_length=20, description="Pipeline mode")
    quant_mode: bool = Field(default=False, description="Quantization mode enabled")
    distill_mode: bool = Field(default=False, description="Distillation mode enabled")
    m405_mode: bool = Field(default=False, description="M405 mode enabled")
    fps: Optional[int] = Field(default=None, description="FPS value")  # Changed to int
    checkpoint_path: Optional[str] = Field(default=None, max_length=255, description="Checkpoint path")
    nonce: Optional[str] = Field(default=None, max_length=255, description="Nonce value")
    
    # Resource allocation
    pp: int = Field(default=1, ge=1, le=16, description="Pipeline parallelism")
    cp: int = Field(default=8, ge=1, le=64, description="Context parallelism")
    tp: int = Field(default=1, ge=1, le=16, description="Tensor parallelism")
    n_workers: int = Field(default=1, ge=1, le=100, description="Number of workers")
    replicas: int = Field(default=1, ge=1, description="Number of replicas")
    
    # Priority and environment
    priorities: List[str] = Field(default_factory=lambda: [Priority.HIGH.value, Priority.NORMAL.value, Priority.LOW.value, Priority.VERY_LOW.value], description="Priority list")
    envs: dict = Field(default_factory=dict, description="Environment variables")
    description: str = Field(default="", max_length=1024, description="Instance description")
    
    # Video processing options
    separate_video_encode: bool = Field(default=True, description="Separate video encoding")
    separate_video_decode: bool = Field(default=True, description="Separate video decoding")
    separate_t5_encode: bool = Field(default=True, description="Separate T5 encoding")
    
    # Ephemeral instance configuration
    ephemeral: bool = Field(default=False, description="Ephemeral instance")
    ephemeral_min_period_seconds: Optional[int] = Field(default=300, ge=0, description="Minimum ephemeral period in seconds")
    ephemeral_to: str = Field(default="", max_length=255, description="Ephemeral to")
    ephemeral_from: str = Field(default="", max_length=255, description="Ephemeral from")
    
    # Storage configuration
    vae_store_type: str = Field(default="redis", max_length=50, description="VAE store type")
    t5_store_type: str = Field(default="redis", max_length=50, description="T5 store type")
    
    # Performance options
    enable_cuda_graph: bool = Field(default=False, description="Enable CUDA graph")
    task_concurrency: int = Field(default=1, ge=1, description="Task concurrency")
    celery_task_concurrency: Optional[int] = Field(default=None, ge=1, description="Celery task concurrency")
    
    # Status
    status: str = Field(default=Status.ACTIVE.value, description="Instance status")

    @validator('status')
    def validate_status(cls, v):
        if v not in [status.value for status in Status]:
            raise ValueError(f'Status must be one of: {[s.value for s in Status]}')
        return v

    @validator('priorities')
    def validate_priorities(cls, v):
        if not isinstance(v, list) or len(v) == 0:
            raise ValueError('Priorities must be a non-empty list')
        valid_priorities = [priority.value for priority in Priority]
        for priority in v:
            if priority not in valid_priorities:
                raise ValueError(f'Each priority must be one of: {valid_priorities}')
        return v

    @validator('pp', 'cp', 'tp', 'n_workers', 'replicas')
    def validate_positive_integers(cls, v):
        if v < 1:
            raise ValueError(f'Value must be at least 1')
        return v


class InferenceInstanceCreate(InferenceInstanceBase):
    """Schema for creating new instances"""
    pass


class InferenceInstanceUpdate(BaseModel):
    """Schema for updating existing instances - all fields optional"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    model_name: Optional[str] = Field(None, min_length=1, max_length=255)
    model_version: Optional[str] = Field(None, max_length=50)
    cluster_name: Optional[str] = Field(None, min_length=1, max_length=255)
    image_tag: Optional[str] = Field(None, min_length=1, max_length=255)
    
    # Pipeline configuration
    pipeline_mode: Optional[str] = Field(None, max_length=20)
    quant_mode: Optional[bool] = None
    distill_mode: Optional[bool] = None
    m405_mode: Optional[bool] = None
    fps: Optional[int] = None
    checkpoint_path: Optional[str] = Field(None, max_length=255)
    nonce: Optional[str] = Field(None, max_length=255)
    
    # Resource allocation
    pp: Optional[int] = Field(None, ge=1, le=16)
    cp: Optional[int] = Field(None, ge=1, le=64)
    tp: Optional[int] = Field(None, ge=1, le=16)
    n_workers: Optional[int] = Field(None, ge=1, le=100)
    replicas: Optional[int] = Field(None, ge=1)
    
    # Priority and environment
    priorities: Optional[List[str]] = None
    envs: Optional[dict] = None
    description: Optional[str] = Field(None, max_length=1024)
    
    # Video processing options
    separate_video_encode: Optional[bool] = None
    separate_video_decode: Optional[bool] = None
    separate_t5_encode: Optional[bool] = None
    
    # Ephemeral instance configuration
    ephemeral: Optional[bool] = None
    ephemeral_min_period_seconds: Optional[int] = Field(None, ge=0)
    ephemeral_to: Optional[str] = Field(None, max_length=255)
    ephemeral_from: Optional[str] = Field(None, max_length=255)
    
    # Storage configuration
    vae_store_type: Optional[str] = Field(None, max_length=50)
    t5_store_type: Optional[str] = Field(None, max_length=50)
    
    # Performance options
    enable_cuda_graph: Optional[bool] = None
    task_concurrency: Optional[int] = Field(None, ge=1)
    celery_task_concurrency: Optional[int] = Field(None, ge=1)
    
    # Status
    status: Optional[str] = None
    
    # Compatibility fields
    priority: Optional[str] = None  # For backward compatibility

    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in [status.value for status in Status]:
            raise ValueError(f'Status must be one of: {[s.value for s in Status]}')
        return v

    @validator('priorities')
    def validate_priorities(cls, v):
        if v is not None:
            if not isinstance(v, list) or len(v) == 0:
                raise ValueError('Priorities must be a non-empty list')
            valid_priorities = [priority.value for priority in Priority]
            for priority in v:
                if priority not in valid_priorities:
                    raise ValueError(f'Each priority must be one of: {valid_priorities}')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        if v is not None and v not in [priority.value for priority in Priority]:
            raise ValueError(f'Priority must be one of: {[p.value for p in Priority]}')
        return v


class InferenceInstanceResponse(BaseModel):
    """Schema for instance responses with database fields"""
    id: int
    name: str
    model_name: str
    model_version: Optional[str] = "latest"
    cluster_name: str
    image_tag: str
    
    # Pipeline configuration - all optional for backward compatibility
    pipeline_mode: Optional[str] = "default"
    quant_mode: Optional[bool] = False
    distill_mode: Optional[bool] = False
    m405_mode: Optional[bool] = False
    fps: Optional[int] = None
    checkpoint_path: Optional[str] = None
    nonce: Optional[str] = None
    
    # Resource allocation
    pp: Optional[int] = 1
    cp: Optional[int] = 8
    tp: Optional[int] = 1
    n_workers: Optional[int] = 1
    replicas: Optional[int] = 1
    
    # Priority and environment
    priorities: Optional[List[str]] = None
    envs: Optional[dict] = None
    description: Optional[str] = ""
    
    # Video processing options
    separate_video_encode: Optional[bool] = True
    separate_video_decode: Optional[bool] = True
    separate_t5_encode: Optional[bool] = True
    
    # Ephemeral instance configuration
    ephemeral: Optional[bool] = False
    ephemeral_min_period_seconds: Optional[int] = 300
    ephemeral_to: Optional[str] = ""
    ephemeral_from: Optional[str] = ""
    
    # Storage configuration
    vae_store_type: Optional[str] = "redis"
    t5_store_type: Optional[str] = "redis"
    
    # Performance options
    enable_cuda_graph: Optional[bool] = False
    task_concurrency: Optional[int] = 1
    celery_task_concurrency: Optional[int] = None
    
    # Status and timestamps
    status: Optional[str] = Status.ACTIVE.value
    created_at: datetime
    updated_at: datetime
    
    # Computed properties for backward compatibility
    priority: Optional[str] = None  # Will be computed from priorities[0]

    class Config:
        from_attributes = True

    @validator('priorities', pre=True)
    def handle_priorities_field(cls, v):
        """Handle different formats of priorities field from database"""
        if v is None:
            return [Priority.HIGH.value, Priority.NORMAL.value, Priority.LOW.value, Priority.VERY_LOW.value]
        elif isinstance(v, str):
            # Old format: single priority string
            return [v, Priority.NORMAL.value, Priority.LOW.value, Priority.VERY_LOW.value]
        elif isinstance(v, dict):
            # Old format: dict with current and options
            if 'current' in v:
                return [v['current'], Priority.NORMAL.value, Priority.LOW.value, Priority.VERY_LOW.value]
            elif 'options' in v:
                return v['options']
            else:
                return [Priority.HIGH.value, Priority.NORMAL.value, Priority.LOW.value, Priority.VERY_LOW.value]
        elif isinstance(v, list):
            # New format: already a list
            return v
        else:
            return [Priority.HIGH.value, Priority.NORMAL.value, Priority.LOW.value, Priority.VERY_LOW.value]

    @validator('envs', pre=True)
    def handle_envs_field(cls, v):
        """Handle envs field from database - keep as dict format"""
        if v is None:
            return {}
        elif isinstance(v, dict):
            return v
        elif isinstance(v, list):
            # Convert list format back to dict if needed
            result = {}
            for item in v:
                if isinstance(item, dict):
                    result.update(item)
            return result
        else:
            return {}

    @validator('priority', pre=False, always=True)
    def compute_priority(cls, v, values):
        """Compute priority from priorities array for backward compatibility"""
        if 'priorities' in values and values['priorities'] and len(values['priorities']) > 0:
            return values['priorities'][0]
        return Priority.NORMAL.value
    
    @validator('description', pre=True, always=True)
    def handle_desc_field(cls, v, values):
        """Handle mapping from desc field to description"""
        # If this is coming from the ORM model, it should have a desc attribute
        if hasattr(v, '__dict__') and hasattr(v, 'desc'):
            return v.desc or ''
        # If we have values dict and desc is in it
        if isinstance(values, dict) and 'desc' in values:
            return values.get('desc', '')
        # Return the value as-is or empty string
        return v or ''


class InferenceInstanceHistoryResponse(BaseModel):
    """Schema for history record responses"""
    history_id: int
    original_id: int
    operation_type: str
    operation_timestamp: datetime
    
    # Snapshot of instance fields at time of operation
    name: str
    model_name: str
    model_version: Optional[str] = None
    cluster_name: str
    image_tag: str
    
    # Pipeline configuration
    pipeline_mode: Optional[str] = None
    quant_mode: Optional[bool] = None
    distill_mode: Optional[bool] = None
    m405_mode: Optional[bool] = None
    fps: Optional[int] = None
    checkpoint_path: Optional[str] = None
    nonce: Optional[str] = None
    
    # Resource allocation
    pp: Optional[int] = None
    cp: Optional[int] = None
    tp: Optional[int] = None
    n_workers: Optional[int] = None
    replicas: Optional[int] = None
    
    # Priority and environment
    priorities: Optional[List[str]] = None
    envs: Optional[dict] = None
    description: Optional[str] = None
    
    # Video processing options
    separate_video_encode: Optional[bool] = None
    separate_video_decode: Optional[bool] = None
    separate_t5_encode: Optional[bool] = None
    
    # Ephemeral instance configuration
    ephemeral: Optional[bool] = None
    ephemeral_min_period_seconds: Optional[int] = None
    ephemeral_to: Optional[str] = None
    ephemeral_from: Optional[str] = None
    
    # Storage configuration
    vae_store_type: Optional[str] = None
    t5_store_type: Optional[str] = None
    
    # Performance options
    enable_cuda_graph: Optional[bool] = None
    task_concurrency: Optional[int] = None
    celery_task_concurrency: Optional[int] = None
    
    # Status and timestamps
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Computed properties for backward compatibility
    priority: Optional[str] = None

    class Config:
        from_attributes = True

    @validator('operation_type')
    def validate_operation_type(cls, v):
        if v not in [op.value for op in OperationType]:
            raise ValueError(f'Operation type must be one of: {[op.value for op in OperationType]}')
        return v

    @validator('envs', pre=True)
    def handle_envs_field(cls, v):
        """Handle envs field from database - keep as dict format"""
        if v is None:
            return {}
        elif isinstance(v, dict):
            return v
        elif isinstance(v, list):
            # Convert list format back to dict if needed
            result = {}
            for item in v:
                if isinstance(item, dict):
                    result.update(item)
            return result
        else:
            return {}

    @validator('priority', pre=False, always=True)
    def compute_priority(cls, v, values):
        """Compute priority from priorities array for backward compatibility"""
        if 'priorities' in values and values['priorities'] and len(values['priorities']) > 0:
            return values['priorities'][0]
        return Priority.NORMAL.value


class HistoryQueryRequest(BaseModel):
    """Schema for history query parameters"""
    limit: Optional[int] = Field(default=50, ge=1, le=1000, description="Number of records to return")
    offset: Optional[int] = Field(default=0, ge=0, description="Number of records to skip")
    operation_type: Optional[str] = Field(None, description="Filter by operation type")
    start_date: Optional[datetime] = Field(None, description="Filter records after this date")
    end_date: Optional[datetime] = Field(None, description="Filter records before this date")

    @validator('operation_type')
    def validate_operation_type(cls, v):
        if v is not None and v not in [op.value for op in OperationType]:
            raise ValueError(f'Operation type must be one of: {[op.value for op in OperationType]}')
        return v

    @validator('end_date')
    def validate_date_range(cls, v, values):
        if v is not None and 'start_date' in values and values['start_date'] is not None:
            if v <= values['start_date']:
                raise ValueError('end_date must be after start_date')
        return v


class HistoryListResponse(BaseModel):
    """Schema for paginated history responses"""
    total_count: int = Field(..., ge=0, description="Total number of history records")
    history_records: List[InferenceInstanceHistoryResponse] = Field(..., description="List of history records")
    limit: int = Field(..., ge=1, description="Number of records requested")
    offset: int = Field(..., ge=0, description="Number of records skipped")
    has_more: bool = Field(..., description="Whether more records are available")


class InferenceInstanceCopyRequest(BaseModel):
    """Schema for copying an instance"""
    source_instance_id: int = Field(..., description="ID of the instance to copy")
    new_name: Optional[str] = Field(None, description="New name for the copied instance (auto-generated if not provided)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "source_instance_id": 1,
                "new_name": "my-instance-copy"
            }
        }


class ErrorResponse(BaseModel):
    """Schema for API error responses"""
    error: str = Field(..., description="Error type or code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "InstanceNotFoundError",
                "message": "Instance with id 123 not found",
                "details": {"instance_id": 123}
            }
        }