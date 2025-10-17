"""
Shared test configuration and fixtures.
"""

import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Base
from main import app
from database import get_db


@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine for the entire test session."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def test_session(test_engine):
    """Create a test database session for each test."""
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def integration_engine():
    """Create in-memory SQLite database for integration testing."""
    engine = create_engine(
        "sqlite:///:memory:", 
        echo=False,
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture
def integration_session(integration_engine):
    """Create test database session for integration tests."""
    Session = sessionmaker(bind=integration_engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def integration_client(integration_session):
    """Create test client with database dependency override for integration tests."""
    def override_get_db():
        try:
            yield integration_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        yield client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables."""
    os.environ["TESTING"] = "1"
    yield
    if "TESTING" in os.environ:
        del os.environ["TESTING"]