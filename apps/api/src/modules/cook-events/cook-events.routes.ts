import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  CancelQueuedCookSchema,
  CreateQueuedCookSchema,
  UpdateCookEventSchema,
  UpdateQueuedCookBatchSizeSchema,
} from '@bigbatch/shared';
import {
  cancelQueuedCook,
  createQueuedCook,
  finishQueuedCook,
  getQueuedCookCookMode,
  listCooksDashboard,
  getRecipeCookHistory,
  updateCookEvent,
  updateQueuedCookBatchSize,
} from './cook-events.service.js';
import { AuthenticationError } from '../core/errors.js';

function getAuthenticatedUser(request: FastifyRequest) {
  if (!request.user) {
    throw new AuthenticationError();
  }

  return request.user;
}

export async function registerCookEventRoutes(server: FastifyInstance) {
  server.post<{ Params: { id: string } }>(
    '/recipes/:id/queued-cooks',
    { schema: { body: CreateQueuedCookSchema } },
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const user = getAuthenticatedUser(request);
      const recipeId = Number(request.params.id);
      const { targetBatchSize } = request.body as { targetBatchSize: number };
      const data = await createQueuedCook(
        householdId,
        user.id,
        recipeId,
        targetBatchSize,
      );
      return reply.status(201).send({ data });
    },
  );

  server.get('/cooks', async request => {
    const { householdId } = request as unknown as { householdId: number };
    const data = await listCooksDashboard(householdId);
    return { data };
  });

  server.patch<{ Params: { id: string } }>(
    '/cooks/:id/batch-size',
    { schema: { body: UpdateQueuedCookBatchSizeSchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const queuedCookId = Number(request.params.id);
      const { targetBatchSize } = request.body as { targetBatchSize: number };
      const data = await updateQueuedCookBatchSize(
        householdId,
        queuedCookId,
        targetBatchSize,
      );
      return { data };
    },
  );

  server.delete<{ Params: { id: string } }>(
    '/cooks/:id',
    { schema: { body: CancelQueuedCookSchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const queuedCookId = Number(request.params.id);
      const { removeShoppingItems } = request.body as {
        removeShoppingItems: boolean;
      };
      const data = await cancelQueuedCook(
        householdId,
        queuedCookId,
        removeShoppingItems,
      );
      return { data };
    },
  );

  server.get<{ Params: { id: string } }>(
    '/cooks/:id/cook-mode',
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const queuedCookId = Number(request.params.id);
      const data = await getQueuedCookCookMode(householdId, queuedCookId);
      return { data };
    },
  );

  server.post<{ Params: { id: string } }>(
    '/cooks/:id/finish',
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const user = getAuthenticatedUser(request);
      const queuedCookId = Number(request.params.id);
      const data = await finishQueuedCook(householdId, queuedCookId, user.id);
      return { data };
    },
  );

  server.get<{ Params: { id: string } }>(
    '/recipes/:id/cook-events',
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const recipeId = Number(request.params.id);
      const data = await getRecipeCookHistory(householdId, recipeId);
      return { data };
    },
  );

  server.patch<{ Params: { id: string } }>(
    '/cook-events/:id',
    { schema: { body: UpdateCookEventSchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const cookEventId = Number(request.params.id);
      const data = await updateCookEvent(
        householdId,
        cookEventId,
        request.body as { date?: string; notes?: string | null },
      );
      return { data };
    },
  );
}
