# PolicySignoff — Frontend Client Guide

A step-by-step guide for building each frontend client. The API is the same for all three — only the frontend implementation changes. Each client should be completable in a day.

---

## What Every Client Needs to Do

Four screens/states, regardless of framework:

### 1. Auth Screen (logged out)
- Login form: email + password
- Register form: name + email + password + confirm password
- Toggle between login and register (or two separate views)
- On success: store auth state, show the dashboard
- On error: display field-level validation messages from the 422 response
- If redirected from an expired session (`?expired=1` query param), show an amber banner: "Your session has expired. Please sign in again."

### 2. Dashboard / Policy List (logged in)
- List all policies from `GET /policies`
- Each item shows: title, due date, status badge (signed / pending / overdue)
- Click a policy to see its detail
- Button or link to create a new policy
- Logout button

### 3. Policy Detail
- Full description text
- Due date
- If file attached: "View/Download Document" link (fetches presigned download URL, opens in new tab)
- Your sign-off status
- **If not yet signed:** "Sign Off" button (primary, full-width). After clicking: stay on the page, replace the button with a green confirmation box ("You signed off on this policy" + timestamp), update the sign-off summary table and counts. Handle 409 (already signed) gracefully — treat it the same as success.
- **If already signed:** show the green confirmation box instead of the button
- Sign-off summary: who's signed, who hasn't, who's overdue

### 4. Create Policy Form
- Title input
- Description textarea
- Due date picker (date input is fine)
- File input (optional) — for attaching a PDF or document
- Submit → creates the policy, then uploads the file if one was selected, then redirects to the new policy's detail page

---

## API Integration Pattern (same for all clients)

Every client follows the same fetch pattern. The critical piece is Sanctum's cookie-based auth.

### Step 1: CSRF cookie (do this before login/register)
```
GET /sanctum/csrf-cookie
credentials: 'include'
```
This sets the XSRF-TOKEN cookie. You must include this cookie in subsequent requests.

### Step 2: Login or register
```
POST /login  (or /register)
credentials: 'include'
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-XSRF-TOKEN': <read from cookie>
}
body: { email, password }
```
On success, the session cookie is set. You're authenticated.

### Step 3: All subsequent API calls
```
credentials: 'include'
headers: {
  'Accept': 'application/json',
  'X-XSRF-TOKEN': <read from cookie>
}
```
The session cookie handles auth. The XSRF token prevents CSRF.

### Reading the XSRF token from the cookie
The cookie is URL-encoded. Helper function you'll reuse in every client:
```javascript
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Usage:
const token = getCookie('XSRF-TOKEN');
```

### Wrapping it in a reusable fetch helper
Consider building a small wrapper early — you'll use it everywhere:
```javascript
async function api(method, path, body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
    },
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.json();
}
```
The logic is identical in React, Alpine, and Vue. In the React (TypeScript) client, make the function generic — `async function api<T>(method: string, path: string, body?: unknown): Promise<T>` — so call sites get typed responses without casting. Alpine and Vue use the plain JS version shown above.

---

## File Upload Pattern (same for all clients)

File uploads use presigned URLs. The file goes directly from the browser to MinIO/S3 — it never touches the Laravel server. This is the standard pattern for S3-backed uploads.

### Uploading a file (on the create policy form)

```javascript
// 1. Create the policy first (to get its ID)
const policy = await api('POST', '/policies', { title, description, due_date });

// 2. If user selected a file, request a presigned upload URL
if (file) {
  const { upload_url } = await api('POST', `/policies/${policy.id}/upload-url`, {
    filename: file.name,
    content_type: file.type,
  });

  // 3. PUT the file directly to MinIO/S3 using the presigned URL
  await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
}

// 4. Navigate to the new policy's detail page
```

Note: the PUT to MinIO does NOT use `credentials: 'include'` — it's a direct request to the object store, not to the Laravel API. No XSRF token needed.

### Downloading/viewing a file (on the policy detail page)

```javascript
// Request a presigned download URL from the API
const { download_url, file_name } = await api('GET', `/policies/${policy.id}/download-url`);

// Open in a new tab
window.open(download_url, '_blank');
```

### Getting the file from the input

```javascript
// From an <input type="file"> element:
const file = event.target.files[0];
// file.name → "Employee_Handbook_2026.pdf"
// file.type → "application/pdf"
// file itself is the body for the PUT request
```

This is ~15 lines of logic per client. The pattern is identical across all three frameworks — only how you access the file input and trigger the flow differs.

---

## Client 1: React

### Setup
- Vite + React + TypeScript (`npm create vite@latest client-react -- --template react-ts`)
- React Router for navigation (`npm install react-router-dom`)
- Tailwind for styling (`npm install -D tailwindcss @tailwindcss/vite`)
- No state management library needed — `useState` and lifting state is enough for this scope

### Suggested file structure
```
src/
  api.ts          — fetch wrapper + shared interfaces (User, Policy, PolicyDetail, SignoffEntry, ValidationErrors)
  App.tsx         — routes and auth state
  pages/
    Login.tsx     — login + register forms
    Dashboard.tsx — policy list
    Detail.tsx    — policy detail + sign-off button + summary
    Create.tsx    — create policy form
  components/
    PolicyCard.tsx    — single policy in the list (title, due date, status badge)
    SignoffList.tsx   — list of users and their sign-off status
    StatusBadge.tsx   — signed (green) / pending (yellow) / overdue (red)
```

### Step-by-step

**1. Scaffold and configure**
- Create the Vite project, install deps, configure Tailwind
- Set up React Router with 4 routes: `/login`, `/`, `/policies/:id`, `/create`

**2. Build the API wrapper**
- `api.ts` with `getCookie()` and a typed `api<T>()` function
- Make the helper generic: `async function api<T>(method: string, path: string, body?: unknown): Promise<T>`
- Define shared interfaces in `api.ts` — all pages and components import from here:
  - `User` — `{ id: number; name: string; email: string }`
  - `ValidationErrors` — `Record<string, string[]>` (the `errors` field from a 422 response)
  - `Policy` — list response shape (id, title, due_date, created_by, has_file, signed, overdue)
  - `SignoffEntry` — `{ user: string; signed_at: string | null; overdue: boolean }`
  - `PolicyDetail extends Policy` — adds `description`, `file_name?`, and `signoff_summary: { total_users, signed_count, signoffs: SignoffEntry[] }`
- Export all of them for use across pages and components

**3. Auth state in App.tsx**
- `useState<User | null>` for `user` (null = logged out, object = logged in)
- On mount: `GET /user` to check if session exists (wrap in try/catch — 401 means not logged in)
- Pass `user` and `setUser` down to pages (or use context if you want to practice it)
- Redirect to `/login` if not authenticated. If the session expired (user was previously logged in but `GET /user` returned 401), redirect to `/login?expired=1`

**4. Login page**
- Two forms (login + register) with a toggle between them
- Form state with `useState` for each field
- On submit: hit CSRF endpoint first, then `POST /login` or `/register`
- On success: `setUser(response)`, navigate to `/`
- On error: display field-level validation messages from the 422 response using the `ValidationErrors` type from `api.ts`
- Check for `?expired=1` in the URL (via `useSearchParams`) and show the session expired amber banner if present

**5. Dashboard**
- `useEffect` to fetch `GET /policies` on mount
- Map over policies, render `PolicyCard` for each
- Each card links to `/policies/:id`
- Add a link/button to `/create`
- Logout button calls `POST /logout`, then `setUser(null)`

**6. Policy detail**
- `useEffect` to fetch `GET /policies/:id` on mount (get id from `useParams`)
- Render full description, due date, status
- If `has_file`: "View Document" button that fetches `GET /policies/:id/download-url` and opens it in a new tab
- If not signed: "Sign Off" button → `POST /policies/:id/signoff` → re-fetch the policy to update local state. The button is replaced with a green confirmation box showing "You signed off on this policy" and the timestamp. Handle 409 (already signed) the same as success.
- If already signed: show the green confirmation box instead of the button
- Render sign-off summary list

**7. Create policy**
- Form with title, description, due_date inputs + a file input (`<input type="file">`)
- Use a ref (`useRef<HTMLInputElement>(null)`) for the file input, or store the file in state with `useState<File | null>(null)`
- On submit: create the policy first, then upload the file if selected (see upload pattern above), then navigate to `/policies/${policy.id}` (the new policy's detail page)
- Display validation errors if 422

**8. Style it**
- Tailwind utility classes. Keep it clean, not fancy.
- Status badges: green for signed, yellow for pending, red for overdue
- Responsive: looks fine on mobile

### React-specific hints
- `useEffect` with an empty dependency array for "fetch on mount"
- Controlled inputs: `value={title}` + `onChange={(e) => setTitle(e.target.value)}`
- File inputs are uncontrolled — use `useRef<HTMLInputElement>(null)` or read from `e.target.files?.[0]` in the onChange handler
- Error display: keep an `errors` state typed as `ValidationErrors` (from `api.ts`), map field names to messages from the 422 response
- Navigation: `useNavigate()` from React Router for programmatic redirects
- Loading states: a simple `loading` boolean while fetches are in flight
- TypeScript: all API response shapes live in `api.ts` as interfaces — import them where needed; this gives autocomplete across pages and components and avoids `any`
- TypeScript: call the generic helper with the expected return type: `api<User>('GET', '/user')`, `api<Policy[]>('GET', '/policies')`, `api<PolicyDetail>('GET', \`/policies/${id}\`)`
- TypeScript: `noUnusedLocals` and `noUnusedParameters` are enabled in `tsconfig.json` — don't declare variables you don't use

---

## Client 2: Alpine

### Setup
- No build step. No node_modules. No bundler. Just static HTML files served by nginx.
- Alpine via CDN (`<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`)
- Tailwind via CDN (`<script src="https://cdn.tailwindcss.com"></script>`)
- A shared `api.js` file with the fetch wrapper, included via `<script src="api.js"></script>`

### The key insight: Alpine sprinkles interactivity onto pages, not SPAs

Unlike React and Vue, this client uses **multi-page architecture** — five separate HTML files with real page navigation between them. Each page has its own `x-data` component with only the state it needs. Auth persists across pages via Sanctum's session cookie (same as any server-rendered app). This is how Alpine is actually used in production.

### Suggested structure
```
alpine/
  api.js            — getCookie() + api() fetch wrapper (shared across all pages)
  login.html        — login form + link to register
  register.html     — register form + link to login
  dashboard.html    — policy list, summary stats, link to create
  detail.html       — policy detail, sign-off button, sign-off summary
  create.html       — create policy form with file upload
```

No subdirectories, no CSS files (Tailwind CDN handles it), no build artifacts. The entire client is 6 files.

### Step-by-step

**1. Build the shared API wrapper (`api.js`)**
```javascript
const API_URL = 'http://localhost:8000';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

async function api(method, path, body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
    },
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(API_URL + path, options);
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.json();
}
```

Every page includes this with `<script src="api.js"></script>` before the Alpine script.

For production, change `API_URL` to `https://api.policysignoff.justinsovine.com`. No env variable injection — just swap the string before deploying.

**2. Build login.html**
- Self-contained page with its own `x-data` for form state and errors
- `@submit.prevent` on the form
- On submit: hit CSRF endpoint first (`GET /sanctum/csrf-cookie`), then `POST /login`
- On success: `window.location.href = 'dashboard.html'` (real page navigation)
- On error: display validation messages with `x-show` and `x-text`
- Check for `?expired=1` in the URL on init and show the session expired amber banner if present
- Link to `register.html` at the bottom

```html
<div x-data="{ form: { email: '', password: '' }, errors: {}, loading: false }">
  <form @submit.prevent="...">
    <input x-model="form.email" type="email">
    <template x-if="errors.email">
      <p x-text="errors.email[0]" class="text-red-600 text-sm"></p>
    </template>
    ...
  </form>
</div>
```

**3. Build register.html**
- Same pattern as login: own `x-data`, own form state
- Fields: name, email, password, password_confirmation
- On success: redirect to `dashboard.html`
- Link to `login.html` at the bottom

**4. Build dashboard.html**
- On load (`x-init`): call `GET /user` to check auth — if 401, redirect to `login.html`
- Fetch `GET /policies` and render the list
- Each policy row is an `<a href="detail.html?id=3">` — real link with the policy ID as a query param
- "Create Policy" button links to `create.html`
- Logout button calls `POST /logout`, then redirects to `login.html`
- Summary stats (total, overdue, pending, signed) computed from the policy list using getters

```html
<div x-data="dashboard()" x-init="init()">
  <template x-for="policy in policies">
    <a :href="'detail.html?id=' + policy.id">
      <span x-text="policy.title"></span>
      <span x-text="policy.due_date"></span>
      ...
    </a>
  </template>
</div>

<script>
function dashboard() {
  return {
    user: null,
    policies: [],
    get overdueCount() { return this.policies.filter(p => !p.signed && p.overdue).length },
    get pendingCount() { return this.policies.filter(p => !p.signed && !p.overdue).length },
    get signedCount() { return this.policies.filter(p => p.signed).length },
    async init() {
      try { this.user = await api('GET', '/user'); }
      catch (e) { window.location.href = 'login.html'; return; }
      this.policies = await api('GET', '/policies');
    },
    async logout() {
      await api('POST', '/logout');
      window.location.href = 'login.html';
    },
  }
}
</script>
```

**5. Build detail.html**
- Read policy ID from the URL: `new URLSearchParams(window.location.search).get('id')`
- On load: check auth (redirect if 401), then fetch `GET /policies/{id}`
- Render full description, metadata, sign-off summary with `x-for`
- If `has_file`: "Download Document" button calls `GET /policies/{id}/download-url` and opens in new tab
- "Sign Off" button calls `POST /policies/{id}/signoff`, then re-fetches the policy to update the summary
- "Back to policies" links to `dashboard.html`

**6. Build create.html**
- On load: check auth (redirect if 401)
- Form fields bound with `x-model`: title, description, due_date
- File input with `@change` handler to capture the File object
- On submit: `POST /policies` to create, then upload file if selected (presigned URL flow), then `window.location.href = 'detail.html?id=' + policy.id`
- Display validation errors from the 422 response

**7. Style with Tailwind**
- Same visual treatment as the React and Vue versions — copy markup patterns from the mockups
- Each page includes the Tailwind CDN script and the same font imports
- Nav bar markup is duplicated across dashboard, detail, and create (no shared components — that's the tradeoff)

### Auth pattern across pages

Every authenticated page (dashboard, detail, create) starts the same way:

```javascript
async init() {
  try {
    this.user = await api('GET', '/user');
  } catch (e) {
    window.location.href = 'login.html?expired=1';
    return;
  }
  // ... page-specific data fetching
}
```

Sanctum's session cookie persists across page navigations, so `GET /user` succeeds as long as the session is valid. No localStorage, no token management — the browser handles cookies automatically.

### Alpine-specific hints
- `x-model` is two-way binding (like Vue's `v-model`)
- `@submit.prevent` is Alpine's equivalent of `e.preventDefault()`
- `x-init` or the `init()` method in your data function for setup logic
- `x-text` for text content, `:class` (shorthand for `x-bind:class`) for conditional classes
- Alpine's `x-for` must be on a `<template>` tag, not directly on the element being repeated
- `$refs` for accessing DOM elements directly if needed
- Use Alpine `x-effect` if you need to react to state changes (e.g., recomputing derived values)

---

## Client 3: Vue (if time allows)

### Setup
- Vite + Vue (`npm create vite@latest client-vue -- --template vue`)
- Vue Router (`npm install vue-router`)
- Tailwind
- No Pinia needed — `ref()` and `provide/inject` or simple props are enough for this scope

### Suggested file structure
```
src/
  api.js            — same fetch wrapper as React
  App.vue           — router-view + auth state
  router.js         — route definitions
  views/
    Login.vue
    Dashboard.vue
    PolicyDetail.vue
    CreatePolicy.vue
  components/
    PolicyCard.vue
    SignoffList.vue
    StatusBadge.vue
```

### Step-by-step

**1. Scaffold and configure**
- Create the Vite project, install deps, configure Tailwind
- Set up Vue Router with the same 4 routes as React

**2. API wrapper**
- Same `api.js` — the fetch helper is identical across all three clients

**3. Auth state in App.vue**
- Use `ref()` for `user` in `<script setup>`
- `onMounted`: check `GET /user` to restore session. If 401, redirect to `/login`. If session was previously active (expired), redirect to `/login?expired=1`
- `provide('user', user)` and `provide('setUser', setUser)` so child views can access auth
- Or just pass as props through router — your call

**4. Login view**
- `ref()` for form fields: `const email = ref('')` etc.
- `@submit.prevent="login"` on the form
- Same CSRF → login flow as the other clients
- On success: set user, `router.push('/')`
- On error: display field-level validation messages from the 422 response
- Check for `?expired=1` in the route query (via `useRoute().query.expired`) and show session expired amber banner if present

**5. Dashboard view**
- `onMounted` → fetch policies
- `v-for="policy in policies"` to render list
- `<router-link :to="'/policies/' + policy.id">` for navigation

**6. Policy detail view**
- Get id from `useRoute().params.id`
- `onMounted` → fetch policy detail
- If `has_file`: "View Document" button → fetches download URL and opens in new tab
- If not signed: "Sign Off" button → `POST /policies/{id}/signoff` → re-fetch the policy to update state. Button is replaced with green confirmation box showing "You signed off on this policy" and the timestamp. Handle 409 (already signed) the same as success.
- If already signed: show the green confirmation box instead of the button
- `v-for` for sign-off summary

**7. Create policy view**
- `v-model` on form inputs + file input with `@change` handler
- Submit → create policy → upload file if selected → `router.push('/policies/' + policy.id)` (redirect to the new policy's detail page)
- Display validation errors if 422

### Vue-specific hints
- `<script setup>` is the modern default — no `export default`, no `setup()` function, just write code at the top level
- `ref()` for primitive values, `reactive()` for objects (but `ref()` works for everything, just use `.value` to access)
- `v-model` works like Alpine's `x-model`
- `v-show` works like Alpine's `x-show`
- `v-for` goes directly on the element (unlike Alpine which needs `<template>`)
- `computed()` for derived values (e.g., filtering overdue policies)
- `onMounted()` for fetching data on component load
- Vue Router's `useRouter()` for programmatic navigation, `useRoute()` for reading params

---

## Styling Approach (all clients)

Keep it consistent across all three so the visual output is the same — only the framework implementation differs.

### Status badges
- **Signed:** green background, "Signed" text
- **Pending:** yellow background, "Pending" text
- **Overdue:** red background, "Overdue" text

### Layout
- Max-width container, centered
- Card-based policy list items
- Simple form styling — stacked labels and inputs
- Mobile-friendly (Tailwind responsive utilities)

### Don't overthink it
The point is the integration pattern, not the visual design. Clean and readable beats impressive. Spend 80% of your time on the fetch/auth/state logic, 20% on making it look decent.

---

## Gotchas

Things that will bite you if you don't know about them upfront.

### CORS during local development
The API spec configures CORS for the production subdomains. During local dev, your clients run on `localhost:3001`, `localhost:3002`, `localhost:3003` and the API is at `localhost:8000`. The API's CORS config and Sanctum stateful domains must include these local origins too, or every request will fail silently with a CORS error. **This is handled on the API side** — just be aware that if you see CORS errors, the API config is the first place to look, not your client code.

### MinIO needs its own CORS policy
When the browser PUTs a file directly to MinIO using a presigned URL, MinIO itself must allow the request origin. This is separate from Laravel's CORS config — it's configured on the MinIO bucket. **This is handled on the API/infrastructure side.** If file uploads fail with a CORS error but everything else works, MinIO's CORS policy is the issue.

### API base URL per environment
The fetch wrapper hardcodes the API URL. During local dev you need `http://localhost:8000`, in production you need `https://api.policysignoff.justinsovine.com`. Use Vite's environment variables:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

Set `VITE_API_URL` in each client's `.env.production` file. Vite bakes env vars into the build at build time.

For Alpine (no build step), set the `API_URL` variable at the top of `api.js` and swap it before deploying.

### Create + upload is two steps
If the policy creates successfully but the file upload fails, you have a policy with no attached file. That's fine — the file is optional. Show a message like "Policy created but file upload failed" and let them try again from the detail page. Don't try to make this transactional.

### 409 on sign-off (already signed)
If the user somehow triggers `POST /policies/{id}/signoff` when they've already signed (e.g., double-click, stale tab), the API returns 409. Don't show an error — treat it the same as a successful sign-off. Re-fetch the policy detail and show the signed confirmation state.

### Sanctum CSRF token timing
The `GET /sanctum/csrf-cookie` request must happen before the first POST (login or register). After that, the cookie persists and refreshes automatically. If you get 419 (CSRF token mismatch) errors, you probably forgot to hit the CSRF endpoint first, or the cookie expired.

---

## Docker Compose — Local Development & Deployment

One `docker-compose.yml` at the project root runs everything. Same file works on your local machine and on the Linode VPS — only environment variables and build targets change.

### Project structure

```
policysignoff/
├── docker-compose.yml
├── docker-compose.prod.yml    — production overrides
├── api/                       — Laravel app
├── client-react/              — React client
├── client-alpine/             — Alpine client (static HTML files, no build step)
├── client-vue/                — Vue client (if time)
└── nginx/
    └── default.conf           — reverse proxy config (production)
```

### docker-compose.yml (development)

```yaml
services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_DATABASE: policysignoff
      MYSQL_ROOT_PASSWORD: secret
    volumes:
      - mysql_data:/var/lib/mysql

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - mysql
      - minio
    volumes:
      - ./api:/app
      - /app/vendor
    environment:
      APP_ENV: local
      APP_URL: http://localhost:8000
      DB_HOST: mysql
      DB_DATABASE: policysignoff
      DB_USERNAME: root
      DB_PASSWORD: secret
      AWS_ACCESS_KEY_ID: minioadmin
      AWS_SECRET_ACCESS_KEY: minioadmin
      AWS_BUCKET: policysignoff
      AWS_ENDPOINT: http://minio:9000
      AWS_USE_PATH_STYLE_ENDPOINT: "true"
      SESSION_DOMAIN: localhost
      SANCTUM_STATEFUL_DOMAINS: "localhost:3001,localhost:3002,localhost:3003"

  client-react:
    build:
      context: ./client-react
      dockerfile: Dockerfile.dev
    ports:
      - "3001:5173"
    volumes:
      - ./client-react:/app
      - /app/node_modules
    environment:
      VITE_API_URL: http://localhost:8000

  client-alpine:
    image: nginx:alpine
    ports:
      - "3002:80"
    volumes:
      - ./client-alpine:/usr/share/nginx/html:ro

  client-vue:
    build:
      context: ./client-vue
      dockerfile: Dockerfile.dev
    ports:
      - "3003:5173"
    volumes:
      - ./client-vue:/app
      - /app/node_modules
    environment:
      VITE_API_URL: http://localhost:8000

volumes:
  mysql_data:
  minio_data:
```

### Dockerfiles

**api/Dockerfile** (development — I'll create this when building the API):
```dockerfile
FROM php:8.3-cli
RUN apt-get update && apt-get install -y unzip libzip-dev \
    && docker-php-ext-install pdo_mysql zip
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-scripts
COPY . .
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

**client-react/Dockerfile.dev** (and same for client-vue):
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**client-alpine**: no Dockerfile needed for dev — just nginx serving static files via volume mount.

### Local development workflow

```bash
# Start everything
docker compose up -d

# First run: migrate and seed the database
docker compose exec api php artisan migrate --seed

# Create the MinIO bucket (first run only)
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/policysignoff

# View logs
docker compose logs -f api
docker compose logs -f client-react
```

Then open:
- React client: http://localhost:3001
- Alpine client: http://localhost:3002
- Vue client: http://localhost:3003
- API directly: http://localhost:8000
- MinIO console: http://localhost:9001 (minioadmin / minioadmin)

Hot reloading works for all clients — edit source files and the browser updates. The API volume mount means Laravel code changes take effect immediately too.

### docker-compose.prod.yml (production overrides)

For the Linode VPS, run with: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

```yaml
services:
  api:
    volumes: []  # no volume mount in prod — use built image
    environment:
      APP_ENV: production
      APP_URL: https://api.policysignoff.justinsovine.com
      SESSION_DOMAIN: .justinsovine.com
      SANCTUM_STATEFUL_DOMAINS: "policysignoff.justinsovine.com,alpine.policysignoff.justinsovine.com,vue.policysignoff.justinsovine.com"

  client-react:
    build:
      context: ./client-react
      dockerfile: Dockerfile.prod
    ports:
      - "3001:80"
    volumes: []

  client-alpine:
    volumes:
      - ./client-alpine:/usr/share/nginx/html:ro
    # Alpine is already static files — same in dev and prod

  client-vue:
    build:
      context: ./client-vue
      dockerfile: Dockerfile.prod
    ports:
      - "3003:80"
    volumes: []

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - api
      - client-react
      - client-alpine
      - client-vue
```

**client-react/Dockerfile.prod** (and same pattern for client-vue):
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**nginx/default.conf** (production reverse proxy):
```nginx
server {
    listen 80;
    server_name api.policysignoff.justinsovine.com;
    location / {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name policysignoff.justinsovine.com;
    location / {
        proxy_pass http://client-react:80;
    }
}

server {
    listen 80;
    server_name alpine.policysignoff.justinsovine.com;
    location / {
        proxy_pass http://client-alpine:80;
    }
}

server {
    listen 80;
    server_name vue.policysignoff.justinsovine.com;
    location / {
        proxy_pass http://client-vue:80;
    }
}

server {
    listen 80;
    server_name minio.policysignoff.justinsovine.com;
    location / {
        proxy_pass http://minio:9000;
        proxy_set_header Host $host;
        client_max_body_size 50M;
    }
}
```

Note: SSL (Let's Encrypt / Certbot) is left out of this config — handle it with Certbot on the VPS directly or add a Caddy container if you prefer automatic SSL. The nginx config above works for HTTP and is ready to drop SSL certs into.

### MinIO production endpoint
The presigned URLs the API generates need to be accessible from the browser. In dev, MinIO is at `localhost:9000`. In production, MinIO needs a public subdomain: `minio.policysignoff.justinsovine.com` — proxied to the MinIO container by nginx. Update the API's `AWS_ENDPOINT` accordingly:
- Dev: `http://minio:9000` (container-to-container)
- Prod: `https://minio.policysignoff.justinsovine.com` (browser-accessible)

The API also needs a separate `AWS_URL` for generating presigned URLs that the browser can reach:
- Dev: `http://localhost:9000`
- Prod: `https://minio.policysignoff.justinsovine.com`
