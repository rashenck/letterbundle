FROM python:3.14-slim as base

# Tell uv to create the venv here instead of /app/.venv(docker-compose overwrites the /app mount)
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Dependencies are installed at build time into /opt/venv.
# Source code is mounted at runtime via docker-compose volume.
# Run `docker-compose up --build` after changing pyproject.toml dependencies.
RUN uv sync --frozen --no-install-project

# Copy API key file if it exists
COPY ../.mistral.ai.key* ./

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM base as dev

RUN uv sync --frozen --no-install-project --extra dev