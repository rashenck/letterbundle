# LetterBundle API Documentation

This document provides detailed documentation for the LetterBundle REST API.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Get JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

## Endpoints

### Authentication

#### POST `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "myusername",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "myusername",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST `/api/auth/login`

Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### GET `/api/auth/me`

Get current authenticated user information.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "myusername",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST `/api/auth/logout`

Logout current user (client-side token removal).

### Users

#### GET `/api/users/{username}`

Get public profile information for a user.

**Response:**
```json
{
  "username": "myusername",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### PUT `/api/users/me`

Update current user's profile information.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "newemail@example.com"
}
```

### Bundles

#### GET `/api/bundles`

List current user's bundles.

**Query Parameters:**
- `skip` (int): Number of bundles to skip (default: 0)
- `limit` (int): Maximum number of bundles to return (default: 100)

**Response:**
```json
[
  {
    "id": "uuid",
    "slug": "grandmas-letters",
    "title": "Grandma's Letters",
    "description": "Letters from my grandmother during WWII",
    "is_public": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/api/bundles`

Create a new bundle.

**Request Body:**
```json
{
  "slug": "grandmas-letters",
  "title": "Grandma's Letters",
  "description": "Letters from my grandmother during WWII",
  "is_public": false
}
```

#### GET `/api/bundles/{id}`

Get detailed information about a specific bundle.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "slug": "grandmas-letters",
  "title": "Grandma's Letters",
  "description": "Letters from my grandmother during WWII",
  "is_public": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### GET `/api/bundles/by-slug/{slug}`

Get bundle by its unique slug (public access).

#### PUT `/api/bundles/{id}`

Update bundle information.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "is_public": true
}
```

#### DELETE `/api/bundles/{id}`

Delete a bundle and all its contents.

#### GET `/api/bundles/public`

Browse public bundles.

**Query Parameters:**
- `skip` (int): Number of bundles to skip
- `limit` (int): Maximum number of bundles to return

#### GET `/api/users/{username}/bundles`

Get public bundles for a specific user.

### Letters

#### GET `/api/bundles/{id}/letters`

List all letters in a bundle.

**Response:**
```json
[
  {
    "id": "uuid",
    "bundle_id": "uuid",
    "date_written": "1945-01-01",
    "author": "Grandma Smith",
    "recipient": "John Doe",
    "location": "Pennsylvania",
    "transcription": "Dear John, ...",
    "notes": "This was written during WWII",
    "order_index": 1,
    "status": "ready",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/api/bundles/{id}/letters`

Create a new letter in a bundle.

**Request Body:**
```json
{
  "date_written": "1945-01-01",
  "author": "Grandma Smith",
  "recipient": "John Doe",
  "location": "Pennsylvania",
  "notes": "This was written during WWII"
}
```

#### GET `/api/letters/{id}`

Get detailed letter information including pages.

#### PUT `/api/letters/{id}`

Update letter metadata.

#### DELETE `/api/letters/{id}`

Delete a letter and all its pages.

#### PUT `/api/bundles/{id}/letters/reorder`

Reorder letters within a bundle.

**Request Body:**
```json
[
  {"id": "uuid1", "order_index": 1},
  {"id": "uuid2", "order_index": 2}
]
```

#### POST `/api/letters/{id}/process`

Submit letter for OCR processing (asynchronous).

### Pages

#### POST `/api/letters/{id}/pages`

Upload one or more page images for a letter.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `files`: Image files (PNG, JPG, JPEG)
- `page_numbers`: Optional array of page numbers

**Response:**
```json
[
  {
    "id": "uuid",
    "letter_id": "uuid",
    "page_number": 1,
    "rotation": 0,
    "crop_box": null,
    "s3_key_original": "letters/uuid/pages/uuid/original.jpg",
    "s3_key_processed": null,
    "s3_key_thumbnail": null,
    "transcription": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### PUT `/api/letters/{id}/pages/reorder`

Reorder pages within a letter.

#### PUT `/api/pages/{id}`

Update page information (rotation, crop, transcription).

**Request Body:**
```json
{
  "rotation": 90,
  "crop_box": {"x": 100, "y": 100, "width": 800, "height": 600},
  "transcription": "Updated OCR text..."
}
```

#### PUT `/api/pages/{id}/crop`

Apply new crop settings (triggers reprocessing).

#### DELETE `/api/pages/{id}`

Delete a page.

#### GET `/api/pages/{id}/image/{version}`

Get presigned URL for page image.

**Versions:** `original`, `processed`, `thumbnail`

**Response:**
```json
{
  "url": "https://s3.amazonaws.com/...",
  "expires_in": 3600
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "detail": "Error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error

## Rate Limiting

- Authentication endpoints: 10 requests per minute
- Other endpoints: 100 requests per minute

## Data Types

### UUID
All IDs are UUIDs (universally unique identifiers) in string format.

### Timestamps
All timestamps are in ISO 8601 format with timezone (UTC):
```
2024-01-01T12:00:00Z
```

### Image Constraints
- Maximum file size: 50MB
- Supported formats: PNG, JPG, JPEG
- Processed images: Automatically resized if >10MB for OCR
- Thumbnails: 200px width, proportional height

## WebSocket Support

Real-time updates for OCR processing status are available via WebSocket:

```
ws://localhost:8000/api/ws/letters/{letter_id}
```

Events:
- `processing_started`
- `page_processed`
- `processing_completed`
- `processing_failed`