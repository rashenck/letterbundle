"""Auth API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_password_hash,
    validate_slug,
    verify_password,
)
from app.models import User
from app.schemas.user import UserCreate, UserResponse
from app.services.email import get_email_service

router = APIRouter()


class LoginRequest(BaseModel):
    """Login request schema."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""

    access_token: str
    token_type: str = "bearer"


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Register a new user."""
    # Validate username
    is_valid, error = validate_slug(user_data.username)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid username: {error}",
        )

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create user with email verification
    email_service = get_email_service()
    verification_token = email_service.generate_verification_token()

    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        verification_token=verification_token,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Send verification email
    email_sent = await email_service.send_verification_email(
        user.email, verification_token
    )

    print(f"DEBUG: Created user with verification_token: {verification_token}")
    print(f"DEBUG: User email_verified: {user.email_verified}")

    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Login and get access token."""
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email before logging in",
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token)


@router.post("/logout")
async def logout() -> dict:
    """Logout (client should discard token)."""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current user info."""
    return current_user


@router.post("/resend-verification")
async def resend_verification(
    login_data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Resend verification email."""
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a verification link has been sent"}

    if user.email_verified:
        return {"message": "Email is already verified"}

    # Generate new token and update user
    email_service = get_email_service()
    verification_token = email_service.generate_verification_token()
    user.verification_token = verification_token
    await db.commit()

    # Send verification email
    await email_service.send_verification_email(user.email, verification_token)

    return {"message": "Verification email sent"}


@router.get("/verify-email")
async def verify_email(
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Verify email with token (query parameter for frontend redirect)."""
    print(f"DEBUG: Looking up user with token: {token}")
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    if not user:
        print(f"DEBUG: No user found for token: {token}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    print(f"DEBUG: Found user: {user.email}, email_verified: {user.email_verified}")

    # Mark email as verified
    user.email_verified = True
    user.verification_token = None
    await db.commit()

    print(f"DEBUG: Email verified for user: {user.email}")

    return {"message": "Email verified successfully"}


@router.get("/debug/token/{token}")
async def debug_token(
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Debug endpoint to check if token exists."""
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    return {
        "token": token,
        "user_found": user is not None,
        "user_email": user.email if user else None,
        "email_verified": user.email_verified if user else None,
    }
