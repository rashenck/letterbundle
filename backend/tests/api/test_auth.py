"""Tests for auth API endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models import User


async def test_register_success(client: TestClient, mock_email_service: AsyncMock):
    """Test successful user registration."""
    with patch("app.api.auth.get_email_service", return_value=mock_email_service):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "password123",
                "first_name": "New",
                "last_name": "User",
            },
        )
        mock_email_service.generate_verification_token.assert_called_once()

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"


@pytest.mark.asyncio
async def test_register_duplicate_email(
    client: TestClient,
    test_user: User,
    mock_email_service: AsyncMock,
):
    """Test registration with duplicate email fails."""
    with patch("app.api.auth.get_email_service", return_value=mock_email_service):
        response = client.post(
            "/api/auth/register",
            json={
                "email": test_user.email,
                "username": "anotheruser",
                "password": "password123",
                "first_name": "Another",
                "last_name": "User",
            },
        )

    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_username(
    client: TestClient, test_user: User, mock_email_service: AsyncMock
):
    """Test registration with duplicate username fails."""
    with patch("app.api.auth.get_email_service", return_value=mock_email_service):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "another@example.com",
                "username": test_user.username,
                "password": "password123",
                "first_name": "Another",
                "last_name": "User",
            },
        )

    assert response.status_code == 400
    assert "Username already taken" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_username(
    client: TestClient, mock_email_service: AsyncMock
):
    """Test registration with reserved username fails."""
    with patch("app.api.auth.get_email_service", return_value=mock_email_service):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "valid@example.com",
                "username": "admin",
                "password": "password123",
                "first_name": "New",
                "last_name": "User",
            },
        )

    assert response.status_code == 400
    assert "reserved" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client: TestClient, test_user: User):
    """Test successful login."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_user.email,
            "password": "password123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: TestClient, test_user: User):
    """Test login with wrong password fails."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_user.email,
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_unverified_email(client: TestClient, db_session: AsyncSession):
    """Test login with unverified email fails."""
    unverified_user = User(
        email="unverified@example.com",
        username="unverified",
        password_hash=get_password_hash("password123"),
        first_name="Unverified",
        last_name="User",
        email_verified=False,
    )
    db_session.add(unverified_user)
    await db_session.flush()

    response = client.post(
        "/api/auth/login",
        json={
            "email": unverified_user.email,
            "password": "password123",
        },
    )

    assert response.status_code == 401
    assert "verify your email" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: TestClient):
    """Test login with non-existent user fails."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_me_authenticated(authenticated_client: TestClient, test_user: User):
    """Test getting current user info when authenticated."""
    response = authenticated_client.get("/api/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["username"] == test_user.username


def test_get_me_unauthenticated(client: TestClient):
    """Test getting current user info when not authenticated."""
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_logout(client: TestClient):
    """Test logout endpoint."""
    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    assert "Successfully logged out" in response.json()["message"]


@pytest.mark.asyncio
async def test_verify_email_valid_token(
    client: TestClient, db_session: AsyncSession, mock_email_service: AsyncMock
):
    """Test email verification with valid token."""
    test_user = User(
        email="verifytest@example.com",
        username="verifytest",
        password_hash=get_password_hash("password123"),
        first_name="Verify",
        last_name="Test",
        email_verified=False,
        verification_token="valid_token",
    )
    db_session.add(test_user)
    await db_session.commit()

    response = client.get("/api/auth/verify-email?token=valid_token")

    assert response.status_code == 200
    assert "Email verified successfully" in response.json()["message"]


@pytest.mark.asyncio
async def test_verify_email_invalid_token(client: TestClient):
    """Test email verification with invalid token."""
    response = client.get("/api/auth/verify-email?token=invalid_token")

    assert response.status_code == 400
    assert "Invalid or expired" in response.json()["detail"]


@pytest.mark.asyncio
async def test_resend_verification_existing_unverified(
    client: TestClient, db_session: AsyncSession, mock_email_service: AsyncMock
):
    """Test resending verification for unverified user."""
    test_user = User(
        email="resend@example.com",
        username="resendtest",
        password_hash=get_password_hash("password123"),
        first_name="Resend",
        last_name="Test",
        email_verified=False,
        verification_token="old_token",
    )
    db_session.add(test_user)
    await db_session.commit()

    with patch("app.api.auth.get_email_service", return_value=mock_email_service):
        response = client.post(
            "/api/auth/resend-verification",
            json={
                "email": test_user.email,
                "password": "password123",
            },
        )

    assert response.status_code == 200
    assert "Verification email sent" in response.json()["message"]


@pytest.mark.asyncio
async def test_resend_verification_already_verified(
    client: TestClient, test_user: User, mock_email_service: AsyncMock
):
    """Test resending verification for already verified user."""
    with patch("app.api.auth.get_email_service", return_value=mock_email_service):
        response = client.post(
            "/api/auth/resend-verification",
            json={
                "email": test_user.email,
                "password": "password123",
            },
        )

    assert response.status_code == 200
    assert "already verified" in response.json()["message"]


@pytest.mark.asyncio
async def test_resend_verification_nonexistent(client: TestClient):
    """Test resending verification for non-existent user."""
    response = client.post(
        "/api/auth/resend-verification",
        json={
            "email": "nonexistent@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 200
    assert "If the email exists" in response.json()["message"]
