import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError, ConflictError } from '../../core/errors.js';

vi.mock('../shopping-list.service.js', () => ({
  getShoppingList: vi.fn(),
  addRecipeToList: vi.fn(),
  addIngredientToList: vi.fn(),
  toggleTickedOff: vi.fn(),
  toggleHaveThis: vi.fn(),
  removeItem: vi.fn(),
  updateItemQuantity: vi.fn(),
  clearShoppingList: vi.fn(),
}));

import {
  getShoppingList,
  addRecipeToList,
  addIngredientToList,
  toggleTickedOff,
  toggleHaveThis,
  removeItem,
  updateItemQuantity,
  clearShoppingList,
} from '../shopping-list.service.js';
import { registerShoppingRoutes } from '../shopping-list.routes.js';

const HOUSEHOLD_ID = 42;

const EMPTY_LIST = { groups: [], totalItems: 0 };

const ENRICHED_ITEM = {
  id: 1,
  householdId: HOUSEHOLD_ID,
  ingredientId: 10,
  ingredientName: 'Flour',
  ingredientDefaultUnit: 'g',
  categoryId: null,
  categoryName: null,
  categorySortOrder: null,
  quantity: 200,
  unit: 'g',
  tickedOff: false,
  haveThis: false,
  createdAt: '2026-01-01T00:00:00Z',
};

function buildServer() {
  const app = Fastify();

  app.addHook('onRequest', async request => {
    (request as typeof request & { householdId: number }).householdId =
      HOUSEHOLD_ID;
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

// ─── GET /shopping-list ───────────────────────────────────────

describe('GET /shopping-list', () => {
  it('returns grouped shopping list', async () => {
    vi.mocked(getShoppingList).mockResolvedValue(EMPTY_LIST as never);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/shopping-list' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ data: EMPTY_LIST });
    expect(getShoppingList).toHaveBeenCalledWith(HOUSEHOLD_ID);

    await app.close();
  });
});

// ─── POST /shopping-list/add-recipe ──────────────────────────

describe('POST /shopping-list/add-recipe', () => {
  it('adds a recipe to the list', async () => {
    vi.mocked(addRecipeToList).mockResolvedValue(EMPTY_LIST as never);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/shopping-list/add-recipe',
      payload: { recipeId: 5, targetBatchSize: 8 },
    });

    expect(res.statusCode).toBe(200);
    expect(addRecipeToList).toHaveBeenCalledWith(HOUSEHOLD_ID, 5, 8);

    await app.close();
  });

  it('returns 400 for invalid body', async () => {
    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/shopping-list/add-recipe',
      payload: { recipeId: 0, targetBatchSize: -1 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('returns 404 when recipe not found', async () => {
    vi.mocked(addRecipeToList).mockRejectedValue(
      new NotFoundError('Recipe not found'),
    );

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/shopping-list/add-recipe',
      payload: { recipeId: 99, targetBatchSize: 4 },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('returns 409 when recipe has no ingredients', async () => {
    vi.mocked(addRecipeToList).mockRejectedValue(
      new ConflictError(
        'Recipe has no ingredients and cannot be added to the shopping list',
      ),
    );

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/shopping-list/add-recipe',
      payload: { recipeId: 5, targetBatchSize: 4 },
    });

    expect(res.statusCode).toBe(409);
    await app.close();
  });
});

// ─── POST /shopping-list/add-ingredient ──────────────────────

describe('POST /shopping-list/add-ingredient', () => {
  it('adds an ingredient to the list', async () => {
    vi.mocked(addIngredientToList).mockResolvedValue(EMPTY_LIST as never);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/shopping-list/add-ingredient',
      payload: { ingredientId: 10, quantity: 200, unit: 'g' },
    });

    expect(res.statusCode).toBe(200);
    expect(addIngredientToList).toHaveBeenCalledWith(
      HOUSEHOLD_ID,
      10,
      200,
      'g',
    );

    await app.close();
  });

  it('returns 404 when ingredient not found', async () => {
    vi.mocked(addIngredientToList).mockRejectedValue(
      new NotFoundError('Ingredient not found'),
    );

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/shopping-list/add-ingredient',
      payload: { ingredientId: 99, quantity: 1, unit: 'g' },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('returns 400 for invalid quantity', async () => {
    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/shopping-list/add-ingredient',
      payload: { ingredientId: 10, quantity: 0, unit: 'g' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });
});

// ─── PATCH /shopping-list/items/:id/toggle ───────────────────

describe('PATCH /shopping-list/items/:id/toggle', () => {
  it('toggles ticked-off state', async () => {
    vi.mocked(toggleTickedOff).mockResolvedValue({
      ...ENRICHED_ITEM,
      tickedOff: true,
    } as never);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/shopping-list/items/1/toggle',
    });

    expect(res.statusCode).toBe(200);
    expect(toggleTickedOff).toHaveBeenCalledWith(HOUSEHOLD_ID, 1);

    await app.close();
  });

  it('returns 404 for non-existent item', async () => {
    vi.mocked(toggleTickedOff).mockRejectedValue(
      new NotFoundError('Shopping list item not found'),
    );

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/shopping-list/items/999/toggle',
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ─── PATCH /shopping-list/items/:id/have-this ────────────────

describe('PATCH /shopping-list/items/:id/have-this', () => {
  it('toggles have-this state', async () => {
    vi.mocked(toggleHaveThis).mockResolvedValue({
      ...ENRICHED_ITEM,
      haveThis: true,
    } as never);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/shopping-list/items/1/have-this',
    });

    expect(res.statusCode).toBe(200);
    expect(toggleHaveThis).toHaveBeenCalledWith(HOUSEHOLD_ID, 1);

    await app.close();
  });
});

// ─── PATCH /shopping-list/items/:id/quantity ─────────────────

describe('PATCH /shopping-list/items/:id/quantity', () => {
  it('updates item quantity', async () => {
    vi.mocked(updateItemQuantity).mockResolvedValue({
      ...ENRICHED_ITEM,
      quantity: 500,
    } as never);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/shopping-list/items/1/quantity',
      payload: { quantity: 500 },
    });

    expect(res.statusCode).toBe(200);
    expect(updateItemQuantity).toHaveBeenCalledWith(HOUSEHOLD_ID, 1, 500);

    await app.close();
  });

  it('returns 400 for invalid quantity', async () => {
    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/shopping-list/items/1/quantity',
      payload: { quantity: -5 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('returns 404 for non-existent item', async () => {
    vi.mocked(updateItemQuantity).mockRejectedValue(
      new NotFoundError('Shopping list item not found'),
    );

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/shopping-list/items/999/quantity',
      payload: { quantity: 100 },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ─── DELETE /shopping-list/items/:id ─────────────────────────

describe('DELETE /shopping-list/items/:id', () => {
  it('removes an item', async () => {
    vi.mocked(removeItem).mockResolvedValue(undefined);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/shopping-list/items/1',
    });

    expect(res.statusCode).toBe(204);
    expect(removeItem).toHaveBeenCalledWith(HOUSEHOLD_ID, 1);

    await app.close();
  });

  it('returns 404 for non-existent item', async () => {
    vi.mocked(removeItem).mockRejectedValue(
      new NotFoundError('Shopping list item not found'),
    );

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/shopping-list/items/999',
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ─── DELETE /shopping-list ────────────────────────────────────

describe('DELETE /shopping-list', () => {
  it('clears the list', async () => {
    vi.mocked(clearShoppingList).mockResolvedValue(undefined);

    const app = buildServer();
    await registerShoppingRoutes(app);
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/shopping-list',
    });

    expect(res.statusCode).toBe(204);
    expect(clearShoppingList).toHaveBeenCalledWith(HOUSEHOLD_ID);

    await app.close();
  });
});
