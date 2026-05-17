import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { registerErrorHandler } from './error-handler.js';
import { registerAuthGuard } from './auth-guard.js';
import { householdResolver } from './household-resolver.js';

async function core(server: FastifyInstance): Promise<void> {
  registerErrorHandler(server);
  registerAuthGuard(server);
  server.addHook('onRequest', householdResolver);
}

export const corePlugin = fp(core, {
  name: 'core',
});
