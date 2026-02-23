# Lesson 5: Wiring Login and Register

**Issue:** #40 — Wire up Login and Register forms
**Files you'll modify:** `client-react/src/pages/Login.tsx`, `client-react/src/components/Global.tsx`

---

## What's already there

`Login.tsx` has the complete visual design — brand panel, form toggle, all error and expired states. Three things aren't wired:

1. Inputs are uncontrolled (no `value` or `onChange`) with hardcoded error state for design preview
2. There's no real submit handler
3. The session-expired banner is hardcoded visible rather than reading the URL

`Global.tsx` has a `NavBar` with an empty Sign Out `onClick`.

---

## Step 1: Make inputs controlled

An *uncontrolled* input manages its own value in the DOM — React can't read it without a ref. A *controlled* input has React state as the source of truth: `value` comes from state, and `onChange` writes back to it.

```tsx
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

Every keystroke fires `onChange`, which calls `setEmail`, which re-renders with the new value. This is React's standard data flow for forms.

Connect `value` and `onChange` to every input in both forms: `email`, `password`, `name`, and `passwordConfirmation`. The `useState` declarations for these are already in the component from when the visual shell was built — you're just wiring them up.

### Clear errors on mode switch

When the user switches from login to register (or back), the existing errors don't apply to the new form. Clear them:

```typescript
function switchMode() {
  setMode(mode === 'login' ? 'register' : 'login');
  setErrors({});
}
```

---

## Step 2: The CSRF preflight

Before the first POST to Laravel, you must call `GET /sanctum/csrf-cookie`. This sets the `XSRF-TOKEN` cookie that the `api()` helper reads and sends on every subsequent request. Without it, Laravel returns 419 (CSRF token mismatch).

This call uses raw `fetch`, not `api()`, for three reasons:

- The XSRF token doesn't exist yet, so there's nothing to send in the header
- It returns 204 with no body (which Lesson 4 fixes, but raw fetch is still simpler here)
- It's a fire-and-forget GET — the response body is empty and unused

```typescript
await fetch(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
  credentials: 'include',
});
```

`credentials: 'include'` is required so the browser accepts and stores the cookie from the cross-origin response. Without it, the cookie is silently ignored.

Call this at the top of the submit handler, before the login or register request.

---

## Step 3: The submit handler

```typescript
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

    const data = await api<UserType>('POST', mode === 'login' ? '/login' : '/register', body);

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
```

### `e.preventDefault()`

HTML forms submit via browser GET/POST by default, which causes a full page reload. `e.preventDefault()` stops that so you can handle submission with JavaScript.

### Why `data` not `user`

The component has a `user` prop in its signature. Writing `const user = await api<UserType>(...)` would *shadow* the prop — creating a new local variable with the same name as the outer one. Using `data` avoids the ambiguity and makes `setUser(data)` clearly mean "the thing returned from the API."

### The `finally` block

`finally` runs whether the try succeeded or the catch ran. `setLoading(false)` goes there so the button always re-enables — even if something unexpected throws that the catch doesn't handle.

---

## Step 4: Handling 422 validation errors

When Laravel receives invalid data, it returns 422 with a body like:

```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

After the Lesson 4 change, `api()` throws `{ status: 422, message: "...", errors: {...} }`. We need a type guard to safely check the shape before reading `.errors`:

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

`err is ApiValidationError` is a *type predicate*. When `isValidationError(err)` returns `true`, TypeScript narrows the type of `err` to `ApiValidationError` inside any `if` block that uses it. That lets you safely access `err.errors` without a type error.

This function is already defined in `Login.tsx` from the visual shell work. Make sure it's being used in the catch block.

Show errors under each field:

```tsx
{errors.email && <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>}
```

`errors.email` is either `undefined` (no error) or `string[]`. `[0]` takes the first message — Laravel sends at least one, and showing more than one is cluttered.

### Password errors

Laravel's `confirmed` validation rule reports mismatches on the `password` field, not `password_confirmation`. So `errors.password` covers both "too short" and "doesn't match confirmation." Don't add a `{errors.password_confirmation}` display — it will never have data.

---

## Step 5: Fix the session-expired banner

The banner currently renders unconditionally (hardcoded `true` for design preview). Wire it to the query param using React Router's `useSearchParams`:

```typescript
const [searchParams] = useSearchParams();
const sessionExpired = searchParams.get('expired') === '1';
```

This hook is already declared in the component. You just need to use `sessionExpired` instead of a hardcoded `true` in the conditional:

```tsx
{sessionExpired && (
  <div className="bg-amber-50 border border-amber-200 ...">
    Your session has expired. Please sign in again.
  </div>
)}
```

`useSearchParams` gives you a `URLSearchParams` object that reads the current URL's query string without any configuration. `.get('expired')` returns `'1'` if the param is present, or `null` if not.

---

## Step 6: Wire logout in NavBar

Open `src/components/Global.tsx`. `NavBar` currently receives `user` but not `setUser`. Logout needs to call the API, clear user state, and navigate — so it needs both.

Add `setUser` to NavBar's props interface:

```typescript
interface NavBarProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}
```

`useNavigate()` can be called directly inside NavBar since it renders inside `BrowserRouter`:

```typescript
const navigate = useNavigate();
```

Wire the Sign Out button:

```typescript
async function handleLogout() {
  await api('POST', '/logout');
  setUser(null);
  navigate('/login');
}
```

Then update every page that renders `NavBar` to pass `setUser` down. Dashboard, Detail, and Create all receive `setUser` as a prop from `App.tsx` — just thread it through:

```tsx
<NavBar user={user} setUser={setUser} />
```

---

## Checklist

- [ ] All inputs in both forms are controlled (`value` + `onChange`)
- [ ] Errors clear when switching between login and register mode
- [ ] Submit calls CSRF preflight with raw `fetch` before the POST
- [ ] Submit handler sets `loading` before the request and clears it in `finally`
- [ ] On success: `setUser(data)` then `navigate('/')`
- [ ] On 422: errors stored in state and shown under each field with `errors[key][0]`
- [ ] `errors.password` covers both min-length and confirmation mismatch; no `errors.password_confirmation` display
- [ ] Session-expired banner reads `?expired=1` from URL via `useSearchParams`, not hardcoded
- [ ] `NavBar` receives `setUser` prop; logout calls `POST /logout`, clears user, navigates to `/login`
- [ ] All pages that render `NavBar` pass `setUser`
