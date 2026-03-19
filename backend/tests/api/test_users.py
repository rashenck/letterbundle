"""Tests for users API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


@pytest.mark.asyncio
async def test_get_user_profile_success(
    authenticated_client: TestClient,
    test_user: User,
):
    """Test getting a public user profile."""
    response = authenticated_client.get(f"/api/users/{test_user.username}")

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user.username


@pytest.mark.asyncio
async def test_get_user_profile_not_found(authenticated_client: TestClient):
    """Test getting a non-existent user profile."""
    response = authenticated_client.get("/api/users/nonexistent")

    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_me_success(authenticated_client: TestClient, test_user: User):
    """Test updating current user profile."""
    response = authenticated_client.put(
        "/api/users/me",
        json={
            "first_name": "Updated",
            "last_name": "Name",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(test_user.id)
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Name"


@pytest.mark.asyncio
async def test_update_me_change_email(
    authenticated_client: TestClient,
):
    """Test updating email to a new email."""
    response = authenticated_client.put(
        "/api/users/me",
        json={
            "email": "newemail@example.com",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newemail@example.com"


@pytest.mark.asyncio
async def test_update_me_duplicate_email(
    authenticated_client: TestClient,
    db_session: AsyncSession,
):
    """Test updating email to one that's already taken."""
    other_user = User(
        email="other@example.com",
        username="otheruser",
        password_hash="hashed",
        first_name="Other",
        last_name="User",
        email_verified=True,
    )
    db_session.add(other_user)
    await db_session.flush()

    response = authenticated_client.put(
        "/api/users/me",
        json={
            "email": other_user.email,
        },
    )

    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]
