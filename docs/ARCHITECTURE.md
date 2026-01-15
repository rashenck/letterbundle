# LetterBundle Architecture

This document describes the technical architecture of the LetterBundle platform.

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + Tailwind CSS + react-easy-crop |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (AWS RDS) |
| File Storage | AWS S3 |
| Auth | Email + password (JWT) |
| OCR | Mistral AI |
| Image Processing | Pillow (may upgrade to OpenCV later if needed) |
| Background Tasks | FastAPI BackgroundTasks (upgrade to Celery/ARQ later if needed) |
| Local Dev | Docker Compose (PostgreSQL, LocalStack) |
| Hosting | AWS (CloudFront, S3, ECS/Fargate, RDS) |

## URL Structure

```
letterbundle.com/                          # Homepage
letterbundle.com/browse                    # Browse public bundles
letterbundle.com/[slug]                    # Public bundle view (globally unique slug)
letterbundle.com/u/[username]              # User profile
letterbundle.com/login
letterbundle.com/register
letterbundle.com/dashboard                 # Authenticated area
letterbundle.com/dashboard/bundles/new
letterbundle.com/dashboard/bundles/[id]
letterbundle.com/dashboard/bundles/[id]/letters/new
letterbundle.com/dashboard/bundles/[id]/letters/[id]
letterbundle.com/dashboard/settings
```

## Validation Rules

### Slugs (bundles)

- Lowercase letters (a-z) and hyphens only
- 4-30 characters
- Globally unique
- Reserved words: `login`, `register`, `dashboard`, `api`, `browse`, `u`, `admin`, `settings`, `help`, `about`, `contact`, `terms`, `privacy`, `status`

### Usernames

- Lowercase letters (a-z) and hyphens only
- 4-30 characters
- Globally unique
- Set at registration, not editable
- Same reserved words as slugs

## Data Model

```sql
-- users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- bundles
CREATE TABLE bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- letters
CREATE TABLE letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
    date_written DATE,
    author VARCHAR(255),
    recipient VARCHAR(255),
    location VARCHAR(255),
    transcription TEXT,           -- Combined from all pages
    notes TEXT,
    order_index INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, processing, ready
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- letter_pages
CREATE TABLE letter_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    rotation INTEGER DEFAULT 0,   -- 0, 90, 180, 270
    crop_box JSONB,               -- {x, y, width, height} or null
    s3_key_original VARCHAR(512) NOT NULL,
    s3_key_processed VARCHAR(512),
    s3_key_thumbnail VARCHAR(512),
    transcription TEXT,           -- Per-page OCR text
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- letter_tags
CREATE TABLE letter_tags (
    letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (letter_id, tag)
);
```

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │    bundles      │       │    letters      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (uuid) PK    │──┐    │ id (uuid) PK    │──┐    │ id (uuid) PK    │
│ email           │  │    │ user_id FK      │◄─┘    │ bundle_id FK    │◄─┐
│ username        │  │    │ slug (unique)   │       │ date_written    │  │
│ password_hash   │  │    │ title           │       │ author          │  │
│ first_name      │  │    │ description     │       │ recipient       │  │
│ last_name       │  │    │ is_public       │       │ location        │  │
│ created_at      │  └───►│ created_at      │──────►│ transcription   │  │
│ updated_at      │       │ updated_at      │       │ notes           │  │
└─────────────────┘       └─────────────────┘       │ order_index     │  │
                                                   │ status          │  │
                                                   │ created_at      │  │
┌─────────────────┐                                 │ updated_at      │  │
│  letter_pages   │                                 └─────────────────┘  │
├─────────────────┤                                                      │
│ id (uuid) PK    │                                                      │
│ letter_id FK    │◄─────────────────────────────────────────────────────┘
│ page_number     │
│ rotation        │
│ crop_box        │
│ s3_key_original │
│ s3_key_processed│
│ s3_key_thumbnail│
│ transcription   │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│  letter_tags    │
├─────────────────┤
│ letter_id FK    │
│ tag             │
└─────────────────┘
```

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (email, username, password, first_name, last_name) |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/{username}` | Get public profile |
| PUT | `/api/users/me` | Update own profile (first_name, last_name, email) |

### Bundles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bundles` | List own bundles |
| POST | `/api/bundles` | Create bundle |
| GET | `/api/bundles/{id}` | Get bundle details |
| GET | `/api/bundles/by-slug/{slug}` | Get bundle by slug (public) |
| PUT | `/api/bundles/{id}` | Update bundle |
| DELETE | `/api/bundles/{id}` | Delete bundle |
| GET | `/api/bundles/public` | Browse public bundles |
| GET | `/api/users/{username}/bundles` | User's public bundles |

### Letters

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bundles/{id}/letters` | List letters in bundle |
| POST | `/api/bundles/{id}/letters` | Create letter (status=draft) |
| GET | `/api/letters/{id}` | Get letter details |
| PUT | `/api/letters/{id}` | Update letter metadata |
| DELETE | `/api/letters/{id}` | Delete letter |
| PUT | `/api/bundles/{id}/letters/reorder` | Reorder letters |
| POST | `/api/letters/{id}/process` | Submit for OCR (async) |

### Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/letters/{id}/pages` | Upload page(s) - triggers async processing |
| PUT | `/api/letters/{id}/pages/reorder` | Reorder pages |
| PUT | `/api/pages/{id}` | Update page (rotation, crop_box, transcription) |
| PUT | `/api/pages/{id}/crop` | Apply new crop - triggers async reprocessing |
| DELETE | `/api/pages/{id}` | Delete page |
| GET | `/api/pages/{id}/image/{version}` | Get image URL (original/processed/thumbnail) |

## Image Processing Pipeline

### Overview

```
Upload → [Background Task] → Store Original → Auto-Crop → Resize if >10MB → Generate Thumbnail → Store All
```

### Processing Service (Pillow-based)

```python
class ImageProcessor:
    """Process uploaded letter page images using Pillow."""

    MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB (Mistral OCR limit)
    THUMBNAIL_WIDTH = 200
    JPEG_QUALITY = 95

    def process_upload(self, image_data: bytes) -> ProcessedImage:
        """
        Full processing pipeline:
        1. Store original
        2. Auto-crop (edge detection)
        3. Resize if over 10MB
        4. Generate thumbnail
        """

    def auto_crop(self, image: Image) -> tuple[Image, CropBox | None]:
        """
        Attempt to detect paper edges and crop.
        Uses Pillow-based approach:
        1. Convert to grayscale
        2. Find bounding box of non-background content
        3. Add small padding
        Returns cropped image and crop box, or original if detection fails.
        """

    def apply_crop(self, image_data: bytes, crop_box: CropBox, rotation: int) -> bytes:
        """Apply user-specified crop and rotation to original image."""

    def resize_if_needed(self, image_data: bytes) -> tuple[bytes, str]:
        """Resize if over 10MB (existing logic from OCR client)."""

    def generate_thumbnail(self, image: Image) -> bytes:
        """Generate small thumbnail for UI."""
```

### S3 Storage Structure

```
letterbundle-images/
└── letters/
    └── {letter_id}/
        └── pages/
            └── {page_id}/
                ├── original.{ext}    # Untouched upload
                ├── processed.jpg     # Cropped, resized
                └── thumbnail.jpg     # Small preview
```

## Architecture Diagrams

### AWS Production Architecture (Future)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CloudFront                                │
│                         (CDN + HTTPS)                               │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │  S3 Bucket    │               │  ALB          │
      │  (Frontend)   │               │  (API)        │
      └───────────────┘               └───────┬───────┘
                                              │
                                      ┌───────▼───────┐
                                      │  ECS Fargate  │
                                      │  (FastAPI)    │
                                      └───────┬───────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
              ┌───────────────┐                               ┌───────────────┐
              │  RDS          │                               │  S3 Bucket    │
              │  (PostgreSQL) │                               │  (Images)     │
              └───────────────┘                               └───────────────┘
```

### Request Flow

```
User Request
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────►│   FastAPI   │────►│  PostgreSQL │
│  (Frontend) │     │  (Backend)  │     │  (Database) │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ Tailwind    │     │     S3      │
│    CSS      │     │  (Images)   │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Mistral AI  │
                    │   (OCR)     │
                    └─────────────┘
```

### Project Structure

```
letterbundle/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx                    # Homepage
│   │   │   │   ├── [slug]/page.tsx             # Public bundle view
│   │   │   │   ├── u/[username]/page.tsx       # User profile
│   │   │   │   ├── browse/page.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx                    # My bundles
│   │   │   │   ├── bundles/
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx            # Edit bundle
│   │   │   │   │       └── letters/
│   │   │   │   │           ├── new/page.tsx    # Upload letter
│   │   │   │   │           └── [id]/page.tsx   # Edit letter
│   │   │   │   └── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── letters/
│   │   │   │   ├── PageUploader.tsx
│   │   │   │   ├── PageThumbnail.tsx
│   │   │   │   ├── CropEditor.tsx
│   │   │   │   ├── PageEditor.tsx
│   │   │   │   └── LetterViewer.tsx
│   │   │   └── bundles/
│   │   │       ├── BundleCard.tsx
│   │   │       └── BundleEditor.tsx
│   │   └── lib/
│   │       ├── api.ts
│   │       └── auth.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── bundles.py
│   │   │   ├── letters.py
│   │   │   └── pages.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── bundle.py
│   │   │   ├── letter.py
│   │   │   └── page.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── bundle.py
│   │   │   ├── letter.py
│   │   │   └── page.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ocr.py              # Mistral OCR
│   │   │   ├── storage.py          # S3 operations
│   │   │   └── image_processing.py # Crop, resize, thumbnail
│   │   └── main.py
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   └── alembic.ini
│   ├── tests/
│   └── pyproject.toml
│
├── docker-compose.yml              # PostgreSQL, LocalStack
├── .env.example
├── Makefile                        # Common commands
└── README.md
```