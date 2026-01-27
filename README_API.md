# API de Gestión de Claves Criptográficas

Microservicio de gestión de claves criptográficas utilizando Fastify, Shamir Secret Sharing e Infisical.

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto (ya existe uno vacío):
```bash
# Edita el archivo .env con tus credenciales
nano .env
```

2. Configura las variables de entorno en `.env` con tus credenciales de Infisical:
```env
INFISICAL_ENVIRONMENT=dev

# Hot Storage (Share 2)
INFISICAL_HOT_CLIENT_ID=tu_hot_client_id_aqui
INFISICAL_HOT_CLIENT_SECRET=tu_hot_client_secret_aqui
INFISICAL_HOT_PROJECT_ID=tu_hot_project_id_aqui

# Cold Storage (Share 3)
INFISICAL_COLD_CLIENT_ID=tu_cold_client_id_aqui
INFISICAL_COLD_CLIENT_SECRET=tu_cold_client_secret_aqui
INFISICAL_COLD_PROJECT_ID=tu_cold_project_id_aqui
```

**Importante:** Necesitas crear dos Machine Identities en Infisical:
- Una para Hot Storage (acceso rápido)
- Una para Cold Storage (recuperación)

Cada una debe tener permisos de lectura/escritura en su respectivo proyecto.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build:ts
npm start
```

## Endpoints

### 1. POST /create-shares

Genera una nueva billetera Ethereum, divide la clave privada en 3 fragmentos usando Shamir Secret Sharing y almacena 2 de ellos en Infisical.

**Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201):**
```json
{
  "share1": "base64_encoded_share",
  "address": "0x..."
}
```

**Nota:** El usuario debe guardar `share1` de forma segura. `share2` se guarda en Hot Storage y `share3` en Cold Storage.

### 2. POST /sign

Firma un mensaje usando la clave privada reconstruida a partir de `share1` (del usuario) y `share2` (de Hot Storage).

**Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "share1": "base64_encoded_share",
  "message": "Mensaje a firmar"
}
```

**Response (200):**
```json
{
  "signature": "0x..."
}
```

### 3. POST /recovery

Recupera el `share1` del usuario en caso de pérdida, usando `share2` (Hot Storage) y `share3` (Cold Storage).

**Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**
```json
{
  "share1": "base64_encoded_share"
}
```

## Arquitectura

### Shamir Secret Sharing (SSS)

El sistema divide la clave privada en 3 fragmentos con un umbral de 2:
- **Share 1:** Entregado al usuario (debe guardarlo de forma segura)
- **Share 2:** Almacenado en Infisical Hot Storage (acceso rápido)
- **Share 3:** Almacenado en Infisical Cold Storage (recuperación)

Cualquier combinación de 2 fragmentos puede reconstruir la clave privada original.

### Estructura del Código

```
src/
├── routes/           # Definición de endpoints y validación
├── controllers/      # Manejo de peticiones/respuestas
└── services/         # Lógica de negocio
    ├── crypto.service.ts           # SSS y operaciones con Ethers
    ├── infisical.service.ts        # Interacción con Infisical
    └── key-management.service.ts   # Orquestación de servicios
```

## Seguridad

- Las claves privadas nunca se almacenan completas
- Los fragmentos se distribuyen en diferentes sistemas
- Se requieren al menos 2 fragmentos para reconstruir la clave
- Las claves privadas nunca se loguean en consola
- Comunicación segura con Infisical mediante Machine Identities

## Ejemplo de Uso

```bash
# 1. Crear shares para un usuario
curl -X POST http://localhost:3000/create-shares \
  -H "Content-Type: application/json" \
  -d '{"userId": "550e8400-e29b-41d4-a716-446655440000"}'

# Respuesta: { "share1": "...", "address": "0x..." }

# 2. Firmar un mensaje
curl -X POST http://localhost:3000/sign \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "share1": "base64_share_from_step_1",
    "message": "Hello World"
  }'

# Respuesta: { "signature": "0x..." }

# 3. Recuperar share1 (en caso de pérdida)
curl -X POST http://localhost:3000/recovery \
  -H "Content-Type: application/json" \
  -d '{"userId": "550e8400-e29b-41d4-a716-446655440000"}'

# Respuesta: { "share1": "..." }
```
