"""Test fixtures for PrivacyGuard AI backend.
Creates a fresh in‑memory SQLite database for each test function,
ensuring isolation and avoiding UNIQUE constraint violations.
"""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import the Base metadata from the application
from app.db.session import Base

@pytest.fixture(scope="function")
def db_session():
    """Provide a SQLAlchemy session bound to a temporary in‑memory DB.
    The database schema is created before each test and dropped afterwards.
    """
    # Use an in‑memory SQLite database; echo disabled for speed.
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
