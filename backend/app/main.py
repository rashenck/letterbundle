"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, bundles, letters, pages, users
from app.core.config import get_settings
from app.services.storage import get_s3_storage

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Letterbundle application...")

    # Ensure S3 bucket exists
    try:
        storage = get_s3_storage()
        if storage.ensure_bucket_exists():
            logger.info(f"✓ S3 bucket '{storage.bucket_name}' is ready")
        else:
            logger.warning(
                f"⚠️  Failed to ensure S3 bucket '{storage.bucket_name}' exists"
            )
    except Exception as e:
        logger.warning(f"⚠️  Could not initialize S3 storage: {e}")

    yield

    # Shutdown
    logger.info("Shutting down Letterbundle application")


app = FastAPI(
    title=settings.app_name,
    description="A platform for sharing collections of handwritten letters",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(bundles.router, prefix="/api/bundles", tags=["bundles"])
app.include_router(letters.router, prefix="/api/letters", tags=["letters"])
app.include_router(pages.router, prefix="/api/pages", tags=["pages"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.app_name}
