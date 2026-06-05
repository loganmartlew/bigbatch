import type { FastifyInstance } from 'fastify';
import { registerCookEventRoutes } from './cook-events.routes.js';

export async function cookEventsPlugin(server: FastifyInstance) {
  await registerCookEventRoutes(server);
}
