# Lesson 3: Login and Register Page (`src/pages/Login.tsx`)

**Issue:** #23 — React client: Auth flow, API helper, and login/register page
**File you'll build:** `client-react/src/pages/Login.tsx`

---

## What this page does

The Login page handles two things on one screen:

1. **Login** — email + password → session cookie → redirect to dashboard
2. **Register** — name + email + password + confirmation → same result

A toggle button switches between the two forms without navigating away. The URL is always `/login`.

It also shows an amber banner if the user was redirected here because their session expired (`?expired=1` in the URL).

---

## Step 1: Props

From Lesson 2, `App.tsx` passes both `user` and `setUser` into this page. `setUser` updates the parent's auth state after a successful login or register. `user` lets the page redirect already-logged-in users away from the login screen.

Start with the component shell:

```typescript
import { User } from '../api';

interface LoginProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

export function Login({ user, setUser }: LoginProps) {
  return (
    <>
      <h1>Login</h1>
    </>
  );
}
```

---

## Step 2: Hooks and the auth redirect

Look at `App.tsx` — the `/login` route is *not* wrapped in `<RequireAuth>`. That means a logged-in user could navigate to `/login` and see the form. We should redirect them to the dashboard instead.

But there's a critical rule to follow first: **React's Rules of Hooks**. Hooks (`useState`, `useNavigate`, etc.) must always be called in the same order on every render. You can never put a hook *after* a conditional return — if the component bails out early, those hooks never run, and React loses track of which hook is which.

So we declare all hooks first, then check the redirect:

```tsx
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, User, ValidationErrors } from '../api';

export function Login({ user, setUser }: LoginProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  // Redirect AFTER all hooks are declared
  if (user) {
    return <Navigate to="/" replace />;
  }

  // ... rest of the component
}
```

`<Navigate>` is React Router's component-based redirect — when it renders, the browser navigates to the `to` path. The `replace` prop prevents `/login` from appearing in the browser history, so the back button doesn't loop back to the login page.

---

## Step 3: Controlled inputs

A "controlled input" is one where React state is the source of truth for its value. Instead of the DOM holding the current value, your `useState` variable holds it, and you sync them with `value` and `onChange`:

```tsx
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

Every keystroke fires `onChange`, which calls `setEmail`, which updates state, which re-renders with the new value in the input. This sounds circular but it's React's standard data flow.

### `mode` state

`'login' | 'register'` is a TypeScript union type — the value can only be one of those two strings. This is safer than using a boolean because it's explicit about what the modes are.

---

## Step 4: The form toggle

Render different fields based on `mode`:

```tsx
<button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
  {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
</button>
```

When switching modes, clear the errors (they're no longer relevant):

```tsx
function switchMode() {
  setMode(mode === 'login' ? 'register' : 'login');
  setErrors({});
}
```

Show the name and password confirmation fields only in register mode:

```tsx
{mode === 'register' && (
  <div>
    <label>Name</label>
    <input value={name} onChange={(e) => setName(e.target.value)} />
    {errors.name && <p className="text-red-600">{errors.name[0]}</p>}
  </div>
)}
```

---

## Step 5: The CSRF preflight

Before the first POST to Laravel, you must hit `GET /sanctum/csrf-cookie`. This sets the `XSRF-TOKEN` cookie. Without it, Laravel returns 419 (CSRF token mismatch) on every form submission.

The simplest place to call it is at the top of the submit handler, before the login/register request. Calling it on every submit is harmless — it's an idempotent GET that just refreshes the cookie:

```typescript
await fetch(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
  credentials: 'include',
});
```

Note: this uses a raw `fetch`, not the `api()` helper, because:
- It's a GET request, so there's no body or Content-Type to manage
- There's no JSON response to parse
- The XSRF token cookie doesn't exist yet, so there's nothing to send in the header

---

## Step 6: The submit handler

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();  // stops the browser from reloading the page
  setLoading(true);
  setErrors({});

  try {
    // 1. Get the CSRF cookie
    await fetch(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
      credentials: 'include',
    });

    // 2. Log in or register
    const body =
      mode === 'login'
        ? { email, password }
        : { name, email, password, password_confirmation: passwordConfirmation };

    const data = await api<User>('POST', mode === 'login' ? '/login' : '/register', body);

    // 3. Update parent state and redirect
    setUser(data);
    navigate('/');
  } catch (err: unknown) {
    // 4. Handle validation errors
    if (isValidationError(err)) {
      setErrors(err.errors);
    }
  } finally {
    setLoading(false);
  }
}
```

### `e.preventDefault()`

HTML forms submit via GET/POST by default, which causes a full page reload. `e.preventDefault()` stops that so we can handle it with JavaScript instead.

### `React.FormEvent`

The `e` parameter in a form's `onSubmit` handler is typed as `React.FormEvent`. This is React's type for form events — you need it to call `e.preventDefault()` in TypeScript without a type error.

### Why the response is called `data`, not `user`

The component already has a `user` prop from its function signature. If you wrote `const user = await api<User>(...)`, that would *shadow* the prop — creating a new local variable with the same name. Shadowing is confusing because a reader might think `setUser(user)` is passing the prop back, not the API response. Using `data` makes it clear which `user` you mean.

### The `finally` block

`finally` runs whether the try succeeded or the catch ran. Setting `setLoading(false)` in `finally` ensures the button always re-enables, even if something unexpected throws.

---

## Step 7: Handling 422 validation errors

When Laravel receives invalid form data (bad email format, password too short, etc.), it returns a 422 response with a body like this:

```json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

Our `api()` helper throws this object — look at `api.ts` line 38: `throw await response.json()`. The thrown value is the parsed JSON body, which includes the `errors` field matching the `ValidationErrors` type (`Record<string, string[]>`).

We need a type guard to safely check the shape of the thrown value before reading `.errors`:

```typescript
interface ApiValidationError {
  errors: ValidationErrors;
}

function isValidationError(err: unknown): err is ApiValidationError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    typeof (err as ApiValidationError).errors === 'object'
  );
}
```

### What a type guard is

`err is ApiValidationError` is a *type predicate*. When `isValidationError(err)` returns `true`, TypeScript narrows the type of `err` to `ApiValidationError` inside the `if` block. That lets you safely access `err.errors` without TypeScript complaining that `err` might be something else.

In the catch block:

```typescript
} catch (err: unknown) {
  if (isValidationError(err)) {
    setErrors(err.errors);  // TypeScript knows err.errors exists here
  }
}
```

Then under each field, show the first error message if one exists:

```tsx
{errors.email && <p className="text-red-600 text-sm">{errors.email[0]}</p>}
```

`errors.email` is either `undefined` (no error) or `string[]` (has errors). Both are falsy/truthy in a way that works naturally with the `&&` short-circuit.

---

## Step 8: The session-expired banner

When `App.tsx` detects an expired session, it redirects to `/login?expired=1`. The Login page reads that query parameter and shows an amber warning banner.

React Router's `useSearchParams` hook gives you read access to the URL's query string. We already called it at the top of the component (before the early return, per the rules of hooks):

```typescript
const [searchParams] = useSearchParams();
const sessionExpired = searchParams.get('expired') === '1';
```

Then in the JSX, show the banner conditionally:

```tsx
{sessionExpired && (
  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 text-sm">
    Your session has expired. Please sign in again.
  </div>
)}
```

---

## The complete `src/pages/Login.tsx`

```tsx
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, User, ValidationErrors } from '../api';

interface LoginProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

interface ApiValidationError {
  errors: ValidationErrors;
}

function isValidationError(err: unknown): err is ApiValidationError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    typeof (err as ApiValidationError).errors === 'object'
  );
}

export function Login({ user, setUser }: LoginProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
      });

      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, password, password_confirmation: passwordConfirmation };

      const data = await api<User>('POST', mode === 'login' ? '/login' : '/register', body);
      setUser(data);
      navigate('/');
    } catch (err: unknown) {
      if (isValidationError(err)) {
        setErrors(err.errors);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold font-serif text-center">PolicySignoff</h1>

        {sessionExpired && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 text-sm">
            Your session has expired. Please sign in again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white rounded py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          <button onClick={switchMode} className="underline">
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
```

---

## Checklist

- [ ] `user` and `setUser` props are typed and received correctly
- [ ] All hooks (`useNavigate`, `useSearchParams`, `useState`) are called before any early return
- [ ] Logged-in users are redirected to `/` via `<Navigate>` (after hooks)
- [ ] `mode` state switches between `'login'` and `'register'`; errors clear on switch
- [ ] All form fields are controlled inputs (`value` + `onChange`)
- [ ] `handleSubmit` calls the CSRF endpoint before the login/register POST
- [ ] 422 errors are caught and stored in `errors` state; shown under each field
- [ ] `sessionExpired` banner shows when `?expired=1` is in the URL
- [ ] On success: `setUser` is called with the API response, then navigate to `/`
- [ ] `loading` disables the submit button while the request is in flight
