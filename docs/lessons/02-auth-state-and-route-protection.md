# Lesson 2: Auth State and Route Protection (`App.tsx`)

**Issue:** #23 — React client: Auth flow, API helper, and login/register page
**File you'll modify:** `client-react/src/App.tsx`

---

## What this does and why

Right now `App.tsx` renders all four routes unconditionally — anyone can visit `/` or `/create` without being logged in. We need to:

1. **Track who's logged in** — hold a `user` object in state (or `null` if no one is)
2. **Check on startup** whether a session already exists (so refreshing the page doesn't log you out)
3. **Redirect unauthenticated visitors** away from protected pages to `/login`
4. **Detect expired sessions** and append `?expired=1` so the login page can show a banner

This all lives in `App.tsx` because it's the root of the component tree — every page is a child of `App`, so it's the right place to own the auth state and pass it down.

---

## Step 1: What "auth state" means in a SPA

In a traditional server-rendered app, the server knows who's logged in because the session cookie is checked on every page load. In a single-page app, there's no page load after the first one — React handles navigation in the browser without making a new request to the server.

That means we need to keep track of the logged-in user in JavaScript memory. We do this with a state variable:

```typescript
const [user, setUser] = useState<User | null>(null);
```

- When `user` is `null`, no one is logged in
- When `user` is a `User` object, someone is logged in
- `setUser` is how we update it (from Login, from Logout, from the startup check)

`useState<User | null>` is the typed version. TypeScript knows this variable is either a `User` or `null`, so if you try to access `user.name` without checking that `user` isn't null first, TypeScript will warn you.

---

## Step 2: Checking for an existing session on startup

When the app loads, there might already be a valid session from a previous visit. We check by calling `GET /user` — if it succeeds, the session is alive; if it returns 401, it's not.

We do this in a `useEffect` with an empty dependency array, which means "run this once when the component first mounts":

```typescript
useEffect(() => {
  api<User>('GET', '/user')
    .then(setUser)
    .catch(() => {
      // 401 — not logged in, do nothing (user stays null)
    });
}, []);
```

### What `useEffect` does

`useEffect` runs *after* React renders the component. The empty array `[]` means "don't re-run this when state changes — only run it once." This is the standard pattern for "fetch something when the component loads."

### Why we don't redirect here yet

We can't redirect on a 401 here, because we don't know *why* the user isn't logged in — they might just be a first-time visitor. The session-expiry redirect only happens when the user was previously logged in but the session has since expired. We'll handle that in the Login page (it reads `?expired=1` from the URL, which we'll add in a moment).

---

## Step 3: Tracking whether the user *was* logged in

To distinguish "never logged in" from "session expired," we need a second piece of state:

```typescript
const [wasLoggedIn, setWasLoggedIn] = useState(false);
```

Set it to `true` whenever `setUser` is called with a real user. When the startup check fails with a 401 *and* `wasLoggedIn` is true, we know the session expired:

```typescript
useEffect(() => {
  api<User>('GET', '/user')
    .then((u) => {
      setUser(u);
      setWasLoggedIn(true);
    })
    .catch(() => {
      if (wasLoggedIn) {
        // Session expired — login page will show the banner
        navigate('/login?expired=1');
      }
    });
}, []);
```

In practice this runs once at startup, so `wasLoggedIn` is almost always `false` on the initial check (nobody has logged in yet this page load). The main case where it matters is if you add a mechanism to re-check the session while the user is active — but for this project, the simpler pattern is fine: just redirect to `/login?expired=1` on any startup 401 if the session cookie exists but is invalid. (You can also check for the session cookie's presence directly if you prefer.)

---

## Step 4: Passing `user` and `setUser` to pages

Protected pages need `user` (to know who's logged in and to check sign-off status). The Dashboard needs `setUser` (to null it out on logout).

The simplest approach: pass them as props. React passes data from parent to child through props.

Update each route's element to pass the props:

```tsx
<Route path="/" element={<Dashboard user={user} setUser={setUser} />} />
```

Each page component then declares it accepts those props:

```typescript
interface DashboardProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

export function Dashboard({ user, setUser }: DashboardProps) {
  // ...
}
```

You'll do this for Dashboard, Detail, and Create. Login gets `setUser` so it can update the parent after a successful login.

---

## Step 5: Route protection with `Navigate`

React Router's `<Navigate>` component redirects when it renders. Wrap each protected route's element in a check:

```tsx
// A small helper — renders children if logged in, redirects if not
function RequireAuth({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
```

Then use it in your routes:

```tsx
<Route
  path="/"
  element={
    <RequireAuth user={user}>
      <Dashboard user={user} setUser={setUser} />
    </RequireAuth>
  }
/>
```

### `replace`

`replace` on `<Navigate>` replaces the current history entry instead of pushing a new one. Without it, pressing the browser Back button from `/login` would take the user back to `/`, which would immediately redirect them to `/login` again — an infinite loop. With `replace`, the back button skips past the redirect.

### The loading state problem

There's a subtle bug in the above: on first load, `user` is `null` and the startup `useEffect` hasn't run yet. If you render `RequireAuth` immediately, it redirects to `/login` before the session check finishes.

Fix it with a loading state:

```typescript
const [loading, setLoading] = useState(true);
```

```typescript
useEffect(() => {
  api<User>('GET', '/user')
    .then(setUser)
    .catch(() => { /* not logged in */ })
    .finally(() => setLoading(false));
}, []);
```

Then in the JSX:

```tsx
if (loading) return null; // or a spinner
```

Render nothing until we know the auth state. This prevents the flash of a redirect on first load.

---

## The complete `App.tsx`

```tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api, User } from './api';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Detail } from './pages/Detail';
import { Create } from './pages/Create';
import './App.css';

interface ProtectedProps {
  user: User | null;
  children: React.ReactNode;
}

function RequireAuth({ user, children }: ProtectedProps) {
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>('GET', '/user')
      .then(setUser)
      .catch(() => { /* no active session */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route
          path="/"
          element={
            <RequireAuth user={user}>
              <Dashboard user={user} setUser={setUser} />
            </RequireAuth>
          }
        />
        <Route
          path="/policies/:id"
          element={
            <RequireAuth user={user}>
              <Detail user={user} />
            </RequireAuth>
          }
        />
        <Route
          path="/create"
          element={
            <RequireAuth user={user}>
              <Create />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Checklist

- [ ] `user` state is typed as `User | null`
- [ ] `useEffect` checks `GET /user` on mount to restore a live session
- [ ] `loading` prevents a flash redirect before the session check finishes
- [ ] `RequireAuth` redirects to `/login` (with `replace`) when `user` is null
- [ ] `user` and `setUser` are passed as props to the pages that need them
- [ ] Refreshing while logged in keeps you on the current page (session restored)
- [ ] Refreshing while logged out redirects you to `/login`
