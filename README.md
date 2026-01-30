# Sistema de Gestión de Claves con Cifrado Basado en Contraseña

## Descripción

Sistema de gestión de claves privadas de Ethereum usando Shamir Secret Sharing (SSS) con cifrado basado en contraseña del usuario:

- **Argon2id**: Derivación de claves (KDF)
- **AES-128-GCM**: Cifrado autenticado
- **Shamir Secret Sharing**: División de claves en 3 shares (umbral 2)

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
3. Cifra los 3 shares con la contraseña del usuario
4. Guarda share2 cifrado en Hot Storage (Infisical)
5. Guarda share3 cifrado en Cold Storage (Infisical)
6. Devuelve share1 cifrado y la dirección de la wallet

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
1. Obtiene share2 cifrado de Hot Storage (Infisical)
2. Descifra share1 (del request) usando la contraseña del usuario
3. Descifra share2 (de Hot Storage) usando la contraseña del usuario
4. Reconstruye la clave privada desde share1 + share2
5. Firma el mensaje con la clave privada
6. Descarta la clave privada de memoria inmediatamente

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
1. Obtiene share2 cifrado de Hot Storage (Infisical)
2. Obtiene share3 cifrado de Cold Storage (Infisical)
3. Descifra share2 y share3 con la contraseña del usuario
4. Reconstruye la clave privada desde share2 + share3
5. Regenera completamente los 3 shares (nuevos valores)
6. Cifra los 3 nuevos shares con la contraseña del usuario
7. Actualiza share2 en Hot Storage
8. Actualiza share3 en Cold Storage
9. Devuelve el nuevo share1 cifrado

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

## Seguridad

- **Sin logs**: Las claves privadas y shares nunca se loguean
- **Efímero**: Las claves privadas solo existen en memoria durante la operación
- **Autenticado**: GCM proporciona autenticación integrada
- **Resistente a fuerza bruta**: Argon2id hace costoso probar contraseñas
- **Salt único**: Cada cifrado usa un salt aleatorio diferente
- **Umbral 2 de 3**: Se necesitan 2 shares para reconstruir la clave privada

## Manejo de Errores

Si la contraseña es incorrecta durante el descifrado:
```json
{
  "success": false,
  "error": "Decryption failed: Invalid password or corrupted data"
}
```
