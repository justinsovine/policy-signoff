# Lesson 4: API Helper Fix and Session Restoration

**Issue:** #39 — Complete api() helper and session restoration
**Files you'll modify:** `client-react/src/api.ts`, `client-react/src/App.tsx`

---

## What needs fixing

Two things are broken before any real API integration can work:

1. `api()` always calls `response.json()`. The CSRF cookie endpoint (`GET /sanctum/csrf-cookie`) returns a 204 No Content response — no body, no JSON. Calling `.json()` on an empty response throws a SyntaxError before the login form ever submits.

2. `App.tsx` has its real session check commented out and replaced with a hardcoded dev user. Until this is restored, the app never checks whether the user is actually authenticated.

While we're fixing the error handling in `api()`, we'll also enrich it to preserve the HTTP status code on thrown errors. Later pages need to detect 401 responses specifically (to redirect to the session-expired login page rather than showing a generic error).

---

## Step 1: Fix api() for empty responses

Open `src/api.ts`. The last lines of the function currently look like this:

```typescript
if (!response.ok) {
  throw await response.json();
}

return response.json() as Promise<T>;
```

There are two changes to make:

**First**, preserve the HTTP status code when throwing errors:

```typescript
if (!response.ok) {
  const body = await response.json().catch(() => ({}));
  throw { status: response.status, ...body };
}
```

The original code throws `await response.json()` directly — the raw parsed body. That works for 422 validation errors, but the caller can't tell *which* kind of error it was without inspecting the shape. Adding `status` to the thrown object gives every catch block a reliable way to check for 401 without guessing from the message text.

The `.catch(() => ({}))` fallback handles error responses that don't have a JSON body — a network error or a 500 with an HTML page would otherwise throw a SyntaxError inside the catch, swallowing the real status code.

**Second**, return early on 204 responses:

```typescript
if (response.status === 204) {
  return undefined as T;
}
```

Add this after the error check. A 204 means "success, no content" — there's nothing to parse. The `as T` cast is an intentional escape hatch: TypeScript can't verify the return is `T` because there's nothing there, but callers that use `api()` for 204 endpoints don't use the return value anyway.

The final function tail looks like this:

```typescript
if (!response.ok) {
  const body = await response.json().catch(() => ({}));
  throw { status: response.status, ...body };
}

if (response.status === 204) {
  return undefined as T;
}

return response.json() as Promise<T>;
```

---

## Step 2: Restore session check in App.tsx

Open `src/App.tsx`. The `AppRoutes` component has a `useEffect` that spoofs a user:

```typescript
useEffect(() => {
  setUser({ id: 1, name: 'Dev User', email: 'dev@example.com' });
  setLoading(false);
}, []);
```

Replace it with a real `GET /user` call:

```typescript
useEffect(() => {
  api<UserType>('GET', '/user')
    .then((data) => {
      setUser(data);
    })
    .catch(() => {
      setUser(null);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);
```

### Why `.then/.catch` instead of `async/await`

React's `useEffect` expects its callback to return either nothing or a cleanup function. An `async` function returns a Promise, which React doesn't know what to do with. You can work around it by defining an inner async function and calling it immediately, but for a simple single-call case like this, `.then/.catch` is cleaner.

### What happens on 401

If the user isn't logged in, `GET /user` returns 401. The `api()` helper throws on any non-ok response. The `.catch()` handler sets user to `null`. Then the `finally` block calls `setLoading(false)`.

With `user = null` and `loading = false`, any route wrapped in `RequireAuth` redirects to `/login`. This is the normal unauthenticated flow — no ?expired=1 because we don't know if they were ever logged in, we just know they aren't now.

The `?expired=1` redirect happens from *within* pages when a user action triggers a 401 during normal use — that's covered in Lesson 6.

---

## Step 3: Understand why loading matters

Look at the `RequireAuth` component:

```typescript
function RequireAuth({ user, children }: RequireAuthProps) {
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
```

If `loading` stayed `false` and `user` started as `null`, then on first render `RequireAuth` would immediately redirect to `/login` — before the `GET /user` response arrives. A user with a valid session would see a flash to the login page, then be bounced back.

The fix is already in place: `loading` starts as `true`, and `AppRoutes` returns `null` while it's true:

```typescript
if (loading) return null;
```

React renders nothing until the session check resolves. Then `setLoading(false)` triggers a re-render with the real user state and routing works correctly.

---

## Checklist

- [ ] `api()` throws `{ status: response.status, ...body }` instead of the raw body
- [ ] `api()` returns `undefined as T` on 204 responses instead of calling `.json()`
- [ ] `AppRoutes` calls `GET /user` on mount via `api()`
- [ ] On success: `setUser(data)`; on failure: `setUser(null)`; either way: `setLoading(false)` in `finally`
- [ ] `loading` starts `true` and only becomes `false` after the check resolves
- [ ] `if (loading) return null` prevents `RequireAuth` from flash-redirecting before the check completes
