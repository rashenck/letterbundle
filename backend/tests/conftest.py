"""Pytest configuration and fixtures for testing."""

import os
import base64
import secrets
from collections.abc import AsyncGenerator
from typing import Any, Callable
from unittest.mock import AsyncMock, MagicMock

import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.user import User

TEST_DB_PATH = "/tmp/letterbundle_test.db"


@pytest_asyncio.fixture(scope="session")  # type: ignore[untyped-decorator]
async def db_engine() -> AsyncGenerator[AsyncEngine, None]:
    """Create a test database engine with SQLite."""
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

    engine = create_async_engine(
        f"sqlite+aiosqlite:///{TEST_DB_PATH}",
        connect_args={"check_same_thread": False},
        echo=False,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest_asyncio.fixture  # type: ignore[untyped-decorator]
async def db_session(db_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session with transaction rollback."""
    async with db_engine.connect() as conn:
        async with conn.begin() as transaction:
            async_session_maker = async_sessionmaker(
                bind=conn,
                class_=AsyncSession,
                expire_on_commit=False,
            )
            async with async_session_maker() as session:
                yield session
                await transaction.rollback()

@pytest_asyncio.fixture
def mock_email_service() -> MagicMock:
    """Create a mock email service."""
    mock = MagicMock()
    mock.generate_verification_token.return_value = "test_verification_token"
    mock.send_verification_email = AsyncMock()
    return mock


@pytest_asyncio.fixture
def mock_s3_storage() -> MagicMock:
    """Create a mock S3 storage service."""
    mock = MagicMock()
    mock.upload_file = MagicMock()
    mock.download_file.return_value = b"fake_image_bytes"
    mock.get_presigned_url.return_value = "https://example.com/presigned-url"
    mock.build_s3_key.return_value = "test/key/path.jpg"
    mock.ensure_bucket_exists.return_value = True
    return mock


@pytest_asyncio.fixture
def mock_ocr_service() -> MagicMock:
    """Create a mock OCR service."""
    mock = MagicMock()
    mock.is_available.return_value = True
    mock.process_page = AsyncMock(
        return_value={
            "text": "This is transcribed text from the OCR service.",
        }
    )
    return mock


@pytest_asyncio.fixture
async def user_factory() -> Callable[..., User]:
    """
    Factory Fixture to build a user in memory based on kwargs passed in or defaults.
    If passing in a password kwarg make sure it is not hashed already, this factory handles hashing.
    """
    def _factory(**kwargs: Any) -> User:
        return User(
            email=kwargs.get("email", "testuser@example.com"),
            username=kwargs.get("username", "testuser"),
            password_hash=get_password_hash(kwargs.get("password", "password123")),
            first_name=kwargs.get("first_name", "Test"),
            last_name=kwargs.get("last_name", "User"),
            verification_token=kwargs.get("verification_token", base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()),
            email_verified=kwargs.get("email_verified", True),
        )

    return _factory


@pytest_asyncio.fixture
async def persisted_user_factory(db_session: AsyncSession, user_factory: Callable[..., User]) -> Callable[..., User]:
    """
    Factory Fixture to build and persist a User object to the database.
    """
    async def _factory(**kwargs: Any) -> User:
        user = user_factory(**kwargs)
        db_session.add(user)
        await db_session.flush()
        await db_session.refresh(user)
        return user
    return _factory


@pytest_asyncio.fixture
async def test_user(persisted_user_factory: Callable[..., User]) -> User:
    """Create a verified test user."""
    return await persisted_user_factory()



@pytest_asyncio.fixture  # type: ignore[untyped-decorator]
async def client(db_session: AsyncSession) -> AsyncGenerator[TestClient, None]:
    """Create a test client with database dependency override."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()



@pytest_asyncio.fixture
async def authenticated_client(
    client: TestClient,
    test_user: User,
) -> TestClient:
    """Create a test client with authentication headers."""
    access_token = create_access_token(data={"sub": str(test_user.id)})
    client.headers = {"Authorization": f"Bearer {access_token}"}
    return client
    