# ====================== Builder Stage ======================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm ci

# Copiar configuración de Prisma primero (necesario para Prisma 7+)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generar Prisma Client (se genera en src/generated)
RUN npx prisma generate

# Copiar el resto del código y compilar
COPY . .
RUN npm run build:ts

# ====================== Production Stage ======================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Dependencias del sistema para Prisma
RUN apk add --no-cache openssl libc6-compat

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ==================== COPIAR ARCHIVOS ESENCIALES ====================

# 1. node_modules de producción
COPY --from=builder /app/node_modules ./node_modules

# 2. Código compilado (dist)
COPY --from=builder /app/dist ./dist

# 3. Prisma schema y migraciones
COPY --from=builder /app/prisma ./prisma

# 4. Configuración Prisma 7
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# 5. Prisma Client generado (¡ESTO ERA LO QUE FALTABA!)
COPY --from=builder /app/src/generated ./src/generated

# EntryPoint
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]