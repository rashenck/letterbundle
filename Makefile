.PHONY: help install dev up down migrate backend frontend test backend-test lint format

help:
	@echo "Letterbundle Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install    - Install all dependencies"
	@echo "  make up         - Start Docker services"
	@echo "  make down       - Stop Docker services"
	@echo "  make migrate    - Run database migrations"
	@echo ""
	@echo "Development:"
	@echo "  make dev        - Start both backend and frontend (requires tmux or two terminals)"
	@echo "  make backend    - Start backend server"
	@echo "  make frontend   - Start frontend server"
	@echo ""
	@echo "Quality:"
	@echo "  make test       - Run all tests"
	@echo "  make backend-test - Run backend tests inside Docker"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"

install:
	cd backend && uv sync
	cd frontend && npm install

up:
	docker-compose up -d

down:
	docker-compose down

migrate:
	cd backend && uv run alembic upgrade head

backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && uv run pytest
	cd frontend && npm test

backend-test:
    docker-compose build backend-tests
	docker compose run --rm backend-tests

lint:
	cd backend && uv run ruff check .
	cd frontend && npm run lint

format:
	cd backend && uv run ruff format .
	cd frontend && npm run format
