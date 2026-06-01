import type { FastifyInstance } from 'fastify';
import { registerRecipeRoutes } from './recipes.routes.js';

export async function recipesPlugin(server: FastifyInstance) {
  await registerRecipeRoutes(server);
}
