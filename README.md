# LetterBundle

A platform for sharing collections of handwritten letters, preserving the charm of the originals while making them searchable and accessible.

**Domain:** letterbundle.com

## What is LetterBundle?

LetterBundle allows users to:
- Upload scanned handwritten letters
- Automatically transcribe text using AI (Mistral OCR)
- Organize letters into collections (bundles)
- Share collections publicly or keep them private
- Browse and discover other users' public collections

## Current Status

✅ **MVP Complete** - Full-stack application with OCR integration, user authentication, and polished UI/UX.

**Live Demo:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Quick Start

See [Setup Guide](docs/SETUP.md) for complete installation instructions.

```bash
# Start all services
docker compose up -d

# Backend
cd backend && uv sync && uv run uvicorn app.main:app --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete installation and development setup
- **[Development](docs/DEVELOPMENT.md)** - Current status, completed features, next steps
- **[Architecture](docs/ARCHITECTURE.md)** - Technical stack, data models, system design
- **[API Reference](docs/API.md)** - Complete REST API documentation
- **[Roadmap](docs/ROADMAP.md)** - Implementation phases and future features
- **[Agent Logs](docs/agent_logs/)** - AI agent change history and artifacts

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.14, SQLAlchemy
- **Database:** PostgreSQL with async support
- **Storage:** AWS S3 (LocalStack for development)
- **OCR:** Mistral AI
- **Auth:** JWT tokens with Argon2 password hashing
- **Deployment:** Docker containerization

## Features

- ✅ User registration and authentication
- ✅ Bundle creation and management
- ✅ Letter upload with multi-page support
- ✅ Automatic OCR transcription
- ✅ Image processing (crop, resize, thumbnails)
- ✅ Public/private collection sharing
- ✅ Responsive web interface
- ✅ Real-time processing status
- ✅ GDPR-compliant privacy practices

## Contributing

See [AGENTS.md](AGENTS.md) for AI coding agent guidelines and [Development](docs/DEVELOPMENT.md) for current status.

## License

[Add license information here]

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
