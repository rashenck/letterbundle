"""Application constants."""

import re

# Reserved slugs and usernames
RESERVED_WORDS: list[str] = [
    "login",
    "register",
    "dashboard",
    "api",
    "browse",
    "u",
    "admin",
    "settings",
    "help",
    "about",
    "contact",
    "terms",
    "privacy",
    "status",
]

# Regex patterns for validation
USERNAME_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
