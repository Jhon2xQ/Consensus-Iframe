# Ejemplos de Uso de la API

## 1. Crear Shares (Generar nueva wallet)

```bash
curl -X POST http://localhost:3000/create-shares \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userPassword": "MiContraseñaSegura123!"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Shares created successfully",
  "data": {
    "share1": "U2FsdGVkX1+...(base64 cifrado)...",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

**Importante:** Guarda el `share1` de forma segura. El usuario debe almacenarlo localmente.

---

## 2. Firmar un Mensaje

```bash
curl -X POST http://localhost:3000/sign \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "share1": "U2FsdGVkX1+...(el share1 que recibiste)...",
    "userPassword": "MiContraseñaSegura123!",
    "message": "Hello, Ethereum!"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Message signed successfully",
  "data": {
    "signature": "0x1234567890abcdef..."
  }
}
```

---

## 3. Recuperar Share Perdido

Si el usuario pierde su `share1`, puede recuperarlo usando su contraseña:

```bash
curl -X POST http://localhost:3000/recovery \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userPassword": "MiContraseñaSegura123!"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Share recovered successfully",
  "data": {
    "share1": "U2FsdGVkX1+...(nuevo share1 cifrado)..."
  }
}
```

---

## 4. Verificar Firma

```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, Ethereum!",
    "signature": "0x1234567890abcdef...",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Signature verified successfully",
  "data": {
    "valid": true,
    "message": "Hello, Ethereum!",
    "recoveredAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

---

## Flujo Completo de Ejemplo

### Paso 1: Usuario se registra y genera su wallet
```javascript
const response = await fetch('http://localhost:3000/create-shares', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid-123',
    userPassword: 'SecurePass123!'
  })
});

const { data } = await response.json();
// Guardar data.share1 en el dispositivo del usuario
// Guardar data.address como la dirección de la wallet
localStorage.setItem('share1', data.share1);
localStorage.setItem('walletAddress', data.address);
```

### Paso 2: Usuario firma una transacción
```javascript
const share1 = localStorage.getItem('share1');
const response = await fetch('http://localhost:3000/sign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid-123',
    share1: share1,
    userPassword: 'SecurePass123!',
    message: 'Transfer 1 ETH to 0x...'
  })
});

const { data } = await response.json();
console.log('Signature:', data.signature);
```

### Paso 3: Usuario pierde su dispositivo y recupera el share
```javascript
const response = await fetch('http://localhost:3000/recovery', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid-123',
    userPassword: 'SecurePass123!'
  })
});

const { data } = await response.json();
// Guardar el nuevo share1 en el nuevo dispositivo
localStorage.setItem('share1', data.share1);
```

---

## Manejo de Errores

### Contraseña Incorrecta
```json
{
  "success": false,
  "error": "Decryption failed: Invalid password or corrupted data"
}
```

### Usuario No Encontrado
```json
{
  "success": false,
  "error": "Secret not found for user"
}
```

### Validación de Entrada
```json
{
  "success": false,
  "error": "userId is required"
}
```

---

## Consideraciones de Seguridad

1. **Nunca compartas tu contraseña**: La contraseña es la única forma de descifrar los shares.
2. **Guarda el share1 de forma segura**: Sin él, necesitarás usar el endpoint de recovery.
3. **Usa HTTPS en producción**: Nunca envíes contraseñas por HTTP sin cifrar.
4. **Contraseñas fuertes**: Usa contraseñas de al menos 12 caracteres con mayúsculas, minúsculas, números y símbolos.
5. **Rate limiting**: Implementa límites de intentos para prevenir ataques de fuerza bruta.
