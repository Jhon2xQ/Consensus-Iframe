import { ethers, HDNodeWallet } from 'ethers';
import { split, combine } from 'shamir-secret-sharing';

class CryptoService {
  private static instance: CryptoService;

  private constructor() {}

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  generateWallet(): HDNodeWallet {
    return ethers.Wallet.createRandom();
  }

  privateKeyToBytes(privateKey: string): Uint8Array {
    const clean = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    return ethers.getBytes('0x' + clean);
  }

  bytesToPrivateKey(data: Uint8Array): string {
    return ethers.hexlify(data);
  }

  async splitSecret(secret: Uint8Array, shares: number, threshold: number): Promise<Uint8Array[]> {
    return split(secret, shares, threshold);
  }

  async combineShares(shares: Uint8Array[]): Promise<Uint8Array> {
    return combine(shares);
  }

  encodeShare(share: Uint8Array): string {
    return Buffer.from(share).toString('base64');
  }

  decodeShare(encoded: string): Uint8Array {
    return new Uint8Array(Buffer.from(encoded, 'base64'));
  }

  async signMessage(privateKey: string, message: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.signMessage(message);
  }
}

export const cryptoService = CryptoService.getInstance();
