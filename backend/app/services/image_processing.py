"""Image processing service for letter pages."""

from dataclasses import dataclass
from io import BytesIO
from typing import Optional

from PIL import Image, ImageChops, ImageStat


@dataclass
class CropBox:
    """Represents a rectangular crop area."""

    x: int
    y: int
    width: int
    height: int

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {"x": self.x, "y": self.y, "width": self.width, "height": self.height}

    @classmethod
    def from_dict(cls, data: dict) -> "CropBox":
        """Create from dictionary."""
        return cls(x=data["x"], y=data["y"], width=data["width"], height=data["height"])


@dataclass
class ProcessedImage:
    """Result of image processing."""

    original_bytes: bytes
    processed_bytes: bytes
    thumbnail_bytes: bytes
    crop_box: Optional[CropBox] = None
    format: str = "JPEG"


class ImageProcessor:
    """Process uploaded letter page images using Pillow."""

    MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB (Mistral OCR limit)
    THUMBNAIL_WIDTH = 200
    JPEG_QUALITY = 95
    THUMBNAIL_QUALITY = 80

    def process_upload(self, image_data: bytes) -> ProcessedImage:
        """
        Full processing pipeline:
        1. Store original
        2. Auto-crop (edge detection)
        3. Resize if over 10MB
        4. Generate thumbnail

        Args:
            image_data: Raw image bytes from upload

        Returns:
            ProcessedImage with all processed versions
        """
        # Open original image
        original_img = Image.open(BytesIO(image_data))

        # Auto-crop to detect paper edges
        cropped_img, crop_box = self.auto_crop(original_img)

        # Resize if needed
        processed_bytes, _ = self.resize_if_needed(
            self._image_to_bytes(
                cropped_img, original_img.format if original_img.format else "JPEG"
            )
        )

        # Generate thumbnail
        thumbnail_bytes = self.generate_thumbnail(cropped_img)

        return ProcessedImage(
            original_bytes=image_data,
            processed_bytes=processed_bytes,
            thumbnail_bytes=thumbnail_bytes,
            crop_box=crop_box,
            format=original_img.format if original_img.format else "JPEG",
        )

    def auto_crop(self, image: Image.Image) -> tuple[Image.Image, Optional[CropBox]]:
        """
        Attempt to detect paper edges and crop.

        Uses Pillow-based approach:
        1. Convert to grayscale
        2. Find bounding box of non-background content
        3. Add small padding

        Returns:
            Tuple of (cropped_image, crop_box) or (original_image, None) if detection fails
        """
        try:
            # Convert to grayscale for analysis
            gray = image.convert("L")

            # Find bounding box of non-white content
            # Invert and look for dark pixels
            inverted = ImageChops.invert(gray)
            bbox = inverted.getbbox()

            if not bbox:
                # No content detected, return original
                return image, None

            x1, y1, x2, y2 = bbox

            # Add padding around detected content (5% of image size)
            width, height = image.size
            padding_x = int(width * 0.05)
            padding_y = int(height * 0.05)

            x1 = max(0, x1 - padding_x)
            y1 = max(0, y1 - padding_y)
            x2 = min(width, x2 + padding_x)
            y2 = min(height, y2 + padding_y)

            # Create crop box
            crop_width = x2 - x1
            crop_height = y2 - y1

            crop_box = CropBox(x=x1, y=y1, width=crop_width, height=crop_height)

            # Crop the image
            cropped = image.crop((x1, y1, x2, y2))

            return cropped, crop_box

        except Exception:
            # If anything fails, return original image
            return image, None

    def apply_crop(
        self, image_data: bytes, crop_box: CropBox, rotation: int = 0
    ) -> bytes:
        """Apply user-specified crop and rotation to original image.

        Args:
            image_data: Original image bytes
            crop_box: Crop specifications
            rotation: Rotation in degrees (0, 90, 180, 270)

        Returns:
            Processed image bytes
        """
        image = Image.open(BytesIO(image_data))

        # Apply rotation first if needed
        if rotation % 360 != 0:
            # Rotate counter-clockwise
            image = image.rotate(rotation, expand=True)

        # Apply crop
        x1, y1 = crop_box.x, crop_box.y
        x2 = x1 + crop_box.width
        y2 = y1 + crop_box.height

        image = image.crop((x1, y1, x2, y2))

        # Resize if needed and convert to JPEG
        return self._process_and_encode(image)

    def resize_if_needed(self, image_data: bytes) -> tuple[bytes, str]:
        """Resize if over 10MB (for Mistral OCR limit).

        Args:
            image_data: Image bytes

        Returns:
            Tuple of (processed_bytes, format_used)
        """
        if len(image_data) <= self.MAX_SIZE_BYTES:
            return image_data, "JPEG"

        image = Image.open(BytesIO(image_data))

        # Calculate reduction factor
        size_ratio = len(image_data) / self.MAX_SIZE_BYTES
        scale_factor = (1 / size_ratio) ** 0.5

        new_width = int(image.width * scale_factor)
        new_height = int(image.height * scale_factor)

        # Resize maintaining aspect ratio
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        return self._process_and_encode(image), "JPEG"

    def generate_thumbnail(self, image: Image.Image) -> bytes:
        """Generate small thumbnail for UI.

        Args:
            image: PIL Image object

        Returns:
            JPEG thumbnail bytes
        """
        # Calculate height maintaining aspect ratio
        aspect_ratio = image.height / image.width
        thumb_height = int(self.THUMBNAIL_WIDTH * aspect_ratio)

        thumb = image.resize(
            (self.THUMBNAIL_WIDTH, thumb_height), Image.Resampling.LANCZOS
        )

        # Convert to RGB if needed
        if thumb.mode in ("RGBA", "LA", "P"):
            rgb_thumb = Image.new("RGB", thumb.size, (255, 255, 255))
            rgb_thumb.paste(
                thumb, mask=thumb.split()[-1] if thumb.mode == "RGBA" else None
            )
            thumb = rgb_thumb

        return self._image_to_bytes(
            thumb, format="JPEG", quality=self.THUMBNAIL_QUALITY
        )

    def _process_and_encode(
        self, image: Image.Image, quality: Optional[int] = None
    ) -> bytes:
        """Process image and encode to JPEG.

        Args:
            image: PIL Image object
            quality: JPEG quality (0-100)

        Returns:
            JPEG bytes
        """
        if quality is None:
            quality = self.JPEG_QUALITY

        # Convert to RGB if needed (for JPEG compatibility)
        if image.mode in ("RGBA", "LA", "P"):
            rgb_image = Image.new("RGB", image.size, (255, 255, 255))
            rgb_image.paste(
                image, mask=image.split()[-1] if image.mode == "RGBA" else None
            )
            image = rgb_image

        return self._image_to_bytes(image, format="JPEG", quality=quality)

    @staticmethod
    def _image_to_bytes(
        image: Image.Image, format: Optional[str] = None, quality: Optional[int] = None
    ) -> bytes:
        """Convert PIL Image to bytes.

        Args:
            image: PIL Image object
            format: Image format (e.g., 'JPEG', 'PNG')
            quality: For JPEG, quality 0-100

        Returns:
            Image bytes
        """
        if format is None:
            format = "JPEG"
        if quality is None:
            quality = 95

        buffer = BytesIO()

        if format.upper() == "JPEG":
            # Ensure RGB for JPEG
            if image.mode != "RGB":
                image = image.convert("RGB")
            image.save(buffer, format="JPEG", quality=quality, optimize=True)
        else:
            image.save(buffer, format=format)

        buffer.seek(0)
        return buffer.getvalue()
