# VPS Setup - One-Time Steps

These steps assume a Linode VPS with NGINX already installed (same host that runs ohiocrashleads.com). SSL is handled by Cloudflare (Flexible mode).

## 1. Clone the repo

```bash
cd /var/www
git clone git@github.com:justinsovine/policy-signoff.git
cd policy-signoff
```

## 2. Create production env file

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in `APP_KEY`, `DB_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `MINIO_ROOT_PASSWORD`. Generate an app key with:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm --no-deps api php artisan key:generate --show
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

```bash
# Install mc (MinIO client) if not already installed
# https://min.io/docs/minio/linux/reference/minio-mc.html

mc alias set policysignoff https://policysignoff-minio.justinsovine.com ACCESS_KEY SECRET_KEY
mc mb policysignoff/policysignoff
```

## 6. Seed the database (optional)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec api php artisan db:seed
```

## DNS

Make sure these A records point to the VPS IP (proxied through Cloudflare):

- `policysignoff.justinsovine.com`
- `policysignoff-api.justinsovine.com`
- `policysignoff-minio.justinsovine.com`
