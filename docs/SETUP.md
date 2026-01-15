# LetterBundle Setup Guide

This guide covers the complete setup process for running LetterBundle locally.

## Prerequisites

- Python 3.14+
- Node.js 20+
- Docker & Docker Compose
- uv (Python package manager)

## Quick Setup

### 1. Start Docker Services (PostgreSQL + LocalStack S3)

```bash
cd /home/ryan/projects/letterbox/letterbundle
docker compose up -d
```

Verify services are running:
```bash
docker compose ps
# Should show:
# - letterbundle-postgres (healthy)
# - letterbundle-localstack (healthy)
```

### 2. Backend Setup

```bash
cd backend
cp ../.env.example .env
# Edit .env with your settings (especially MISTRAL_API_KEY)
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup (in another terminal)

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Environment Configuration

### Backend (.env)

Located in `backend/.env`:

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

### Frontend (.env.local)

Located in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Development Workflow

### Common Commands

```bash
# Start/stop services
docker compose up -d
docker compose down

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

### Database Management

```bash
cd backend

# Create new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback last migration
uv run alembic downgrade -1
```

### Git Configuration

Configure git to use the commit message template:

```bash
# This is already configured globally, but if needed locally:
git config commit.template .git-commit-template.txt
```

Use the template for all commits to ensure consistent formatting.

## API Testing

### Health Check

```bash
curl http://localhost:8000/api/health
```

Response:
```json
{"status":"healthy","app":"Letterbundle"}
```

### Register a User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "myusername",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

Returns:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Protected Endpoint

```bash
curl -H "Authorization: Bearer <your_token_here>" \
  http://localhost:8000/api/auth/me
```

## Troubleshooting

### "Connection refused" on localhost:8000

Make sure the backend is running:
```bash
# Check if uvicorn process exists
ps aux | grep uvicorn

# Or manually start it
cd backend
uv run uvicorn app.main:app --port 8000
```

### Database connection errors

Verify PostgreSQL is running:
```bash
docker compose ps
# Should show postgres with status "Up (healthy)"
```

### "Module not found" errors

Make sure you're using `uv run` for Python commands:
```bash
# ✓ Correct
cd backend && uv run python script.py

# ✗ Wrong
cd backend && python script.py
```

## Project Structure

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
├── docs/              # Documentation
└── AGENTS.md          # Agent guidelines
```

## What's Running?

| Service | URL | Status |
|---------|-----|--------|
| PostgreSQL | localhost:5432 | Docker |
| LocalStack (S3) | localhost:4566 | Docker |
| Backend API | localhost:8000 | Running |
| Frontend | localhost:3000 | (Optional) |
| API Docs | localhost:8000/docs | Running |

## Next Steps

1. ✅ API is running - ready to build on it
2. Frontend can be started with `npm install && npm run dev`
3. Phase 4: Implement OCR integration
4. Phase 5: Public bundle viewing

For more details, see [DEVELOPMENT.md](DEVELOPMENT.md) and [ROADMAP.md](ROADMAP.md).