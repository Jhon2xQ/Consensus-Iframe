import { cryptoService } from "./crypto.service";
import { infisicalService } from "./infisical.service";

class KeyManagementService {
  private static instance: KeyManagementService;

  private constructor() {}

  static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  async createShares(userId: string): Promise<{ share1: string; address: string }> {
    const wallet = cryptoService.generateWallet();
    const secretBytes = cryptoService.privateKeyToBytes(wallet.privateKey);
    const shares = await cryptoService.splitSecret(secretBytes, 3, 2);

    const [share1, share2, share3] = shares.map((s) => cryptoService.encodeShare(s));

    await Promise.all([
      infisicalService.saveToHotStorage(userId, share2),
      infisicalService.saveToColdStorage(userId, share3),
    ]);

    return { share1, address: wallet.address };
  }

  async signMessage(userId: string, share1: string, message: string): Promise<string> {
    const share2 = await infisicalService.getFromHotStorage(userId);

    const shares = [share1, share2].map((s) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    return cryptoService.signMessage(privateKey, message);
  }

  async recoverShare(userId: string): Promise<string> {
    const [share2, share3] = await Promise.all([
      infisicalService.getFromHotStorage(userId),
      infisicalService.getFromColdStorage(userId),
    ]);

    const shares = [share2, share3].map((s) => cryptoService.decodeShare(s));
    const secretBytes = await cryptoService.combineShares(shares);
    const privateKey = cryptoService.bytesToPrivateKey(secretBytes);

    const newSecretBytes = cryptoService.privateKeyToBytes(privateKey);
    const newShares = await cryptoService.splitSecret(newSecretBytes, 3, 2);
    const [share11, share22, share33] = newShares.map((s) => cryptoService.encodeShare(s));
    console.log(share22, share33);

    return share11;
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
