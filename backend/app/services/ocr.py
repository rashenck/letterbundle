"""OCR service for processing letter page images."""

import logging
import os
import sys
from pathlib import Path

# Add openletterbox to path first
openletterbox_path = Path("/home/ryan/projects/letterbox/openletterbox")
if str(openletterbox_path) not in sys.path:
    sys.path.insert(0, str(openletterbox_path))

from openletterbox.ocr import OCRClient, OCRResult  # noqa: E402

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
            result: OCRResult = client.process_image(image_data)

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
    if _ocr_service is None:
        _ocr_service = LetterboxOCRService(api_key=api_key)
    return _ocr_service
