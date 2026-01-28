import { FastifyPluginAsync } from 'fastify';
import { ResponseBuilder } from '../types/response.types';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => {
    return ResponseBuilder.success('Key Management Service API', {
      version: '1.0.0',
      endpoints: ['/create-shares', '/sign', '/recovery', '/verify']
    });
  });

  fastify.get('/health', async () => {
    return ResponseBuilder.success('Service is healthy');
  });
};

export default root;
