import { cryptoService } from "./crypto.service";
import { infisicalService } from "./infisical.service";
import { encryptionService } from "./encryption.service";
import * as fs from "fs";

class KeyManagementService {
  private static instance: KeyManagementService;

  private constructor() {}

  static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  async createShares(userId: string, userPassword: string): Promise<{ share1: string; address: string }> {
    const wallet = cryptoService.generateWallet();
    const secretBytes = cryptoService.privateKeyToBytes(wallet.privateKey);
    const shares = await cryptoService.splitSecret(secretBytes, 3, 2);

    const [share1, share2, share3] = shares.map((s) => cryptoService.encodeShare(s));

    // Cifrar solo el share3 (Cold Storage) con la contraseña del usuario
    const encryptedShare3 = await encryptionService.encrypt(share3, userPassword);

    // Guardar share2 sin cifrar en Hot Storage y share3 cifrado en Cold Storage
    await Promise.all([
      infisicalService.saveToHotStorage(userId, share2),
      infisicalService.saveToColdStorage(userId, encryptedShare3),
    ]);

    // Devolver share1 sin cifrar
    return { share1, address: wallet.address };
  }

  async signMessage(userId: string, share1: string, message: string): Promise<string> {
    // Leer share2 directamente del volumen de secrets de Infisical
    let share2: string;
    
    try {
      const secretsPath = process.env.SECRETS_PATH || '/app/secrets/secrets.json';
      const data = fs.readFileSync(secretsPath, 'utf8');
      const secrets = JSON.parse(data);
      
      share2 = secrets[userId];
      
      if (!share2) {
        throw new Error(`Share2 not found for userId: ${userId}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to read share2 from volume: ${error.message}`);
    }

    // share1 y share2 ya están en base64, solo decodificar
    const shares = [share1, share2].map((s) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    return cryptoService.signMessage(privateKey, message);
  }

  async recoverShare(userId: string, userPassword: string): Promise<string> {
    const [share2, encryptedShare3] = await Promise.all([
      infisicalService.getFromHotStorage(userId),
      infisicalService.getFromColdStorage(userId),
    ]);

    // Descifrar solo share3 (Cold Storage)
    const share3 = await encryptionService.decrypt(encryptedShare3, userPassword);

    const shares = [share2, share3].map((s) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    // Regenerar los shares con la misma clave privada
    const newSecretBytes = cryptoService.privateKeyToBytes(privateKey);
    const newShares = await cryptoService.splitSecret(newSecretBytes, 3, 2);
    const [newShare1, newShare2, newShare3] = newShares.map((s) => cryptoService.encodeShare(s));

    // Cifrar solo el nuevo share3 (Cold Storage)
    const encryptedNewShare3 = await encryptionService.encrypt(newShare3, userPassword);

    // Actualizar los shares en Hot Storage (sin cifrar) y Cold Storage (cifrado)
    await Promise.all([
      infisicalService.updateHotStorage(userId, newShare2),
      infisicalService.updateColdStorage(userId, encryptedNewShare3),
    ]);

    // Devolver el nuevo share1 sin cifrar
    return newShare1;
  }

  async verifySignature(
    message: string,
    signature: string,
    address: string,
  ): Promise<{ valid: boolean; recoveredAddress: string }> {
    const recoveredAddress = await cryptoService.recoverAddressFromSignature(message, signature);
    const valid = recoveredAddress.toLowerCase() === address.toLowerCase();

    return { valid, recoveredAddress };
  }
}

export const keyManagementService = KeyManagementService.getInstance();
