import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { registerAuthRoutes } from './auth.routes.js';
import { registerHouseholdRoutes } from './household.routes.js';

async function auth(server: FastifyInstance): Promise<void> {
  await registerAuthRoutes(server);
  await registerHouseholdRoutes(server);
}

export const authPlugin = fp(auth, {
  name: 'auth',
  dependencies: ['core'],
});
