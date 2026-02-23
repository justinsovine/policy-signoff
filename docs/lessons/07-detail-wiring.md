# Lesson 7: Wiring the Detail Page

**Issue:** #42 — Wire up Detail page
**File you'll modify:** `client-react/src/pages/Detail.tsx`

---

## What's already there

`Detail.tsx` renders the full policy detail layout: metadata, description, sign-off button, and a sign-off summary table. All the data is hardcoded. A `hasSigned` boolean toggle switches between the unsigned and signed visual states.

There are three things to wire:

1. Fetch real policy data on mount using the ID from the URL
2. Sign-off action — POST to the API, re-fetch, update UI
3. File download — fetch a presigned URL, open it in a new tab

---

## Step 1: Get the policy ID from the URL

React Router's `useParams` hook reads the dynamic segments of the current URL. The route is defined as `/policies/:id`, so:

```typescript
const { id } = useParams<{ id: string }>();
```

`id` will be a string — URL params are always strings, even if the value looks like a number. The API accepts string IDs in the path, so you can use it directly without converting.

---

## Step 2: Add state and fetch on mount

```typescript
const [policy, setPolicy] = useState<PolicyDetail | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(false);
```

`PolicyDetail` is already defined in `src/types.ts` — it extends `Policy` with `description`, `file_name`, and `signoff_summary`.

Fetch on mount:

```typescript
useEffect(() => {
  async function loadPolicy() {
    try {
      const data = await api<PolicyDetail>('GET', `/policies/${id}`);
      setPolicy(data);
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

  loadPolicy();
}, [id]);
```

The dependency array is `[id]` instead of `[]`. If the user navigates directly from one policy detail to another (e.g., via browser history), `id` changes but the component doesn't unmount and remount — the effect needs to re-run to load the new policy.

---

## Step 3: Derive hasSigned from the API response

The current component has a standalone `useState` boolean for `hasSigned` that you click to toggle. Replace it with a derived value from the fetched policy:

```typescript
const hasSigned = policy?.signed ?? false;
```

`policy?.signed` uses optional chaining — if `policy` is null (while loading), it returns `undefined` instead of throwing. The `?? false` coalesces `undefined` to `false`.

You still need a way to update the UI after signing without waiting for a refetch to complete. The cleanest approach is to refetch the full policy after a successful sign-off. The policy object from the API will have `signed: true`, and `hasSigned` will update automatically.

---

## Step 4: Wire the sign-off button

```typescript
const [signing, setSigning] = useState(false);

async function handleSignOff() {
  setSigning(true);
  try {
    await api('POST', `/policies/${id}/signoff`);
  } catch (err: unknown) {
    // 409 means already signed — treat as success
    if (!isConflict(err) && !isUnauthorized(err)) {
      // unexpected error — could show a toast, but don't block
    }
    if (isUnauthorized(err)) {
      navigate('/login?expired=1');
      return;
    }
  }

  // Refetch to get updated signed status and signoff_summary
  try {
    const data = await api<PolicyDetail>('GET', `/policies/${id}`);
    setPolicy(data);
  } catch {
    // Refetch failed — the sign-off still happened, not critical
  } finally {
    setSigning(false);
  }
}
```

### 409 as success

The API returns 409 (Conflict) if the user tries to sign off on a policy they've already signed. From the user's perspective, the desired state — "I've signed this" — is already true. Treating 409 identically to 200 means clicking Sign Off twice does nothing harmful. Add a helper alongside `isUnauthorized`:

```typescript
function isConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status: number }).status === 409
  );
}
```

### Why refetch instead of optimistic update

Optimistic updates patch local state immediately and roll back on failure. That works well for simple toggling, but the sign-off summary table shows *all users'* statuses, counts, and timestamps — data we don't have locally. Refetching is simpler and keeps everything consistent.

---

## Step 5: Wire the download button

The download button should fetch a presigned URL from the API and open it in a new tab.

```typescript
async function handleDownload() {
  try {
    const data = await api<{ download_url: string; file_name: string }>(
      'GET',
      `/policies/${id}/download-url`
    );
    window.open(data.download_url, '_blank');
  } catch (err: unknown) {
    if (isUnauthorized(err)) {
      navigate('/login?expired=1');
    }
  }
}
```

`window.open(url, '_blank')` opens the URL in a new browser tab. The presigned URL contains temporary S3/MinIO credentials embedded as query parameters — the browser downloads the file directly from object storage without going back through the API.

The download button should only render if `policy.has_file` is `true`. This is already conditional in the visual shell; just make sure the condition uses the fetched `policy.has_file` instead of a hardcoded value.

---

## Step 6: Replace hardcoded data

With `policy` in state, replace every hardcoded value:

- `policy.title`, `policy.description`, `policy.due_date`
- `policy.created_by` for the metadata row
- `policy.signed`, `policy.overdue` passed to `getStatusInfo()`
- `policy.signoff_summary.signed_count` and `policy.signoff_summary.total_users` for the count display
- `policy.signoff_summary.signoffs.map(...)` for the sign-off table rows
- `policy.has_file` to conditionally show the download button

The `signoff_summary.signoffs` array contains `SignoffEntry` objects with `user`, `signed_at`, and `overdue`. Map over them the same way you replaced the hardcoded rows in Dashboard.

---

## Checklist

- [ ] `useParams()` extracts `id` from the URL
- [ ] `policy`, `loading`, `error` declared as state
- [ ] `useEffect` fetches `GET /policies/:id` on mount with `[id]` dependency array
- [ ] `hasSigned` derived from `policy.signed`, not a standalone toggle
- [ ] Sign-off button calls `POST /policies/:id/signoff`; 409 treated as success
- [ ] After sign-off: policy refetched to update summary table
- [ ] `signing` state disables the button while in flight
- [ ] Download button calls `GET /policies/:id/download-url`; opens `download_url` in new tab
- [ ] Download button only renders when `policy.has_file` is true
- [ ] All hardcoded field values replaced with data from `policy`
- [ ] 401 from any request navigates to `/login?expired=1`
