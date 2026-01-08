# Letterbundle

A platform for sharing collections of handwritten letters, preserving the charm of the originals while making them searchable and accessible.

**Domain:** letterbundle.com

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- uv (Python package manager)

### Setup

1. **Start services (PostgreSQL, LocalStack S3):**
   ```bash
   docker-compose up -d
   ```

2. **Backend setup:**
   ```bash
   cd backend
   cp ../.env.example .env
   # Edit .env with your settings (especially MISTRAL_API_KEY)
   uv sync
   uv run alembic upgrade head
   uv run uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend setup (in another terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Development

### Common Commands

```bash
# Start/stop services
docker-compose up -d
docker-compose down

# Backend
cd backend
uv run uvicorn app.main:app --reload      # Run dev server
uv run pytest                              # Run tests
uv run ruff check .                        # Lint
uv run ruff format .                       # Format
uv run alembic revision --autogenerate -m "description"  # Create migration
uv run alembic upgrade head                # Apply migrations

# Frontend
cd frontend
npm run dev      # Run dev server
npm run build    # Build for production
npm run lint     # Lint
npm test         # Run tests
```

### Project Structure

```
letterbundle/
├── frontend/          # Next.js application
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── core/      # Config, database, security
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic
│   ├── alembic/       # Database migrations
│   └── tests/
├── docker-compose.yml
└── PLAN.md            # Detailed implementation plan
```

## Features

- **User accounts** - Register, login, manage profile
- **Bundles** - Create collections of letters with unique URLs
- **Letters** - Upload images of handwritten letters
- **OCR** - Automatic text extraction using Mistral AI
- **Image processing** - Auto-crop, resize, thumbnails
- **Public sharing** - Share bundles with unique URLs like `letterbundle.com/grandmas-letters`

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS, React
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Storage:** AWS S3 (LocalStack for dev)
- **OCR:** Mistral AI
- **Auth:** JWT tokens

## License

[Add license here]
