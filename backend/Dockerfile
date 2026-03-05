FROM python:3.14-slim as base

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install dependencies
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

RUN uv sync --frozen --extra dev

# Add venv to PATH so pytest is found directly
ENV PATH="/app/.venv/bin:$PATH"
