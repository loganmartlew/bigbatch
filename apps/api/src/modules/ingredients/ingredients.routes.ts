import type { FastifyInstance } from 'fastify';
import {
  CreateIngredientSchema,
  UpdateIngredientSchema,
} from '@bigbatch/shared';
import {
  createIngredient,
  listIngredients,
  getIngredient,
  updateIngredient,
  deleteIngredient,
  searchOpenFoodFacts,
} from './ingredients.service.js';

export async function registerIngredientRoutes(server: FastifyInstance) {
  server.get('/ingredients', async request => {
    const { householdId } = request as { householdId: number };
    const data = await listIngredients(householdId);
    return { data };
  });

  server.get<{ Params: { id: string } }>('/ingredients/:id', async request => {
    const { householdId } = request as unknown as { householdId: number };
    const id = Number(request.params.id);
    const data = await getIngredient(householdId, id);
    return { data };
  });

  server.post(
    '/ingredients',
    {
      schema: { body: CreateIngredientSchema },
    },
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const data = await createIngredient(householdId, request.body as any);
      return reply.status(201).send({ data });
    },
  );

  server.patch<{ Params: { id: string } }>(
    '/ingredients/:id',
    {
      schema: { body: UpdateIngredientSchema },
    },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      const data = await updateIngredient(householdId, id, request.body as any);
      return { data };
    },
  );

  server.delete<{ Params: { id: string } }>(
    '/ingredients/:id',
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      await deleteIngredient(householdId, id);
      return reply.status(204).send();
    },
  );

  server.get<{ Querystring: { q?: string } }>(
    '/ingredients/search/openfoodfacts',
    async request => {
      const query = request.query.q ?? '';
      const data = await searchOpenFoodFacts(query);
      return { data: data.results, error: data.error, message: data.message };
    },
  );
}
