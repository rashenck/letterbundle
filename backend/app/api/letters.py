"""Letters API routes."""

import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_user_optional
from app.core.database import get_db
from app.models import Bundle, Letter, LetterStatus, LetterTag, User
from app.schemas.letter import (
    LetterCreate,
    LetterReorder,
    LetterResponse,
    LetterUpdate,
    LetterWithPages,
)

router = APIRouter()


async def run_ocr_for_letter(letter_id: uuid.UUID) -> None:
    """Background task to run OCR on letter pages."""
    # TODO: Implement OCR processing
    pass


@router.get("/{letter_id}", response_model=LetterWithPages)
async def get_letter(
    letter_id: uuid.UUID,
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Letter:
    """Get a letter by ID."""
    result = await db.execute(
        select(Letter)
        .options(selectinload(Letter.pages), selectinload(Letter.tags))
        .where(Letter.id == letter_id)
    )
    letter = result.scalar_one_or_none()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Letter not found",
        )

    # Get bundle to check permissions
    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == letter.bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Letter not found",
        )

    # Check if user can access this letter
    if not bundle.is_public:
        if not current_user or bundle.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Letter not found",
            )

    return letter


@router.put("/{letter_id}", response_model=LetterResponse)
async def update_letter(
    letter_id: uuid.UUID,
    letter_data: LetterUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Letter:
    """Update a letter."""
    result = await db.execute(
        select(Letter).options(selectinload(Letter.tags)).where(Letter.id == letter_id)
    )
    letter = result.scalar_one_or_none()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Letter not found",
        )

    # Get bundle to check ownership
    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == letter.bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()

    if not bundle or bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this letter",
        )

    # Update fields
    if letter_data.date_written is not None:
        letter.date_written = letter_data.date_written

    if letter_data.author is not None:
        letter.author = letter_data.author

    if letter_data.recipient is not None:
        letter.recipient = letter_data.recipient

    if letter_data.location is not None:
        letter.location = letter_data.location

    if letter_data.notes is not None:
        letter.notes = letter_data.notes

    if letter_data.transcription is not None:
        letter.transcription = letter_data.transcription

    # Update tags
    if letter_data.tags is not None:
        # Remove existing tags
        for tag in letter.tags:
            await db.delete(tag)

        # Add new tags
        for tag_name in letter_data.tags:
            tag = LetterTag(letter_id=letter.id, tag=tag_name)
            db.add(tag)

    await db.flush()
    await db.refresh(letter)

    return letter


@router.delete("/{letter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_letter(
    letter_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a letter."""
    result = await db.execute(select(Letter).where(Letter.id == letter_id))
    letter = result.scalar_one_or_none()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Letter not found",
        )

    # Get bundle to check ownership
    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == letter.bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()

    if not bundle or bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this letter",
        )

    await db.delete(letter)


@router.post("/{letter_id}/process", response_model=LetterResponse)
async def process_letter(
    letter_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Letter:
    """Submit a letter for OCR processing."""
    result = await db.execute(select(Letter).where(Letter.id == letter_id))
    letter = result.scalar_one_or_none()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Letter not found",
        )

    # Get bundle to check ownership
    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == letter.bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()

    if not bundle or bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process this letter",
        )

    # Update status to processing
    letter.status = LetterStatus.PROCESSING.value
    await db.flush()
    await db.refresh(letter)

    # Queue background task
    background_tasks.add_task(run_ocr_for_letter, letter_id)

    return letter
