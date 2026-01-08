"""Users API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.user import UserPublic, UserResponse, UserUpdate

router = APIRouter()


@router.get("/{username}", response_model=UserPublic)
async def get_user_profile(
    username: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get public user profile."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Update current user profile."""
    if user_data.email and user_data.email != current_user.email:
        # Check if new email is taken
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        current_user.email = user_data.email

    if user_data.first_name:
        current_user.first_name = user_data.first_name

    if user_data.last_name:
        current_user.last_name = user_data.last_name

    await db.flush()
    await db.refresh(current_user)

    return current_user
