import { InfisicalSDK } from '@infisical/sdk';

class InfisicalService {
  private static instance: InfisicalService;
  private client: InfisicalSDK | null = null;
  private projectId: string | null = null;
  private authenticated: boolean = false;
  private readonly environment: string;

  private constructor() {
    this.environment = process.env.INFISICAL_ENVIRONMENT || 'dev';
  }

  static getInstance(): InfisicalService {
    if (!InfisicalService.instance) {
      InfisicalService.instance = new InfisicalService();
    }
    return InfisicalService.instance;
  }

  private initializeClient(): void {
    if (this.client) return;

    const projectId = process.env.INFISICAL_COLD_PROJECT_ID;
    if (!projectId) {
      throw new Error('Missing cold storage project ID');
    }

    this.client = new InfisicalSDK();
    this.projectId = projectId;
  }

  private async authenticate(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized for cold storage');

    const clientId = process.env.INFISICAL_COLD_CLIENT_ID;
    const clientSecret = process.env.INFISICAL_COLD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing cold storage credentials');
    }

    await this.client.auth().universalAuth.login({ clientId, clientSecret });
    this.authenticated = true;
  }

  private async ensureReady(): Promise<void> {
    this.initializeClient();
    if (!this.authenticated) {
      await this.authenticate();
    }
  }

  async saveToColdStorage(userId: string, value: string): Promise<void> {
    await this.ensureReady();
    const client = this.client!;
    const projectId = this.projectId!;

    await client.secrets().createSecret(userId, {
      environment: this.environment,
      projectId,
      secretValue: value,
      secretPath: '/'
    });
  }

  async getFromColdStorage(userId: string): Promise<string> {
    await this.ensureReady();
    const client = this.client!;
    const projectId = this.projectId!;

    const secret = await client.secrets().getSecret({
      environment: this.environment,
      projectId,
      secretName: userId,
      secretPath: '/'
    });

    return secret.secretValue;
  }

  async updateColdStorage(userId: string, value: string): Promise<void> {
    await this.ensureReady();
    const client = this.client!;
    const projectId = this.projectId!;

    await client.secrets().updateSecret(userId, {
      environment: this.environment,
      projectId,
      secretValue: value,
      secretPath: '/'
    });
  }
}

export const infisicalService = InfisicalService.getInstance();