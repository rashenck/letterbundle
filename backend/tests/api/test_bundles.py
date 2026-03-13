"""Tests for bundles API endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Bundle, Letter, User


@pytest.mark.asyncio
async def test_list_my_bundles_empty(authenticated_client: TestClient):
    """Test listing user's bundles when empty."""
    response = authenticated_client.get("/api/bundles")

    assert response.status_code == 200
    data = response.json()
    assert data["bundles"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_my_bundles_with_data(
    authenticated_client: TestClient, test_user: User, db_session: AsyncSession
):
    """Test listing user's bundles with data."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="my-bundle",
        title="My Bundle",
        is_public=False,
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.get("/api/bundles")

    assert response.status_code == 200
    data = response.json()
    assert len(data["bundles"]) == 1
    assert data["bundles"][0]["slug"] == "my-bundle"
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_create_bundle_success(authenticated_client: TestClient, test_user: User):
    """Test creating a bundle."""
    response = authenticated_client.post(
        "/api/bundles",
        json={
            "slug": "new-bundle",
            "title": "New Bundle",
            "description": "A test bundle",
            "is_public": True,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "new-bundle"
    assert data["title"] == "New Bundle"


@pytest.mark.asyncio
async def test_create_bundle_invalid_slug(
    authenticated_client: TestClient, test_user: User
):
    """Test creating a bundle with invalid slug (Pydantic validation)."""
    response = authenticated_client.post(
        "/api/bundles",
        json={
            "slug": "-startswithhyphen",
            "title": "New Bundle",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_bundle_duplicate_slug(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test creating a bundle with duplicate slug."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="existing-bundle",
        title="Existing Bundle",
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.post(
        "/api/bundles",
        json={
            "slug": "existing-bundle",
            "title": "Another Bundle",
        },
    )

    assert response.status_code == 400
    assert "already taken" in response.json()["detail"]


def test_list_public_bundles_empty(client: TestClient):
    """Test listing public bundles when empty."""
    response = client.get("/api/bundles/public")

    assert response.status_code == 200
    data = response.json()
    assert data["bundles"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_public_bundles_with_data(
    client: TestClient, test_user: User, db_session: AsyncSession
):
    """Test listing public bundles with data."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="public-bundle",
        title="Public Bundle",
        is_public=True,
    )
    db_session.add(bundle)
    await db_session.commit()

    response = client.get("/api/bundles/public")

    assert response.status_code == 200
    data = response.json()
    assert len(data["bundles"]) == 1
    assert data["bundles"][0]["slug"] == "public-bundle"


@pytest.mark.asyncio
async def test_get_bundle_by_slug_public(
    client: TestClient, test_user: User, db_session: AsyncSession
):
    """Test getting a public bundle by slug."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="public-bundle-slug",
        title="Public Bundle",
        is_public=True,
    )
    db_session.add(bundle)
    await db_session.commit()

    response = client.get("/api/bundles/by-slug/public-bundle-slug")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "public-bundle-slug"


@pytest.mark.asyncio
async def test_get_bundle_by_slug_private_owner(
    authenticated_client: TestClient, test_user: User, db_session: AsyncSession
):
    """Test getting a private bundle by slug as owner."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="private-bundle",
        title="Private Bundle",
        is_public=False,
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.get("/api/bundles/by-slug/private-bundle")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "private-bundle"


@pytest.mark.asyncio
async def test_get_bundle_by_slug_private_non_owner(
    client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test getting a private bundle by slug as non-owner."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="private-bundle",
        title="Private Bundle",
        is_public=False,
    )
    db_session.add(bundle)
    await db_session.commit()

    response = client.get("/api/bundles/by-slug/private-bundle")

    assert response.status_code == 404
    assert "Bundle not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_bundle_by_slug_not_found(client: TestClient):
    """Test getting non-existent bundle by slug."""
    response = client.get("/api/bundles/by-slug/nonexistent")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_bundle_by_id(
    authenticated_client: TestClient, test_user: User, db_session: AsyncSession
):
    """Test getting a bundle by ID."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="my-bundle-id",
        title="My Bundle",
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.get(f"/api/bundles/{bundle.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(bundle.id)


@pytest.mark.asyncio
async def test_update_bundle_success(
    authenticated_client: TestClient, test_user: User, db_session: AsyncSession
):
    """Test updating a bundle."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="update-bundle",
        title="Original Title",
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.put(
        f"/api/bundles/{bundle.id}",
        json={
            "title": "Updated Title",
            "is_public": True,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["is_public"] is True


@pytest.mark.asyncio
async def test_update_bundle_not_found(
    authenticated_client: TestClient, test_user: User
):
    """Test updating non-existent bundle."""
    fake_id = uuid.uuid4()
    response = authenticated_client.put(
        f"/api/bundles/{fake_id}",
        json={"title": "Updated Title"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_bundle_forbidden(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test updating another user's bundle."""
    other_user = User(
        email="other@example.com",
        username="otheruser",
        password_hash="hashed",
        first_name="Other",
        last_name="User",
    )
    db_session.add(other_user)
    await db_session.flush()

    bundle = Bundle(
        user_id=other_user.id,
        slug="other-bundle",
        title="Other Bundle",
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.put(
        f"/api/bundles/{bundle.id}",
        json={"title": "Hacked Title"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_bundle_success(
    authenticated_client: TestClient, test_user: User, db_session: AsyncSession
):
    """Test deleting a bundle."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="delete-bundle",
        title="Delete Me",
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.delete(f"/api/bundles/{bundle.id}")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_bundle_not_found(
    authenticated_client: TestClient, test_user: User
):
    """Test deleting non-existent bundle."""
    fake_id = uuid.uuid4()
    response = authenticated_client.delete(f"/api/bundles/{fake_id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_bundle_letters(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test listing letters in a bundle."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="letters-bundle",
        title="Letters Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(
        bundle_id=bundle.id,
        order_index=1,
    )
    db_session.add(letter)
    await db_session.commit()

    response = authenticated_client.get(f"/api/bundles/{bundle.id}/letters")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


@pytest.mark.asyncio
async def test_create_letter(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test creating a letter in a bundle."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="create-letter-bundle",
        title="Create Letter Bundle",
    )
    db_session.add(bundle)
    await db_session.commit()

    response = authenticated_client.post(
        f"/api/bundles/{bundle.id}/letters",
        json={
            "date_written": "2024-01-15",
            "author": "John Doe",
            "recipient": "Jane Doe",
            "location": "New York",
            "notes": "A test letter",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["author"] == "John Doe"
    assert data["recipient"] == "Jane Doe"


@pytest.mark.asyncio
async def test_reorder_letters(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test reordering letters in a bundle."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="reorder-bundle",
        title="Reorder Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter1 = Letter(bundle_id=bundle.id, order_index=1)
    letter2 = Letter(bundle_id=bundle.id, order_index=2)
    db_session.add(letter1)
    db_session.add(letter2)
    await db_session.commit()

    response = authenticated_client.put(
        f"/api/bundles/{bundle.id}/letters/reorder",
        json={"letter_ids": [str(letter2.id), str(letter1.id)]},
    )

    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == str(letter2.id)
    assert data[1]["id"] == str(letter1.id)
