# Lesson 6: Wiring the Dashboard

**Issue:** #41 — Wire up Dashboard to real API
**File you'll modify:** `client-react/src/pages/Dashboard.tsx`

---

## What's already there

`Dashboard.tsx` renders a full policy list and summary stats, but everything is hardcoded. There are four static policy objects in the component body and four hardcoded counts in `SummaryStats`. No data fetching happens.

The goal: call `GET /policies` on mount, show a loading state while the request is in flight, replace the static rows with real data, and derive the summary counts from the response.

---

## Step 1: Add state for the data

You'll need three pieces of state:

```typescript
const [policies, setPolicies] = useState<Policy[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(false);
```

`Policy` is already defined in `src/types.ts`. Import it.

`loading` starts as `true` because the request fires immediately on mount — the component has no useful state to render before it resolves. Starting `true` means you can render a skeleton or spinner right away without a frame of stale data flashing first.

---

## Step 2: Fetch on mount with useEffect

```typescript
useEffect(() => {
  async function loadPolicies() {
    try {
      const data = await api<Policy[]>('GET', '/policies');
      setPolicies(data);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        navigate('/login?expired=1');
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }

  loadPolicies();
}, []);
```

### Why you can't make useEffect async

React's `useEffect` expects its callback to return either nothing or a cleanup function. An `async` function always returns a Promise, and React doesn't know what to do with a Promise as a cleanup value. The pattern is to define an inner `async` function and call it immediately inside the effect.

### The dependency array

The empty `[]` means this effect runs once — after the first render. Without it, the effect would run after every render, including the ones caused by `setPolicies`, creating an infinite loop.

### useNavigate for the expired redirect

`useNavigate` must be called at the top of the component, before any conditional returns. Add it alongside the other hooks:

```typescript
const navigate = useNavigate();
```

### Detecting 401

After the Lesson 4 change, `api()` throws `{ status: response.status, ...body }`. A helper to check for 401:

```typescript
function isUnauthorized(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status: number }).status === 401
  );
}
```

When `GET /policies` returns 401, the session expired while the user was logged in. Navigate to `/login?expired=1` so the login page shows the session-expired banner. Any other error (500, network failure) sets the error flag instead.

---

## Step 3: Render loading and error states

Before the main return, handle the loading and error cases:

```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-zinc-400 text-sm">Loading...</p>
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-zinc-400 text-sm">Something went wrong. Try refreshing.</p>
    </div>
  );
}
```

These can be as simple or as polished as you like — the important part is that they exist so the component never renders with `policies = []` when data is expected.

---

## Step 4: Derive summary counts

Replace the four hardcoded numbers in `SummaryStats` with counts derived from the `policies` array:

```typescript
const total = policies.length;
const signed = policies.filter((p) => p.signed).length;
const overdue = policies.filter((p) => p.overdue).length;
const pending = policies.filter((p) => !p.signed && !p.overdue).length;
```

Pass these to `SummaryStats` as props, or compute them inline in the JSX.

`Array.filter()` returns a new array containing only the elements where the callback returns `true`. Chaining `.length` gives the count. Each policy has `signed` and `overdue` booleans from the API response — `pending` is everything that's neither signed nor overdue.

---

## Step 5: Replace hardcoded rows with real data

The `PolicyTable` component (or the table rendering code) currently maps over a hardcoded array. Replace it with `policies.map(...)`:

```tsx
{policies.map((policy) => (
  <div key={policy.id} onClick={() => navigate(`/policies/${policy.id}`)}>
    {/* render policy.title, policy.due_date, policy.created_by, etc. */}
  </div>
))}
```

### The `key` prop

React uses `key` to track list items across renders. Without it, React can't tell which item changed when the list updates and will re-render the entire list. `policy.id` is a stable, unique value — always use it as the key when rendering API data.

---

## Checklist

- [ ] `policies`, `loading`, and `error` are declared as state
- [ ] `useEffect` fetches `GET /policies` on mount (empty dependency array)
- [ ] Inner async function used inside useEffect (not async callback directly)
- [ ] On 401: navigate to `/login?expired=1`
- [ ] On other errors: set `error` state
- [ ] Loading and error states render before the main return
- [ ] Summary counts derived from the `policies` array with `filter().length`
- [ ] Policy rows rendered with `policies.map()`; each row has `key={policy.id}`
