import type { FastifyInstance } from 'fastify';
import { registerIngredientRoutes } from './ingredients.routes.js';
import { registerCategoryRoutes } from './categories.routes.js';

export async function ingredientsPlugin(server: FastifyInstance) {
  await registerIngredientRoutes(server);
  await registerCategoryRoutes(server);
}
