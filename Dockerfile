# Etapa 1: Build (instala todo, incluyendo devDeps, y compila)
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo dev)
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN npm run build:ts

# Etapa 2: Runtime (imagen final limpia, solo production deps)
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar solo production deps
RUN npm ci --only=production

# Copiar el código compilado desde la etapa builder
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Comando de inicio (¡importante: NO volver a compilar en prod!)
CMD ["node", "dist/app.js"]