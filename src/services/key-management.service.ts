import { cryptoService } from "./crypto.service";
import { infisicalService } from "./infisical.service";
import { encryptionService } from "./encryption.service";

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

    // Cifrar todos los shares con la contraseña del usuario
    const [encryptedShare1, encryptedShare2, encryptedShare3] = await Promise.all([
      encryptionService.encrypt(share1, userPassword),
      encryptionService.encrypt(share2, userPassword),
      encryptionService.encrypt(share3, userPassword),
    ]);

    // Guardar shares cifrados en Infisical
    await Promise.all([
      infisicalService.saveToHotStorage(userId, encryptedShare2),
      infisicalService.saveToColdStorage(userId, encryptedShare3),
    ]);

    return { share1: encryptedShare1, address: wallet.address };
  }

  async signMessage(userId: string, share1: string, userPassword: string, message: string): Promise<string> {
    const encryptedShare2 = await infisicalService.getFromHotStorage(userId);

    // Descifrar ambos shares
    const [decryptedShare1, decryptedShare2] = await Promise.all([
      encryptionService.decrypt(share1, userPassword),
      encryptionService.decrypt(encryptedShare2, userPassword),
    ]);

    const shares = [decryptedShare1, decryptedShare2].map((s) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    return cryptoService.signMessage(privateKey, message);
  }

  async recoverShare(userId: string, userPassword: string): Promise<string> {
    const [encryptedShare2, encryptedShare3] = await Promise.all([
      infisicalService.getFromHotStorage(userId),
      infisicalService.getFromColdStorage(userId),
    ]);

    // Descifrar shares
    const [share2, share3] = await Promise.all([
      encryptionService.decrypt(encryptedShare2, userPassword),
      encryptionService.decrypt(encryptedShare3, userPassword),
    ]);

    const shares = [share2, share3].map((s) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    // Regenerar los shares con la misma clave privada
    const newSecretBytes = cryptoService.privateKeyToBytes(privateKey);
    const newShares = await cryptoService.splitSecret(newSecretBytes, 3, 2);
    const [newShare1, newShare2, newShare3] = newShares.map((s) => cryptoService.encodeShare(s));

    // Cifrar los nuevos shares
    const [encryptedNewShare1, encryptedNewShare2, encryptedNewShare3] = await Promise.all([
      encryptionService.encrypt(newShare1, userPassword),
      encryptionService.encrypt(newShare2, userPassword),
      encryptionService.encrypt(newShare3, userPassword),
    ]);

    // Actualizar los shares en Hot Storage y Cold Storage
    await Promise.all([
      infisicalService.updateHotStorage(userId, encryptedNewShare2),
      infisicalService.updateColdStorage(userId, encryptedNewShare3),
    ]);

    // Devolver el nuevo share1 cifrado
    return encryptedNewShare1;
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
