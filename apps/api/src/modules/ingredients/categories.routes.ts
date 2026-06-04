import type { FastifyInstance } from 'fastify';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ReorderCategoriesSchema,
} from '@bigbatch/shared';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from './categories.service.js';

export async function registerCategoryRoutes(server: FastifyInstance) {
  server.get('/shopping-categories', async request => {
    const { householdId } = request as { householdId: number };
    const data = await listCategories(householdId);
    return { data };
  });

  server.post(
    '/shopping-categories',
    {
      schema: { body: CreateCategorySchema },
    },
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const { name } = request.body as { name: string };
      const data = await createCategory(householdId, name);
      return reply.status(201).send({ data });
    },
  );

  server.patch<{ Params: { id: string } }>(
    '/shopping-categories/:id',
    {
      schema: { body: UpdateCategorySchema },
    },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      const data = await updateCategory(householdId, id, request.body as any);
      return { data };
    },
  );

  server.delete<{ Params: { id: string } }>(
    '/shopping-categories/:id',
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      await deleteCategory(householdId, id);
      return reply.status(204).send();
    },
  );

  server.put(
    '/shopping-categories/reorder',
    {
      schema: { body: ReorderCategoriesSchema },
    },
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const { orderedIds } = request.body as { orderedIds: number[] };
      await reorderCategories(householdId, orderedIds);
      return reply.status(204).send();
    },
  );
}
