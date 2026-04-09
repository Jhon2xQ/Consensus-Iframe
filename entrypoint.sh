#!/bin/sh
set -e

echo "=== Starting Application ==="
echo "DATABASE_URL is set: ${DATABASE_URL:+YES}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is missing!"
  exit 1
fi

echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully"
echo "🎉 Starting Fastify server..."

exec node dist/app.js