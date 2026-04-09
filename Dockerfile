# ====================== Builder Stage ======================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build:ts

# ====================== Production Stage ======================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Dependencias del sistema para Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ==================== COPIAR ARCHIVOS IMPORTANTES ====================
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# ←←← AQUÍ ENTRA TU entrypoint.sh
COPY entrypoint.sh ./

# Dar permisos de ejecución al entrypoint
RUN chmod +x ./entrypoint.sh

# Crear usuario no-root (buena práctica)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Usar el entrypoint.sh como punto de entrada
ENTRYPOINT ["./entrypoint.sh"]