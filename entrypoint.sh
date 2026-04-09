#!/bin/sh
set -e

echo "=== Starting Application ==="
echo "DATABASE_URL is set: ${DATABASE_URL:+YES}"

echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully"
echo "🎉 Starting Fastify server..."

exec npm run start