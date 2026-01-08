"""Letters API routes."""

import uuid
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_user_optional
from app.core.database import get_db
from app.models import Bundle, Letter, LetterPage, LetterStatus, LetterTag, User
from app.schemas.letter import (
    LetterCreate,
    LetterReorder,
    LetterResponse,
    LetterUpdate,
    LetterWithPages,
)
from app.schemas.page import PageResponse
from app.services.image_processing import ImageProcessor
from app.services.storage import get_s3_storage

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


@router.post("/{letter_id}/pages", response_model=list[PageResponse])
async def upload_letter_pages(
    letter_id: uuid.UUID,
    files: Annotated[list[UploadFile], File()],
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Upload pages for a letter. Triggers background processing."""
    # Get letter and check ownership
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
            detail="Not authorized to upload pages for this letter",
        )

    # Get max page number
    max_page_result = await db.execute(
        select(func.max(LetterPage.page_number)).where(
            LetterPage.letter_id == letter_id
        )
    )
    max_page = max_page_result.scalar() or 0

    # Initialize services
    processor = ImageProcessor()
    storage = get_s3_storage()

    # Process each uploaded file
    created_pages = []
    for idx, file in enumerate(files):
        try:
            # Read file
            file_data = await file.read()

            # Process image
            processed = processor.process_upload(file_data)

            # Create letter page record
            page = LetterPage(
                letter_id=letter_id,
                page_number=max_page + idx + 1,
                rotation=0,
                crop_box=processed.crop_box.to_dict() if processed.crop_box else None,
                s3_key_original="",  # Will be set after upload
                s3_key_processed="",
                s3_key_thumbnail="",
            )
            db.add(page)
            await db.flush()

            # Build S3 keys
            original_key = storage.build_s3_key(
                str(letter.id), str(page.id), "original"
            )
            processed_key = storage.build_s3_key(
                str(letter.id), str(page.id), "processed"
            )
            thumbnail_key = storage.build_s3_key(
                str(letter.id), str(page.id), "thumbnail"
            )

            # Upload to S3
            storage.upload_file(processed.original_bytes, original_key)
            storage.upload_file(processed.processed_bytes, processed_key)
            storage.upload_file(processed.thumbnail_bytes, thumbnail_key)

            # Update page with S3 keys
            page.s3_key_original = original_key
            page.s3_key_processed = processed_key
            page.s3_key_thumbnail = thumbnail_key

            await db.flush()
            await db.refresh(page)
            created_pages.append(page)

            # Queue OCR processing
            background_tasks.add_task(run_ocr_for_letter, letter_id)

        except Exception as e:
            # Log error but continue with other files
            print(f"Error processing page: {e}")
            continue

    return created_pages


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
