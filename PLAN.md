# Letterbundle - Implementation Plan

**Domain:** letterbundle.com

**Vision:** A platform for sharing collections of handwritten letters, preserving the charm of the originals while making them searchable and accessible.

---

## Table of Contents

- [Technical Stack](#technical-stack)
- [URL Structure](#url-structure)
- [Validation Rules](#validation-rules)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [Image Processing Pipeline](#image-processing-pipeline)
- [Letter Creation Flow](#letter-creation-flow)
- [Project Structure](#project-structure)
- [Implementation Phases](#implementation-phases)
- [Future Features & TODOs](#future-features--todos)
- [Local Development](#local-development)

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js + Tailwind CSS + react-easy-crop |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (AWS RDS) |
| File Storage | AWS S3 |
| Auth | Email + password (JWT) |
| OCR | Mistral AI |
| Image Processing | Pillow (may upgrade to OpenCV later if needed) |
| Background Tasks | FastAPI BackgroundTasks (upgrade to Celery/ARQ later if needed) |
| Local Dev | Docker Compose (PostgreSQL, LocalStack) |
| Hosting | AWS (CloudFront, S3, ECS/Fargate, RDS) |

---

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

---

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

---

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

---

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

---

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

---

## Letter Creation Flow

### Step 1: Upload Pages

```
┌─────────────────────────────────────────────────────────────────────┐
│  Add Letter                                                         │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │        📄 Drop images here or click to upload               │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Pages (drag to reorder):                                           │
│                                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐                                      │
│  │ ┌──┐ │  │ ┌──┐ │  │ ┌──┐ │                                      │
│  │ │1 │ │  │ │2 │ │  │ │3 │ │                                      │
│  │ └──┘ │  │ └──┘ │  │ └──┘ │                                      │
│  │ ↻ ✂ ×│  │ ↻ ✂ ×│  │ ↻ ✂ ×│                                      │
│  └──────┘  └──────┘  └──────┘                                      │
│                                                                     │
│  ↻ Rotate  ✂ Adjust crop  × Remove                                 │
│                                                                     │
│                              [Submit for Processing]                │
└─────────────────────────────────────────────────────────────────────┘
```

### Crop Editor Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  Adjust Crop - Page 1                                    [×]        │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │     ┌─────────────────────────────────────────────┐         │   │
│  │     │ ○─────────────────────────────────────────○ │         │   │
│  │     │ │                                         │ │         │   │
│  │     │ │        [Letter content area]            │ │         │   │
│  │     │ │                                         │ │         │   │
│  │     │ │         Drag corners to adjust          │ │         │   │
│  │     │ │                                         │ │         │   │
│  │     │ ○─────────────────────────────────────────○ │         │   │
│  │     └─────────────────────────────────────────────┘         │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│            [Cancel]    [Reset to Auto]    [Apply]                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2: Processing

```
┌─────────────────────────────────────────────────────────────────────┐
│  Processing Letter                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│                    ⏳ Running OCR on 3 pages...                     │
│                                                                     │
│                    ████████████░░░░░░░░  Page 2 of 3                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 3: Review & Edit

```
┌─────────────────────────────────────────────────────────────────────┐
│  Edit Letter                                                        │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Date          Author          Recipient        Location    │   │
│  │  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │   │
│  │  │          │  │            │  │            │  │          │ │   │
│  │  └──────────┘  └────────────┘  └────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Page 1 of 3                           [<] [1] [2] [3] [>]  │   │
│  │  ┌───────────────────┐  ┌───────────────────────────────┐   │   │
│  │  │                   │  │ Transcription:                │   │   │
│  │  │                   │  │ ┌───────────────────────────┐ │   │   │
│  │  │  [Page 1 image]   │  │ │ Jan. 1945                 │ │   │   │
│  │  │                   │  │ │ Monday                    │ │   │   │
│  │  │                   │  │ │ Lemoyne, Pa               │ │   │   │
│  │  │                   │  │ │                           │ │   │   │
│  │  │                   │  │ │ Dearest Darling,          │ │   │   │
│  │  │                   │  │ │                           │ │   │   │
│  │  │                   │  │ │ I'm writing you today...  │ │   │   │
│  │  │                   │  │ └───────────────────────────┘ │   │   │
│  │  └───────────────────┘  └───────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Notes                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ This was written during WWII while grandpa was stationed... │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Tags                                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [WWII] [grandparents] [love-letters] [+]                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                         [Save Draft]    [Save & Add Another]        │
└─────────────────────────────────────────────────────────────────────┘
```

### Letter Status Flow

```
   Upload pages
        │
        ▼
    ┌───────┐     Submit for processing     ┌────────────┐
    │ draft │ ─────────────────────────────►│ processing │
    └───────┘                               └─────┬──────┘
        ▲                                         │
        │           OCR complete                  │
        │                                         ▼
        │                                   ┌───────────┐
        └───────── (edit pages) ───────────│   ready   │
                                           └───────────┘
```

---

## Project Structure

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
│   │   │   ├── ocr.py              # Mistral OCR (from openletterbox)
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

---

## Implementation Phases

### Phase 1: Project Setup (Days 1-2)

- [ ] Rename project directory to `letterbundle`
- [ ] Set up monorepo structure
- [ ] Initialize Next.js frontend with Tailwind
- [ ] Initialize FastAPI backend with project structure
- [ ] Set up Docker Compose (PostgreSQL, LocalStack)
- [ ] Configure environment variables
- [ ] Move OCR client code to `backend/app/services/ocr.py`
- [ ] Basic health check endpoints

### Phase 2: Auth & Users (Days 3-4)

- [ ] User model + Alembic migration
- [ ] Password hashing (passlib + bcrypt)
- [ ] JWT token generation/validation
- [ ] Auth endpoints (register, login, logout, me)
- [ ] Username/slug validation utilities
- [ ] Login page
- [ ] Register page (username, email, password, first_name, last_name)
- [ ] Auth context/hooks in frontend
- [ ] Protected route middleware

### Phase 3: Bundles (Days 5-6)

- [ ] Bundle model + migration
- [ ] Bundle CRUD endpoints
- [ ] Slug uniqueness validation
- [ ] Dashboard page (list own bundles)
- [ ] Create bundle page
- [ ] Edit bundle page
- [ ] Delete bundle confirmation

### Phase 4: Letters & Pages - Core (Days 7-10)

- [ ] Letter and LetterPage models + migrations
- [ ] S3 storage service
- [ ] Image processing service (Pillow-based)
  - [ ] Auto-crop implementation
  - [ ] Resize if >10MB
  - [ ] Thumbnail generation
- [ ] Page upload endpoint (with background processing)
- [ ] Letter CRUD endpoints
- [ ] Page management endpoints

### Phase 5: Letters & Pages - UI (Days 11-14)

- [ ] Page uploader component (drag & drop)
- [ ] Page thumbnail component (with rotate/crop/delete)
- [ ] Crop editor modal (react-easy-crop)
- [ ] Page reordering (drag & drop)
- [ ] Add letter page (upload flow)
- [ ] Processing status polling
- [ ] Edit letter page (metadata + per-page transcription)
- [ ] Letter list within bundle

### Phase 6: Public Views (Days 15-17)

- [ ] Public bundle view page
- [ ] Letter viewer component (image + transcription)
- [ ] User profile page
- [ ] Browse public bundles page
- [ ] Homepage (hero, featured bundles)

### Phase 7: Polish (Days 18-20)

- [ ] Loading states throughout
- [ ] Error handling and user feedback
- [ ] Responsive design
- [ ] Form validation messages
- [ ] Empty states
- [ ] Basic 404 page

### Phase 8: AWS Deployment (Future)

- [ ] Set up AWS infrastructure
- [ ] CI/CD pipeline
- [ ] Domain configuration
- [ ] Production environment

---

## Future Features & TODOs

### Security & Trust

- [ ] Virus scanning on upload (ClamAV or AWS-based)
- [ ] S3 bucket scanning (periodic or on-access)
- [ ] Content approval workflow for bundles (per-bundle approval before public)
- [ ] Admin moderation dashboard
- [ ] IP address capture and logging for users
- [ ] Rate limiting (API and uploads)

### Operational Controls

- [ ] Enable/disable new user registration
- [ ] Enable/disable user logins (maintenance mode)
- [ ] Site settings admin panel
- [ ] Status/metrics page (admin)
- [ ] Admin role system

### Content Features

- [ ] People profiles (letter writers/recipients with photos)
- [ ] Link letters to people
- [ ] People gallery in bundle view
- [ ] Envelope image support (separate from letter pages)

### Polish & Branding

- [ ] Mascot design
- [ ] Cute 404 page ("lost letter" theme)
- [ ] Friendly error pages (500, 403, maintenance)
- [ ] Custom maintenance mode page

### Technical Improvements

- [ ] Image processing upgrade to OpenCV (if Pillow auto-crop insufficient)
- [ ] Background task upgrade to Celery/ARQ (if BackgroundTasks insufficient)
- [ ] Metadata auto-extraction from OCR text (LLM-based)
- [ ] Full-text search across letters
- [ ] Export bundles (PDF/ZIP)

### Social Features (Future)

- [ ] Comments on public bundles
- [ ] Likes/bookmarks
- [ ] User following
- [ ] Activity feed

---

## Local Development

### Prerequisites

- Python 3.14+
- Node.js 20+
- Docker & Docker Compose
- uv (Python package manager)

### Setup

```bash
# Clone and enter directory
cd letterbundle

# Start services (PostgreSQL, LocalStack)
docker-compose up -d

# Backend setup
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

See `.env.example` for required configuration:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/letterbundle

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS/LocalStack
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
S3_BUCKET=letterbundle-images
S3_ENDPOINT_URL=http://localhost:4566  # LocalStack

# Mistral AI
MISTRAL_API_KEY=your-mistral-key
```

### Common Commands

```bash
# Run backend tests
cd backend && uv run pytest

# Run frontend tests
cd frontend && npm test

# Create new migration
cd backend && uv run alembic revision --autogenerate -m "description"

# Apply migrations
cd backend && uv run alembic upgrade head

# Format code
cd backend && uv run ruff format .
cd frontend && npm run format

# Lint
cd backend && uv run ruff check .
cd frontend && npm run lint
```

---

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
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │     S3      │
                   │  (Images)   │
                   └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Mistral AI  │
                   │   (OCR)     │
                   └─────────────┘
```

---

*Last updated: January 2026*
