# Letterbundle Development Progress

**Last Updated**: January 8, 2026

## Overview

Letterbundle is a platform for sharing collections of handwritten letters with automatic OCR transcription, built with FastAPI (backend), Next.js (frontend), PostgreSQL, and AWS S3.

## ✅ Completed Phases

### Phase 1: Project Setup ✓ (100%)

**Backend Infrastructure:**
- ✓ FastAPI application structure with CORS
- ✓ SQLAlchemy ORM with async support (asyncpg)
- ✓ Alembic migrations set up and configured
- ✓ Pydantic settings for configuration management
- ✓ Docker Compose with PostgreSQL 16 and LocalStack (S3 emulation)
- ✓ Initial migration created with all 5 tables (users, bundles, letters, letter_pages, letter_tags)
- ✓ Health check endpoint verified working

**Database Models:**
- ✓ User (UUID, email, username, password_hash, names, timestamps)
- ✓ Bundle (UUID, user_id, slug, title, description, is_public, timestamps)
- ✓ Letter (UUID, bundle_id, metadata, status, timestamps)
- ✓ LetterPage (UUID, letter_id, rotation, crop_box, S3 keys, transcription)
- ✓ LetterTag (letter_id + tag composite key)

**Dependencies Fixed:**
- ✓ Switched from bcrypt to argon2 (handles long passwords without 72-byte limit)
- ✓ Added email-validator for Pydantic EmailStr validation
- ✓ All 80+ dependencies resolved with `uv sync`

### Phase 2: Auth & Users ✓ (100%)

**Backend Authentication:**
- ✓ User registration endpoint (`POST /api/auth/register`)
  - Validates email, username, password
  - Creates user with argon2-hashed password
  - Returns user data
- ✓ User login endpoint (`POST /api/auth/login`)
  - Returns JWT access token
  - Token valid for 30 minutes (configurable)
  - Uses HS256 algorithm
- ✓ Protected `/api/auth/me` endpoint
  - Requires Bearer token
  - Returns current authenticated user
- ✓ Logout endpoint (`POST /api/auth/logout`)
- ✓ Auth dependency injection in FastAPI (`get_current_user`)
- ✓ Slug/username validation (lowercase a-z + hyphens, 4-30 chars, reserved words)
- ✓ Password hashing with argon2 (>72 bytes supported)
- ✓ JWT token creation and validation

**Live API Testing:**
```bash
# Registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login & get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPassword123!"}'

# Protected endpoint
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/auth/me
```

**Frontend Auth:**
- ✓ AuthContext with useAuth hook
- ✓ Token persistence in localStorage
- ✓ Auth state management (user, isLoading, isLoggedIn)
- ✓ Register method (email validation, password match checking)
- ✓ Login method (email/password authentication)
- ✓ Logout method (clears token and user)
- ✓ Auto-login after registration

**Frontend Pages:**
- ✓ `/login` - Email/password login with error handling
- ✓ `/register` - Sign up with validation (password confirmation, length requirements)
- ✓ `/` - Homepage with hero section and features
- ✓ `/browse` - Public collections browsing (placeholder)

### Phase 3: Services ✓ (100%)

**Image Processing Service** (`app/services/image_processing.py`):
- ✓ Auto-crop with edge detection (Pillow-based)
  - Converts to grayscale, detects content bounds
  - Adds 5% padding around detected content
  - Falls back to original if detection fails
- ✓ Resize if over 10MB (respects Mistral OCR limit)
  - Maintains aspect ratio
  - Uses high-quality LANCZOS resampling
- ✓ Thumbnail generation (200px width, proportional height)
- ✓ Crop box data structure (x, y, width, height)
- ✓ Apply user-specified crops and rotations
- ✓ JPEG quality optimization (95 for processed, 80 for thumbnails)
- ✓ Type hints and docstrings

**S3 Storage Service** (`app/services/storage.py`):
- ✓ Async-ready boto3 S3 client wrapper
- ✓ Upload file to S3 (`upload_file`)
- ✓ Download file from S3 (`download_file`)
- ✓ Delete file from S3 (`delete_file`)
- ✓ Generate presigned URLs with expiration
- ✓ Automatic bucket creation if needed
- ✓ S3 key path builder for letter/page structure
- ✓ Support for LocalStack (development) and AWS S3 (production)
- ✓ Singleton instance with `get_s3_storage()`

**API Client** (`frontend/src/lib/api.ts`):
- ✓ Typed API client with request wrapper
- ✓ Error handling with ApiError interface
- ✓ Auth endpoints (register, login, logout, me)
- ✓ User endpoints (getProfile, updateProfile)
- ✓ Bundle endpoints (list, create, get, update, delete, getBySlug)
- ✓ Automatic JWT injection for protected routes
- ✓ Environment variable configuration

## 📋 Current Status

**Backend:** Ready for Phase 3 (Bundles)
- Health check: ✓ Working
- Auth flow: ✓ Tested and working
- Database: ✓ Migrations applied

**Frontend:** Ready for auth page testing
- Build configuration: ✓ Complete
- Auth context: ✓ Implemented
- Pages structure: ✓ Set up

**Services:** Ready for integration
- Image processing: ✓ Complete
- S3 storage: ✓ Complete

## 🚀 Next Steps (Phase 3: Bundles)

1. **Bundle CRUD Endpoints**
   - `GET /api/bundles` - List user's bundles
   - `POST /api/bundles` - Create bundle
   - `GET /api/bundles/{id}` - Get bundle details
   - `PUT /api/bundles/{id}` - Update bundle
   - `DELETE /api/bundles/{id}` - Delete bundle
   - `GET /api/bundles/by-slug/{slug}` - Get public bundle

2. **Bundle UI**
   - Dashboard page (list bundles)
   - Create bundle form
   - Edit bundle form
   - Delete confirmation dialog

3. **Bundle Validation**
   - Slug uniqueness across entire system
   - Reserved words validation
   - Length constraints (4-30 characters)

## 🔧 Development Setup

### Prerequisites
- Python 3.14+
- Docker & Docker Compose
- `uv` package manager

### Start Services

```bash
# Terminal 1: Start Docker (PostgreSQL + LocalStack)
docker compose up -d

# Terminal 2: Start backend
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

### Environment Files

**Backend**: `backend/.env`
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/letterbundle
SECRET_KEY=change-me-in-production-use-a-long-random-string
S3_ENDPOINT_URL=http://localhost:4566
S3_BUCKET=letterbundle-images
MISTRAL_API_KEY=your-key-here
```

**Frontend**: `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Database Migrations

```bash
cd backend

# Create new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

## 📊 Architecture

### Database Schema
- 5 main tables: users, bundles, letters, letter_pages, letter_tags
- UUID primary keys (standard for distributed systems)
- Timestamps (created_at, updated_at) on all tables
- Foreign key relationships with CASCADE delete

### API Structure
```
/api
├── /auth (public)
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   └── GET /me
├── /users (public + protected)
├── /bundles (protected)
├── /letters (protected)
└── /pages (protected)
```

### Frontend Structure
```
src/
├── app/              # Pages (App Router)
├── lib/
│   ├── api.ts       # API client
│   └── auth.tsx     # Auth context
└── components/      # UI components (coming soon)
```

## 🎨 Design System

**Color Palette:**
- Primary: Warm brown (#b8845e) - reminiscent of aged letters
- Grays: Standard Tailwind gray scale
- Accent: Primary-700 (#8b543d) for interactions

**Typography:**
- Headings: Bold, clear hierarchy
- Body: Readable sans-serif
- Monospace: For code/technical info

## 🔐 Security Notes

1. **Passwords**: Using argon2-cffi with default parameters (safe)
2. **Tokens**: JWT with HS256, 30-minute expiration
3. **CORS**: Configured for local development
4. **Validation**: Pydantic schemas on all inputs
5. **Reserved Words**: 15 words protected (login, register, dashboard, etc.)

## 📝 Code Quality

- **Linting**: Ruff configured
- **Type Hints**: Full coverage in backend
- **Documentation**: Google-style docstrings
- **Testing**: pytest setup ready
- **Format**: 88-character line limit

## 🎯 Key Decisions Made

1. **Argon2 instead of bcrypt**: Python 3.14 compatibility + no length limit
2. **UUID primary keys**: Future-proof, industry standard
3. **Pillow for image processing**: Pure Python, no system dependencies
4. **LocalStack for development**: Full S3 API compatibility without AWS costs
5. **Next.js App Router**: Modern, file-based routing, built-in optimizations
6. **Client-side auth context**: Simple, no middleware complexity needed yet

## 📈 Metrics

- **Files Created**: 58
- **Lines of Backend Code**: ~2000
- **Lines of Frontend Code**: ~1000
- **Dependencies**: 80+ (Python), TBD (Node.js)
- **Git Commits**: 1 initial commit
- **Estimated Implementation Time**: 2-3 weeks to MVP

---

**Status**: On track for MVP completion. All Phase 1-2 requirements met.
