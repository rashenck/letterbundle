"""Bundle schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class BundleBase(BaseModel):
    """Base bundle schema."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    is_public: bool = False


class BundleCreate(BundleBase):
    """Schema for creating a bundle."""

    slug: str = Field(
        min_length=4, max_length=30, pattern=r"^[a-z][a-z\-]*[a-z]$|^[a-z]{1,4}$"
    )


class BundleUpdate(BaseModel):
    """Schema for updating a bundle."""

    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_public: bool | None = None


class BundleResponse(BaseModel):
    """Schema for bundle response."""

    id: uuid.UUID
    user_id: uuid.UUID
    slug: str
    title: str
    description: str | None
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BundleWithUser(BundleResponse):
    """Bundle response with user info."""

    username: str  # Populated from user relationship


class BundleList(BaseModel):
    """Schema for bundle list response."""

    bundles: list[BundleResponse]
    total: int
