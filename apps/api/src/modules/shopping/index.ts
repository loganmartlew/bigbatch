import type { FastifyInstance } from 'fastify';
import { registerShoppingRoutes } from './shopping-list.routes.js';

export async function shoppingPlugin(server: FastifyInstance) {
  await registerShoppingRoutes(server);
}
