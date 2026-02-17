# API Development — Issue Breakdown

Each issue maps to one branch. Merge them in order. After each merge, the API is in a working state — nothing half-built.

---

## Issue 1: Project scaffold and Docker Compose

**Branch:** `api/scaffold`
**Priority:** p0
**Depends on:** nothing

### What to do
- Create the Laravel 12 project in `api/`
- Set up `docker-compose.yml` at the project root with MySQL, MinIO, and the API container
- Verify the API boots and responds to requests

### Acceptance criteria
- `docker compose up -d` starts all three services
- `curl http://localhost:8000` returns the Laravel welcome page (or a JSON response)
- MySQL is accessible from the API container
- MinIO console is accessible at `http://localhost:9001`

### Files created/modified
- `api/` — entire Laravel project
- `api/Dockerfile` — PHP 8.4 + extensions + Composer
- `docker-compose.yml` — mysql, minio, api services
- `api/.env` — local development values

### Config/env to set
- `DB_HOST=mysql`, `DB_DATABASE=policysignoff`, `DB_USERNAME=root`, `DB_PASSWORD=secret`
- `APP_URL=http://localhost:8000`

---

## Issue 2: Database schema — migrations and models

**Branch:** `api/database`
**Priority:** p0
**Depends on:** Issue 1

### What to do
- Create migrations for `policies` and `signoffs` tables (users table comes with Laravel)
- Create Eloquent models with relationships
- Verify with `php artisan migrate`

### Acceptance criteria
- `docker compose exec api php artisan migrate` runs cleanly
- All three tables exist: `users`, `policies`, `signoffs`
- Models have correct relationships:
  - `Policy` belongsTo `User` (creator), hasMany `Signoff`
  - `Signoff` belongsTo `Policy`, belongsTo `User`
  - `User` hasMany `Signoff`, hasMany `Policy` (created)

### Files created
- `database/migrations/xxxx_create_policies_table.php`
- `database/migrations/xxxx_create_signoffs_table.php`
- `app/Models/Policy.php`
- `app/Models/Signoff.php`
- Modify `app/Models/User.php` to add relationships

### Schema details
See `docs/api-spec.md` → Data Model section for exact columns and types. Key points:
- `policies.created_by` is a foreign key to `users.id`
- `signoffs` has a unique constraint on `(policy_id, user_id)`
- `signoffs.signed_at` is a timestamp, not nullable

---

## Issue 3: Authentication — Sanctum SPA setup

**Branch:** `api/auth`
**Priority:** p0
**Depends on:** Issue 2

### What to do
- Install Sanctum (`php artisan install:api`)
- Configure stateful SPA authentication in `bootstrap/app.php`
- Publish and configure CORS
- Create auth routes: `POST /register`, `POST /login`, `POST /logout`, `GET /user`
- Configure session domain and stateful domains for local dev

### Acceptance criteria
Test the full flow with curl:
```bash
# 1. Get CSRF cookie
curl -c cookies.txt http://localhost:8000/sanctum/csrf-cookie

# 2. Register
curl -b cookies.txt -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token from cookie>" \
  -d '{"name":"Test","email":"test@example.com","password":"password","password_confirmation":"password"}'

# 3. Get current user
curl -b cookies.txt http://localhost:8000/user \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"

# 4. Logout
curl -b cookies.txt -X POST http://localhost:8000/logout \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"

# 5. Verify logged out
curl -b cookies.txt http://localhost:8000/user \
  -H "Accept: application/json"
# → should return 401
```

### Files created/modified
- `routes/api.php` — auth routes (register, login, logout)
- `routes/web.php` — may need sanctum csrf-cookie route (check if automatic)
- `app/Http/Controllers/AuthController.php`
- `bootstrap/app.php` — add `statefulApi()` middleware
- `config/cors.php` — publish and configure
- `config/sanctum.php` — stateful domains
- `.env` — `SESSION_DOMAIN=localhost`, `SANCTUM_STATEFUL_DOMAINS=localhost:3001,localhost:3002,localhost:3003`

### Config/env to set
- `SESSION_DOMAIN=localhost`
- `SANCTUM_STATEFUL_DOMAINS=localhost:3001,localhost:3002,localhost:3003`
- CORS `allowed_origins`: `http://localhost:3001`, `http://localhost:3002`, `http://localhost:3003`
- CORS `supports_credentials`: `true`

### Validation rules
- Register: `name` required string max:255, `email` required email unique:users, `password` required min:8 confirmed
- Login: `email` required email, `password` required

---

## Issue 4: Policy endpoints — list, create, detail

**Branch:** `api/policies`
**Priority:** p1
**Depends on:** Issue 3

### What to do
- Create `PolicyController` with `index`, `store`, `show` methods
- Implement the query logic for computing signed/overdue/pending per user
- Implement the sign-off summary on the detail endpoint (list all users with status)
- All routes require `auth:sanctum`

### Acceptance criteria
```bash
# Create a policy (as authenticated user)
curl -b cookies.txt -X POST http://localhost:8000/policies \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>" \
  -d '{"title":"Test Policy","description":"Test description","due_date":"2026-04-01"}'
# → returns created policy with id

# List policies
curl -b cookies.txt http://localhost:8000/policies \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"
# → returns array with signed/overdue status per policy

# Get detail
curl -b cookies.txt http://localhost:8000/policies/1 \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"
# → returns policy with signoff_summary listing all users
```

### Files created/modified
- `app/Http/Controllers/PolicyController.php`
- `routes/api.php` — add policy routes

### Response shapes
See `docs/api-spec.md` → Response Shapes section. Key logic:
- **List:** each policy includes `signed` (bool), `overdue` (bool) for the current user, `created_by` (name string), `has_file` (bool)
- **Detail:** includes `signoff_summary` with `total_users`, `signed_count`, and array of all users. Each user entry has `user` (full name), `signed_at` (timestamp or null), and `overdue` (bool, only for unsigned users)
- **Overdue** = not signed AND `due_date` is before today
- **Sorted** by `due_date` ascending

### Validation rules
- `title` — required, string, max:255
- `description` — required, string
- `due_date` — required, date, after_or_equal:today

---

## Issue 5: Sign-off endpoint

**Branch:** `api/signoffs`
**Priority:** p1
**Depends on:** Issue 4

### What to do
- Add `POST /policies/{id}/signoff` route
- Record the sign-off with current timestamp
- Return 409 if the user already signed this policy
- Verify the detail endpoint reflects the new sign-off

### Acceptance criteria
```bash
# Sign off
curl -b cookies.txt -X POST http://localhost:8000/policies/1/signoff \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"
# → {"message": "Signed off successfully", "signed_at": "2026-..."}

# Try again
curl -b cookies.txt -X POST http://localhost:8000/policies/1/signoff \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"
# → 409

# Verify detail shows updated summary
curl -b cookies.txt http://localhost:8000/policies/1 \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"
# → signoff_summary shows current user as signed
```

### Files created/modified
- `app/Http/Controllers/SignoffController.php` (or add to PolicyController)
- `routes/api.php` — add signoff route

---

## Issue 6: File upload and download — presigned URLs

**Branch:** `api/file-uploads`
**Priority:** p1
**Depends on:** Issue 5

### What to do
- Install S3 Flysystem package (`league/flysystem-aws-s3-v3`)
- Configure MinIO as S3 disk in `config/filesystems.php`
- Create MinIO bucket (manual step or init container)
- Set MinIO CORS policy for browser uploads
- Implement `POST /policies/{id}/upload-url` — generates presigned PUT URL, stores file_path and file_name on the policy
- Implement `GET /policies/{id}/download-url` — generates presigned GET URL
- Handle the dual-endpoint problem: internal endpoint for API → MinIO communication, external endpoint for presigned URLs the browser can use

### Acceptance criteria
```bash
# Request upload URL
curl -b cookies.txt -X POST http://localhost:8000/policies/1/upload-url \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>" \
  -d '{"filename":"test.pdf","content_type":"application/pdf"}'
# → {"upload_url": "http://localhost:9000/...", "key": "policies/..."}

# Upload a file directly to MinIO
curl -X PUT "<upload_url from above>" \
  -H "Content-Type: application/pdf" \
  --data-binary @test.pdf

# Request download URL
curl -b cookies.txt http://localhost:8000/policies/1/download-url \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <token>"
# → {"download_url": "http://localhost:9000/...", "file_name": "test.pdf"}

# Download URL should work in browser
curl "<download_url from above>" -o downloaded.pdf
```

### Files created/modified
- `app/Http/Controllers/FileController.php` (or add to PolicyController)
- `routes/api.php` — add file routes
- `config/filesystems.php` — S3/MinIO disk config

### Config/env to set
- `AWS_ACCESS_KEY_ID=minioadmin`
- `AWS_SECRET_ACCESS_KEY=minioadmin`
- `AWS_DEFAULT_REGION=us-east-1`
- `AWS_BUCKET=policysignoff`
- `AWS_ENDPOINT=http://minio:9000` (internal, container-to-container)
- `AWS_URL=http://localhost:9000` (external, for presigned URLs the browser hits)
- `AWS_USE_PATH_STYLE_ENDPOINT=true`

### Validation rules
- `filename` — required, string, must end in `.pdf`, `.doc`, or `.docx`
- `content_type` — required, must be `application/pdf`, `application/msword`, or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### MinIO CORS
The MinIO bucket needs a CORS policy allowing browser origins. Set via `mc` client:
```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/policysignoff
# Set CORS policy — see SETUP.md for details
```

---

## Issue 7: Database seeder

**Branch:** `api/seeder`
**Priority:** p1
**Depends on:** Issue 5 (doesn't need file uploads)

### What to do
- Create seeders for users, policies, and sign-offs
- Use realistic data matching the mockup sample data
- Seed should be idempotent (safe to re-run)

### Acceptance criteria
```bash
docker compose exec api php artisan migrate:fresh --seed
```
After seeding, the API returns:
- 4+ users exist
- 3-4 policies with varying due dates (past due, due soon, future)
- Mix of sign-off states — some users signed some policies, others haven't
- At least one policy has `has_file: true` (set file_path/file_name even without actual file in MinIO)

### Seed data (matching mockups)
**Users:** Jane Admin, Mike Manager, Alice Thompson, Bob Martinez, Charlie Kim, Dana Williams

**Policies:**
| Title | Due Date | Created By | Has File |
|---|---|---|---|
| 2026 Employee Handbook | 2026-03-01 | Jane Admin | Yes |
| HIPAA Annual Training | 2026-03-15 | Jane Admin | Yes |
| Workplace Safety Guidelines | 2026-04-30 | Mike Manager | No |
| Remote Work Policy Update | 2026-02-10 | Jane Admin | No |

**Sign-offs** (for Employee Handbook):
- Alice Thompson: signed Feb 10
- Bob Martinez: signed Feb 11
- Charlie Kim: signed Feb 14
- Dana Williams: not signed
- Others: not signed

### Files created
- `database/seeders/DatabaseSeeder.php`
- `database/seeders/UserSeeder.php` (optional, can inline)
- `database/seeders/PolicySeeder.php` (optional, can inline)
