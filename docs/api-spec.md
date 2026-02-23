# PolicySignoff — API Specification

A simple policy sign-off tracker. Admin creates policies with deadlines, users acknowledge them, everyone can see who's signed and who hasn't.

---

## User Flow

1. User registers or logs in
2. User sees a list of all policies, each showing their personal sign-off status and the due date
3. User reads a policy (and optionally downloads the attached document) and clicks "Sign Off" to acknowledge it
4. Any authenticated user can create a new policy with a title, description, due date, and an optional file attachment
5. Any user can view a policy's sign-off summary — who has signed, who hasn't, who's overdue

That's the whole app.

**Important:** Every registered user is expected to sign off on every policy. There is no assignment or invitation system — if you have an account, you owe sign-offs on all existing policies. The sign-off summary for a policy lists all users in the system and their status.

---

## Data Model

### users
Standard Laravel `users` table. No modifications needed beyond what `php artisan make:auth` / Breeze provides.

| Column | Type | Notes |
|---|---|---|
| id | bigint | PK |
| name | string | |
| email | string | unique |
| password | string | hashed |
| timestamps | | |

### policies
| Column | Type | Notes |
|---|---|---|
| id | bigint | PK |
| title | string | e.g. "2026 Employee Handbook" |
| description | text | the policy content or summary |
| due_date | date | deadline for sign-off |
| file_path | string, nullable | S3/MinIO object key (e.g. `policies/abc123.pdf`). Null if no file attached. |
| file_name | string, nullable | Original filename for display (e.g. `Employee_Handbook_2026.pdf`) |
| created_by | foreignId → users | who posted it |
| timestamps | | |

### signoffs
| Column | Type | Notes |
|---|---|---|
| id | bigint | PK |
| policy_id | foreignId → policies | |
| user_id | foreignId → users | |
| signed_at | timestamp | when they signed off |
| unique constraint | | (policy_id, user_id) — one sign-off per user per policy |

---

## API Routes

All routes return JSON. All except register/login/logout require authentication via Sanctum.

### Auth

| Method | Route | What it does |
|---|---|---|
| POST | `/register` | Create account. Accepts `name`, `email`, `password`, `password_confirmation`. Returns user + sets session cookie. |
| POST | `/login` | Log in. Accepts `email`, `password`. Returns user + sets session cookie. |
| POST | `/logout` | Log out. Clears session. |
| GET | `/user` | Returns the currently authenticated user. Used by frontends to check auth state on load. |

### Policies

| Method | Route | What it does |
|---|---|---|
| GET | `/policies` | List all policies. Each includes: title, due_date, creator name, and the current user's sign-off status (signed/pending/overdue). Sorted by due_date ascending (most urgent first). |
| POST | `/policies` | Create a policy. Accepts `title`, `description`, `due_date`. Returns the created policy. |
| GET | `/policies/{id}` | Single policy with full description, due_date, and sign-off summary: list of all users with their status (signed + timestamp, or pending/overdue). |

### Sign-offs

| Method | Route | What it does |
|---|---|---|
| POST | `/policies/{id}/signoff` | Current user signs off on this policy. Records timestamp. Returns 409 if already signed. |

### File Uploads

| Method | Route | What it does |
|---|---|---|
| POST | `/policies/{id}/upload-url` | Returns a presigned PUT URL for uploading a file to MinIO/S3. Accepts `filename` and `content_type`. Returns the presigned URL and the object key. |
| GET | `/policies/{id}/download-url` | Returns a presigned GET URL for downloading/viewing the attached file. Returns 404 if no file attached. |

---

## Response Shapes

### Policy (list item)
```json
{
  "id": 1,
  "title": "2026 Employee Handbook",
  "due_date": "2026-03-01",
  "created_by": "Jane Admin",
  "has_file": true,
  "signed": false,
  "overdue": true
}
```

### Policy (detail)
```json
{
  "id": 1,
  "title": "2026 Employee Handbook",
  "description": "Full policy text here...",
  "due_date": "2026-03-01",
  "created_by": "Jane Admin",
  "has_file": true,
  "file_name": "Employee_Handbook_2026.pdf",
  "signed": false,
  "overdue": true,
  "signoff_summary": {
    "total_users": 5,
    "signed_count": 3,
    "signoffs": [
      { "user": "Alice Thompson", "user_id": 1, "signed_at": "2026-02-10T14:30:00Z", "overdue": false },
      { "user": "Bob Martinez", "user_id": 2, "signed_at": "2026-02-11T09:15:00Z", "overdue": false },
      { "user": "Charlie Kim", "user_id": 3, "signed_at": null, "overdue": true },
      { "user": "Dana Williams", "user_id": 4, "signed_at": null, "overdue": false }
    ]
  }
}
```

### Sign-off confirmation
```json
{
  "message": "Signed off successfully",
  "signed_at": "2026-02-17T10:00:00Z"
}
```

### Upload URL response
```json
{
  "upload_url": "https://minio.justinsovine.com/policysignoff/policies/abc123.pdf?X-Amz-...",
  "key": "policies/abc123.pdf"
}
```

### Download URL response
```json
{
  "download_url": "https://minio.justinsovine.com/policysignoff/policies/abc123.pdf?X-Amz-...",
  "file_name": "Employee_Handbook_2026.pdf"
}
```

---

## Sanctum Configuration

The API uses Sanctum cookie-based SPA authentication. The frontend apps live on subdomains of `justinsovine.com`.

### Key config values

**.env:**
```
SESSION_DOMAIN=.justinsovine.com
SANCTUM_STATEFUL_DOMAINS=policysignoff.justinsovine.com,alpine.policysignoff.justinsovine.com,vue.policysignoff.justinsovine.com
```

**config/cors.php:**
```php
'allowed_origins' => [
    'https://policysignoff.justinsovine.com',
    'https://alpine.policysignoff.justinsovine.com',
    'https://vue.policysignoff.justinsovine.com',
],
'supports_credentials' => true,
```

### Auth flow from the frontend
1. `GET /sanctum/csrf-cookie` — sets XSRF-TOKEN cookie
2. `POST /login` with credentials — sets session cookie
3. All subsequent requests include cookies automatically (`credentials: 'include'` on fetch)
4. `GET /user` to verify auth state on page load

---

## MinIO / Object Storage Configuration

MinIO provides S3-compatible object storage. The frontend upload code is identical to what you'd write against real AWS S3 — same presigned URL pattern, same PUT request.

### Key config values

**.env:**
```
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=your-minio-key
AWS_SECRET_ACCESS_KEY=your-minio-secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=policysignoff
AWS_ENDPOINT=https://minio.justinsovine.com
AWS_USE_PATH_STYLE_ENDPOINT=true
```

Laravel's `s3` filesystem driver works with MinIO out of the box — just set the endpoint and enable path-style URLs.

### Upload flow
1. Frontend calls `POST /policies/{id}/upload-url` with the filename and content type
2. API generates a presigned PUT URL using Laravel's Storage facade
3. API stores the object key and original filename on the policy record
4. Frontend PUTs the file directly to MinIO using the presigned URL — the file never touches the Laravel server
5. On the policy detail page, frontend calls `GET /policies/{id}/download-url` to get a presigned GET URL for viewing/downloading

### Why this matters for the interview
"The frontend doesn't touch storage credentials — it asks the API for a presigned URL, then uploads directly to the object store. I used MinIO for development since it's S3-compatible — the frontend code is identical to what you'd use with AWS S3."

---

## Validation Rules

### POST /register
- `name` — required, string, max 255
- `email` — required, email, unique:users
- `password` — required, min 8, confirmed

### POST /login
- `email` — required, email
- `password` — required

### POST /policies
- `title` — required, string, max 255
- `description` — required, string
- `due_date` — required, date, after_or_equal:today

### POST /policies/{id}/upload-url
- `filename` — required, string (original filename, must end in `.pdf`, `.doc`, or `.docx`)
- `content_type` — required, string (must be `application/pdf`, `application/msword`, or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- File size limit: 10 MB (enforced by presigned URL policy)

---

## Error Responses

Standard Laravel validation errors (422) with field-level messages. Auth failures return 401. Already-signed-off returns 409.

```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

---

## Seed Data

For demo/development, seed with:
- 3–4 users (one "admin" who creates policies, others who sign off)
- 3–4 policies with varying due dates (one past due, one due soon, one future)
- A mix of sign-offs so the dashboard isn't empty

---

## What This API Does NOT Include

Keeping scope tight:
- No roles/permissions — any user can create policies and sign off
- No email notifications
- No pagination — keep the policy list small
- No soft deletes
- No policy editing or archiving
- No categories or tags
- File uploads are optional per policy — a policy can have text-only description or an attached file (or both)
