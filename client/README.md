# PolicySignoff - React Client

React + Vite + React Router frontend for the PolicySignoff API. Runs at [policysignoff.justinsovine.com](https://policysignoff.justinsovine.com) in production.

## Stack

- **React 19** + **Vite 7**
- **React Router** for client-side routing
- **Tailwind CSS v4** for styling

## Dev setup

```bash
npm install
npm run dev        # http://localhost:5173
```

Or via Docker Compose from the repo root (runs on port 3001):

```bash
docker compose up -d client
```

The app expects the API at `http://localhost:8000` by default. Override via `.env`:

```
VITE_API_URL=http://localhost:8000
```

Make sure the API is running and the database is seeded before logging in. See the [root README](../README.md) for full setup instructions.

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

`VITE_API_URL` is baked into the bundle at build time. The production build reads from `.env.production` (committed), which points to `https://api.policysignoff.justinsovine.com`.

## Structure

```
src/
  api.js          - getCookie() + api() fetch wrapper (Sanctum cookie auth)
  main.jsx        - entry point, React Router setup
  App.jsx         - auth state, protected routes
  pages/
    Login.jsx     - login + register forms, session-expired banner
    Dashboard.jsx - policy list with status badges
    Policy.jsx    - policy detail, sign-off button, sign-off summary
    Create.jsx    - create policy form with file upload
  components/
    StatusBadge.jsx   - signed / pending / overdue pill
    SignoffList.jsx   - per-user sign-off status table
```

## API integration

All requests go through `src/api.js`:

```js
import { api } from './api'

// GET
const policies = await api('GET', '/api/policies')

// POST with body
const policy = await api('POST', '/api/policies', { title, description, due_date })

// File upload (two steps)
const { upload_url } = await api('POST', `/api/policies/${id}/upload-url`, {
  filename: file.name,
  content_type: file.type,
})
await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
```

Auth is cookie-based via Laravel Sanctum - no tokens or localStorage. The `api()` helper handles CSRF automatically by reading the `XSRF-TOKEN` cookie.
