import { FastifyPluginAsync } from 'fastify';
import { keyManagementController } from '../controllers/key-management.controller';

const keyManagementRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/create-shares', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'userPassword'],
        properties: {
          userId: { type: 'string', minLength: 1 },
          userPassword: { type: 'string', minLength: 8 }
        }
      }
    }
  }, keyManagementController.createShares.bind(keyManagementController));

  fastify.post('/sign', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'share1', 'userPassword', 'message'],
        properties: {
          userId: { type: 'string', minLength: 1 },
          share1: { type: 'string', minLength: 1 },
          userPassword: { type: 'string', minLength: 8 },
          message: { type: 'string', minLength: 1 }
        }
      }
    }
  }, keyManagementController.sign.bind(keyManagementController));

  fastify.post('/recovery', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'userPassword'],
        properties: {
          userId: { type: 'string', minLength: 1 },
          userPassword: { type: 'string', minLength: 8 }
        }
      }
    }
  }, keyManagementController.recovery.bind(keyManagementController));

  fastify.post('/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['message', 'signature', 'address'],
        properties: {
          message: { type: 'string', minLength: 1 },
          signature: { type: 'string', minLength: 1 },
          address: { type: 'string', minLength: 1 }
        }
      }
    }
  }, keyManagementController.verify.bind(keyManagementController));
};

export default keyManagementRoutes;
