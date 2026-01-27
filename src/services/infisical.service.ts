import { InfisicalSDK } from '@infisical/sdk';

enum StorageType {
  HOT = 'hot',
  COLD = 'cold'
}

class InfisicalService {
  private static instance: InfisicalService;
  private clients: Map<StorageType, InfisicalSDK> = new Map();
  private projectIds: Map<StorageType, string> = new Map();
  private readonly environment: string;
  private isAuthenticated = false;

  private constructor() {
    this.environment = process.env.INFISICAL_ENVIRONMENT || 'dev';
  }

  static getInstance(): InfisicalService {
    if (!InfisicalService.instance) {
      InfisicalService.instance = new InfisicalService();
    }
    return InfisicalService.instance;
  }

  private initializeClient(type: StorageType): void {
    if (this.clients.has(type)) return;

    const client = new InfisicalSDK();
    const projectId = process.env[`INFISICAL_${type.toUpperCase()}_PROJECT_ID`];
    
    if (!projectId) {
      throw new Error(`Missing ${type} storage project ID`);
    }

    this.clients.set(type, client);
    this.projectIds.set(type, projectId);
  }

  private async authenticate(type: StorageType): Promise<void> {
    const client = this.clients.get(type);
    if (!client) throw new Error(`Client not initialized for ${type} storage`);

    const clientId = process.env[`INFISICAL_${type.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`INFISICAL_${type.toUpperCase()}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      throw new Error(`Missing ${type} storage credentials`);
    }

    await client.auth().universalAuth.login({ clientId, clientSecret });
  }

  private async ensureReady(type: StorageType): Promise<void> {
    this.initializeClient(type);
    if (!this.isAuthenticated) {
      await Promise.all([
        this.authenticate(StorageType.HOT),
        this.authenticate(StorageType.COLD)
      ]);
      this.isAuthenticated = true;
    }
  }

  private async saveSecret(type: StorageType, userId: string, value: string): Promise<void> {
    await this.ensureReady(type);
    const client = this.clients.get(type)!;
    const projectId = this.projectIds.get(type)!;

    await client.secrets().createSecret(userId, {
      environment: this.environment,
      projectId,
      secretValue: value,
      secretPath: '/'
    });
  }

  private async getSecret(type: StorageType, userId: string): Promise<string> {
    await this.ensureReady(type);
    const client = this.clients.get(type)!;
    const projectId = this.projectIds.get(type)!;

    const secret = await client.secrets().getSecret({
      environment: this.environment,
      projectId,
      secretName: userId,
      secretPath: '/'
    });

    return secret.secretValue;
  }

  async saveToHotStorage(userId: string, value: string): Promise<void> {
    return this.saveSecret(StorageType.HOT, userId, value);
  }

  async saveToColdStorage(userId: string, value: string): Promise<void> {
    return this.saveSecret(StorageType.COLD, userId, value);
  }

  async getFromHotStorage(userId: string): Promise<string> {
    return this.getSecret(StorageType.HOT, userId);
  }

  async getFromColdStorage(userId: string): Promise<string> {
    return this.getSecret(StorageType.COLD, userId);
  }
}

export const infisicalService = InfisicalService.getInstance();
