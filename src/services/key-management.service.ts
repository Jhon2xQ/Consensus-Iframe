import { cryptoService } from "./crypto.service";
import { hotStorageService } from "./hot-storage.service";
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

    const [share1, share2, share3] = shares.map((s: Uint8Array) => cryptoService.encodeShare(s));

    const encryptedShare3 = await encryptionService.encrypt(share3, userPassword);

    await Promise.all([
      hotStorageService.save(userId, share2),
      infisicalService.saveToColdStorage(userId, encryptedShare3),
    ]);

    return { share1, address: wallet.address };
  }

  async signMessage(userId: string, share1: string, message: string): Promise<string> {
    const share2 = await hotStorageService.get(userId);

    const shares = [share1, share2].map((s: string) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    return cryptoService.signMessage(privateKey, message);
  }

  async recoverShare(userId: string, userPassword: string): Promise<string> {
    const [share2, encryptedShare3] = await Promise.all([
      hotStorageService.get(userId),
      infisicalService.getFromColdStorage(userId),
    ]);

    const share3 = await encryptionService.decrypt(encryptedShare3, userPassword);

    const shares = [share2, share3].map((s: string) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    const newSecretBytes = cryptoService.privateKeyToBytes(privateKey);
    const newShares = await cryptoService.splitSecret(newSecretBytes, 3, 2);
    const [newShare1, newShare2, newShare3] = newShares.map((s: Uint8Array) => cryptoService.encodeShare(s));

    const encryptedNewShare3 = await encryptionService.encrypt(newShare3, userPassword);

    await Promise.all([
      hotStorageService.update(userId, newShare2),
      infisicalService.updateColdStorage(userId, encryptedNewShare3),
    ]);

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