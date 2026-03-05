"""Letter page model."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.letter import Letter


class LetterPage(Base):
    """Letter page (individual image) model."""

    __tablename__ = "letter_pages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    letter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("letters.id", ondelete="CASCADE"), nullable=False
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    rotation: Mapped[int] = mapped_column(Integer, default=0)  # 0, 90, 180, 270
    crop_box: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )  # {x, y, width, height}
    s3_key_original: Mapped[str] = mapped_column(String(512), nullable=False)
    s3_key_processed: Mapped[str | None] = mapped_column(String(512), nullable=True)
    s3_key_thumbnail: Mapped[str | None] = mapped_column(String(512), nullable=True)
    transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    letter: Mapped["Letter"] = relationship("Letter", back_populates="pages")

    def __repr__(self) -> str:
        return f"<LetterPage {self.id} page {self.page_number}>"
