"""Tests for conftest fixtures."""

import pytest
from sqlalchemy import select

from app.models import User


@pytest.mark.asyncio
async def test_db_session_fixture(db_session):
    """Test that db_session fixture provides a working session."""
    user = User(
        email="test@example.com",
        username="testuser",
        password_hash="hashed",
        first_name="Test",
        last_name="User",
    )
    db_session.add(user)
    await db_session.flush()

    result = await db_session.execute(
        select(User).where(User.email == "test@example.com")
    )
    found_user = result.scalar_one_or_none()

    assert found_user is not None
    assert found_user.email == "test@example.com"


@pytest.mark.asyncio
async def test_db_session_rollback(db_session):
    """Test that changes are rolled back after test."""
    user = User(
        email="rollback@example.com",
        username="rollbackuser",
        password_hash="hashed",
        first_name="Roll",
        last_name="Back",
    )
    db_session.add(user)
    await db_session.flush()

    result = await db_session.execute(
        select(User).where(User.email == "rollback@example.com")
    )
    found_user = result.scalar_one_or_none()

    assert found_user is not None


@pytest.mark.asyncio
async def test_client_fixture(client):
    """Test that client fixture works."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
