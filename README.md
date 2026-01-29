# Cifrado Basado en Contraseña

## Descripción

Todos los shares generados por el sistema ahora están protegidos mediante cifrado basado en contraseña del usuario usando:

- **Argon2id**: Para derivación de claves (KDF)
- **AES-128-GCM**: Para cifrado autenticado

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

## Flujo de Operaciones

### 1. POST /create-shares

**Request:**
```json
{
  "userId": "uuid-del-usuario",
  "userPassword": "contraseña-segura-del-usuario"
}
```

**Proceso:**
1. Genera wallet de Ethereum
2. Divide la clave privada en 3 shares (umbral 2)
3. **Cifra los 3 shares** con la contraseña del usuario
4. Guarda share2 cifrado en Hot Storage
5. Guarda share3 cifrado en Cold Storage
6. Devuelve share1 cifrado

**Response:**
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

### 2. POST /sign

**Request:**
```json
{
  "userId": "uuid-del-usuario",
  "share1": "base64-encrypted-share",
  "userPassword": "contraseña-segura-del-usuario",
  "message": "mensaje-a-firmar"
}
```

**Proceso:**
1. Obtiene share2 cifrado de Hot Storage
2. **Descifra share1 y share2** con la contraseña
3. Reconstruye la clave privada
4. Firma el mensaje
5. Descarta la clave privada de memoria

**Response:**
```json
{
  "success": true,
  "message": "Message signed successfully",
  "data": {
    "signature": "0x..."
  }
}
```

### 3. POST /recovery

**Request:**
```json
{
  "userId": "uuid-del-usuario",
  "userPassword": "contraseña-segura-del-usuario"
}
```

**Proceso:**
1. Obtiene share2 y share3 cifrados de ambos storages
2. **Descifra ambos shares** con la contraseña
3. Reconstruye la clave privada
4. **Regenera completamente los 3 shares** (nuevos valores)
5. **Cifra los 3 nuevos shares** con la contraseña
6. **Actualiza share2 en Hot Storage**
7. **Actualiza share3 en Cold Storage**
8. Devuelve el nuevo share1 cifrado

**Importante:** Este endpoint regenera todos los shares, por lo que el share1 anterior quedará invalidado. El usuario debe guardar el nuevo share1 devuelto.

**Response:**
```json
{
  "success": true,
  "message": "Share recovered successfully",
  "data": {
    "share1": "base64-encrypted-share-NUEVO"
  }
}
```

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

## Manejo de Errores

Si la contraseña es incorrecta durante el descifrado:
```json
{
  "success": false,
  "error": "Decryption failed: Invalid password or corrupted data"
}
```
