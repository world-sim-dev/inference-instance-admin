"""
History service for managing InferenceInstanceHistory operations.
Provides audit trail functionality with immutable history records.
"""

import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import desc

from models import InferenceInstance, InferenceInstanceHistory, OperationType
from services.exceptions import (
    HistoryError, HistoryNotFoundError, HistoryOperationError
)

# Configure logging
logger = logging.getLogger(__name__)


class HistoryService:
    """
    Service class for managing InferenceInstanceHistory entities.
    Provides audit trail functionality with immutable history records.
    """

    @staticmethod
    def save_history(
        session: Session, 
        instance: InferenceInstance, 
        operation_type: OperationType
    ) -> InferenceInstanceHistory:
        """
        Save a history record for an instance operation.
        Creates an immutable snapshot of the instance state.
        
        Args:
            session: Database session
            instance: The InferenceInstance to create history for
            operation_type: The type of operation being performed
            
        Returns:
            InferenceInstanceHistory: Created history record
            
        Raises:
            HistoryOperationError: If history creation fails
        """
        try:
            # Create history record from instance
            history_record = InferenceInstanceHistory.from_instance(instance, operation_type)
            
            # Add to session and commit
            session.add(history_record)
            session.commit()
            session.refresh(history_record)
            
            logger.info(
                f"Created history record: {history_record.history_id} for instance "
                f"{instance.name} (ID: {instance.id}) - Operation: {operation_type.value}"
            )
            
            return history_record
            
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating history record for instance {instance.id}: {str(e)}")
            raise HistoryOperationError(
                "Failed to create history record",
                operation="save_history",
                cause=str(e)
            )

    @staticmethod
    def get_history(
        session: Session,
        instance_id: int,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[InferenceInstanceHistory]:
        """
        Get history records for a specific instance.
        Returns records in chronological order (newest first).
        
        Args:
            session: Database session
            instance_id: ID of the instance to get history for
            filters: Optional filters to apply
            limit: Optional limit for pagination
            offset: Optional offset for pagination
            
        Returns:
            List[InferenceInstanceHistory]: List of history records
            
        Raises:
            HistoryOperationError: If retrieval fails
        """
        try:
            query = session.query(InferenceInstanceHistory).filter(
                InferenceInstanceHistory.original_id == instance_id
            )
            
            # Apply additional filters if provided
            if filters:
                query = HistoryService._apply_filters(query, filters)
            
            # Order by operation timestamp (newest first), then by history_id for deterministic ordering
            query = query.order_by(
                desc(InferenceInstanceHistory.operation_timestamp),
                desc(InferenceInstanceHistory.history_id)
            )
            
            # Apply pagination
            if offset is not None:
                query = query.offset(offset)
            if limit is not None:
                query = query.limit(limit)
            
            history_records = query.all()
            
            logger.debug(
                f"Retrieved {len(history_records)} history records for instance {instance_id} "
                f"with filters: {filters}"
            )
            
            return history_records
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving history for instance {instance_id}: {str(e)}")
            raise HistoryOperationError(
                "Failed to retrieve instance history",
                operation="get_history",
                cause=str(e)
            )

    @staticmethod
    def get_history_by_id(session: Session, history_id: int) -> Optional[InferenceInstanceHistory]:
        """
        Get a specific history record by its ID.
        
        Args:
            session: Database session
            history_id: ID of the history record to retrieve
            
        Returns:
            Optional[InferenceInstanceHistory]: History record if found, None otherwise
            
        Raises:
            HistoryOperationError: If retrieval fails
        """
        try:
            history_record = session.query(InferenceInstanceHistory).filter(
                InferenceInstanceHistory.history_id == history_id
            ).first()
            
            if history_record:
                logger.debug(f"Retrieved history record by ID: {history_id}")
            else:
                logger.debug(f"History record not found by ID: {history_id}")
                
            return history_record
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving history record {history_id}: {str(e)}")
            raise HistoryOperationError(
                "Failed to retrieve history record",
                operation="get_history_by_id",
                cause=str(e)
            )

    @staticmethod
    def get_all_history(
        session: Session,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[InferenceInstanceHistory]:
        """
        Get all history records across all instances.
        Returns records in chronological order (newest first).
        
        Args:
            session: Database session
            filters: Optional filters to apply
            limit: Optional limit for pagination
            offset: Optional offset for pagination
            
        Returns:
            List[InferenceInstanceHistory]: List of history records
            
        Raises:
            HistoryOperationError: If retrieval fails
        """
        try:
            query = session.query(InferenceInstanceHistory)
            
            # Apply filters if provided
            if filters:
                query = HistoryService._apply_filters(query, filters)
            
            # Order by operation timestamp (newest first), then by history_id for deterministic ordering
            query = query.order_by(
                desc(InferenceInstanceHistory.operation_timestamp),
                desc(InferenceInstanceHistory.history_id)
            )
            
            # Apply pagination
            if offset is not None:
                query = query.offset(offset)
            if limit is not None:
                query = query.limit(limit)
            
            history_records = query.all()
            
            logger.debug(
                f"Retrieved {len(history_records)} total history records with filters: {filters}"
            )
            
            return history_records
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving all history records: {str(e)}")
            raise HistoryOperationError(
                "Failed to retrieve history records",
                operation="get_all_history",
                cause=str(e)
            )

    @staticmethod
    def count_history(
        session: Session,
        instance_id: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Count history records for a specific instance or all instances.
        
        Args:
            session: Database session
            instance_id: Optional instance ID to count history for
            filters: Optional filters to apply
            
        Returns:
            int: Count of history records
            
        Raises:
            HistoryOperationError: If count fails
        """
        try:
            query = session.query(InferenceInstanceHistory)
            
            # Filter by instance if specified
            if instance_id is not None:
                query = query.filter(InferenceInstanceHistory.original_id == instance_id)
            
            # Apply additional filters if provided
            if filters:
                query = HistoryService._apply_filters(query, filters)
            
            count = query.count()
            
            logger.debug(
                f"Counted {count} history records for instance {instance_id} "
                f"with filters: {filters}"
            )
            
            return count
            
        except SQLAlchemyError as e:
            logger.error(f"Database error counting history records: {str(e)}")
            raise HistoryOperationError(
                "Failed to count history records",
                operation="count_history",
                cause=str(e)
            )

    @staticmethod
    def get_latest_history(
        session: Session,
        instance_id: int,
        operation_type: Optional[OperationType] = None
    ) -> Optional[InferenceInstanceHistory]:
        """
        Get the most recent history record for an instance.
        
        Args:
            session: Database session
            instance_id: ID of the instance
            operation_type: Optional operation type to filter by
            
        Returns:
            Optional[InferenceInstanceHistory]: Latest history record if found
            
        Raises:
            HistoryOperationError: If retrieval fails
        """
        try:
            query = session.query(InferenceInstanceHistory).filter(
                InferenceInstanceHistory.original_id == instance_id
            )
            
            # Filter by operation type if specified
            if operation_type is not None:
                query = query.filter(InferenceInstanceHistory.operation_type == operation_type.value)
            
            # Get the most recent record
            history_record = query.order_by(
                desc(InferenceInstanceHistory.operation_timestamp),
                desc(InferenceInstanceHistory.history_id)
            ).first()
            
            if history_record:
                logger.debug(
                    f"Retrieved latest history record for instance {instance_id}: "
                    f"{history_record.history_id}"
                )
            else:
                logger.debug(f"No history records found for instance {instance_id}")
                
            return history_record
            
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving latest history for instance {instance_id}: {str(e)}")
            raise HistoryOperationError(
                "Failed to retrieve latest history record",
                operation="get_latest_history",
                cause=str(e)
            )

    @staticmethod
    def _apply_filters(query, filters: Dict[str, Any]):
        """
        Apply filters to a history query.
        
        Args:
            query: SQLAlchemy query object
            filters: Dictionary of filters to apply
            
        Returns:
            Modified query object
        """
        for field, value in filters.items():
            if value is None:
                continue
                
            if field == 'operation_type' and isinstance(value, (str, list)):
                # Operation type filtering (single or multiple)
                if isinstance(value, list):
                    query = query.filter(InferenceInstanceHistory.operation_type.in_(value))
                else:
                    query = query.filter(InferenceInstanceHistory.operation_type == value)
            elif field == 'name' and isinstance(value, str):
                # Partial name matching
                query = query.filter(InferenceInstanceHistory.name.ilike(f"%{value}%"))
            elif field == 'model_name' and isinstance(value, str):
                # Partial model name matching
                query = query.filter(InferenceInstanceHistory.model_name.ilike(f"%{value}%"))
            elif field == 'status' and isinstance(value, (str, list)):
                # Status filtering (single or multiple)
                if isinstance(value, list):
                    query = query.filter(InferenceInstanceHistory.status.in_(value))
                else:
                    query = query.filter(InferenceInstanceHistory.status == value)
            elif field == 'cluster_name' and isinstance(value, str):
                # Exact cluster name matching
                query = query.filter(InferenceInstanceHistory.cluster_name == value)
            elif field == 'original_id' and isinstance(value, int):
                # Filter by original instance ID
                query = query.filter(InferenceInstanceHistory.original_id == value)
            elif field == 'date_from' and value:
                # Filter records from a specific date
                query = query.filter(InferenceInstanceHistory.operation_timestamp >= value)
            elif field == 'date_to' and value:
                # Filter records up to a specific date
                query = query.filter(InferenceInstanceHistory.operation_timestamp <= value)
            elif hasattr(InferenceInstanceHistory, field):
                # Direct field matching for other fields
                query = query.filter(getattr(InferenceInstanceHistory, field) == value)
        
        return query

    @staticmethod
    def validate_history_integrity(session: Session, instance_id: int) -> bool:
        """
        Validate the integrity of history records for an instance.
        Ensures chronological ordering and data consistency.
        
        Args:
            session: Database session
            instance_id: ID of the instance to validate
            
        Returns:
            bool: True if history integrity is valid
            
        Raises:
            HistoryOperationError: If validation fails
        """
        try:
            # Get all history records for the instance in chronological order
            history_records = HistoryService.get_history(session, instance_id)
            
            if not history_records:
                logger.debug(f"No history records found for instance {instance_id}")
                return True
            
            # Check chronological ordering
            for i in range(1, len(history_records)):
                current_timestamp = history_records[i-1].operation_timestamp
                previous_timestamp = history_records[i].operation_timestamp
                
                if current_timestamp < previous_timestamp:
                    logger.error(
                        f"History chronological order violation for instance {instance_id}: "
                        f"Record {history_records[i-1].history_id} timestamp {current_timestamp} "
                        f"is before record {history_records[i].history_id} timestamp {previous_timestamp}"
                    )
                    return False
            
            # Validate that history records are unique by history_id (timestamps can be the same)
            history_ids = [record.history_id for record in history_records]
            if len(history_ids) != len(set(history_ids)):
                logger.error(f"Duplicate history IDs found in history for instance {instance_id}")
                return False
            
            logger.debug(f"History integrity validated for instance {instance_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error validating history integrity for instance {instance_id}: {str(e)}")
            raise HistoryOperationError(
                "Failed to validate history integrity",
                operation="validate_history_integrity",
                cause=str(e)
            )