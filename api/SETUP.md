# API Setup — Command Guide

Step-by-step commands to set up the Laravel API by hand. Run these in order.

---

## Prerequisites

- PHP 8.4 with extensions: `mbstring`, `xml`, `curl`, `mysql`, `zip`, `bcmath`
- Composer 2.x
- Docker & Docker Compose
- Laravel installer (`composer global require laravel/installer`)
- MinIO client `mc` (for bucket setup)

---

## 1. Create the Laravel project

From the project root (`policy-signoff/`):

```bash
# Create Laravel 12 project in api/ directory
# When prompted: select "None" for starter kit, "PHPUnit" for testing, no git repo
laravel new api
```

If `api/` already exists (e.g. ISSUES.md is in it), move it out temporarily:

```bash
mv api/ISSUES.md /tmp/
rmdir api
laravel new api
mv /tmp/ISSUES.md api/
```

---

## 2. Docker Compose

Create `docker-compose.yml` at the project root:

```yaml
services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./api:/var/www/html
    depends_on:
      - mysql
    environment:
      - APP_ENV=local
    networks:
      - policysignoff

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: policysignoff
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - policysignoff

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - policysignoff

volumes:
  mysql_data:
  minio_data:

networks:
  policysignoff:
```

Create `api/Dockerfile`:

```dockerfile
FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libxml2-dev libcurl4-openssl-dev \
    default-mysql-client \
    && docker-php-ext-install pdo_mysql zip bcmath xml curl \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Use artisan serve for local dev
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

Boot it up:

```bash
docker compose up -d
docker compose exec api php artisan --version  # verify Laravel is running
```

---

## 3. Configure .env

Edit `api/.env`:

```env
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=policysignoff
DB_USERNAME=root
DB_PASSWORD=secret

SESSION_DRIVER=database
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3001,localhost:3002,localhost:3003

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=policysignoff
AWS_ENDPOINT=http://minio:9000
AWS_URL=http://localhost:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

---

## 4. Install Sanctum

```bash
docker compose exec api php artisan install:api
```

This installs Sanctum, creates the `personal_access_tokens` migration, and adds the `api.php` route file.

Add stateful SPA middleware in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
})
```

---

## 5. Publish and configure CORS

```bash
docker compose exec api php artisan config:publish cors
```

Edit `config/cors.php`:

```php
'allowed_origins' => [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
],
'supports_credentials' => true,
```

---

## 6. Create session table (if using database sessions)

```bash
docker compose exec api php artisan session:table
docker compose exec api php artisan migrate
```

---

## 7. Create migrations

```bash
docker compose exec api php artisan make:migration create_policies_table
docker compose exec api php artisan make:migration create_signoffs_table
```

See `docs/api-spec.md` → Data Model for exact column definitions.

Run migrations:

```bash
docker compose exec api php artisan migrate
```

---

## 8. Create models

```bash
docker compose exec api php artisan make:model Policy
docker compose exec api php artisan make:model Signoff
```

Add relationships per ISSUES.md Issue 2.

---

## 9. Create controllers

```bash
docker compose exec api php artisan make:controller AuthController
docker compose exec api php artisan make:controller PolicyController
docker compose exec api php artisan make:controller SignoffController
docker compose exec api php artisan make:controller FileController
```

---

## 10. Install S3/MinIO filesystem driver

```bash
docker compose exec api composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

The `config/filesystems.php` already has an `s3` disk defined — the `.env` values from step 3 configure it for MinIO.

---

## 11. Set up MinIO bucket

Install the MinIO client (`mc`) on your host machine:

```bash
# macOS
brew install minio/stable/mc

# Linux (amd64)
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc
```

Create the bucket:

```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/policysignoff
```

Set CORS policy for browser uploads:

```bash
cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# MinIO uses the S3 API for CORS — use AWS CLI or mc admin
mc anonymous set download local/policysignoff
```

> **Note:** MinIO CORS can also be configured through the MinIO Console at `http://localhost:9001`.

---

## 12. Create seeders

```bash
docker compose exec api php artisan make:seeder UserSeeder
docker compose exec api php artisan make:seeder PolicySeeder
```

Seed data details in ISSUES.md Issue 7.

Run:

```bash
docker compose exec api php artisan db:seed
# or fresh reset with seeds:
docker compose exec api php artisan migrate:fresh --seed
```

---

## Quick Reference

| Action | Command |
|---|---|
| Start services | `docker compose up -d` |
| Stop services | `docker compose down` |
| API shell | `docker compose exec api bash` |
| Run migrations | `docker compose exec api php artisan migrate` |
| Fresh reset + seed | `docker compose exec api php artisan migrate:fresh --seed` |
| Clear caches | `docker compose exec api php artisan optimize:clear` |
| View API logs | `docker compose logs -f api` |
| MySQL shell | `docker compose exec mysql mysql -uroot -psecret policysignoff` |
| MinIO console | `http://localhost:9001` (minioadmin/minioadmin) |

---

## Presigned URLs — Key Concept

Laravel provides two methods for presigned URLs:

```php
// Presigned PUT (upload) — returns [url, headers]
Storage::disk('s3')->temporaryUploadUrl($path, now()->addMinutes(5));

// Presigned GET (download) — returns url string
Storage::disk('s3')->temporaryUrl($path, now()->addMinutes(5));
```

**Dual-endpoint problem:** The API container talks to MinIO at `http://minio:9000` (Docker internal network), but the browser needs presigned URLs pointing to `http://localhost:9000`. Use `AWS_URL` in `.env` to control the external-facing URL in presigned URLs, while `AWS_ENDPOINT` handles internal communication.

If presigned URLs contain `minio:9000` instead of `localhost:9000`, you'll need to str_replace the host in the generated URL, or configure MinIO's `MINIO_SERVER_URL` environment variable:

```yaml
# In docker-compose.yml, under minio service:
environment:
  MINIO_SERVER_URL: http://localhost:9000
```
