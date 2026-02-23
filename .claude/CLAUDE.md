# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PolicySignoff is a policy sign-off tracker for HR/compliance. Users create policies with deadlines and optional file attachments, other users acknowledge them, and everyone can see who's signed and who hasn't. This is a portfolio/interview project hosted on justinsovine.com.

## Architecture

The project has four components, each in its own directory:

- **api/** — Laravel 12 backend with Sanctum cookie-based SPA auth and MinIO/S3 file storage
- **react/** — React + Vite + React Router client (stub — not yet implemented)
- **alpine/** — Alpine.js multi-page client (stub — not yet implemented; no build step, 5 static HTML files + shared `api.js`)
- **vue/** — Vue + Vite + Vue Router client (stub — not yet implemented)

All three frontends consume the same API. The API spec is in `docs/api-spec.md` and the frontend implementation guide is in `docs/client-guide.md`. Static HTML mockups for the UI are in `docs/mockups/`.

## Key Documentation

- `docs/api-spec.md` — Complete API routes, data model, response shapes, validation rules, Sanctum config, MinIO config
- `docs/client-guide.md` — Step-by-step build guide for each frontend client, Docker Compose setup, gotchas
- `docs/mockups/` — Static HTML+Tailwind mockups (login, register, dashboard, detail, create) and the design prompt that generated them
- `docs/mockups/DESIGN-PROMPT.md` — Design direction and sample data for mockups
- `api/ISSUES.md` — 7 branch-based development issues tracking API implementation progress
- `api/SETUP.md` — Manual step-by-step setup instructions for the API

## Commands

All API commands run inside the Docker container or via `docker compose exec api`:

```bash
# First-time setup (install deps, generate key, migrate, build)
docker compose exec api composer setup

# Run database migrations and seed
docker compose exec api php artisan migrate --seed

# Run tests (PHPUnit, SQLite in-memory)
docker compose exec api composer test
# or
docker compose exec api php artisan test

# Start dev server with queue worker and log tail
docker compose exec api composer dev
```

Frontend clients (React/Vue) once scaffolded:
```bash
npm run dev    # Vite dev server with HMR
npm run build  # Production build
```

## API Details

- Auth routes (`/register`, `/login`, `/logout`, `/user`) are in `routes/web.php`
- Policy, sign-off, and file routes are in `routes/api.php`
- Auth flow: `GET /sanctum/csrf-cookie` → `POST /login` → session cookie handles subsequent requests
- All API requests need `credentials: 'include'` and `X-XSRF-TOKEN` header read from cookie
- File uploads use presigned S3/MinIO URLs — files go directly from browser to object store, never through Laravel
- No roles/permissions — any authenticated user can create policies and sign off
- Tests are placeholder only (`tests/Feature/ExampleTest.php`, `tests/Unit/ExampleTest.php`); phpunit.xml uses SQLite in-memory

## Frontend Patterns

All three clients share identical API integration logic:
- `getCookie()` helper to read URL-decoded XSRF-TOKEN from cookie
- `api(method, path, body)` fetch wrapper with credentials and XSRF header
- API base URL configured via `VITE_API_URL` env var (or hardcoded for Alpine)
- File upload: create policy first → request presigned URL → PUT file directly to MinIO
- Styling: Tailwind CSS, Shadcn-inspired aesthetic (see mockups for reference)

## Environment Setup

Copy `api/.env.example` to `api/.env`. Key variables for local dev:

```
SANCTUM_STATEFUL_DOMAINS=localhost:3001,localhost:3002,localhost:3003
SESSION_DOMAIN=localhost
AWS_ENDPOINT=http://minio:9000      # internal Docker network (Laravel → MinIO)
AWS_URL=http://localhost:9000       # external URL (browser presigned URLs)
AWS_USE_PATH_STYLE_ENDPOINT=true
```

## Docker Compose

**Local development ports:**
- API: localhost:8000
- React: localhost:3001
- Alpine: localhost:3002
- Vue: localhost:3003
- MinIO console: localhost:9001 (credentials: minioadmin/minioadmin)

**Production domains:** `{react,alpine,vue,api,minio}.policysignoff.justinsovine.com`

## Workflow

- **Commit and push automatically** — after completing implementation work, always commit and push without waiting to be asked
- **PR text** — when creating PRs, write a proper title and body: a short summary paragraph explaining the change and its rationale, followed by a bullet list of what was changed and why

### Semantic Commit Messages

Format: `<type>(<scope>): <subject>` — scope is optional, subject in present tense.

| Type | Use for |
|------|---------|
| `feat` | New feature for end users |
| `fix` | Bug fix for end users |
| `docs` | Documentation changes |
| `style` | Formatting, whitespace — no logic changes |
| `refactor` | Restructuring production code — no feature or bug changes |
| `test` | Adding or refactoring tests — no production code changes |
| `chore` | Dependency updates, build scripts, maintenance |
| `build` | Build system or external dependency changes |
| `ci` | CI configuration changes |
| `perf` | Performance improvements |
| `revert` | Reverting a previous commit |

Examples: `feat(auth): add login page`, `fix(api): handle 419 on CSRF expiry`, `chore: upgrade tailwindcss to v4`

## Common Gotchas

- CORS errors during local dev → check API's CORS config and Sanctum stateful domains, not client code
- MinIO has its own CORS policy separate from Laravel's — file upload CORS failures are a MinIO config issue
- 419 errors → forgot to call `/sanctum/csrf-cookie` before first POST
- Create + upload is two steps; if upload fails, policy exists without file (by design)
- `AWS_ENDPOINT` vs `AWS_URL`: endpoint is for server-side communication (Docker internal), URL is embedded in presigned URLs returned to the browser
