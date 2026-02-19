# Lesson 1: The API Helper (`src/api.ts`)

**Issue:** #23 — React client: Auth flow, API helper, and login/register page
**File you'll build:** `client-react/src/api.ts`

---

## What this is and why it exists

Every request to the Laravel API needs the same three things:

1. **`credentials: 'include'`** — tells the browser to send session cookies automatically
2. **`X-XSRF-TOKEN` header** — a security token Laravel reads from a cookie to prove the request came from your app, not a third-party site
3. **`Accept: application/json`** — tells Laravel to respond with JSON instead of HTML

Without those, every request either fails auth or returns an HTML error page instead of JSON.

Rather than copy-pasting those three things into every `fetch()` call across five pages, we write a small wrapper once and call it everywhere.

---

## Step 1: Understanding the XSRF token

Laravel's Sanctum sets a cookie called `XSRF-TOKEN` when you hit `GET /sanctum/csrf-cookie`. The browser stores it. On every subsequent POST/PUT/DELETE, your app reads that cookie and sends it back as a request header (`X-XSRF-TOKEN`). Laravel checks that the header matches the cookie — if they match, it knows the request is legitimate.

The cookie is **URL-encoded**, meaning special characters like `=` are escaped as `%3D`. Before you can use the value as a header, you need to decode it.

Here's a function that reads any cookie by name and URL-decodes it:

```typescript
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
```

What each piece does:
- `document.cookie` — a string containing all cookies for this page, e.g. `"XSRF-TOKEN=abc123; laravel_session=xyz"`
- The regex `(^| )name=([^;]+)` — matches ` XSRF-TOKEN=somevalue` and captures `somevalue` in group 2
- `decodeURIComponent(match[2])` — decodes `%3D` back to `=` etc.
- Returns `null` if the cookie isn't found

You call it like: `getCookie('XSRF-TOKEN')`.

---

## Step 2: The fetch wrapper

Now build the `api` function around that. Start with the plain shape:

```typescript
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
    },
  });

  if (!res.ok) {
    throw await res.json();
  }

  return res.json();
}
```

### What `<T>` means (TypeScript generics)

`api<T>` is a *generic function*. `T` is a placeholder for whatever type the caller expects back. When you call `api<User>('GET', '/user')`, TypeScript knows the return type is `Promise<User>`. If you call `api<Policy[]>('GET', '/policies')`, it returns `Promise<Policy[]>`.

Without generics, the return type would be `Promise<any>`, which gives you no autocomplete and no type safety. Generics let one function work for every endpoint without losing type information.

### `import.meta.env.VITE_API_URL`

Vite injects environment variables at build time. In `client-react/.env` (you'll create this), you set:

```
VITE_API_URL=http://localhost:8000
```

Vite replaces `import.meta.env.VITE_API_URL` with that string at build time. Only variables prefixed `VITE_` are exposed to the browser — this is intentional (keeps secrets out of the bundle).

### `?? ''`

`getCookie` returns `string | null`. The `X-XSRF-TOKEN` header value must be a string, not `null`. The `??` (nullish coalescing) operator says "use the right side if the left is null or undefined." In practice the cookie is always set by the time you make API calls, but TypeScript needs you to handle the null case.

---

## Step 3: Handling request bodies

The current function doesn't send a body. Add that:

```typescript
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw await res.json();
  }

  return res.json();
}
```

Why `Content-Type` is conditional: GET requests don't have a body, so sending `Content-Type: application/json` on a GET is technically wrong (and Laravel will complain). Only add it when there's actually something to send.

### Why we `throw` the error response

When Laravel returns a non-2xx status (like 422 for validation errors, 401 for unauthenticated), the response body is a JSON object with useful information. By throwing it, the caller can catch it and read it:

```typescript
try {
  const user = await api<User>('POST', '/login', { email, password });
} catch (err) {
  // err is the parsed JSON error body — e.g. { message: '...', errors: { email: ['...'] } }
}
```

---

## Step 4: Shared interfaces

All the shapes of data that come back from the API should be defined once and imported everywhere. Put them all in `api.ts` alongside the helper.

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
}

// The `errors` field from a 422 Unprocessable Content response.
// Each key is a field name, each value is an array of error strings.
// Example: { email: ['The email has already been taken.'] }
export type ValidationErrors = Record<string, string[]>;

export interface Policy {
  id: number;
  title: string;
  due_date: string;       // ISO date string, e.g. "2026-03-01"
  created_by: string;     // creator's full name
  has_file: boolean;
  signed: boolean;        // has the current user signed?
  overdue: boolean;       // not signed AND past due_date
}

export interface SignoffEntry {
  user: string;           // full name
  signed_at: string | null;
  overdue: boolean;
}

export interface PolicyDetail extends Policy {
  description: string;
  file_name?: string;
  signoff_summary: {
    total_users: number;
    signed_count: number;
    signoffs: SignoffEntry[];
  };
}
```

### `extends`

`PolicyDetail extends Policy` means PolicyDetail has all the fields of Policy plus the additional `signoff_summary` field. This avoids repeating the Policy fields — the detail endpoint returns everything the list endpoint returns, plus more.

### `type` vs `interface`

Both work for object shapes. `ValidationErrors` uses `type` because it's a mapped type (`Record<string, string[]>`) rather than a named object structure. For everything else, `interface` is idiomatic and slightly more readable.

---

## The complete `src/api.ts`

```typescript
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw await res.json();
  }

  return res.json() as Promise<T>;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export type ValidationErrors = Record<string, string[]>;

export interface Policy {
  id: number;
  title: string;
  due_date: string;
  created_by: string;
  has_file: boolean;
  signed: boolean;
  overdue: boolean;
}

export interface SignoffEntry {
  user: string;
  signed_at: string | null;
  overdue: boolean;
}

export interface PolicyDetail extends Policy {
  description: string;
  file_name?: string;
  signoff_summary: {
    total_users: number;
    signed_count: number;
    signoffs: SignoffEntry[];
  };
}
```

---

## Checklist

- [ ] `client-react/.env` exists with `VITE_API_URL=http://localhost:8000`
- [ ] `getCookie` reads and URL-decodes the XSRF-TOKEN cookie
- [ ] `api<T>()` sends the right headers on every request
- [ ] `api<T>()` throws the parsed JSON body on non-2xx responses
- [ ] All interfaces are exported so other files can import them
- [ ] `typecheck` passes: `npm run typecheck` in `client-react/`
