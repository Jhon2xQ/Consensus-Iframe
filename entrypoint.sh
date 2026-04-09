#!/bin/sh
set -e

echo "=== Starting Application (DEBUG MODE) ==="
echo "DATABASE_URL is set: ${DATABASE_URL:+YES}"
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "Contents of dist/:"
ls -la dist/ || echo "dist/ folder not found!"

echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed"
echo "🎉 Attempting to start Fastify server..."

echo "=== Launching node dist/app.js ==="
# Ejecutamos sin 'exec' primero para capturar errores
node dist/app.js

echo "❌ Node process exited unexpectedly with code $?"
sleep 5