"""Tests for pages API endpoints."""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Bundle, Letter, LetterPage, User


@pytest.mark.asyncio
async def test_update_page_success(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test updating a page."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="page-bundle",
        title="Page Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(bundle_id=bundle.id, order_index=1)
    db_session.add(letter)
    await db_session.flush()

    page = LetterPage(
        letter_id=letter.id,
        page_number=1,
        rotation=0,
        s3_key_original="test/original.jpg",
        s3_key_processed="test/processed.jpg",
        s3_key_thumbnail="test/thumb.jpg",
    )
    db_session.add(page)
    await db_session.commit()

    response = authenticated_client.put(
        f"/api/pages/{page.id}",
        json={
            "rotation": 90,
            "transcription": "Updated transcription",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["rotation"] == 90
    assert data["transcription"] == "Updated transcription"


@pytest.mark.asyncio
async def test_update_page_not_found(authenticated_client: TestClient, test_user: User):
    """Test updating non-existent page."""
    fake_id = uuid.uuid4()
    response = authenticated_client.put(
        f"/api/pages/{fake_id}",
        json={"rotation": 90},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_page_forbidden(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test updating page from another user's bundle."""
    other_user = User(
        email="other2@example.com",
        username="otheruser2",
        password_hash="hashed",
        first_name="Other",
        last_name="User",
    )
    db_session.add(other_user)
    await db_session.flush()

    bundle = Bundle(user_id=other_user.id, slug="other-bundle-2", title="Other")
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(bundle_id=bundle.id, order_index=1)
    db_session.add(letter)
    await db_session.flush()

    page = LetterPage(
        letter_id=letter.id,
        page_number=1,
        s3_key_original="test/original.jpg",
        s3_key_processed="test/processed.jpg",
        s3_key_thumbnail="test/thumb.jpg",
    )
    db_session.add(page)
    await db_session.commit()

    response = authenticated_client.put(
        f"/api/pages/{page.id}",
        json={"rotation": 90},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_apply_crop(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test applying crop to a page."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="crop-bundle",
        title="Crop Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(bundle_id=bundle.id, order_index=1)
    db_session.add(letter)
    await db_session.flush()

    page = LetterPage(
        letter_id=letter.id,
        page_number=1,
        rotation=0,
        s3_key_original="test/original.jpg",
        s3_key_processed="test/processed.jpg",
        s3_key_thumbnail="test/thumb.jpg",
    )
    db_session.add(page)
    await db_session.commit()

    response = authenticated_client.put(
        f"/api/pages/{page.id}/crop",
        json={
            "rotation": 180,
            "crop_box": {"x": 0, "y": 0, "width": 100, "height": 100},
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["rotation"] == 180


@pytest.mark.asyncio
async def test_delete_page_success(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test deleting a page."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="delete-page-bundle",
        title="Delete Page Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(bundle_id=bundle.id, order_index=1)
    db_session.add(letter)
    await db_session.flush()

    page = LetterPage(
        letter_id=letter.id,
        page_number=1,
        s3_key_original="test/original.jpg",
        s3_key_processed="test/processed.jpg",
        s3_key_thumbnail="test/thumb.jpg",
    )
    db_session.add(page)
    await db_session.commit()

    response = authenticated_client.delete(f"/api/pages/{page.id}")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_page_not_found(authenticated_client: TestClient, test_user: User):
    """Test deleting non-existent page."""
    fake_id = uuid.uuid4()
    response = authenticated_client.delete(f"/api/pages/{fake_id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_page_image_original(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
    mock_s3_storage: MagicMock,
):
    """Test getting original image URL for a page."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="image-bundle",
        title="Image Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(bundle_id=bundle.id, order_index=1)
    db_session.add(letter)
    await db_session.flush()

    page = LetterPage(
        letter_id=letter.id,
        page_number=1,
        s3_key_original="test/original.jpg",
        s3_key_processed="test/processed.jpg",
        s3_key_thumbnail="test/thumb.jpg",
    )
    db_session.add(page)
    await db_session.commit()

    with patch("app.api.pages.get_s3_storage", return_value=mock_s3_storage):
        response = authenticated_client.get(f"/api/pages/{page.id}/image/original")

    assert response.status_code == 200
    data = response.json()
    assert "url" in data


@pytest.mark.asyncio
async def test_get_page_image_invalid_version(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test getting image with invalid version."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="version-bundle",
        title="Version Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(bundle_id=bundle.id, order_index=1)
    db_session.add(letter)
    await db_session.flush()

    page = LetterPage(
        letter_id=letter.id,
        page_number=1,
        s3_key_original="test/original.jpg",
        s3_key_processed="test/processed.jpg",
        s3_key_thumbnail="test/thumb.jpg",
    )
    db_session.add(page)
    await db_session.commit()

    response = authenticated_client.get(f"/api/pages/{page.id}/image/invalid")

    assert response.status_code == 400
    assert "Invalid version" in response.json()["detail"]


@pytest.mark.asyncio
async def test_reorder_pages(
    authenticated_client: TestClient,
    test_user: User,
    db_session: AsyncSession,
):
    """Test reordering pages in a letter."""
    bundle = Bundle(
        user_id=test_user.id,
        slug="reorder-pages-bundle",
        title="Reorder Pages Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(bundle_id=bundle.id, order_index=1)
    db_session.add(letter)
    await db_session.flush()

    page1 = LetterPage(
        letter_id=letter.id,
        page_number=1,
        s3_key_original="test/original1.jpg",
        s3_key_processed="test/processed1.jpg",
        s3_key_thumbnail="test/thumb1.jpg",
    )
    page2 = LetterPage(
        letter_id=letter.id,
        page_number=2,
        s3_key_original="test/original2.jpg",
        s3_key_processed="test/processed2.jpg",
        s3_key_thumbnail="test/thumb2.jpg",
    )
    db_session.add(page1)
    db_session.add(page2)
    await db_session.commit()

    response = authenticated_client.put(
        f"/api/pages/{letter.id}/pages/reorder",
        json={"page_ids": [str(page2.id), str(page1.id)]},
    )

    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == str(page2.id)
    assert data[1]["id"] == str(page1.id)
