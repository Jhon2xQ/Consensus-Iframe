# Sistema de Gestión de Claves con Cifrado Basado en Contraseña

## Descripción

Sistema de gestión de claves privadas de Ethereum usando Shamir Secret Sharing (SSS) con cifrado basado en contraseña del usuario:

- **Argon2id**: Derivación de claves (KDF)
- **AES-128-GCM**: Cifrado autenticado
- **Shamir Secret Sharing**: División de claves en 3 shares (umbral 2)

## Arquitectura de Almacenamiento

Los 3 shares se almacenan de forma distribuida:

| Share | Almacenamiento | Tecnología | Cifrado |
|-------|---------------|------------|---------|
| share1 | Cliente (usuario) | Devuelto en respuesta | Sin cifrar (el usuario lo guarda) |
| share2 | Hot Storage | PostgreSQL | Sin cifrar (base de datos interna) |
| share3 | Cold Storage | Infisical | Cifrado con contraseña del usuario |

**Hot Storage (PostgreSQL):** Almacena share2 en una base de datos PostgreSQL propia. Acceso rápido y control total sobre los datos.

**Cold Storage (Infisical):** Almacena share3 cifrado con la contraseña del usuario en Infisical como capa de seguridad adicional y recuperación ante desastres.

## Parámetros de Seguridad

### Argon2id
- **Iteraciones (t)**: 3
- **Memoria (m)**: 65536 KB (64 MB)
- **Paralelismo (p)**: 4 threads
- **Longitud de clave**: 16 bytes (128 bits)
- **Salt**: 16 bytes aleatorios por operación

### AES-128-GCM
- **Tamaño de clave**: 128 bits
- **IV**: 12 bytes aleatorios por operación
- **Tag de autenticación**: Incluido automáticamente

## Endpoints

### 1. POST /create-shares

Crea una nueva wallet de Ethereum y divide la clave privada en 3 shares cifrados.

**Request:**
```json
{
  "userId": "uuid-del-usuario",
  "userPassword": "contraseña-segura-del-usuario"
}
```

**Validaciones:**
- `userId`: string, mínimo 1 carácter (requerido)
- `userPassword`: string, mínimo 8 caracteres (requerido)

**Proceso:**
1. Genera wallet de Ethereum (clave privada + dirección)
2. Divide la clave privada en 3 shares usando SSS (umbral 2)
3. Cifra el share3 con la contraseña del usuario
4. Guarda share2 en Hot Storage (PostgreSQL)
5. Guarda share3 cifrado en Cold Storage (Infisical)
6. Devuelve share1 y la dirección de la wallet

**Response (201):**
```json
{
  "success": true,
  "message": "Shares created successfully",
  "data": {
    "share1": "base64-encrypted-share",
    "address": "0x..."
  }
}
```

**Response Error (500):**
```json
{
  "success": false,
  "error": "Failed to create shares"
}
```

---

### 2. POST /sign

Firma un mensaje usando la clave privada reconstruida desde share1 y share2.

**Request:**
```json
{
  "userId": "uuid-del-usuario",
  "share1": "base64-encrypted-share",
  "message": "mensaje-a-firmar"
}
```

**Validaciones:**
- `userId`: string, mínimo 1 carácter (requerido)
- `share1`: string, mínimo 1 carácter (requerido)
- `message`: string, mínimo 1 carácter (requerido)

**Proceso:**
1. Obtiene share2 de Hot Storage (PostgreSQL)
2. Decodifica share1 (del request) y share2 (de PostgreSQL)
3. Reconstruye la clave privada desde share1 + share2
4. Firma el mensaje con la clave privada
5. Descarta la clave privada de memoria inmediatamente

**Response (200):**
```json
{
  "success": true,
  "message": "Message signed successfully",
  "data": {
    "signature": "0x..."
  }
}
```

**Response Error (500):**
```json
{
  "success": false,
  "error": "Failed to sign message"
}
```

---

### 3. POST /recovery

Recupera y regenera todos los shares usando share2 y share3 de los storages.

**Request:**
```json
{
  "userId": "uuid-del-usuario",
  "userPassword": "contraseña-segura-del-usuario"
}
```

**Validaciones:**
- `userId`: string, mínimo 1 carácter (requerido)
- `userPassword`: string, mínimo 8 caracteres (requerido)

**Proceso:**
1. Obtiene share2 de Hot Storage (PostgreSQL)
2. Obtiene share3 cifrado de Cold Storage (Infisical)
3. Descifra share3 con la contraseña del usuario
4. Reconstruye la clave privada desde share2 + share3
5. Regenera completamente los 3 shares (nuevos valores)
6. Cifra el nuevo share3 con la contraseña del usuario
7. Actualiza share2 en Hot Storage (PostgreSQL)
8. Actualiza share3 cifrado en Cold Storage (Infisical)
9. Devuelve el nuevo share1

**Importante:** Este endpoint regenera todos los shares. El share1 anterior quedará invalidado. El usuario debe guardar el nuevo share1 devuelto.

**Response (200):**
```json
{
  "success": true,
  "message": "Share recovered successfully",
  "data": {
    "share1": "base64-encrypted-share-NUEVO"
  }
}
```

**Response Error (500):**
```json
{
  "success": false,
  "error": "Failed to recover share"
}
```

---

### 4. POST /verify

Verifica la validez de una firma y recupera la dirección del firmante.

**Request:**
```json
{
  "message": "mensaje-original",
  "signature": "0x...",
  "address": "0x..."
}
```

**Validaciones:**
- `message`: string, mínimo 1 carácter (requerido)
- `signature`: string, mínimo 1 carácter (requerido)
- `address`: string, mínimo 1 carácter (requerido)

**Proceso:**
1. Recupera la dirección del firmante desde la firma
2. Compara la dirección recuperada con la dirección proporcionada
3. Devuelve el resultado de la verificación

**Response (200):**
```json
{
  "success": true,
  "message": "Signature verified successfully",
  "data": {
    "valid": true,
    "message": "mensaje-original",
    "recoveredAddress": "0x..."
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Signature verification failed"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "error": "Failed to verify signature"
}
```

---

## Formato de Datos Cifrados

Cada share cifrado se almacena en formato Base64 con la siguiente estructura:

```
[Salt (16 bytes)] + [IV (12 bytes)] + [Ciphertext + Auth Tag]
```

## Base de Datos (PostgreSQL)

La tabla `Share` en PostgreSQL almacena los shares del Hot Storage:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador del usuario (PK) |
| share | String | Share2 en formato base64 |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Fecha de última actualización |

### Prisma Schema

```prisma
model Share {
  id        String   @id @default(uuid())
  share     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Seguridad

- **Sin logs**: Las claves privadas y shares nunca se loguean
- **Efímero**: Las claves privadas solo existen en memoria durante la operación
- **Autenticado**: GCM proporciona autenticación integrada
- **Resistente a fuerza bruta**: Argon2id hace costoso probar contraseñas
- **Salt único**: Cada cifrado usa un salt aleatorio diferente
- **Umbral 2 de 3**: Se necesitan 2 shares para reconstruir la clave privada
- **Hot Storage aislado**: PostgreSQL en contenedor propio, sin exposición innecesaria

## Manejo de Errores

Si la contraseña es incorrecta durante el descifrado:
```json
{
  "success": false,
  "error": "Decryption failed: Invalid password or corrupted data"
}
```

## Despliegue con Docker

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

El docker-compose incluye:
- **postgres**: PostgreSQL 17 Alpine (Hot Storage) con healthcheck
- **fastify-app**: Aplicación Fastify con migración automática de Prisma