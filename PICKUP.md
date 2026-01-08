## Prompt for Continuing Letterbundle Development

---

**Project:** Letterbundle - A platform for sharing handwritten letter collections (letterbundle.com)

**Location:** `/home/ryan/projects/letterbox/letterbundle/`

---

### What Was Completed

#### 1. OCR Client (Separate Package)
Location: `/home/ryan/projects/letterbox/openletterbox/`
- Built `openletterbox/ocr.py` with `OCRClient` class using Mistral AI's OCR API
- Handles images and PDFs, auto-resizes files >10MB
- Has async variants of all methods
- 23 passing tests in `tests/test_ocr.py`
- Successfully tested on a 20MB image

#### 2. Comprehensive Project Plan
File: `/home/ryan/projects/letterbox/letterbundle/PLAN.md`
- Detailed multi-phase implementation plan
- Tech stack: FastAPI backend, Next.js + Tailwind frontend, PostgreSQL, S3, Mistral OCR
- Data models, API endpoints, URL structure all documented

#### 3. Backend Structure (Created but not yet running)
Location: `/home/ryan/projects/letterbox/letterbundle/backend/`

**Files created:**
- `pyproject.toml` - All dependencies (FastAPI, SQLAlchemy, asyncpg, Pillow, mistralai, boto3, etc.)
- `app/core/config.py` - Settings with pydantic-settings
- `app/core/database.py` - Async SQLAlchemy setup
- `app/core/security.py` - JWT auth, password hashing, slug validation
- `app/models/` - User, Bundle, Letter, LetterPage, LetterTag SQLAlchemy models
- `app/schemas/` - Pydantic schemas for all models
- `app/api/` - Routers for auth, users, bundles, letters, pages
- `app/api/deps.py` - Auth dependencies (get_current_user)
- `app/main.py` - FastAPI app with CORS
- `alembic/` - Migration setup configured
- `docker-compose.yml` - PostgreSQL + LocalStack (S3 emulation)
- `.env.example` - Environment variable template

**Dependencies installed** via `uv sync` (63 packages)

---

### What Needs to Be Done Next

#### Immediate Next Steps (Phase 1 completion):
1. **Create `.env` file** from `.env.example` with actual values
2. **Start Docker services**: `docker-compose up -d` (PostgreSQL + LocalStack)
3. **Create initial Alembic migration**: `alembic revision --autogenerate -m "initial"`
4. **Run migrations**: `alembic upgrade head`
5. **Test API works**: `uvicorn app.main:app --reload` and hit endpoints

#### Then Continue With:
- **Phase 2**: Create Next.js frontend with Tailwind, implement auth UI
- **Phase 3**: Bundle CRUD UI
- **Phase 4-5**: Letter/page upload with image processing and OCR integration
- **Phase 6**: Public bundle views
- **Phase 7**: Polish

---

### Key Design Decisions to Remember
- **Bundle slugs are globally unique** (not per-user) - e.g., `letterbundle.com/grandmas-letters`
- **Usernames**: lowercase a-z + hyphens only, 4-30 chars, set at registration, immutable
- **Image processing**: Background tasks for auto-crop, resize, thumbnails
- **Letter status workflow**: draft → processing → ready
- **OCR client** from openletterbox package will be integrated into backend services

---

### Key Commands
```bash
cd /home/ryan/projects/letterbox/letterbundle/backend
docker-compose -f ../docker-compose.yml up -d
source .venv/bin/activate  # or use uv run
alembic revision --autogenerate -m "initial"
alembic upgrade head
uvicorn app.main:app --reload
```

---

### Reference Files
- `PLAN.md` - Full implementation roadmap
- `backend/app/models/` - All database models
- `backend/app/api/` - All API endpoints
- `/home/ryan/projects/letterbox/openletterbox/openletterbox/ocr.py` - OCR client to integrate
