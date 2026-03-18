"""Letter model."""

import uuid
from datetime import date, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.bundle import Bundle
    from app.models.page import LetterPage


class LetterStatus(StrEnum):
    """Letter processing status."""

    DRAFT = "draft"
    PROCESSING = "processing"
    READY = "ready"


class Letter(Base):
    """Letter model."""

    __tablename__ = "letters"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bundle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bundles.id", ondelete="CASCADE"), nullable=False
    )
    date_written: Mapped[date | None] = mapped_column(Date, nullable=True)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    recipient: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=LetterStatus.DRAFT.value, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    bundle: Mapped["Bundle"] = relationship("Bundle", back_populates="letters")
    pages: Mapped[list["LetterPage"]] = relationship(
        "LetterPage", back_populates="letter", cascade="all, delete-orphan"
    )
    tags: Mapped[list["LetterTag"]] = relationship(
        "LetterTag", back_populates="letter", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Letter {self.id}>"


class LetterTag(Base):
    """Letter tag model."""

    __tablename__ = "letter_tags"

    letter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("letters.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag: Mapped[str] = mapped_column(String(100), primary_key=True)

    # Relationships
    letter: Mapped["Letter"] = relationship("Letter", back_populates="tags")

    def __repr__(self) -> str:
        return f"<LetterTag {self.tag}>"
