import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './lib/env.js';
import { corePlugin } from './modules/core/index.js';
import { authPlugin } from './modules/auth/index.js';
import { ingredientsPlugin } from './modules/ingredients/index.js';

const server = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport:
      env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  },
});

await server.register(helmet);
await server.register(cookie);
await server.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});
await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
await server.register(corePlugin);
await server.register(authPlugin);
await server.register(ingredientsPlugin);

// Domain module plugins registered here in later units:
// await server.register(recipesPlugin, { prefix: "/recipes" });
// await server.register(shoppingListPlugin, { prefix: "/shopping-list" });

server.get('/health', async () => ({ status: 'ok' }));

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
