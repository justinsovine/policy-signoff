# PolicySignoff

A policy sign-off tracker for HR and compliance teams. Users create policies with deadlines and optional document attachments. All registered users are required to acknowledge each policy, and managers can see exactly who has signed and who hasn't.

**Live:** [policysignoff.justinsovine.com](https://policysignoff.justinsovine.com)

---

## What it does

- Create policies with a title, description, due date, and optional PDF/Word attachment
- All users sign off on every policy — no assignment or invitation step
- Dashboard shows each policy's status: signed, pending, or overdue
- Policy detail shows a full sign-off summary: who signed, when, and who's still outstanding
- Files are stored in S3-compatible object storage (MinIO); uploads go directly from the browser to the object store via presigned URLs

## Architecture

Three separate frontend clients consume the same Laravel API, demonstrating the same product built three different ways:

| Client | Stack | URL |
|--------|-------|-----|
| `client/` | React + Vite + React Router | [policysignoff.justinsovine.com](https://policysignoff.justinsovine.com) |
| `api/` | Laravel 12 + Sanctum + MinIO | [api.policysignoff.justinsovine.com](https://api.policysignoff.justinsovine.com) |

Auth is cookie-based via Laravel Sanctum (no tokens, no localStorage). The API is fully documented in [`docs/api-spec.md`](docs/api-spec.md).

## Running locally

**Prerequisites:** Docker and Docker Compose.

```bash
# Start all services (API, MySQL, MinIO, React dev server)
docker compose up -d

# First run: migrate, seed, create the MinIO bucket
docker compose exec api php artisan migrate --seed
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/policysignoff
```

| Service | URL |
|---------|-----|
| React client | http://localhost:3001 |
| API | http://localhost:8000 |
| MinIO console | http://localhost:9001 (minioadmin / minioadmin) |

Default seed credentials: `jane@example.com` / `password` (and `alice@example.com`, `bob@example.com`, etc.)

See each client's README for client-specific dev setup. See [`docs/client-guide.md`](docs/client-guide.md) for a full build guide covering all three frontends.

## Testing the API

A curl-based smoke test covers all 16 API endpoints including the full file upload/download roundtrip:

```bash
./test-api.sh
# or as a specific user:
./test-api.sh jane@example.com password
```

A Postman collection is in [`postman/`](postman/) covering all endpoints with Sanctum cookie auth pre-wired. Import the collection, run "Auth / 1. CSRF Cookie" then "Auth / 2. Login", and the rest of the requests are ready to use. Requires cookie handling enabled for localhost in Postman settings.

## Deployment

The app runs on a Linode VPS behind a host-level NGINX that handles SSL termination. Docker services expose ports directly; NGINX proxies to them. To deploy:

```bash
./deploy/deploy.sh
```

The script pulls the latest code, rebuilds the client image with the production API URL baked in, restarts the containers, and runs migrations. See [`deploy/SETUP.md`](deploy/SETUP.md) for one-time VPS setup (NGINX config, certbot, MinIO bucket, DNS).

## Docs

- [`docs/api-spec.md`](docs/api-spec.md) — API routes, data model, response shapes, auth and file upload patterns
- [`docs/client-guide.md`](docs/client-guide.md) — Step-by-step frontend build guide for all three clients
- [`docs/mockups/`](docs/mockups/) — Static HTML+Tailwind mockups with all UI states
- [`deploy/SETUP.md`](deploy/SETUP.md) — One-time VPS setup instructions
