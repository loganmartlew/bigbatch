import type { FastifyInstance } from 'fastify';
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  RecipeFiltersSchema,
} from '@bigbatch/shared';
import {
  createRecipe,
  listRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  duplicateRecipe,
  listTags,
} from './recipes.service.js';
import { AuthenticationError } from '../core/errors.js';

function getAuthenticatedUser(request: import('fastify').FastifyRequest) {
  if (!request.user) {
    throw new AuthenticationError();
  }

  return request.user;
}

export async function registerRecipeRoutes(server: FastifyInstance) {
  server.get(
    '/recipes',
    { schema: { querystring: RecipeFiltersSchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const filters = request.query as { search?: string; tags?: string };
      const data = await listRecipes(householdId, filters);
      return { data };
    },
  );

  server.get<{ Params: { id: string } }>('/recipes/:id', async request => {
    const { householdId } = request as unknown as { householdId: number };
    const id = Number(request.params.id);
    const data = await getRecipe(householdId, id);
    return { data };
  });

  server.post(
    '/recipes',
    { schema: { body: CreateRecipeSchema } },
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const user = getAuthenticatedUser(request);
      const data = await createRecipe(
        householdId,
        user.id,
        request.body as any,
      );
      return reply.status(201).send({ data });
    },
  );

  server.patch<{ Params: { id: string } }>(
    '/recipes/:id',
    { schema: { body: UpdateRecipeSchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      const data = await updateRecipe(householdId, id, request.body as any);
      return { data };
    },
  );

  server.delete<{ Params: { id: string } }>(
    '/recipes/:id',
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      await deleteRecipe(householdId, id);
      return reply.status(204).send();
    },
  );

  server.post<{ Params: { id: string } }>(
    '/recipes/:id/duplicate',
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const user = getAuthenticatedUser(request);
      const id = Number(request.params.id);
      const data = await duplicateRecipe(householdId, user.id, id);
      return reply.status(201).send({ data });
    },
  );

  server.get('/tags', async request => {
    const { householdId } = request as unknown as { householdId: number };
    const data = await listTags(householdId);
    return { data };
  });
}
