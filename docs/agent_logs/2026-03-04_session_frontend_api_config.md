# Session: Frontend API Configuration - 2026-03-04

## Changes Made

### Centralized API Configuration
- **Issue**: All API URLs hardcoded to `localhost:8000` across frontend pages
- **Solution**: Centralized API client in `lib/api.ts` using `NEXT_PUBLIC_API_URL` environment variable

### Files Modified
- `frontend/src/lib/api.ts` - Added API_BASE_URL export, expanded methods
- `frontend/src/app/verify-email/page.tsx` - Uses API_BASE_URL
- `frontend/src/app/browse/page.tsx` - Uses apiClient
- `frontend/src/app/[slug]/page.tsx` - Uses apiClient
- `frontend/src/app/users/[username]/page.tsx` - Uses apiClient
- `frontend/src/app/dashboard/page.tsx` - Uses apiClient
- `frontend/src/app/dashboard/bundles/new/page.tsx` - Uses apiClient
- `frontend/src/app/dashboard/bundles/[id]/page.tsx` - Uses apiClient
- `frontend/src/app/dashboard/settings/page.tsx` - Uses apiClient
- `frontend/src/app/dashboard/bundles/[id]/letters/[letterid]/page.tsx` - Uses apiClient + API_BASE_URL
- `frontend/src/app/dashboard/bundles/[id]/letters/new/page.tsx` - Uses API_BASE_URL

## Environment Configuration

### Development
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Production
```bash
# Set in docker-compose.yml, Vercel, or hosting platform
NEXT_PUBLIC_API_URL=https://api.letterbundle.com
```

## Results
- ✅ All hardcoded localhost URLs removed
- ✅ Single source of truth for API URL
- ✅ Easy to configure for production deployment
- ✅ Frontend build succeeds
