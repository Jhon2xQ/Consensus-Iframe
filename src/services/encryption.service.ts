import { argon2id } from '@noble/hashes/argon2.js';
import { randomBytes } from 'crypto';

class EncryptionService {
  private static instance: EncryptionService;

  // Parámetros seguros pero mínimos para Argon2id
  private readonly ARGON2_TIME = 3; // iteraciones
  private readonly ARGON2_MEMORY = 65536; // 64 MB
  private readonly ARGON2_PARALLELISM = 4; // threads
  private readonly KEY_LENGTH = 16; // 128 bits para AES-128
  private readonly SALT_LENGTH = 16; // 128 bits
  private readonly IV_LENGTH = 12; // 96 bits para GCM

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Deriva una clave de 16 bytes usando Argon2id
   */
  private deriveKey(password: string, salt: Uint8Array): Uint8Array {
    return argon2id(password, salt, {
      t: this.ARGON2_TIME,
      m: this.ARGON2_MEMORY,
      p: this.ARGON2_PARALLELISM,
      dkLen: this.KEY_LENGTH,
    });
  }

  /**
   * Cifra datos usando AES-128-GCM
   */
  async encrypt(data: string, password: string): Promise<string> {
    const salt = randomBytes(this.SALT_LENGTH);
    const iv = randomBytes(this.IV_LENGTH);
    const key = this.deriveKey(password, salt);

    // Importar la clave para Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Cifrar
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      dataBytes
    );

    // Combinar: salt (16) + iv (12) + ciphertext + authTag (incluido en encrypted)
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    return Buffer.from(result).toString('base64');
  }

  /**
   * Descifra datos usando AES-128-GCM
   */
  async decrypt(encryptedData: string, password: string): Promise<string> {
    const data = Buffer.from(encryptedData, 'base64');

    // Extraer componentes
    const salt = data.subarray(0, this.SALT_LENGTH);
    const iv = data.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
    const ciphertext = data.subarray(this.SALT_LENGTH + this.IV_LENGTH);

    // Derivar clave
    const key = this.deriveKey(password, salt);

    // Importar la clave
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Descifrar
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        cryptoKey,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed: Invalid password or corrupted data');
    }
  }
}

export const encryptionService = EncryptionService.getInstance();
