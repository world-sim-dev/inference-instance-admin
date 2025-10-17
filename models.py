"""
Data models for inference instance management.
Based on the provided implementation with JSON fields and InstanceManager.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Tuple
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

Base = declarative_base()


class Status(str, Enum):
    """Instance status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    ERROR = "error"


class Priority(str, Enum):
    """Instance priority enumeration"""
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"
    VERY_LOW = "very_low"


class OperationType(str, Enum):
    """History operation type enumeration"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    ROLLBACK = "rollback"


class InferenceInstance(Base):
    """
    InferenceInstance model based on the provided implementation.
    """
    __tablename__ = "inference_instances"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Core identification
    name = Column(String(255), nullable=False, unique=True)
    model_name = Column(String(255), nullable=False)
    model_version = Column(String(50), default="latest")
    
    # Pipeline configuration
    pipeline_mode = Column(String(20), default="default")
    quant_mode = Column(Boolean, default=False)
    distill_mode = Column(Boolean, default=False)
    m405_mode = Column(Boolean, default=False)
    fps = Column(Integer, nullable=True)  # Changed to Integer for FPS value
    checkpoint_path = Column(String(255), nullable=True)
    
    # Infrastructure
    cluster_name = Column(String(255), nullable=False)
    image_tag = Column(String(255), nullable=False)
    nonce = Column(String(255), nullable=True)
    
    # Resource allocation
    pp = Column(Integer, default=1)  # Pipeline parallelism
    cp = Column(Integer, default=8)  # Context parallelism
    tp = Column(Integer, default=1)  # Tensor parallelism
    n_workers = Column(Integer, default=1)
    replicas = Column(Integer, default=1)
    
    # Priority and environment
    priorities = Column(JSON, default=lambda: [
        Priority.HIGH.value,
        Priority.NORMAL.value,
        Priority.LOW.value,
        Priority.VERY_LOW.value,
    ])
    envs = Column(JSON, default=list)
    desc = Column(String(1024), default="")
    
    # Video processing options
    separate_video_encode = Column(Boolean, default=True)
    separate_video_decode = Column(Boolean, default=True)
    separate_t5_encode = Column(Boolean, default=True)
    
    # Ephemeral instance configuration
    ephemeral = Column(Boolean, default=False, nullable=True)
    ephemeral_min_period_seconds = Column(Integer, nullable=True, default=60 * 5)
    ephemeral_to = Column(String(255), nullable=True, default="")
    ephemeral_from = Column(String(255), nullable=True, default="")
    
    # Storage configuration
    vae_store_type = Column(String(50), default="redis")
    t5_store_type = Column(String(50), default="redis")
    
    # Performance options
    enable_cuda_graph = Column(Boolean, default=False)
    task_concurrency = Column(Integer, default=1)
    celery_task_concurrency = Column(Integer, nullable=True)
    
    # Status and timestamps
    status = Column(String(50), default=Status.ACTIVE.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<InferenceInstance(name={self.name}, model_name={self.model_name}, cluster_name={self.cluster_name})>"

    def to_dict(self):
        """Convert instance to dictionary for serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'model_name': self.model_name,
            'model_version': self.model_version,
            'pipeline_mode': self.pipeline_mode,
            'quant_mode': self.quant_mode,
            'distill_mode': self.distill_mode,
            'm405_mode': self.m405_mode,
            'fps': self.fps,
            'checkpoint_path': self.checkpoint_path,
            'cluster_name': self.cluster_name,
            'image_tag': self.image_tag,
            'nonce': self.nonce,
            'pp': self.pp,
            'cp': self.cp,
            'tp': self.tp,
            'n_workers': self.n_workers,
            'replicas': self.replicas,
            'priorities': self.priorities,
            'envs': self.envs,
            'desc': self.desc,
            'description': self.desc,  # Add description field for frontend compatibility
            'separate_video_encode': self.separate_video_encode,
            'separate_video_decode': self.separate_video_decode,
            'separate_t5_encode': self.separate_t5_encode,
            'ephemeral': self.ephemeral,
            'ephemeral_min_period_seconds': self.ephemeral_min_period_seconds,
            'ephemeral_to': self.ephemeral_to,
            'ephemeral_from': self.ephemeral_from,
            'vae_store_type': self.vae_store_type,
            't5_store_type': self.t5_store_type,
            'enable_cuda_graph': self.enable_cuda_graph,
            'task_concurrency': self.task_concurrency,
            'celery_task_concurrency': self.celery_task_concurrency,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @property
    def priority(self):
        """
        Compatibility property to extract priority from priorities JSON field.
        Returns the first priority as the current one for backward compatibility.
        """
        if self.priorities and isinstance(self.priorities, list) and len(self.priorities) > 0:
            return self.priorities[0]
        return Priority.NORMAL.value
    
    @property
    def description(self):
        """
        Compatibility property to map 'desc' field to 'description'.
        """
        return self.desc or ""


class InstanceManager:
    """
    Manager class for InferenceInstance operations.
    Based on the provided implementation.
    """
    
    def get(
        self,
        session: Session = None,
        model_name: Optional[str] = None,
        cluster_name: Optional[str] = None,
        active_only=False,
        inactive_only=False,
        ephemeral_only=False,
    ) -> Tuple[int, List[InferenceInstance]]:
        """
        Get instances with filtering options.
        
        Returns:
            Tuple of (total_count, instances_list)
        """
        query = session.query(InferenceInstance)
        
        # Apply filters
        if model_name:
            query = query.filter(InferenceInstance.model_name == model_name)
        if cluster_name:
            query = query.filter(InferenceInstance.cluster_name == cluster_name)
        if active_only:
            query = query.filter(InferenceInstance.status == Status.ACTIVE.value)
        if inactive_only:
            query = query.filter(InferenceInstance.status == Status.INACTIVE.value)
        if ephemeral_only:
            query = query.filter(InferenceInstance.ephemeral == True)
        
        # Get total count
        total_count = query.count()
        
        # Get results
        instances = query.all()
        
        return total_count, instances
    
    def create_instance(self, session: Session, instance: InferenceInstance):
        """Create a new instance."""
        session.add(instance)
    
    def update_instance(self, session: Session, instance: InferenceInstance):
        """Update an existing instance."""
        session.merge(instance)
    
    def get_one_by_name(self, session: Session, name: str) -> Optional[InferenceInstance]:
        """Get a single instance by name."""
        return (
            session.query(InferenceInstance)
            .filter(InferenceInstance.name == name)
            .first()
        )
    
    def delete_instance(self, session: Session, name: str):
        """Delete an instance by name."""
        session.query(InferenceInstance).filter(InferenceInstance.name == name).delete()


class InferenceInstanceHistory(Base):
    """
    History model for tracking changes to InferenceInstance.
    Maintains complete audit trail with immutable records matching the main table structure.
    """
    __tablename__ = "inference_instances_history"

    # History metadata
    history_id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer, nullable=False, index=True)
    operation_type = Column(String(20), nullable=False)
    operation_timestamp = Column(DateTime, default=func.now(), nullable=False)
    
    # Snapshot of InferenceInstance fields at time of operation
    name = Column(String(255), nullable=False)
    model_name = Column(String(255), nullable=False)
    model_version = Column(String(50))
    pipeline_mode = Column(String(20))
    quant_mode = Column(Boolean)
    distill_mode = Column(Boolean)
    m405_mode = Column(Boolean)
    fps = Column(Integer, nullable=True)
    checkpoint_path = Column(String(255))
    cluster_name = Column(String(255), nullable=False)
    image_tag = Column(String(255))
    nonce = Column(String(255))
    
    # Resource allocation
    pp = Column(Integer)
    cp = Column(Integer)
    tp = Column(Integer)
    n_workers = Column(Integer)
    replicas = Column(Integer)
    
    # Priority and environment
    priorities = Column(JSON)
    envs = Column(JSON)
    desc = Column(String(1024))
    
    # Video processing options
    separate_video_encode = Column(Boolean)
    separate_video_decode = Column(Boolean)
    separate_t5_encode = Column(Boolean)
    
    # Ephemeral instance configuration
    ephemeral = Column(Boolean)
    ephemeral_min_period_seconds = Column(Integer)
    ephemeral_to = Column(String(255))
    ephemeral_from = Column(String(255))
    
    # Storage configuration
    vae_store_type = Column(String(50))
    t5_store_type = Column(String(50))
    
    # Performance options
    enable_cuda_graph = Column(Boolean)
    task_concurrency = Column(Integer)
    celery_task_concurrency = Column(Integer)
    
    # Status and timestamps (from original instance)
    status = Column(String(50))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    def __repr__(self):
        return (f"<InferenceInstanceHistory(history_id={self.history_id}, "
                f"original_id={self.original_id}, operation='{self.operation_type}')>")

    def to_dict(self):
        """Convert history record to dictionary for serialization"""
        return {
            'history_id': self.history_id,
            'original_id': self.original_id,
            'operation_type': self.operation_type,
            'operation_timestamp': self.operation_timestamp.isoformat() if self.operation_timestamp else None,
            'name': self.name,
            'model_name': self.model_name,
            'model_version': self.model_version,
            'pipeline_mode': self.pipeline_mode,
            'quant_mode': self.quant_mode,
            'distill_mode': self.distill_mode,
            'm405_mode': self.m405_mode,
            'fps': self.fps,
            'checkpoint_path': self.checkpoint_path,
            'cluster_name': self.cluster_name,
            'image_tag': self.image_tag,
            'nonce': self.nonce,
            'pp': self.pp,
            'cp': self.cp,
            'tp': self.tp,
            'n_workers': self.n_workers,
            'replicas': self.replicas,
            'priorities': self.priorities,
            'envs': self.envs,
            'desc': self.desc,
            'separate_video_encode': self.separate_video_encode,
            'separate_video_decode': self.separate_video_decode,
            'separate_t5_encode': self.separate_t5_encode,
            'ephemeral': self.ephemeral,
            'ephemeral_min_period_seconds': self.ephemeral_min_period_seconds,
            'ephemeral_to': self.ephemeral_to,
            'ephemeral_from': self.ephemeral_from,
            'vae_store_type': self.vae_store_type,
            't5_store_type': self.t5_store_type,
            'enable_cuda_graph': self.enable_cuda_graph,
            'task_concurrency': self.task_concurrency,
            'celery_task_concurrency': self.celery_task_concurrency,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @property
    def priority(self):
        """
        Compatibility property to extract priority from priorities JSON field.
        """
        if self.priorities and isinstance(self.priorities, list) and len(self.priorities) > 0:
            return self.priorities[0]
        return Priority.NORMAL.value
    
    @property
    def description(self):
        """
        Compatibility property to map 'desc' field to 'description'.
        """
        return self.desc or ""

    @classmethod
    def from_instance(cls, instance: 'InferenceInstance', operation_type: OperationType):
        """
        Create a history record from an InferenceInstance.
        
        Args:
            instance: The InferenceInstance to create history from
            operation_type: The type of operation being performed
            
        Returns:
            InferenceInstanceHistory: New history record
        """
        return cls(
            original_id=instance.id,
            operation_type=operation_type.value,
            name=instance.name,
            model_name=instance.model_name,
            model_version=instance.model_version,
            pipeline_mode=instance.pipeline_mode,
            quant_mode=instance.quant_mode,
            distill_mode=instance.distill_mode,
            m405_mode=instance.m405_mode,
            fps=instance.fps,
            checkpoint_path=instance.checkpoint_path,
            cluster_name=instance.cluster_name,
            image_tag=instance.image_tag,
            nonce=instance.nonce,
            pp=instance.pp,
            cp=instance.cp,
            tp=instance.tp,
            n_workers=instance.n_workers,
            replicas=instance.replicas,
            priorities=instance.priorities,
            envs=instance.envs,
            desc=instance.desc,
            separate_video_encode=instance.separate_video_encode,
            separate_video_decode=instance.separate_video_decode,
            separate_t5_encode=instance.separate_t5_encode,
            ephemeral=instance.ephemeral,
            ephemeral_min_period_seconds=instance.ephemeral_min_period_seconds,
            ephemeral_to=instance.ephemeral_to,
            ephemeral_from=instance.ephemeral_from,
            vae_store_type=instance.vae_store_type,
            t5_store_type=instance.t5_store_type,
            enable_cuda_graph=instance.enable_cuda_graph,
            task_concurrency=instance.task_concurrency,
            celery_task_concurrency=instance.celery_task_concurrency,
            status=instance.status,
            created_at=instance.created_at,
            updated_at=instance.updated_at
        )




# Database table creation helper
def create_tables(engine):
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def drop_tables(engine):
    """Drop all database tables (for testing)"""
    Base.metadata.drop_all(bind=engine)