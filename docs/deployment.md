# VPS Setup - One-Time Steps

These steps assume a Linode VPS with NGINX already installed. SSL is terminated upstream (e.g. Cloudflare); NGINX listens on port 80 only.

## 1. Clone the repo

```bash
cd /var/www
git clone git@github.com:justinsovine/policy-signoff.git
cd policy-signoff
```

## 2. Create production env file

```bash
cp .env.production.example .env.production
```

Generate the values and fill them in:

```bash
# Generate APP_KEY
docker compose -f docker-compose.prod.yml --env-file .env.production build api
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm --no-deps api php artisan key:generate --show

# Generate DB_PASSWORD
openssl rand -base64 24

# Generate MinIO credentials (use the same values for both pairs)
openssl rand -base64 24   # MINIO_ROOT_USER + AWS_ACCESS_KEY_ID
openssl rand -base64 24   # MINIO_ROOT_PASSWORD + AWS_SECRET_ACCESS_KEY
```

Your `.env.production` should look like:

```
APP_KEY=base64:...
DB_PASSWORD=<generated>
MINIO_ROOT_USER=<generated>
MINIO_ROOT_PASSWORD=<generated>
AWS_ACCESS_KEY_ID=<same as MINIO_ROOT_USER>
AWS_SECRET_ACCESS_KEY=<same as MINIO_ROOT_PASSWORD>
```

## 3. Set up host NGINX

```bash
sudo cp nginx-site.conf /etc/nginx/sites-available/policysignoff.justinsovine.com
sudo ln -s /etc/nginx/sites-available/policysignoff.justinsovine.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. First deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

## 5. Create MinIO bucket

The MinIO container ships with `mc` built in — no need to install it on the host:

```bash
source .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production exec minio \
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
docker compose -f docker-compose.prod.yml --env-file .env.production exec minio \
  mc mb local/policysignoff
```

## 6. Seed the database (optional)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec api php artisan db:seed --force
```

## DNS

Create A records pointing to the VPS IP for:

- `policysignoff.justinsovine.com`
- `policysignoff-api.justinsovine.com`
- `policysignoff-minio.justinsovine.com`

Subdomains are flat (`policysignoff-api` instead of `api.policysignoff`) so they're covered by a single `*.justinsovine.com` wildcard SSL certificate.*

*\* Two-level-deep subdomains like `api.policysignoff.justinsovine.com` require a separate cert or paid wildcard — flat subdomains avoid this.*

## Subsequent deploys

```bash
./deploy.sh
```

The script pulls latest code, rebuilds images, restarts containers, and runs migrations.
