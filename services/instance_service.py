"""
Instance service for managing InferenceInstance CRUD operations.
Provides core business logic for instance management with proper error handling.
"""

import logging
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import and_, or_

from models import InferenceInstance, Status, Priority, OperationType
from services.exceptions import (
    InstanceError, InstanceNotFoundError, InstanceValidationError, 
    InstanceConflictError, InstanceOperationError, map_sqlalchemy_error
)

# Configure logging
logger = logging.getLogger(__name__)


class InstanceService:
    """
    Service class for managing InferenceInstance entities.
    Provides CRUD operations with validation and error handling.
    """

    @staticmethod
    def create(session: Session, instance_data: Dict[str, Any]) -> InferenceInstance:
        """
        Create a new InferenceInstance.
        
        Args:
            session: Database session
            instance_data: Dictionary containing instance data
            
        Returns:
            InferenceInstance: Created instance
            
        Raises:
            InstanceValidationError: If validation fails
            InstanceError: If creation fails
        """
        try:
            # Validate required fields
            InstanceService._validate_create_data(instance_data)
            
            # Create new instance using the new model structure
            instance = InferenceInstance(
                name=instance_data['name'],
                model_name=instance_data['model_name'],
                cluster_name=instance_data['cluster_name'],
                image_tag=instance_data.get('image_tag', 'latest'),
                model_version=instance_data.get('model_version', 'latest'),
                pipeline_mode=instance_data.get('pipeline_mode', 'default'),
                quant_mode=instance_data.get('quant_mode', False),
                distill_mode=instance_data.get('distill_mode', False),
                m405_mode=instance_data.get('m405_mode', False),
                fps=instance_data.get('fps'),
                checkpoint_path=instance_data.get('checkpoint_path'),
                nonce=instance_data.get('nonce'),
                pp=instance_data.get('pp', 1),
                cp=instance_data.get('cp', 8),
                tp=instance_data.get('tp', 1),
                n_workers=instance_data.get('n_workers', 1),
                replicas=instance_data.get('replicas', 1),
                # priorities will use default from model
                envs=instance_data.get('envs', []),
                desc=instance_data.get('description', ''),
                separate_video_encode=instance_data.get('separate_video_encode', True),
                separate_video_decode=instance_data.get('separate_video_decode', True),
                separate_t5_encode=instance_data.get('separate_t5_encode', True),
                ephemeral=instance_data.get('ephemeral', False),
                ephemeral_min_period_seconds=instance_data.get('ephemeral_min_period_seconds', 300),
                ephemeral_to=instance_data.get('ephemeral_to', ''),
                ephemeral_from=instance_data.get('ephemeral_from', ''),
                vae_store_type=instance_data.get('vae_store_type', 'redis'),
                t5_store_type=instance_data.get('t5_store_type', 'redis'),
                enable_cuda_graph=instance_data.get('enable_cuda_graph', False),
                task_concurrency=instance_data.get('task_concurrency', 1),
                celery_task_concurrency=instance_data.get('celery_task_concurrency'),
                status=instance_data.get('status', Status.ACTIVE.value)
            )
            
            session.add(instance)
            session.commit()
            session.refresh(instance)
            
            # Create history record after creation (import here to avoid circular imports)
            from services.history_service import HistoryService
            HistoryService.save_history(session, instance, OperationType.CREATE)
            
            logger.info(f"Created instance: {instance.name} (ID: {instance.id})")
            return instance
            
        except IntegrityError as e:
            session.rollback()
            logger.error(f"Integrity error creating instance: {str(e)}")
            raise map_sqlalchemy_error(e, "create")
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating instance: {str(e)}")
            if not isinstance(e, InstanceError):
                raise InstanceOperationError("Failed to create instance", operation="create", cause=str(e))
            raise

    @staticmethod
    def get_by_id(session: Session, instance_id: int) -> Optional[InferenceInstance]:
        """
        Get an InferenceInstance by ID.
        
        Args:
            session: Database session
            instance_id: Instance ID
            
        Returns:
            Optional[InferenceInstance]: Instance if found, None otherwise
        """
        try:
            instance = session.query(InferenceInstance).filter(
                InferenceInstance.id == instance_id
            ).first()
            
            if instance:
                logger.debug(f"Retrieved instance by ID: {instance_id}")
            else:
                logger.debug(f"Instance not found by ID: {instance_id}")
                
            return instance
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving instance by ID {instance_id}: {str(e)}")
            raise InstanceOperationError("Failed to retrieve instance", operation="get_by_id", cause=str(e))

    @staticmethod
    def get_by_name(session: Session, name: str) -> Optional[InferenceInstance]:
        """
        Get an InferenceInstance by name.
        
        Args:
            session: Database session
            name: Instance name
            
        Returns:
            Optional[InferenceInstance]: Instance if found, None otherwise
        """
        try:
            instance = session.query(InferenceInstance).filter(
                InferenceInstance.name == name
            ).first()
            
            if instance:
                logger.debug(f"Retrieved instance by name: {name}")
            else:
                logger.debug(f"Instance not found by name: {name}")
                
            return instance
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving instance by name {name}: {str(e)}")
            raise InstanceOperationError("Failed to retrieve instance", operation="get_by_name", cause=str(e))

    @staticmethod
    def list_instances(
        session: Session, 
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[InferenceInstance]:
        """
        List InferenceInstances with optional filtering and pagination.
        
        Args:
            session: Database session
            filters: Optional filters to apply
            limit: Optional limit for pagination
            offset: Optional offset for pagination
            
        Returns:
            List[InferenceInstance]: List of instances
        """
        try:
            query = session.query(InferenceInstance)
            
            # Apply filters if provided
            if filters:
                query = InstanceService._apply_filters(query, filters)
            
            # Apply ordering (default by created_at desc)
            query = query.order_by(InferenceInstance.created_at.desc())
            
            # Apply pagination
            if offset is not None:
                query = query.offset(offset)
            if limit is not None:
                query = query.limit(limit)
            
            instances = query.all()
            logger.debug(f"Retrieved {len(instances)} instances with filters: {filters}")
            
            return instances
            
        except SQLAlchemyError as e:
            logger.error(f"Database error listing instances: {str(e)}")
            raise InstanceOperationError("Failed to list instances", operation="list_instances", cause=str(e))

    @staticmethod
    def update(session: Session, instance_id: int, update_data: Dict[str, Any]) -> InferenceInstance:
        """
        Update an existing InferenceInstance.
        Automatically creates a history record before updating.
        
        Args:
            session: Database session
            instance_id: Instance ID to update
            update_data: Dictionary containing update data
            
        Returns:
            InferenceInstance: Updated instance
            
        Raises:
            InstanceNotFoundError: If instance not found
            InstanceValidationError: If validation fails
            InstanceError: If update fails
        """
        try:
            # Get existing instance
            instance = InstanceService.get_by_id(session, instance_id)
            if not instance:
                raise InstanceNotFoundError(f"Instance with ID {instance_id} not found", instance_id=instance_id)
            
            # Validate update data
            InstanceService._validate_update_data(update_data)
            
            # Create history record before updating (import here to avoid circular imports)
            from services.history_service import HistoryService
            HistoryService.save_history(session, instance, OperationType.UPDATE)
            
            # Update fields with special handling for description field
            for field, value in update_data.items():
                if field in ['id', 'created_at']:
                    continue  # Skip protected fields
                elif field == 'description':
                    # Map description to desc column
                    instance.desc = value
                elif field == 'priority':
                    # For priority, we need to update the priorities array
                    # Keep the existing array structure but update the first element
                    if isinstance(instance.priorities, list) and len(instance.priorities) > 0:
                        instance.priorities[0] = value
                    else:
                        # Create new priorities array with the priority as first element
                        instance.priorities = [value, Priority.NORMAL.value, Priority.LOW.value, Priority.VERY_LOW.value]
                elif hasattr(instance, field):
                    setattr(instance, field, value)
            
            # Update timestamp (this is handled automatically by the model's onupdate)
            
            session.commit()
            session.refresh(instance)
            
            logger.info(f"Updated instance: {instance.name} (ID: {instance.id})")
            return instance
            
        except IntegrityError as e:
            session.rollback()
            logger.error(f"Integrity error updating instance {instance_id}: {str(e)}")
            raise map_sqlalchemy_error(e, "update")
        except Exception as e:
            session.rollback()
            logger.error(f"Error updating instance {instance_id}: {str(e)}")
            if not isinstance(e, InstanceError):
                raise InstanceOperationError("Failed to update instance", operation="update", cause=str(e))
            raise

    @staticmethod
    def delete(session: Session, instance_id: int) -> bool:
        """
        Delete an InferenceInstance.
        Automatically creates a history record before deletion.
        
        Args:
            session: Database session
            instance_id: Instance ID to delete
            
        Returns:
            bool: True if deleted, False if not found
            
        Raises:
            InstanceError: If deletion fails
        """
        try:
            # Get existing instance
            instance = InstanceService.get_by_id(session, instance_id)
            if not instance:
                logger.debug(f"Instance {instance_id} not found for deletion")
                return False
            
            # Create history record before deletion (import here to avoid circular imports)
            from services.history_service import HistoryService
            HistoryService.save_history(session, instance, OperationType.DELETE)
            
            instance_name = instance.name
            session.delete(instance)
            session.commit()
            
            logger.info(f"Deleted instance: {instance_name} (ID: {instance_id})")
            return True
            
        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting instance {instance_id}: {str(e)}")
            if not isinstance(e, InstanceError):
                raise InstanceOperationError("Failed to delete instance", operation="delete", cause=str(e))
            raise

    @staticmethod
    def count_instances(session: Session, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count InferenceInstances with optional filtering.
        
        Args:
            session: Database session
            filters: Optional filters to apply
            
        Returns:
            int: Count of instances
        """
        try:
            query = session.query(InferenceInstance)
            
            # Apply filters if provided
            if filters:
                query = InstanceService._apply_filters(query, filters)
            
            count = query.count()
            logger.debug(f"Counted {count} instances with filters: {filters}")
            
            return count
            
        except SQLAlchemyError as e:
            logger.error(f"Database error counting instances: {str(e)}")
            raise InstanceOperationError("Failed to count instances", operation="count_instances", cause=str(e))

    @staticmethod
    def _validate_create_data(data: Dict[str, Any]) -> None:
        """
        Validate data for instance creation.
        
        Args:
            data: Instance data to validate
            
        Raises:
            InstanceValidationError: If validation fails
        """
        required_fields = ['name', 'model_name', 'cluster_name', 'image_tag']
        
        # Check required fields
        for field in required_fields:
            if field not in data or not data[field]:
                raise InstanceValidationError(f"Required field '{field}' is missing or empty")
        
        # Validate field types and constraints
        InstanceService._validate_field_constraints(data)

    @staticmethod
    def _validate_update_data(data: Dict[str, Any]) -> None:
        """
        Validate data for instance update.
        
        Args:
            data: Update data to validate
            
        Raises:
            InstanceValidationError: If validation fails
        """
        # Don't allow updating certain fields
        protected_fields = ['id', 'created_at']
        for field in protected_fields:
            if field in data:
                raise InstanceValidationError(f"Field '{field}' cannot be updated")
        
        # Validate field constraints for provided fields
        InstanceService._validate_field_constraints(data)

    @staticmethod
    def _validate_field_constraints(data: Dict[str, Any]) -> None:
        """
        Validate field constraints.
        
        Args:
            data: Data to validate
            
        Raises:
            InstanceValidationError: If validation fails
        """
        # Validate string lengths
        string_fields = {
            'name': 255,
            'model_name': 255,
            'cluster_name': 255,
            'image_tag': 255,
            'model_version': 50,
            'status': 50,
            'priority': 20
        }
        
        for field, max_length in string_fields.items():
            if field in data and data[field] and len(str(data[field])) > max_length:
                raise InstanceValidationError(f"Field '{field}' exceeds maximum length of {max_length}")
        
        # Validate integer fields
        integer_fields = ['replicas', 'pp', 'cp', 'tp']
        for field in integer_fields:
            if field in data and data[field] is not None:
                try:
                    value = int(data[field])
                    if value < 1:
                        raise InstanceValidationError(f"Field '{field}' must be a positive integer")
                except (ValueError, TypeError):
                    raise InstanceValidationError(f"Field '{field}' must be an integer")
        
        # Validate enum values
        if 'status' in data and data['status']:
            valid_statuses = [status.value for status in Status]
            if data['status'] not in valid_statuses:
                raise InstanceValidationError(f"Invalid status. Must be one of: {valid_statuses}")
        
        if 'priority' in data and data['priority']:
            valid_priorities = [priority.value for priority in Priority]
            if data['priority'] not in valid_priorities:
                raise InstanceValidationError(f"Invalid priority. Must be one of: {valid_priorities}")

    @staticmethod
    def _apply_filters(query, filters: Dict[str, Any]):
        """
        Apply filters to a query.
        
        Args:
            query: SQLAlchemy query object
            filters: Dictionary of filters to apply
            
        Returns:
            Modified query object
        """
        for field, value in filters.items():
            if value is None:
                continue
                
            if field == 'name' and isinstance(value, str):
                # Partial name matching
                query = query.filter(InferenceInstance.name.ilike(f"%{value}%"))
            elif field == 'model_name' and isinstance(value, str):
                # Partial model name matching
                query = query.filter(InferenceInstance.model_name.ilike(f"%{value}%"))
            elif field == 'status' and isinstance(value, (str, list)):
                # Status filtering (single or multiple)
                if isinstance(value, list):
                    query = query.filter(InferenceInstance.status.in_(value))
                else:
                    query = query.filter(InferenceInstance.status == value)
            elif field == 'priority' and isinstance(value, (str, list)):
                # Priority filtering - need to filter on the JSON array's first element
                from sqlalchemy import func
                if isinstance(value, list):
                    # For multiple priorities, check if first element of priorities array is in the list
                    query = query.filter(func.json_extract(InferenceInstance.priorities, '$[0]').in_(value))
                else:
                    # For single priority, check if first element matches
                    query = query.filter(func.json_extract(InferenceInstance.priorities, '$[0]') == value)
            elif field == 'cluster_name' and isinstance(value, str):
                # Exact cluster name matching
                query = query.filter(InferenceInstance.cluster_name == value)
            elif hasattr(InferenceInstance, field):
                # Direct field matching for other fields
                query = query.filter(getattr(InferenceInstance, field) == value)
        
        return query

    @staticmethod
    def get_instance_history(
        session: Session,
        instance_id: int,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List:
        """
        Get history records for a specific instance.
        Convenience method that delegates to HistoryService.
        
        Args:
            session: Database session
            instance_id: ID of the instance to get history for
            filters: Optional filters to apply
            limit: Optional limit for pagination
            offset: Optional offset for pagination
            
        Returns:
            List[InferenceInstanceHistory]: List of history records
            
        Raises:
            InstanceNotFoundError: If instance not found
            HistoryOperationError: If retrieval fails
        """
        # Verify instance exists
        instance = InstanceService.get_by_id(session, instance_id)
        if not instance:
            raise InstanceNotFoundError(f"Instance with ID {instance_id} not found", instance_id=instance_id)
        
        # Import here to avoid circular imports
        from services.history_service import HistoryService
        return HistoryService.get_history(session, instance_id, filters, limit, offset)

    @staticmethod
    def copy_instance(session: Session, source_instance_id: int, new_name: Optional[str] = None) -> InferenceInstance:
        """
        Copy an existing InferenceInstance with a new name.
        
        Args:
            session: Database session
            source_instance_id: ID of the instance to copy
            new_name: Optional new name for the copied instance
            
        Returns:
            InferenceInstance: Newly created copy of the instance
            
        Raises:
            InstanceNotFoundError: If source instance not found
            InstanceConflictError: If generated name conflicts
            InstanceError: If copy operation fails
        """
        try:
            # Get the source instance
            source_instance = InstanceService.get_by_id(session, source_instance_id)
            if not source_instance:
                raise InstanceNotFoundError(f"Source instance with ID {source_instance_id} not found", instance_id=source_instance_id)
            
            # Generate new name if not provided
            if not new_name:
                new_name = InstanceService._generate_copy_name(session, source_instance.name)
            else:
                # Check if provided name already exists
                existing = InstanceService.get_by_name(session, new_name)
                if existing:
                    raise InstanceConflictError(f"Instance with name '{new_name}' already exists", conflicting_field="name")
            
            # Create copy data from source instance
            copy_data = {
                'name': new_name,
                'model_name': source_instance.model_name,
                'model_version': source_instance.model_version,
                'cluster_name': source_instance.cluster_name,
                'image_tag': source_instance.image_tag,
                'pipeline_mode': source_instance.pipeline_mode,
                'quant_mode': source_instance.quant_mode,
                'distill_mode': source_instance.distill_mode,
                'm405_mode': source_instance.m405_mode,
                'fps': source_instance.fps,
                'checkpoint_path': source_instance.checkpoint_path,
                'nonce': source_instance.nonce,
                'pp': source_instance.pp,
                'cp': source_instance.cp,
                'tp': source_instance.tp,
                'n_workers': source_instance.n_workers,
                'replicas': source_instance.replicas,
                'envs': source_instance.envs,
                'description': source_instance.desc,
                'separate_video_encode': source_instance.separate_video_encode,
                'separate_video_decode': source_instance.separate_video_decode,
                'separate_t5_encode': source_instance.separate_t5_encode,
                'ephemeral': source_instance.ephemeral,
                'ephemeral_min_period_seconds': source_instance.ephemeral_min_period_seconds,
                'ephemeral_to': source_instance.ephemeral_to,
                'ephemeral_from': source_instance.ephemeral_from,
                'vae_store_type': source_instance.vae_store_type,
                't5_store_type': source_instance.t5_store_type,
                'enable_cuda_graph': source_instance.enable_cuda_graph,
                'task_concurrency': source_instance.task_concurrency,
                'celery_task_concurrency': source_instance.celery_task_concurrency,
                'status': source_instance.status
            }
            
            # Create the new instance
            new_instance = InstanceService.create(session, copy_data)
            
            logger.info(f"Copied instance {source_instance.name} (ID: {source_instance_id}) to {new_name} (ID: {new_instance.id})")
            return new_instance
            
        except Exception as e:
            session.rollback()
            logger.error(f"Error copying instance {source_instance_id}: {str(e)}")
            if not isinstance(e, InstanceError):
                raise InstanceOperationError("Failed to copy instance", operation="copy", cause=str(e))
            raise

    @staticmethod
    def _generate_copy_name(session: Session, base_name: str) -> str:
        """
        Generate a unique name for a copied instance.
        
        Args:
            session: Database session
            base_name: Base name to generate copy name from
            
        Returns:
            str: Unique copy name
        """
        # Try simple "copy" suffix first
        copy_name = f"{base_name}copy"
        
        # Check if this name exists
        existing = InstanceService.get_by_name(session, copy_name)
        if not existing:
            return copy_name
        
        # If it exists, try numbered suffixes
        counter = 1
        while True:
            copy_name = f"{base_name}copy{counter}"
            existing = InstanceService.get_by_name(session, copy_name)
            if not existing:
                return copy_name
            counter += 1
            
            # Safety check to prevent infinite loop
            if counter > 1000:
                raise InstanceOperationError("Unable to generate unique copy name after 1000 attempts")

    @staticmethod
    def get_instance_with_latest_history(session: Session, instance_id: int):
        """
        Get an instance along with its most recent history record.
        
        Args:
            session: Database session
            instance_id: Instance ID
            
        Returns:
            tuple: (InferenceInstance, Optional[InferenceInstanceHistory])
            
        Raises:
            InstanceNotFoundError: If instance not found
        """
        # Get the instance
        instance = InstanceService.get_by_id(session, instance_id)
        if not instance:
            raise InstanceNotFoundError(f"Instance with ID {instance_id} not found", instance_id=instance_id)
        
        # Get the latest history record
        from services.history_service import HistoryService
        latest_history = HistoryService.get_latest_history(session, instance_id)
        
        return instance, latest_history