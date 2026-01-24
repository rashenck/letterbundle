"""Security utilities for authentication."""

import re
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.constants import USERNAME_PATTERN

settings = get_settings()

# Use argon2 for password hashing (no length limitations)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using argon2."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None


def validate_slug(slug: str) -> tuple[bool, str | None]:
    """Validate a slug or username.

    Args:
        slug: The slug or username to validate.

    Returns:
        Tuple of (is_valid, error_message).
    """
    if len(slug) < settings.min_slug_length:
        return False, f"Must be at least {settings.min_slug_length} characters"

    if len(slug) > settings.max_slug_length:
        return False, f"Must be at most {settings.max_slug_length} characters"

    # Allow lowercase letters, numbers, and hyphens
    if not USERNAME_PATTERN.match(slug):
        return (
            False,
            "Must contain only lowercase letters, numbers, and hyphens, and start/end with a letter or number",
        )

    if slug in settings.reserved_words:
        return False, "This name is reserved"

    if "--" in slug:
        return False, "Cannot contain consecutive hyphens"

    return True, None
