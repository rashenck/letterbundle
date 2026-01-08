"""Letter schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.letter import LetterStatus


class LetterBase(BaseModel):
    """Base letter schema."""

    date_written: date | None = None
    author: str | None = Field(None, max_length=255)
    recipient: str | None = Field(None, max_length=255)
    location: str | None = Field(None, max_length=255)
    notes: str | None = None


class LetterCreate(LetterBase):
    """Schema for creating a letter."""

    pass


class LetterUpdate(LetterBase):
    """Schema for updating a letter."""

    transcription: str | None = None
    tags: list[str] | None = None


class LetterReorder(BaseModel):
    """Schema for reordering letters."""

    letter_ids: list[uuid.UUID]


class LetterResponse(BaseModel):
    """Schema for letter response."""

    id: uuid.UUID
    bundle_id: uuid.UUID
    date_written: date | None
    author: str | None
    recipient: str | None
    location: str | None
    transcription: str | None
    notes: str | None
    order_index: int
    status: LetterStatus
    created_at: datetime
    updated_at: datetime
    tags: list[str] = []

    model_config = {"from_attributes": True}


class LetterWithPages(LetterResponse):
    """Letter response with pages."""

    pages: list["PageResponse"] = []


# Avoid circular import
from app.schemas.page import PageResponse  # noqa: E402

LetterWithPages.model_rebuild()
