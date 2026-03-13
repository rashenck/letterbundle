"""Tests for letters API."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from app.api.letters import run_ocr_for_letter
from app.models import Bundle, Letter, LetterPage, User


@pytest.mark.asyncio
async def test_run_ocr_for_letter(db_session, db_engine):
    """Test OCR processing updates letter status to ready."""
    user = User(
        email="test@example.com",
        username="testuser",
        password_hash="hashed",
        first_name="Test",
        last_name="User",
    )
    db_session.add(user)
    await db_session.flush()

    bundle = Bundle(
        user_id=user.id,
        slug="test-bundle",
        title="Test Bundle",
    )
    db_session.add(bundle)
    await db_session.flush()

    letter = Letter(
        bundle_id=bundle.id,
        status="processing",
        order_index=1,
    )
    db_session.add(letter)
    await db_session.flush()

    page = LetterPage(
        letter_id=letter.id,
        page_number=1,
        s3_key_original="test/key/original.jpg",
        s3_key_processed="test/key/processed.jpg",
        s3_key_thumbnail="test/key/thumb.jpg",
    )
    db_session.add(page)
    await db_session.commit()

    letter_id = letter.id

    with (
        patch(
            "app.api.letters.get_db_session", return_value=AsyncMock()
        ) as mock_get_db_session,
        patch("app.api.letters.get_ocr_service") as mock_ocr_service,
        patch("app.api.letters.get_s3_storage") as mock_storage_service,
    ):
        mock_get_db_session.return_value.__aenter__.return_value = db_session

        mock_ocr = MagicMock()
        mock_ocr.is_available.return_value = True
        mock_ocr.process_page = AsyncMock(return_value={"text": "Transcribed text"})
        mock_ocr_service.return_value = mock_ocr

        mock_storage = MagicMock()
        mock_storage.download_file.return_value = b"fake_image_bytes"
        mock_storage_service.return_value = mock_storage

        await run_ocr_for_letter(letter_id)

    result = await db_session.execute(select(Letter).where(Letter.id == letter_id))
    updated_letter = result.scalar_one()

    assert updated_letter.status == "ready"
    assert updated_letter.transcription == "Transcribed text"
