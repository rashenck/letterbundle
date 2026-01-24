"""Application configuration."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Letterbundle"
    debug: bool = False

    # Database
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/letterbundle"
    )

    # JWT Authentication
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # AWS / S3
    aws_access_key_id: str = "test"
    aws_secret_access_key: str = "test"
    aws_region: str = "us-east-1"
    s3_bucket: str = "letterbundle-images"
    s3_endpoint_url: str | None = None  # Set for LocalStack

    # Mistral AI
    mistral_api_key: str = ""

    # Email Configuration
    smtp_server: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True
    from_email: str | None = None
    frontend_url: str = "http://localhost:3000"

    # Validation
    min_slug_length: int = 4
    max_slug_length: int = 30
    min_username_length: int = 4
    max_username_length: int = 30

    # Reserved slugs/usernames
    reserved_words: list[str] = [
        "login",
        "register",
        "dashboard",
        "api",
        "browse",
        "u",
        "admin",
        "settings",
        "help",
        "about",
        "contact",
        "terms",
        "privacy",
        "status",
    ]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
