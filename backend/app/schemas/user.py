"""User schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    username: str = Field(
        min_length=4, max_length=30, pattern=r"^[a-z][a-z\-]*[a-z]$|^[a-z]{1,4}$"
    )
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str = Field(min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    email: EmailStr | None = None
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)


class UserResponse(BaseModel):
    """Schema for user response (excludes sensitive data)."""

    id: uuid.UUID
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    """Schema for public user profile."""

    username: str
    created_at: datetime

    model_config = {"from_attributes": True}
