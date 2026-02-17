# PolicySignoff API

Laravel 12 REST API with Sanctum cookie-based SPA authentication and MinIO/S3 file storage.

## Stack

- **PHP 8.4** / **Laravel 12**
- **MySQL 8** via Docker
- **Laravel Sanctum** — cookie-based session auth (no tokens)
- **MinIO** — S3-compatible object storage for policy documents
- **Presigned URLs** — file uploads go directly from browser to MinIO, never through Laravel

## Setup

Runs inside Docker. From the repo root:

```bash
docker compose up -d
docker compose exec api php artisan migrate --seed
```

Create the MinIO bucket (first run only):

```bash
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/policysignoff
```

API is available at **http://localhost:8000**.

Copy `.env.example` to `.env` if starting fresh — the example is pre-configured for the Docker Compose environment.

## Commands

```bash
# Run tests (PHPUnit, SQLite in-memory)
docker compose exec api composer test

# Re-seed the database
docker compose exec api php artisan db:seed

# Run fresh migrations and seed
docker compose exec api php artisan migrate:fresh --seed
```

## Routes

Auth routes (no `/api` prefix, in `routes/web.php`):

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Authenticate and set session cookie |
| `POST` | `/logout` | Clear session |
| `GET` | `/user` | Get authenticated user |

Protected routes (prefixed `/api`, require `auth:sanctum`):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/policies` | List all policies |
| `POST` | `/api/policies` | Create a policy |
| `GET` | `/api/policies/{id}` | Policy detail with sign-off summary |
| `POST` | `/api/policies/{id}/signoff` | Sign off on a policy |
| `POST` | `/api/policies/{id}/upload-url` | Get a presigned S3 upload URL |
| `GET` | `/api/policies/{id}/download-url` | Get a presigned S3 download URL |

Full request/response documentation: [`../docs/api-spec.md`](../docs/api-spec.md)

## Auth flow

All API clients follow the same pattern:

1. `GET /sanctum/csrf-cookie` — sets the `XSRF-TOKEN` cookie
2. `POST /login` with `X-XSRF-TOKEN` header — sets the session cookie
3. All subsequent requests include both cookies (`credentials: 'include'`)

Requests must come from a domain listed in `SANCTUM_STATEFUL_DOMAINS` and include a matching `Origin` or `Referer` header — this is how Sanctum identifies stateful (cookie-based) requests.

## File upload flow

1. Client calls `POST /api/policies/{id}/upload-url` with `filename` and `content_type`
2. API generates a presigned S3 `PutObject` URL (15-minute expiry) and updates the policy record with the file metadata
3. Client PUTs the file directly to MinIO using the presigned URL — no Laravel involvement
4. Client calls `GET /api/policies/{id}/download-url` to get a presigned `GetObject` URL for viewing

Presigned URLs are signed against `AWS_URL` (the external MinIO hostname) so signatures remain valid when the browser uses them. `AWS_ENDPOINT` (the internal Docker hostname) is used only for server-side Laravel→MinIO communication.

## Key files

```
app/Http/Controllers/
  AuthController.php      — register, login, logout, user
  PolicyController.php    — index, store, show
  SignoffController.php   — store (with 409 on duplicate)
  FileController.php      — uploadUrl, downloadUrl

database/
  migrations/             — users, policies, signoffs
  seeders/DatabaseSeeder.php  — 6 users, 4 policies, realistic sign-offs

config/
  cors.php                — allowed origins, auth route paths
  sanctum.php             — stateful domains from SANCTUM_STATEFUL_DOMAINS env
```
