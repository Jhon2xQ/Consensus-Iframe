import { FastifyPluginAsync } from 'fastify';
import { keyManagementController } from '../controllers/key-management.controller';

const responseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: { type: 'object' }
  }
};

const keyManagementRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/create-shares', {
    schema: {
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', minLength: 1 }
        }
      },
      response: {
        201: responseSchema
      }
    }
  }, keyManagementController.createShares.bind(keyManagementController));

  fastify.post('/sign', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'share1', 'message'],
        properties: {
          userId: { type: 'string', minLength: 1 },
          share1: { type: 'string', minLength: 1 },
          message: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: responseSchema
      }
    }
  }, keyManagementController.sign.bind(keyManagementController));

  fastify.post('/recovery', {
    schema: {
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: responseSchema
      }
    }
  }, keyManagementController.recovery.bind(keyManagementController));
};

export default keyManagementRoutes;
