"""S3 storage service for image and file uploads."""

from typing import Optional

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()


class S3Storage:
    """Handle S3 file uploads and retrieval."""

    def __init__(self):
        """Initialize S3 client with configured credentials."""
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url if settings.s3_endpoint_url else None,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        self.bucket_name = settings.s3_bucket

    def upload_file(self, file_data: bytes, s3_key: str) -> bool:
        """Upload file to S3.

        Args:
            file_data: Raw file bytes
            s3_key: S3 object key (path)

        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_data,
            )
            return True
        except ClientError as e:
            print(f"Error uploading to S3: {e}")
            return False

    def download_file(self, s3_key: str) -> Optional[bytes]:
        """Download file from S3.

        Args:
            s3_key: S3 object key (path)

        Returns:
            File bytes if successful, None otherwise
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return response["Body"].read()
        except ClientError as e:
            print(f"Error downloading from S3: {e}")
            return None

    def delete_file(self, s3_key: str) -> bool:
        """Delete file from S3.

        Args:
            s3_key: S3 object key (path)

        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            print(f"Error deleting from S3: {e}")
            return False

    def get_presigned_url(
        self, s3_key: str, expiration_seconds: int = 3600
    ) -> Optional[str]:
        """Get presigned URL for file access.

        Args:
            s3_key: S3 object key (path)
            expiration_seconds: How long URL is valid (default 1 hour)

        Returns:
            Presigned URL if successful, None otherwise
        """
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": s3_key},
                ExpiresIn=expiration_seconds,
            )
            return url
        except ClientError as e:
            print(f"Error generating presigned URL: {e}")
            return None

    def ensure_bucket_exists(self) -> bool:
        """Create bucket if it doesn't exist.

        Returns:
            True if bucket exists or was created, False otherwise
        """
        try:
            # Check if bucket exists
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            return True
        except ClientError:
            # Bucket doesn't exist, try to create it
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
                return True
            except ClientError as e:
                print(f"Error creating bucket: {e}")
                return False

    def build_s3_key(
        self, letter_id: str, page_id: str, version: str = "original"
    ) -> str:
        """Build S3 key for letter page image.

        Args:
            letter_id: Letter UUID
            page_id: Page UUID
            version: Image version (original, processed, thumbnail)

        Returns:
            S3 key path
        """
        extension = self._get_extension_for_version(version)
        return f"letters/{letter_id}/pages/{page_id}/{version}{extension}"

    @staticmethod
    def _get_extension_for_version(version: str) -> str:
        """Get file extension for image version.

        Args:
            version: Image version (original, processed, thumbnail)

        Returns:
            File extension including dot
        """
        # Original might be any format, but processed/thumbnail are always JPEG
        if version == "original":
            return ".jpg"  # Default to jpg, but could be detected from upload
        return ".jpg"


# Global instance for easy access
_s3_storage: Optional[S3Storage] = None


def get_s3_storage() -> S3Storage:
    """Get or create S3 storage instance."""
    global _s3_storage
    if _s3_storage is None:
        _s3_storage = S3Storage()
    return _s3_storage
