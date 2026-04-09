import fp from 'fastify-plugin'
import cors, { FastifyCorsOptions } from '@fastify/cors'

export default fp<FastifyCorsOptions>(async (fastify) => {
  const corsOrigin = process.env.CORS_ORIGIN || '*'
  
  const origin = corsOrigin === '*' 
    ? '*' 
    : corsOrigin.split(',').map(o => o.trim())

  await fastify.register(cors, {
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  fastify.log.info(`CORS enabled for origins: ${corsOrigin}`)
})