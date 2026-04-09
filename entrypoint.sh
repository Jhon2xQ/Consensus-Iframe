#!/bin/sh
set -e

echo "=== Prisma EntryPoint Started ==="
echo "DATABASE_URL is set: ${DATABASE_URL:+YES}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL no está definida en el contenedor"
  exit 1
fi

echo "🚀 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "✅ Migraciones completadas"
echo "🎉 Iniciando la aplicación Fastify..."

exec node dist/app.js