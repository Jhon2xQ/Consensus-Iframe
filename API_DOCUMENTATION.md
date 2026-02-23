# API REST - Sistema de Gestión de Claves con Shamir Secret Sharing

API REST para la gestión segura de claves privadas de Ethereum utilizando Shamir Secret Sharing (SSS), cifrado basado en contraseña con Argon2id y AES-128-GCM, con almacenamiento distribuido en Infisical (Hot Storage y Cold Storage).

---

## Endpoints

### 1. POST /create-shares

Crea una nueva wallet de Ethereum y divide la clave privada en 3 shares cifrados.

**URL:** `/create-shares`

**Método:** `POST`

**Request Body:**
```json
{
  "userId": "string",
  "userPassword": "string"
}
```

**Parámetros:**
- `userId` (string, requerido): Identificador único del usuario. Mínimo 1 carácter.
- `userPassword` (string, requerido): Contraseña del usuario para cifrar los shares. Mínimo 8 caracteres.

**Response Exitoso (201):**
```json
{
  "success": true,
  "message": "Shares created successfully",
  "data": {
    "share1": "base64-encrypted-share",
    "address": "0x..."
  },
  "timestamp": 1234567890123
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Failed to create shares",
  "timestamp": 1234567890123
}
```

---

### 2. POST /sign

Firma un mensaje usando la clave privada reconstruida desde share1 (proporcionado) y share2 (Hot Storage).

**URL:** `/sign`

**Método:** `POST`

**Request Body:**
```json
{
  "userId": "string",
  "share1": "string",
  "message": "string"
}
```

**Parámetros:**
- `userId` (string, requerido): Identificador único del usuario. Mínimo 1 carácter.
- `share1` (string, requerido): Share1 cifrado en formato Base64. Mínimo 1 carácter.
- `message` (string, requerido): Mensaje a firmar. Mínimo 1 carácter.

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Message signed successfully",
  "data": {
    "signature": "0x..."
  },
  "timestamp": 1234567890123
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Failed to sign message",
  "timestamp": 1234567890123
}
```

---

### 3. POST /recovery

Recupera el share1 regenerando todos los shares usando share2 (Hot Storage) y share3 (Cold Storage).

**URL:** `/recovery`

**Método:** `POST`

**Request Body:**
```json
{
  "userId": "string",
  "userPassword": "string"
}
```

**Parámetros:**
- `userId` (string, requerido): Identificador único del usuario. Mínimo 1 carácter.
- `userPassword` (string, requerido): Contraseña del usuario para descifrar los shares. Mínimo 8 caracteres.

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Share recovered successfully",
  "data": {
    "share1": "base64-encrypted-share"
  },
  "timestamp": 1234567890123
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Failed to recover share",
  "timestamp": 1234567890123
}
```

**Nota:** Este endpoint regenera todos los shares. El share1 anterior quedará invalidado.

---

### 4. POST /verify

Verifica la validez de una firma y recupera la dirección del firmante.

**URL:** `/verify`

**Método:** `POST`

**Request Body:**
```json
{
  "message": "string",
  "signature": "string",
  "address": "string"
}
```

**Parámetros:**
- `message` (string, requerido): Mensaje original que fue firmado. Mínimo 1 carácter.
- `signature` (string, requerido): Firma en formato hexadecimal (0x...). Mínimo 1 carácter.
- `address` (string, requerido): Dirección de Ethereum esperada del firmante. Mínimo 1 carácter.

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Signature verified successfully",
  "data": {
    "valid": true,
    "message": "mensaje-original",
    "recoveredAddress": "0x..."
  },
  "timestamp": 1234567890123
}
```

**Response Error - Verificación Fallida (400):**
```json
{
  "success": false,
  "message": "Signature verification failed",
  "timestamp": 1234567890123
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Failed to verify signature",
  "timestamp": 1234567890123
}
```

---

### 5. GET /

Endpoint raíz que proporciona información básica de la API.

**URL:** `/`

**Método:** `GET`

**Response (200):**
```json
{
  "success": true,
  "message": "Key Management Service API",
  "data": {
    "version": "1.0.0",
    "endpoints": ["/create-shares", "/sign", "/recovery", "/verify"]
  },
  "timestamp": 1234567890123
}
```

---

### 6. GET /health

Endpoint de health check para verificar el estado del servicio.

**URL:** `/health`

**Método:** `GET`

**Response (200):**
```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": 1234567890123
}
```
