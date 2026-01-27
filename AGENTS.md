## Contexto del Proyecto

Estamos construyendo un microservicio de gestión de claves criptográficas utilizando **Fastify** (Node.js + TypeScript). El sistema utiliza el esquema de **Shamir Secret Sharing (SSS)** para dividir llaves privadas de Ethereum y las almacena de forma distribuida en **Infisical** (Secret Management).

## Stack Tecnológico

- **Framework:** Fastify con TypeScript.
- **Criptografía:** `shamir-secret-sharing` (SSS).
- **Blockchain:** `ethers` (para generación de carteras y firma).
- **Almacenamiento:** `@infisical/sdk` (con dos proyectos: Hot Storage y Cold Storage).

## Estructura Requerida

El código debe organizarse en:

- `routes/`: Definición de endpoints y validación de esquemas.
- `controllers/`: Manejo de la lógica de petición/respuesta.
- `services/`: Lógica de negocio (SSS, Infisical, Ethers).

## Configuración de Infisical

Se manejan dos identidades de máquina (Machine Identities):

1. **Hot Storage:** Almacena el `Share 2`. Acceso rápido.
2. **Cold Storage:** Almacena el `Share 3`. Acceso de recuperación.
   _Nota: El Agente debe instanciar dos clientes de Infisical o manejar el cambio de credenciales según el proyecto._

---

## Especificaciones de los Endpoints

### 1. `POST /create-shares`

**Objetivo:** Generar una llave nueva, dividirla y persistir fragmentos.

- **Entrada:** `{ userId: string }` (UUID).
- **Lógica:**
  1. Generar una billetera aleatoria con `ethers.Wallet.createRandom()`.
  2. Convertir la `privateKey` a `Uint8Array`.
  3. Usar SSS para crear **3 shares** con un umbral de **2** (`split(secret, 3, 2)`).
  4. Guardar `share2` en **Infisical Hot Storage** usando el `userId` como nombre del secreto.
  5. Guardar `share3` en **Infisical Cold Storage** usando el `userId` como nombre del secreto.
- **Salida:** `{ share1: string (base64) }`.

### 2. `POST /sign`

**Objetivo:** Firmar un mensaje sin reconstruir la llave permanentemente.

- **Entrada:** `{ userId: string, share1: string, message: string }`.
- **Lógica:**
  1. Obtener `share2` desde **Infisical Hot Storage** usando el `userId`.
  2. Reconstruir la llave privada usando `combine([share1, share2])`.
  3. Instanciar una `ethers.Wallet` con la llave recuperada.
  4. Firmar el `message` proporcionado.
- **Salida:** `{ signature: string }`.

### 3. `POST /recovery`

**Objetivo:** Recuperar el fragmento del usuario en caso de pérdida.

- **Entrada:** `{ userId: string }` (Aunque el usuario no lo pase en el cuerpo, se requiere para buscar en Infisical).
- **Lógica:**
  1. Obtener `share2` de **Hot Storage**.
  2. Obtener `share3` de **Cold Storage**.
  3. Reconstruir la llave privada original con `combine([share2, share3])`.
  4. Volver a generar los shares o derivar el `share1` original.
- **Salida:** `{ share1: string (base64) }`.

---

## Reglas de Implementación para la IA

1. **Conversión de Tipos:** SSS trabaja con `Uint8Array`. Las llaves de Ethers son Hex strings. Usa `ethers.utils.arrayify` o `TextEncoder` según corresponda. Para enviar por JSON, convierte los shares a **Base64**.
2. **Seguridad:** Nunca loguear llaves privadas ni fragmentos en la consola.
3. **Manejo de Errores:** Implementar try/catch en los servicios para capturar fallos de conexión con Infisical.
4. **Instanciación:** Crear un Singleton o una clase de servicio para Infisical que reciba los IDs de proyecto y tokens por variables de entorno:
   - `INFISICAL_HOT_CLIENT_ID`, `INFISICAL_HOT_CLIENT_SECRET`, `INFISICAL_HOT_PROJECT_ID`
   - `INFISICAL_COLD_CLIENT_ID`, `INFISICAL_COLD_CLIENT_SECRET`, `INFISICAL_COLD_PROJECT_ID`

## Ejemplos de Referencia para el Agente

### Reconstrucción con SSS

```typescript
import { split, combine } from "shamir-secret-sharing";
// split(secret: Uint8Array, shares: number, threshold: number)
// combine(shares: Uint8Array[])
```

### Interacción con Infisical

```typescript
// Crear secreto
await client.secrets().createSecret("USER_ID_HERE", {
  environment: "dev",
  projectId: "PROJ_ID",
  secretValue: "SHARE_VALUE_BASE64",
});

// Obtener secreto
const secret = await client.secrets().getSecret({
  environment: "dev",
  projectId: "PROJ_ID",
  secretName: "USER_ID_HERE",
});
```

---

**Instrucción Final:** "Implementa los archivos siguiendo esta arquitectura, asegurando que el código sea limpio, modular y maneje correctamente las promesas asíncronas de Infisical."
