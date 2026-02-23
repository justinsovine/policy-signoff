# Lesson 8: Wiring the Create Page

**Issue:** #43 — Wire up Create page
**File you'll modify:** `client-react/src/pages/Create.tsx`

---

## What's already there

`Create.tsx` has the full form layout — title, description, due date, file upload dropzone with a selected-file card state, and cancel/submit buttons. Inputs are uncontrolled. There's no submit handler. The file dropzone toggle works visually (using a `selectedFile` state) but doesn't connect to anything.

---

## Step 1: Make inputs controlled

Add `useState` for each text field and connect them to their inputs:

```typescript
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [dueDate, setDueDate] = useState('');
const [errors, setErrors] = useState<ValidationErrors>({});
const [submitting, setSubmitting] = useState(false);
const [uploadWarning, setUploadWarning] = useState(false);
```

The file input uses the existing `selectedFile: File | null` state that drives the dropzone toggle — no change needed there, just make sure the submit handler reads from it.

Wire the text inputs:

```tsx
<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>
```

Do the same for `description` (on a `<textarea>`) and `dueDate` (on `<input type="date">`).

---

## Step 2: The submit handler — Part 1: Create the policy

The submit flow is two steps: create the policy record, then upload the file if one was selected. Keep them separate so a file upload failure doesn't prevent the policy from being created.

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitting(true);
  setErrors({});
  setUploadWarning(false);

  let createdPolicy: Policy;

  try {
    createdPolicy = await api<Policy>('POST', '/policies', {
      title,
      description,
      due_date: dueDate,
    });
  } catch (err: unknown) {
    if (isValidationError(err)) {
      setErrors(err.errors);
    } else if (isUnauthorized(err)) {
      navigate('/login?expired=1');
    }
    setSubmitting(false);
    return;
  }

  // ... file upload handled in Step 3

  navigate(`/policies/${createdPolicy.id}`);
}
```

### Why return after the catch

If the policy creation fails (422 validation error or 401), we show the error and stop. The `return` after `setSubmitting(false)` exits the function so we don't try to proceed to the file upload step with no `createdPolicy`.

### `let` instead of `const`

`createdPolicy` is declared with `let` because TypeScript can't guarantee it's assigned if the `try` block throws — using `const` inside `try` would make it unavailable in the outer scope. The `let` declares it in the function scope; the `try` assigns it; any code after the try (Step 3) can read it.

---

## Step 3: The submit handler — Part 2: Upload the file

After the policy is created, upload the file if one was selected. This is a separate try/catch because upload failure is non-fatal — the policy exists, and the user should navigate to it even if the upload fails.

```typescript
if (selectedFile) {
  try {
    // Step 1: Get presigned PUT URL from the API
    const { upload_url } = await api<{ upload_url: string; key: string }>(
      'POST',
      `/policies/${createdPolicy.id}/upload-url`,
      {
        filename: selectedFile.name,
        content_type: selectedFile.type,
      }
    );

    // Step 2: PUT the file directly to MinIO
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      body: selectedFile,
      headers: {
        'Content-Type': selectedFile.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }
  } catch {
    setUploadWarning(true);
  }
}
```

### Why the MinIO PUT is different from api()

The presigned PUT URL points directly to MinIO (or S3) — not to the Laravel API. Sending the XSRF-TOKEN header or session cookies to MinIO would cause a CORS error and the upload would fail. The `fetch` call to MinIO must be completely plain:

- No `credentials: 'include'`
- No `X-XSRF-TOKEN` header
- No `Accept: application/json`
- Just `Content-Type` matching what you sent to `upload-url`

MinIO validates that the `Content-Type` of the actual PUT matches the content type used to generate the presigned URL. If they don't match, it rejects the upload.

### The upload warning

If the upload fails for any reason (network error, MinIO down, wrong content type), set `uploadWarning` to `true`. Show a yellow/amber banner on the Create page or on the Detail page after navigation. The important thing is to still call `navigate()` — the policy record exists and is usable without a file.

---

## Step 4: Show 422 validation errors

The API validates `title`, `description`, and `due_date`. If any fail, it returns 422 with the same `{ errors: { ... } }` shape you handled in Login.

Show errors under each field:

```tsx
{errors.title && (
  <p className="text-red-600 text-sm mt-1">{errors.title[0]}</p>
)}
```

The validation error state on the title input already has red border styling in the visual shell — it's hardcoded to show for design preview. Replace the hardcoded condition with `!!errors.title`:

```tsx
<input
  className={errors.title ? 'border-red-300 ...' : 'border-zinc-300 ...'}
  ...
/>
```

---

## Step 5: Show the upload warning

If `uploadWarning` is `true`, render an amber banner before navigation. You could show it on the Create page while briefly pausing before navigating, or pass it as state to the Detail page via React Router's `useNavigate`. The simpler approach is to show it on the Detail page by passing a flag through navigation state:

```typescript
navigate(`/policies/${createdPolicy.id}`, {
  state: { uploadWarning: uploadWarning },
});
```

Then in `Detail.tsx`, read it:

```typescript
const location = useLocation();
const uploadWarning = location.state?.uploadWarning === true;
```

Show a banner at the top of Detail if `uploadWarning` is true.

Alternatively, just show the warning on the Create page with a brief delay before navigating. Either approach is fine — pick what feels cleaner to you.

---

## Checklist

- [ ] `title`, `description`, `dueDate` are controlled inputs with `value` + `onChange`
- [ ] `errors`, `submitting`, `uploadWarning` declared as state
- [ ] Submit calls `POST /policies` with `{ title, description, due_date: dueDate }`
- [ ] On 422: errors set in state and shown under relevant fields; function returns
- [ ] On 401: navigate to `/login?expired=1`; function returns
- [ ] If `selectedFile` is set: request presigned URL via `POST /policies/:id/upload-url`
- [ ] MinIO PUT uses raw `fetch` — no credentials, no XSRF token, `Content-Type: selectedFile.type`
- [ ] Upload failure sets `uploadWarning` but does not prevent navigation
- [ ] Navigation to `/policies/:id` happens after both steps regardless of upload result
- [ ] Error borders on inputs use `!!errors.fieldName` instead of hardcoded condition
