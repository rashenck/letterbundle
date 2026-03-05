"""OCR service for processing letter page images."""

import base64
import io
import logging
import os
from dataclasses import dataclass
from pathlib import Path

from mistralai import Mistral
from PIL import Image

logger = logging.getLogger(__name__)


# Maximum image size allowed by Mistral OCR API (10 MB)
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


@dataclass
class OCRResult:
    """Result from OCR processing."""

    text: str
    pages: list[dict]
    model: str
    usage: dict | None = None


class OCRClient:
    """Client for performing OCR on images using Mistral AI.

    Args:
        api_key: Mistral API key. If not provided, reads from .mistral.ai.key file
            in current directory, then falls back to MISTRAL_API_KEY env var.
        model: OCR model to use. Defaults to "mistral-ocr-latest".
    """

    API_KEY_FILENAME = ".mistral.ai.key"

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "mistral-ocr-latest",
    ) -> None:
        self.api_key = (
            api_key
            or self._load_api_key_from_file()
            or os.getenv("MISTRAL_API_KEY", "")
        )
        if not self.api_key:
            raise ValueError(
                "API key is required. Create a .mistral.ai.key file, "
                "set MISTRAL_API_KEY environment variable, or pass api_key parameter."
            )
        self.model = model
        self._client: Mistral | None = None

    @classmethod
    def _load_api_key_from_file(cls) -> str | None:
        """Load API key from .mistral.ai.key file in current directory.

        Returns:
            The API key string if file exists, None otherwise.
        """
        key_file = Path.cwd() / cls.API_KEY_FILENAME
        if key_file.exists():
            return key_file.read_text().strip()
        return None

    def _get_client(self) -> Mistral:
        """Get or create the Mistral client."""
        if self._client is None:
            self._client = Mistral(api_key=self.api_key)
        return self._client

    def _resize_image_if_needed(
        self,
        image_data: bytes,
        max_size: int = MAX_IMAGE_SIZE_BYTES,
    ) -> tuple[bytes, str]:
        """Resize image if it exceeds the maximum size.

        Uses a quality-focused approach: starts with high quality JPEG and
        iteratively reduces scale and quality until the image fits within
        the size limit.

        Args:
            image_data: Raw image bytes.
            max_size: Maximum allowed size in bytes.

        Returns:
            Tuple of (image_bytes, mime_type). If resizing occurred, mime_type
            will be "image/jpeg".
        """
        if len(image_data) <= max_size:
            # Try to detect format from bytes, default to png
            try:
                with Image.open(io.BytesIO(image_data)) as img:
                    fmt = img.format or "PNG"
                    mime_type = f"image/{fmt.lower()}"
                    if mime_type == "image/jpeg":
                        mime_type = "image/jpeg"
            except Exception:
                mime_type = "image/png"
            return image_data, mime_type

        original_size = len(image_data)
        logger.info(
            "Image size (%.2f MB) exceeds limit (%.2f MB), resizing...",
            original_size / (1024 * 1024),
            max_size / (1024 * 1024),
        )

        # Open the image
        with Image.open(io.BytesIO(image_data)) as img:
            # Convert to RGB if necessary (for JPEG compatibility)
            if img.mode in ("RGBA", "P", "LA"):
                # Create white background for transparent images
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            original_width, original_height = img.size
            quality = 95
            scale_factor = 1.0
            min_quality = 70
            min_scale = 0.3

            while True:
                # Calculate new dimensions
                new_width = int(original_width * scale_factor)
                new_height = int(original_height * scale_factor)

                # Resize if scale factor is less than 1
                if scale_factor < 1.0:
                    resized_img = img.resize(
                        (new_width, new_height), Image.Resampling.LANCZOS
                    )
                else:
                    resized_img = img

                # Encode as JPEG
                buffer = io.BytesIO()
                resized_img.save(buffer, format="JPEG", quality=quality, optimize=True)
                result_data = buffer.getvalue()

                if len(result_data) <= max_size:
                    logger.info(
                        "Resized image from %.2f MB to %.2f MB "
                        "(scale: %.0f%%, quality: %d, dimensions: %dx%d)",
                        original_size / (1024 * 1024),
                        len(result_data) / (1024 * 1024),
                        scale_factor * 100,
                        quality,
                        new_width,
                        new_height,
                    )
                    return result_data, "image/jpeg"

                # Try reducing scale first, then quality
                if scale_factor > min_scale:
                    scale_factor -= 0.1
                elif quality > min_quality:
                    quality -= 5
                else:
                    # We've hit minimum settings, return what we have
                    logger.warning(
                        "Could not resize image below %.2f MB "
                        "(minimum settings reached)",
                        len(result_data) / (1024 * 1024),
                    )
                    return result_data, "image/jpeg"

    async def process_image_bytes_async(
        self,
        data: bytes,
        mime_type: str = "image/png",
    ) -> OCRResult:
        """Process an image from bytes asynchronously.

        Args:
            data: Raw image bytes.
            mime_type: MIME type of the image (used as hint, may change if resizing).

        Returns:
            OCRResult containing extracted text and metadata.
        """
        logger.info("Processing image from bytes (%d bytes)", len(data))

        # Resize if needed (mime_type may change to image/jpeg)
        data, mime_type = self._resize_image_if_needed(data)

        base64_data = base64.b64encode(data).decode("utf-8")
        data_url = f"data:{mime_type};base64,{base64_data}"

        client = self._get_client()
        response = await client.ocr.process_async(
            model=self.model,
            document={
                "type": "image_url",
                "image_url": {"url": data_url},
            },
        )

        return self._parse_response(response)

    def _parse_response(self, response) -> OCRResult:
        """Parse the OCR API response into an OCRResult."""
        # Extract text from all pages
        pages = []
        all_text = []

        if hasattr(response, "pages") and response.pages:
            for page in response.pages:
                page_data = {
                    "index": getattr(page, "index", 0),
                    "markdown": getattr(page, "markdown", ""),
                }
                pages.append(page_data)
                if page_data["markdown"]:
                    all_text.append(page_data["markdown"])

        # Get usage info if available
        usage = None
        if hasattr(response, "usage") and response.usage:
            usage = {
                "pages_processed": getattr(response.usage, "pages_processed", 0),
                "doc_size_bytes": getattr(response.usage, "doc_size_bytes", 0),
            }

        return OCRResult(
            text="\n\n".join(all_text),
            pages=pages,
            model=getattr(response, "model", self.model),
            usage=usage,
        )


logger = logging.getLogger(__name__)


def _get_api_key() -> str | None:
    """Get Mistral API key from file or environment.

    Looks for the key in this order:
    1. MISTRAL_API_KEY environment variable
    2. .mistral.ai.key file, searching up the directory tree
    """
    # Check environment variable first
    if api_key := os.getenv("MISTRAL_API_KEY"):
        return api_key

    # Search for .mistral.ai.key file starting from current directory
    # and going up to parent directories
    current = Path.cwd()
    for _ in range(10):  # Search up to 10 levels deep
        key_file = current / ".mistral.ai.key"
        if key_file.exists():
            return key_file.read_text().strip()
        # Go up one directory
        parent = current.parent
        if parent == current:  # Reached root
            break
        current = parent

    return None


class LetterboxOCRService:
    """Service for OCR processing of letter pages."""

    def __init__(self, api_key: str | None = None):
        """Initialize OCR service with Mistral API."""
        self.api_key = api_key or _get_api_key()
        self.client: OCRClient | None = None

    def _get_client(self) -> OCRClient:
        """Get or create OCR client."""
        if self.client is None:
            try:
                self.client = OCRClient(api_key=self.api_key)
                logger.info("✓ Mistral OCR client initialized")
            except ValueError as e:
                logger.error(f"Failed to initialize OCR client: {e}")
                raise
        return self.client

    async def process_page(self, image_data: bytes, page_number: int = 1) -> dict:
        """Process a single page image with OCR.

        Args:
            image_data: Raw image bytes
            page_number: Page number for logging

        Returns:
            Dictionary with OCR results (text, pages, model)
        """
        try:
            client = self._get_client()
            logger.info(f"Processing page {page_number} with OCR...")

            # Process with Mistral
            result: OCRResult = await client.process_image_bytes_async(image_data)

            logger.info(
                f"✓ Page {page_number} OCR complete. "
                f"Extracted {len(result.text)} characters"
            )

            return {
                "text": result.text,
                "page_number": page_number,
                "model": result.model,
                "pages": result.pages,
                "usage": result.usage,
            }
        except Exception as e:
            logger.error(f"Error processing page {page_number}: {e}")
            raise

    async def process_letter(self, page_images: list[bytes]) -> dict:
        """Process multiple pages (letter) with OCR.

        Args:
            page_images: List of image byte arrays

        Returns:
            Dictionary with combined OCR results
        """
        logger.info(f"Processing letter with {len(page_images)} pages...")

        results = []
        combined_text = []

        for idx, image_data in enumerate(page_images, 1):
            try:
                result = await self.process_page(image_data, idx)
                results.append(result)
                combined_text.append(result["text"])
            except Exception as e:
                logger.error(f"Failed to process page {idx}: {e}")
                # Continue processing other pages
                continue

        return {
            "success": len(results) == len(page_images),
            "total_pages": len(page_images),
            "processed_pages": len(results),
            "combined_text": "\n\n---\n\n".join(combined_text),
            "pages": results,
        }

    def is_available(self) -> bool:
        """Check if OCR service is available.

        Returns:
            True if API key is configured, False otherwise
        """
        try:
            self._get_client()
            return True
        except ValueError:
            return False


# Global instance
_ocr_service: LetterboxOCRService | None = None


def get_ocr_service(api_key: str | None = None) -> LetterboxOCRService:
    """Get or create OCR service instance."""
    global _ocr_service
    if _ocr_service is None or not _ocr_service.is_available():
        _ocr_service = LetterboxOCRService(api_key=api_key)
    return _ocr_service
