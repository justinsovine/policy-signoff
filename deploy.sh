#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env.production"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file $ENV_FILE"

cd "$PROJECT_DIR"

# Preflight check
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    echo "Copy .env.production.example to .env.production and fill in the values."
    exit 1
fi

echo "==> Pulling latest code..."
git pull origin main

echo "==> Stopping containers..."
$COMPOSE down

echo "==> Building client (no cache)..."
$COMPOSE build --no-cache client

echo "==> Starting containers..."
$COMPOSE up -d

echo "==> Waiting for API container to be ready..."
sleep 5

echo "==> Running database migrations..."
$COMPOSE exec api php artisan migrate --force

echo "==> Done. Container status:"
$COMPOSE ps
