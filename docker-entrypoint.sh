#!/bin/sh
set -e

# Ensure data directory exists (volume mount creates it but not the db file)
mkdir -p /app/data

echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] Running seed..."
node /app/scripts/seed.cjs

echo "[entrypoint] Starting Next.js server..."
exec node server.js
