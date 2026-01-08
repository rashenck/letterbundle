# Letterbundle Backend

FastAPI backend for the Letterbundle platform.

## Setup

```bash
uv sync
cp ../.env.example .env
# Edit .env with your settings
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
