# Session: Bundle API Bug Fixes - 2026-03-04

## Changes Made

### Bundle Create Endpoint Fix
- **Root cause**: 500 error when creating bundles
- **Issue 1**: Missing import in `bundles.py` - referenced `USERNAME_PATTERN` without importing it
- **Issue 2**: Schema validation pattern mismatch - Pydantic schema had outdated regex that didn't allow numbers

### Files Modified
- `backend/app/api/bundles.py` - Added `USERNAME_PATTERN` import from `app.core.constants`
- `backend/app/schemas/bundle.py` - Updated slug pattern from `^[a-z][a-z\-]*[a-z]$|^[a-z]{1,4}$` to `^[a-z0-9]+(-[a-z0-9]+)*$`

## Results
- ✅ Bundle creation endpoint now works
- ✅ Slugs with numbers (e.g., "test-bundle-123") are now accepted
- ✅ Consistent validation pattern across codebase (shared constant)
