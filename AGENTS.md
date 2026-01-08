# AGENTS.md - Coding Agent Guidelines for openletterbox

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

- **Language**: Python 3.14+
- **Package Manager**: uv (using pyproject.toml)
- **Project Type**: Python application

## Build & Development Commands

### Package Management

```bash
uv sync                    # Install dependencies
uv add <package>           # Add a dependency
uv add --dev <package>     # Add a dev dependency
```

### Running the Application

```bash
uv run python main.py      # Run the main application
```

### Testing (pytest)

```bash
uv run pytest                                      # Run all tests
uv run pytest tests/test_example.py                # Run a single test file
uv run pytest tests/test_example.py::test_func     # Run a single test function
uv run pytest -k "pattern"                         # Run tests matching a pattern
uv run pytest -v                                   # Run with verbose output
uv run pytest --cov=openletterbox                  # Run with coverage
```

### Linting & Formatting (ruff)

```bash
uv run ruff check .          # Check code
uv run ruff check --fix .    # Fix auto-fixable issues
uv run ruff format .         # Format code
```

### Type Checking (mypy)

```bash
uv run mypy .
```

## Code Style Guidelines

### Formatting

- Follow PEP 8 style guidelines
- 4 spaces for indentation, 88 character line limit
- Double quotes for strings
- Two blank lines between top-level definitions

### Imports

Order imports in three groups, separated by blank lines:

```python
# 1. Standard library
import os
from pathlib import Path

# 2. Third-party
import requests
from pydantic import BaseModel

# 3. Local
from openletterbox.core import something
```

Use absolute imports, avoid wildcards, sort alphabetically.

### Type Hints

Use type hints for all function signatures. Use modern syntax (`X | None` not `Optional[X]`):

```python
def process_data(items: list[str], count: int = 10) -> dict[str, int]: ...
def fetch_user(user_id: int) -> User | None: ...
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions/Variables | snake_case | `get_user_data`, `user_count` |
| Classes | PascalCase | `UserProfile` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Private | Leading underscore | `_internal_method` |

### Docstrings (Google style)

```python
def calculate_total(items: list[float], tax_rate: float = 0.1) -> float:
    """Calculate the total price including tax.

    Args:
        items: List of item prices.
        tax_rate: Tax rate as a decimal.

    Returns:
        Total price including tax.

    Raises:
        ValueError: If tax_rate is negative.
    """
```

### Error Handling

- Use specific exception types, never bare `except:`
- Use `raise ... from e` to preserve exception chains
- Log errors with context

```python
try:
    result = risky_operation()
except ConnectionError as e:
    logger.error("Connection failed: %s", e)
    raise ServiceUnavailableError("Could not connect") from e
```

### Testing

- Name test files and functions with `test_` prefix
- Use pytest fixtures for shared setup
- Use `pytest.raises` for exception testing

```python
def test_calculate_total_with_default_tax():
    assert calculate_total([10.0, 20.0]) == 33.0

def test_calculate_total_raises_on_negative_tax():
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_total([10.0], tax_rate=-0.1)
```

### Logging

Use `logging` module, not `print()`:

```python
import logging
logger = logging.getLogger(__name__)
logger.info("Processing user %s", user_id)
```

## Agent-Specific Guidelines

- Run linting before committing changes
- Run relevant tests after making changes
- Keep functions small and focused (< 50 lines)
- Prefer composition over inheritance
- Write tests for new functionality
- Update docstrings when modifying function behavior
