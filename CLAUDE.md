# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PolicySignoff is a policy sign-off tracker for HR/compliance. Users create policies with deadlines and optional file attachments, other users acknowledge them, and everyone can see who's signed and who hasn't. This is a portfolio/interview project hosted on justinsovine.com.

## Architecture

The project has four components, each in its own directory:

- **api/** — Laravel backend with Sanctum cookie-based SPA auth and MinIO/S3 file storage
- **react/** — React + Vite + React Router client
- **alpine/** — Alpine.js multi-page client (no build step — 5 static HTML files + shared `api.js`, real page navigation between views, auth via session cookie)
- **vue/** — Vue + Vite + Vue Router client

All three frontends consume the same API. The API spec is in `docs/api-spec.md` and the frontend implementation guide is in `docs/client-guide.md`. Static HTML mockups for the UI are in `docs/mockups/`.

## Key Documentation

- `docs/api-spec.md` — Complete API routes, data model, response shapes, validation rules, Sanctum config, MinIO config
- `docs/client-guide.md` — Step-by-step build guide for each frontend client, Docker Compose setup, gotchas
- `docs/mockups/` — Static HTML+Tailwind mockups (login, register, dashboard, detail, create) and the design prompt that generated them
- `docs/mockups/DESIGN-PROMPT.md` — Design direction and sample data for mockups

## API Details

- Laravel with Sanctum cookie-based auth (not token-based)
- Auth flow: `GET /sanctum/csrf-cookie` → `POST /login` → session cookie handles subsequent requests
- All API requests need `credentials: 'include'` and `X-XSRF-TOKEN` header read from cookie
- File uploads use presigned S3/MinIO URLs — files go directly from browser to object store, never through Laravel
- No roles/permissions — any authenticated user can create policies and sign off

## Frontend Patterns

All three clients share identical API integration logic:
- `getCookie()` helper to read URL-decoded XSRF-TOKEN from cookie
- `api(method, path, body)` fetch wrapper with credentials and XSRF header
- API base URL configured via `VITE_API_URL` env var (or hardcoded for Alpine)
- File upload: create policy first → request presigned URL → PUT file directly to MinIO
- Styling: Tailwind CSS, Shadcn-inspired aesthetic (see mockups for reference)

## Docker Compose

The project runs via Docker Compose. See `docs/client-guide.md` for full compose config.

**Local development ports:**
- API: localhost:8000
- React: localhost:3001
- Alpine: localhost:3002
- Vue: localhost:3003
- MinIO console: localhost:9001

**Production domains:** `{react,alpine,vue,api,minio}.policysignoff.justinsovine.com`

## Common Gotchas

- CORS errors during local dev → check API's CORS config and Sanctum stateful domains, not client code
- MinIO has its own CORS policy separate from Laravel's — file upload CORS failures are a MinIO config issue
- 419 errors → forgot to call `/sanctum/csrf-cookie` before first POST
- Create + upload is two steps; if upload fails, policy exists without file (by design)
