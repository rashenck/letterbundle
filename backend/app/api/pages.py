"""Letter pages API routes."""

import uuid
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Bundle, Letter, LetterPage, User
from app.schemas.page import PageCrop, PageResponse, PageUpdate
from app.services.storage import get_s3_storage

router = APIRouter()


async def process_page_image(page_id: uuid.UUID) -> None:
    """Background task to process a page image (auto-crop, resize, thumbnail)."""
    try:
        # This would be called asynchronously in production
        # For now, we've already processed in the upload endpoint
        pass
    except Exception as e:
        print(f"Error processing page {page_id}: {e}")


@router.put("/{page_id}", response_model=PageResponse)
async def update_page(
    page_id: uuid.UUID,
    page_data: PageUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LetterPage:
    """Update a page."""
    result = await db.execute(select(LetterPage).where(LetterPage.id == page_id))
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    # Check ownership through letter -> bundle
    letter_result = await db.execute(select(Letter).where(Letter.id == page.letter_id))
    letter = letter_result.scalar_one_or_none()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == letter.bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()

    if not bundle or bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this page",
        )

    # Update fields
    if page_data.rotation is not None:
        page.rotation = page_data.rotation

    if page_data.crop_box is not None:
        page.crop_box = page_data.crop_box.model_dump()

    if page_data.transcription is not None:
        page.transcription = page_data.transcription

    await db.flush()
    await db.refresh(page)

    return page


@router.put("/{page_id}/crop", response_model=PageResponse)
async def apply_crop(
    page_id: uuid.UUID,
    crop_data: PageCrop,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LetterPage:
    """Apply a new crop to a page (triggers reprocessing)."""
    result = await db.execute(select(LetterPage).where(LetterPage.id == page_id))
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    # Check ownership
    letter_result = await db.execute(select(Letter).where(Letter.id == page.letter_id))
    letter = letter_result.scalar_one_or_none()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == letter.bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()

    if not bundle or bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this page",
        )

    # Update crop settings
    page.crop_box = crop_data.crop_box.model_dump()
    page.rotation = crop_data.rotation

    await db.flush()
    await db.refresh(page)

    # Queue reprocessing
    background_tasks.add_task(process_page_image, page_id)

    return page


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    page_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a page."""
    result = await db.execute(select(LetterPage).where(LetterPage.id == page_id))
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    # Check ownership
    letter_result = await db.execute(select(Letter).where(Letter.id == page.letter_id))
    letter = letter_result.scalar_one_or_none()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == letter.bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()

    if not bundle or bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this page",
        )

    await db.delete(page)


@router.get("/{page_id}/image/{version}")
async def get_page_image(
    page_id: uuid.UUID,
    version: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Get a presigned URL for a page image.

    Version can be: original, processed, thumbnail
    """
    if version not in ("original", "processed", "thumbnail"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid version. Must be: original, processed, or thumbnail",
        )

    result = await db.execute(select(LetterPage).where(LetterPage.id == page_id))
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    # Get the appropriate S3 key
    s3_key = None
    if version == "original":
        s3_key = page.s3_key_original
    elif version == "processed":
        s3_key = page.s3_key_processed
    elif version == "thumbnail":
        s3_key = page.s3_key_thumbnail

    if not s3_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image version '{version}' not available",
        )

    # Generate presigned URL from S3
    storage = get_s3_storage()
    url = storage.get_presigned_url(s3_key)

    return {
        "s3_key": s3_key,
        "url": url or f"https://letterbundle.s3.amazonaws.com/{s3_key}",
    }
