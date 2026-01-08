"""Letter page schemas."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CropBox(BaseModel):
    """Crop box coordinates."""

    x: float
    y: float
    width: float
    height: float


class PageBase(BaseModel):
    """Base page schema."""

    rotation: int = Field(default=0, ge=0, le=270)
    crop_box: CropBox | None = None


class PageCreate(PageBase):
    """Schema for creating a page (internal use)."""

    page_number: int
    s3_key_original: str


class PageUpdate(BaseModel):
    """Schema for updating a page."""

    rotation: int | None = Field(None, ge=0, le=270)
    crop_box: CropBox | None = None
    transcription: str | None = None


class PageReorder(BaseModel):
    """Schema for reordering pages."""

    page_ids: list[uuid.UUID]


class PageCrop(BaseModel):
    """Schema for applying crop."""

    crop_box: CropBox
    rotation: int = Field(default=0, ge=0, le=270)


class PageResponse(BaseModel):
    """Schema for page response."""

    id: uuid.UUID
    letter_id: uuid.UUID
    page_number: int
    rotation: int
    crop_box: dict[str, Any] | None
    transcription: str | None
    created_at: datetime
    updated_at: datetime
    # Image URLs (generated from S3 keys)
    image_url_original: str | None = None
    image_url_processed: str | None = None
    image_url_thumbnail: str | None = None

    model_config = {"from_attributes": True}
