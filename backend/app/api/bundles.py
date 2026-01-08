"""Bundles API routes."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_user_optional
from app.core.database import get_db
from app.core.security import validate_slug
from app.models import Bundle, Letter, User
from app.schemas.bundle import BundleCreate, BundleList, BundleResponse, BundleUpdate
from app.schemas.letter import LetterCreate, LetterReorder, LetterResponse

router = APIRouter()


@router.get("", response_model=BundleList)
async def list_my_bundles(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 50,
):
    """List current user's bundles."""
    # Get total count
    count_result = await db.execute(
        select(func.count())
        .select_from(Bundle)
        .where(Bundle.user_id == current_user.id)
    )
    total = count_result.scalar() or 0

    # Get bundles
    result = await db.execute(
        select(Bundle)
        .where(Bundle.user_id == current_user.id)
        .order_by(Bundle.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    bundles = list(result.scalars().all())

    return BundleList(bundles=bundles, total=total)


@router.post("", response_model=BundleResponse, status_code=status.HTTP_201_CREATED)
async def create_bundle(
    bundle_data: BundleCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Bundle:
    """Create a new bundle."""
    # Validate slug
    is_valid, error = validate_slug(bundle_data.slug)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid slug: {error}",
        )

    # Check if slug already exists
    result = await db.execute(select(Bundle).where(Bundle.slug == bundle_data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This slug is already taken",
        )

    # Create bundle
    bundle = Bundle(
        user_id=current_user.id,
        slug=bundle_data.slug,
        title=bundle_data.title,
        description=bundle_data.description,
        is_public=bundle_data.is_public,
    )
    db.add(bundle)
    await db.flush()
    await db.refresh(bundle)

    return bundle


@router.get("/public", response_model=BundleList)
async def list_public_bundles(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 50,
) -> BundleList:
    """List public bundles."""
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(Bundle).where(Bundle.is_public == True)
    )
    total = count_result.scalar() or 0

    # Get bundles
    result = await db.execute(
        select(Bundle)
        .where(Bundle.is_public == True)
        .order_by(Bundle.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    bundles = result.scalars().all()

    return BundleList(bundles=bundles, total=total)


@router.get("/by-slug/{slug}", response_model=BundleResponse)
async def get_bundle_by_slug(
    slug: str,
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Bundle:
    """Get a bundle by its slug."""
    result = await db.execute(select(Bundle).where(Bundle.slug == slug))
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    # Check if user can access this bundle
    if not bundle.is_public:
        if not current_user or bundle.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bundle not found",
            )

    return bundle


@router.get("/{bundle_id}", response_model=BundleResponse)
async def get_bundle(
    bundle_id: uuid.UUID,
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Bundle:
    """Get a bundle by ID."""
    result = await db.execute(select(Bundle).where(Bundle.id == bundle_id))
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    # Check if user can access this bundle
    if not bundle.is_public:
        if not current_user or bundle.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bundle not found",
            )

    return bundle


@router.put("/{bundle_id}", response_model=BundleResponse)
async def update_bundle(
    bundle_id: uuid.UUID,
    bundle_data: BundleUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Bundle:
    """Update a bundle."""
    result = await db.execute(select(Bundle).where(Bundle.id == bundle_id))
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    if bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this bundle",
        )

    if bundle_data.title is not None:
        bundle.title = bundle_data.title

    if bundle_data.description is not None:
        bundle.description = bundle_data.description

    if bundle_data.is_public is not None:
        bundle.is_public = bundle_data.is_public

    await db.flush()
    await db.refresh(bundle)

    return bundle


@router.delete("/{bundle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bundle(
    bundle_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a bundle."""
    result = await db.execute(select(Bundle).where(Bundle.id == bundle_id))
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    if bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this bundle",
        )

    await db.delete(bundle)


# Letters within bundle endpoints


@router.get("/{bundle_id}/letters", response_model=list[LetterResponse])
async def list_bundle_letters(
    bundle_id: uuid.UUID,
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Letter]:
    """List letters in a bundle."""
    result = await db.execute(select(Bundle).where(Bundle.id == bundle_id))
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    # Check if user can access this bundle
    if not bundle.is_public:
        if not current_user or bundle.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bundle not found",
            )

    letters_result = await db.execute(
        select(Letter).where(Letter.bundle_id == bundle_id).order_by(Letter.order_index)
    )
    return list(letters_result.scalars().all())


@router.post(
    "/{bundle_id}/letters",
    response_model=LetterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_letter(
    bundle_id: uuid.UUID,
    letter_data: LetterCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Letter:
    """Create a new letter in a bundle."""
    result = await db.execute(select(Bundle).where(Bundle.id == bundle_id))
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    if bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add letters to this bundle",
        )

    # Get the next order index
    max_order_result = await db.execute(
        select(func.max(Letter.order_index)).where(Letter.bundle_id == bundle_id)
    )
    max_order = max_order_result.scalar() or 0

    # Create letter
    letter = Letter(
        bundle_id=bundle_id,
        date_written=letter_data.date_written,
        author=letter_data.author,
        recipient=letter_data.recipient,
        location=letter_data.location,
        notes=letter_data.notes,
        order_index=max_order + 1,
    )
    db.add(letter)
    await db.flush()
    await db.refresh(letter)

    return letter


@router.put("/{bundle_id}/letters/reorder", response_model=list[LetterResponse])
async def reorder_letters(
    bundle_id: uuid.UUID,
    reorder_data: LetterReorder,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Letter]:
    """Reorder letters in a bundle."""
    result = await db.execute(select(Bundle).where(Bundle.id == bundle_id))
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    if bundle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reorder letters in this bundle",
        )

    # Update order indices
    for index, letter_id in enumerate(reorder_data.letter_ids):
        letter_result = await db.execute(
            select(Letter).where(Letter.id == letter_id, Letter.bundle_id == bundle_id)
        )
        letter = letter_result.scalar_one_or_none()
        if letter:
            letter.order_index = index

    await db.flush()

    # Return updated list
    letters_result = await db.execute(
        select(Letter).where(Letter.bundle_id == bundle_id).order_by(Letter.order_index)
    )
    return list(letters_result.scalars().all())
