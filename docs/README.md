# Documentation Index

This directory contains comprehensive documentation for the Inference Instances Management System.

## Documentation Files

### Core Documentation
- **[README.md](../README.md)** - Main project documentation with setup, usage, and configuration
- **[API_DOCUMENTATION.md](../API_DOCUMENTATION.md)** - Complete API reference with examples
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Detailed migration guide from previous system

### Architecture Documentation
- **[ARCHITECTURE_DECISIONS.md](../ARCHITECTURE_DECISIONS.md)** - Architectural decisions and rationale

## Quick Links

### Getting Started
1. [Installation and Setup](../README.md#quick-start)
2. [Configuration](../README.md#configuration)
3. [First Steps](../README.md#usage)

### API Reference
1. [Instance Management](../API_DOCUMENTATION.md#instance-management-endpoints)
2. [History Tracking](../API_DOCUMENTATION.md#history-endpoints)
3. [Error Handling](../API_DOCUMENTATION.md#error-handling)

### Migration
1. [Pre-Migration Checklist](../MIGRATION_GUIDE.md#pre-migration-checklist)
2. [Migration Steps](../MIGRATION_GUIDE.md#migration-steps)
3. [Post-Migration Tasks](../MIGRATION_GUIDE.md#post-migration-tasks)

## Code Documentation

### Key Components

#### Models (`models.py`)
- `InferenceInstance`: Main entity model with core fields
- `InferenceInstanceHistory`: Audit trail model for tracking changes
- Enums: `Status`, `Priority`, `OperationType`

#### Services (`services/`)
- `InstanceService`: Core CRUD operations for instances
- `HistoryService`: History tracking and audit trail management
- `exceptions.py`: Custom exception classes

#### API (`api/`)
- `instances.py`: Instance management endpoints
- `history.py`: History access endpoints

#### Core Files
- `main.py`: FastAPI application setup and configuration
- `database.py`: Database connection and session management
- `schemas.py`: Pydantic models for API requests/responses

### Documentation Standards

All code follows these documentation standards:

1. **Module Docstrings**: Every module has a comprehensive docstring explaining its purpose
2. **Class Docstrings**: All classes have docstrings describing their role and usage
3. **Method Docstrings**: All public methods include:
   - Purpose description
   - Parameter descriptions with types
   - Return value description
   - Exception information
   - Usage examples where helpful

4. **Inline Comments**: Complex logic includes explanatory comments
5. **Type Hints**: All functions use proper type hints for parameters and return values

## Examples

### Basic Usage Examples

#### Creating an Instance
```python
from services.instance_service import InstanceService
from database import get_db_session

session = get_db_session()
try:
    instance = InstanceService.create(session, {
        "name": "my-model",
        "model_name": "llama-7b",
        "cluster_name": "gpu-cluster",
        "image_tag": "llama:latest"
    })
    print(f"Created instance: {instance.id}")
finally:
    session.close()
```

#### API Usage
```bash
# Create instance via API
curl -X POST "http://localhost:8000/api/instances" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-example",
    "model_name": "gpt-3.5",
    "cluster_name": "production",
    "image_tag": "openai:latest"
  }'
```

### Advanced Examples

#### Batch Operations
```python
# Create multiple instances
instances_data = [
    {"name": "model-1", "model_name": "llama-7b", ...},
    {"name": "model-2", "model_name": "gpt-3.5", ...},
]

session = get_db_session()
try:
    for data in instances_data:
        instance = InstanceService.create(session, data)
        print(f"Created: {instance.name}")
finally:
    session.close()
```

#### History Tracking
```python
# Get instance history
from services.history_service import HistoryService

session = get_db_session()
try:
    history = HistoryService.get_history(session, instance_id=1)
    for record in history:
        print(f"{record.operation_type} at {record.operation_timestamp}")
finally:
    session.close()
```

## Testing Documentation

### Running Tests
```bash
# Run all tests
python run_tests.py

# Run specific test categories
pytest tests/test_instance_service.py -v
pytest tests/test_api_instances.py -v
pytest tests/test_integration.py -v

# Run browser tests
python run_integration_tests.py
```

### Test Structure
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **API Tests**: Test HTTP endpoints and responses
- **Browser Tests**: Test web interface functionality

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database file
ls -la inference_instances.db

# Test connection
python -c "from database import get_db_session; print('DB OK')"
```

#### API Issues
```bash
# Test health endpoint
curl http://localhost:8000/health

# Check logs
tail -f app.log
```

#### Web Interface
- Clear browser cache
- Check browser console for errors
- Verify static files are loading

### Getting Help

1. Check the main [README.md](../README.md) troubleshooting section
2. Review [API Documentation](../API_DOCUMENTATION.md) for endpoint details
3. Check application logs for error details
4. Verify configuration in `.env` file
5. Test with minimal data to isolate issues

## Contributing

### Documentation Guidelines

When contributing to documentation:

1. **Keep it current**: Update docs when changing functionality
2. **Be comprehensive**: Include examples and edge cases
3. **Use clear language**: Write for developers of all experience levels
4. **Follow structure**: Maintain consistent formatting and organization
5. **Test examples**: Ensure all code examples work correctly

### Code Documentation Guidelines

When adding code documentation:

1. **Document public APIs**: All public methods need comprehensive docstrings
2. **Explain complex logic**: Add comments for non-obvious code
3. **Include examples**: Show how to use functions and classes
4. **Document exceptions**: List all exceptions that can be raised
5. **Keep it updated**: Update docs when changing implementation

## Version History

### v2.0.0 (Current)
- Simplified architecture with 500-line file limit
- Removed authentication system
- Streamlined to core CRUD operations
- Enhanced history tracking
- Comprehensive documentation

### v1.x (Legacy)
- Complex field system
- Authentication with JWT
- Advanced filtering and validation
- Copy functionality
- Performance monitoring

## License

This documentation is part of the Inference Instances Management System and is subject to the same license terms as the main project.