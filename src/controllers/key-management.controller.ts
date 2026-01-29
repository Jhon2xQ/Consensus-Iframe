import { FastifyRequest, FastifyReply } from 'fastify';
import { keyManagementService } from '../services/key-management.service';
import { ResponseBuilder } from '../types/response.types';

interface CreateSharesBody {
  userId: string;
  userPassword: string;
}

interface SignBody {
  userId: string;
  share1: string;
  userPassword: string;
  message: string;
}

interface RecoveryBody {
  userId: string;
  userPassword: string;
}

interface VerifyBody {
  message: string;
  signature: string;
  address: string;
}

class KeyManagementController {
  private static instance: KeyManagementController;

  private constructor() {}

  static getInstance(): KeyManagementController {
    if (!KeyManagementController.instance) {
      KeyManagementController.instance = new KeyManagementController();
    }
    return KeyManagementController.instance;
  }

  async createShares(
    request: FastifyRequest<{ Body: CreateSharesBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { userId, userPassword } = request.body;
      const result = await keyManagementService.createShares(userId, userPassword);
      
      reply.code(201).send(
        ResponseBuilder.success('Shares created successfully', result)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.code(500).send(
        ResponseBuilder.error(error?.message || 'Failed to create shares')
      );
    }
  }

  async sign(
    request: FastifyRequest<{ Body: SignBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { userId, share1, userPassword, message } = request.body;
      const signature = await keyManagementService.signMessage(userId, share1, userPassword, message);

      reply.send(
        ResponseBuilder.success('Message signed successfully', { signature })
      );
    } catch (error: any) {
      request.log.error(error);
      reply.code(500).send(
        ResponseBuilder.error(error?.message || 'Failed to sign message')
      );
    }
  }

  async recovery(
    request: FastifyRequest<{ Body: RecoveryBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { userId, userPassword } = request.body;
      const share1 = await keyManagementService.recoverShare(userId, userPassword);

      reply.send(
        ResponseBuilder.success('Share recovered successfully', { share1 })
      );
    } catch (error: any) {
      request.log.error(error);
      reply.code(500).send(
        ResponseBuilder.error(error?.message || 'Failed to recover share')
      );
    }
  }

  async verify(
    request: FastifyRequest<{ Body: VerifyBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { message, signature, address } = request.body;
      const result = await keyManagementService.verifySignature(message, signature, address);

      if (result.valid) {
        reply.send(
          ResponseBuilder.success('Signature verified successfully', {
            valid: true,
            message,
            recoveredAddress: result.recoveredAddress
          })
        );
      } else {
        reply.code(400).send(
          ResponseBuilder.error('Signature verification failed')
        );
      }
    } catch (error: any) {
      request.log.error(error);
      reply.code(500).send(
        ResponseBuilder.error(error?.message || 'Failed to verify signature')
      );
    }
  }
}

export const keyManagementController = KeyManagementController.getInstance();
