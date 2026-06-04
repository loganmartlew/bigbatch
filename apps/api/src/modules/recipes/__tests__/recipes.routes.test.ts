import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../recipes.service.js', () => ({
  listRecipes: vi.fn(),
  getRecipe: vi.fn(),
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  duplicateRecipe: vi.fn(),
  listTags: vi.fn(),
}));

import { createRecipe, duplicateRecipe } from '../recipes.service.js';
import { registerRecipeRoutes } from '../recipes.routes.js';

function buildServer() {
  const app = Fastify();

  app.addHook('onRequest', async request => {
    (request as typeof request & { householdId: number }).householdId = 42;
    request.user = {
      id: 7,
      email: 'cook@example.com',
      firstName: 'Test',
      lastName: 'Cook',
    };
  });

  return app;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('Recipe routes', () => {
  it('passes the authenticated user id when creating a recipe', async () => {
    vi.mocked(createRecipe).mockResolvedValue({ id: 99 } as never);

    const app = buildServer();
    await registerRecipeRoutes(app);
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/recipes',
      payload: {
        name: 'Soup',
        batchSize: 4,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createRecipe).toHaveBeenCalledWith(
      42,
      7,
      expect.objectContaining({ name: 'Soup', batchSize: 4 }),
    );

    await app.close();
  });

  it('passes the authenticated user id when duplicating a recipe', async () => {
    vi.mocked(duplicateRecipe).mockResolvedValue({ id: 100 } as never);

    const app = buildServer();
    await registerRecipeRoutes(app);
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/recipes/55/duplicate',
    });

    expect(response.statusCode).toBe(201);
    expect(duplicateRecipe).toHaveBeenCalledWith(42, 7, 55);

    await app.close();
  });
});
