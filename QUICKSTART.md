# Letterbundle Quick Start Guide

## Prerequisites

- Docker & Docker Compose
- Python 3.14+
- `uv` package manager

## Starting the Application

### 1. Start Docker Services (PostgreSQL + LocalStack)

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

### 2. Start the Backend API

Open a terminal and run:

```bash
cd /home/ryan/projects/letterbox/letterbundle/backend
uv run uvicorn app.main:app --port 8000 --log-level warning
```

The API will be available at: **http://localhost:8000**

### 3. (Optional) Start the Frontend

When frontend dependencies are installed:

```bash
cd /home/ryan/projects/letterbox/letterbundle/frontend
npm install
npm run dev
```

The frontend will be available at: **http://localhost:3000**

---

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

### Get Current User (Protected)

```bash
curl -H "Authorization: Bearer <your_token_here>" \
  http://localhost:8000/api/auth/me
```

---

## Database Management

### Create a Migration

```bash
cd backend
uv run alembic revision --autogenerate -m "description of changes"
```

### Apply Migrations

```bash
cd backend
uv run alembic upgrade head
```

### Rollback Last Migration

```bash
cd backend
uv run alembic downgrade -1
```

---

## Available Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)

### Users
- `GET /api/users/{username}` - Get public profile
- `PUT /api/users/me` - Update own profile (protected)

### Bundles (Coming Soon)
- `GET /api/bundles` - List own bundles (protected)
- `POST /api/bundles` - Create bundle (protected)
- `GET /api/bundles/{id}` - Get bundle details
- `PUT /api/bundles/{id}` - Update bundle (protected)
- `DELETE /api/bundles/{id}` - Delete bundle (protected)

---

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

---

## Environment Configuration

### Backend (.env)
Located in `backend/.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `S3_ENDPOINT_URL` - LocalStack S3 endpoint
- `MISTRAL_API_KEY` - For OCR (not needed for basic testing)

### Frontend (.env.local)
Located in `frontend/.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API URL

---

## What's Running?

| Service | URL | Status |
|---------|-----|--------|
| PostgreSQL | localhost:5432 | Docker |
| LocalStack (S3) | localhost:4566 | Docker |
| Backend API | localhost:8000 | Running |
| Frontend | localhost:3000 | (Optional) |

---

## Next Steps

1. ✅ API is running - ready to build on it
2. Frontend can be started with `npm install && npm run dev`
3. Phase 3: Implement bundle CRUD endpoints and UI
4. Phase 4-5: Letter upload and OCR integration

For more details, see [PROGRESS.md](PROGRESS.md) and [PLAN.md](PLAN.md).
