"""Pytest configuration and fixtures for testing."""

import os
from collections.abc import AsyncGenerator
from typing import Any

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
from app.main import app

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


@pytest_asyncio.fixture  # type: ignore[untyped-decorator]
async def client(db_session: AsyncSession) -> AsyncGenerator[TestClient, None]:
    """Create a test client with database dependency override."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
