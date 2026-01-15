# AGENTS.md - Coding Agent Guidelines for LetterBundle

This document provides guidelines for AI coding agents working in the LetterBundle repository.

## Documentation Style Guidelines

- **Project Name**: Use "LetterBundle" for all display text and headings in documentation
- **Technical References**: Use casing consistent with established casing patterns for the language in use.
- **Domain**: Keep "letterbundle.com" in lowercase as registered
- **Consistency**: Maintain consistent casing throughout all documentation

## Project Overview

- **Languages**: Python 3.14+ (backend), TypeScript (frontend)
- **Package Managers**: uv (Python), npm (Node.js)
- **Project Type**: Full-stack web application (Next.js frontend + FastAPI backend)
- **Domain**: letterbundle.com - Platform for sharing handwritten letter collections with OCR transcription

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

## Agent Logging Requirements

All significant changes made by AI agents must be documented in `docs/agent_logs/` for transparency and accountability.

### Logging Location
- **Directory**: `docs/agent_logs/`
- **Naming Convention**: `{YYYY-MM-DD}_session_{brief_description}.md`
- **Example**: `2026-01-15_session_component_refactor.md`

### Log Content Structure
Each log should include:
- **Session Header**: `# Session: [Brief Description] - [Date]`
- **Changes Made**: What was implemented, modified, or fixed
- **Technical Details**: Code changes, new files, architectural decisions
- **Next Steps**: Follow-up work, known issues, or recommendations

### When to Log
- Major feature implementations
- Bug fixes affecting functionality
- Architecture changes
- Significant refactoring
- New component creation
- API endpoint additions

### Integration
- Reference agent logs in `docs/DEVELOPMENT.md` for project history
- Link to related commits/PRs when available
- Keep logs concise but informative

## Frontend Component Guidelines

### Next.js App Router Patterns
- Use App Router (`src/app/`) for all new routes
- File-based routing: `page.tsx` for route components
- `layout.tsx` for shared layouts and providers
- `loading.tsx` for route-level loading states
- `error.tsx` for error boundaries

### Component Architecture
- **File Structure**: `src/components/ui/` for reusable UI components
- **Naming**: PascalCase for component files and exports
- **Props**: Define TypeScript interfaces for all component props
- **Forward Refs**: Use `forwardRef` for DOM access needs
- **Default Exports**: Prefer default exports for components

### Styling
- **Tailwind CSS**: Primary styling approach
- **Utility Classes**: Use `cn()` helper for conditional classes
- **Design System**: Follow established color palette and spacing
- **Responsive**: Mobile-first approach with responsive utilities

### TypeScript
- **Strict Mode**: Full type safety required
- **Interfaces**: Define props interfaces above component
- **Generics**: Use when appropriate for reusable components
- **Imports**: Prefer absolute imports over relative

### Best Practices
- **Component Composition**: Build complex UIs from simple components
- **Accessibility**: Include ARIA labels and semantic HTML
- **Performance**: Use React.memo for expensive components
- **Error Handling**: Implement error boundaries for user-facing components

## Agent-Specific Guidelines

- Run linting before committing changes (`uv run ruff check .` for backend, `npm run lint` for frontend)
- Run relevant tests after making changes
- Keep functions small and focused (< 50 lines)
- Prefer composition over inheritance
- Write tests for new functionality
- Update docstrings when modifying function behavior
- Use the commit message template (`.git-commit-template.txt`) for all commits
- Document agent work in `docs/agent_logs/` as specified above
