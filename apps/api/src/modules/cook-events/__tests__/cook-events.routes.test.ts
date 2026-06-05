import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError } from '../../core/errors.js';

vi.mock('../cook-events.service.js', () => ({
  createQueuedCook: vi.fn(),
  listCooksDashboard: vi.fn(),
  updateQueuedCookBatchSize: vi.fn(),
  cancelQueuedCook: vi.fn(),
  getQueuedCookCookMode: vi.fn(),
  finishQueuedCook: vi.fn(),
  getRecipeCookHistory: vi.fn(),
  updateCookEvent: vi.fn(),
}));

import {
  cancelQueuedCook,
  createQueuedCook,
  finishQueuedCook,
  getQueuedCookCookMode,
  getRecipeCookHistory,
  listCooksDashboard,
  updateCookEvent,
  updateQueuedCookBatchSize,
} from '../cook-events.service.js';
import { registerCookEventRoutes } from '../cook-events.routes.js';

const HOUSEHOLD_ID = 42;
const USER_ID = 7;

const QUEUED_COOK = {
  id: 1,
  recipeId: 10,
  recipeName: 'Chili',
  selectedBatchSize: 4,
  state: 'gatheringIngredients',
  requiredIngredientsCount: 2,
  satisfiedIngredientsCount: 1,
  createdBy: USER_ID,
  createdByName: 'Alex Cook',
  createdAt: '2026-01-01T00:00:00Z',
  ingredients: [],
};

function buildServer() {
  const app = Fastify();

  app.addHook('onRequest', async request => {
    (
      request as typeof request & {
        householdId: number;
        user: {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
        };
      }
    ).householdId = HOUSEHOLD_ID;
    (
      request as typeof request & {
        user: {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
        };
      }
    ).user = {
      id: USER_ID,
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: 'Cook',
    };
  });

  app.setErrorHandler((error: unknown, _request, reply) => {
    const appError = error as {
      statusCode?: number;
      code?: string;
      message: string;
    };
    if (appError.statusCode) {
      return reply.status(appError.statusCode).send({
        error: { code: appError.code, message: appError.message },
      });
    }
    return reply
      .status(500)
      .send({ error: { code: 'INTERNAL_ERROR', message: 'Internal error' } });
  });

  return app;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /recipes/:id/queued-cooks', () => {
  it('creates a queued cook', async () => {
    vi.mocked(createQueuedCook).mockResolvedValue(QUEUED_COOK as never);

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/recipes/10/queued-cooks',
      payload: { targetBatchSize: 4 },
    });

    expect(res.statusCode).toBe(201);
    expect(createQueuedCook).toHaveBeenCalledWith(HOUSEHOLD_ID, USER_ID, 10, 4);

    await app.close();
  });
});

describe('GET /cooks', () => {
  it('returns dashboard data', async () => {
    vi.mocked(listCooksDashboard).mockResolvedValue({
      queue: [],
      history: [],
    } as never);

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/cooks' });

    expect(res.statusCode).toBe(200);
    expect(listCooksDashboard).toHaveBeenCalledWith(HOUSEHOLD_ID);

    await app.close();
  });
});

describe('PATCH /cooks/:id/batch-size', () => {
  it('updates queued cook batch size', async () => {
    vi.mocked(updateQueuedCookBatchSize).mockResolvedValue(
      QUEUED_COOK as never,
    );

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/cooks/1/batch-size',
      payload: { targetBatchSize: 6 },
    });

    expect(res.statusCode).toBe(200);
    expect(updateQueuedCookBatchSize).toHaveBeenCalledWith(HOUSEHOLD_ID, 1, 6);

    await app.close();
  });

  it('returns 409 when queued cook is no longer editable', async () => {
    vi.mocked(updateQueuedCookBatchSize).mockRejectedValue(
      new ConflictError(
        'Batch size can only be edited while gathering ingredients',
      ),
    );

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/cooks/1/batch-size',
      payload: { targetBatchSize: 6 },
    });

    expect(res.statusCode).toBe(409);

    await app.close();
  });
});

describe('DELETE /cooks/:id', () => {
  it('cancels a queued cook', async () => {
    vi.mocked(cancelQueuedCook).mockResolvedValue({
      removedFromQueue: true,
      shoppingCleanup: { removedItemIds: [], retainedSharedItemIds: [] },
    } as never);

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/cooks/1',
      payload: { removeShoppingItems: true },
    });

    expect(res.statusCode).toBe(200);
    expect(cancelQueuedCook).toHaveBeenCalledWith(HOUSEHOLD_ID, 1, true);

    await app.close();
  });
});

describe('GET /cooks/:id/cook-mode', () => {
  it('returns cook mode payload', async () => {
    vi.mocked(getQueuedCookCookMode).mockResolvedValue({
      queuedCookId: 1,
      recipeId: 10,
      recipeName: 'Chili',
      selectedBatchSize: 4,
      ingredients: [],
      instructions: [],
    } as never);

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/cooks/1/cook-mode' });

    expect(res.statusCode).toBe(200);
    expect(getQueuedCookCookMode).toHaveBeenCalledWith(HOUSEHOLD_ID, 1);

    await app.close();
  });
});

describe('POST /cooks/:id/finish', () => {
  it('finishes a queued cook', async () => {
    vi.mocked(finishQueuedCook).mockResolvedValue({
      cookEvent: {
        id: 99,
        recipeId: 10,
        userId: USER_ID,
        recipeName: 'Chili',
        userDisplayName: 'Alex Cook',
        date: '2026-06-05',
        batchSize: 4,
        notes: null,
        createdAt: '2026-06-05T00:00:00Z',
        updatedAt: '2026-06-05T00:00:00Z',
        deletedAt: null,
      },
      shoppingCleanup: { removedItemIds: [1], retainedSharedItemIds: [] },
    } as never);

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({ method: 'POST', url: '/cooks/1/finish' });

    expect(res.statusCode).toBe(200);
    expect(finishQueuedCook).toHaveBeenCalledWith(HOUSEHOLD_ID, 1, USER_ID);

    await app.close();
  });
});

describe('GET /recipes/:id/cook-events', () => {
  it('returns recipe cook history', async () => {
    vi.mocked(getRecipeCookHistory).mockResolvedValue([] as never);

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/recipes/10/cook-events',
    });

    expect(res.statusCode).toBe(200);
    expect(getRecipeCookHistory).toHaveBeenCalledWith(HOUSEHOLD_ID, 10);

    await app.close();
  });
});

describe('PATCH /cook-events/:id', () => {
  it('updates a cook event', async () => {
    vi.mocked(updateCookEvent).mockResolvedValue({
      id: 99,
      recipeId: 10,
      userId: USER_ID,
      recipeName: 'Chili',
      userDisplayName: 'Alex Cook',
      date: '2026-06-01',
      batchSize: 4,
      notes: 'Weekend prep',
      createdAt: '2026-06-05T00:00:00Z',
      updatedAt: '2026-06-05T00:00:00Z',
      deletedAt: null,
    } as never);

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/cook-events/99',
      payload: { date: '2026-06-01', notes: 'Weekend prep' },
    });

    expect(res.statusCode).toBe(200);
    expect(updateCookEvent).toHaveBeenCalledWith(HOUSEHOLD_ID, 99, {
      date: '2026-06-01',
      notes: 'Weekend prep',
    });

    await app.close();
  });

  it('returns 404 when cook event is missing', async () => {
    vi.mocked(updateCookEvent).mockRejectedValue(
      new NotFoundError('Cook event not found'),
    );

    const app = buildServer();
    await registerCookEventRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/cook-events/99',
      payload: { date: '2026-06-01' },
    });

    expect(res.statusCode).toBe(404);

    await app.close();
  });
});
