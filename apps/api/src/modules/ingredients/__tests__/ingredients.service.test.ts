import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Ingredients service tests — example-based
// ---------------------------------------------------------------------------

vi.mock('../../../db/client.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../lib/env.js', () => ({
  env: { NODE_ENV: 'test' },
}));

import { db } from '../../../db/client.js';

// Helper to build chained mock
function selectChain(result: unknown[] = []) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  // Also make chain itself thenable for queries without .limit()
  chain.then = (resolve: any) => resolve(result);
  return chain;
}

function insertChain(result: unknown[] = []) {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(result),
    }),
  };
}

function updateChain() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

describe('Ingredients Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('createIngredient', () => {
    it('rejects empty name', async () => {
      const { createIngredient } = await import('../ingredients.service.js');
      await expect(
        createIngredient(1, { name: '', defaultUnit: 'g' }),
      ).rejects.toThrow('Ingredient name must be 1–200 characters');
    });

    it('rejects name over 200 chars', async () => {
      const { createIngredient } = await import('../ingredients.service.js');
      await expect(
        createIngredient(1, { name: 'a'.repeat(201), defaultUnit: 'g' }),
      ).rejects.toThrow('Ingredient name must be 1–200 characters');
    });

    it('rejects duplicate name (case-insensitive)', async () => {
      const chain = selectChain([{ id: 99 }]);
      vi.mocked(db.select).mockReturnValue(chain);

      const { createIngredient } = await import('../ingredients.service.js');
      await expect(
        createIngredient(1, { name: 'Chicken', defaultUnit: 'g' }),
      ).rejects.toThrow('An ingredient with this name already exists');
    });

    it('creates ingredient with nullable nutrition', async () => {
      // First select: uniqueness check (empty)
      const uniqueChain = selectChain([]);
      // Second select: category validation not needed (no categoryId)
      // Insert chain
      const created = {
        id: 1,
        householdId: 1,
        name: 'Chicken',
        defaultUnit: 'g',
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        categoryId: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        deletedAt: null,
      };
      vi.mocked(db.select).mockReturnValue(uniqueChain);
      vi.mocked(db.insert).mockReturnValue(insertChain([created]) as any);

      const { createIngredient } = await import('../ingredients.service.js');
      const result = await createIngredient(1, {
        name: 'Chicken',
        defaultUnit: 'g',
      });
      expect(result).toMatchObject({ name: 'Chicken', calories: null });
    });
  });

  describe('deleteIngredient', () => {
    it('rejects deletion when ingredient is in use', async () => {
      const existsChain = selectChain([
        { id: 1, householdId: 1, deletedAt: null },
      ]);
      const usageChain = selectChain([{ total: 3 }]);

      vi.mocked(db.select)
        .mockReturnValueOnce(existsChain)
        .mockReturnValueOnce(usageChain);

      const { deleteIngredient } = await import('../ingredients.service.js');
      await expect(deleteIngredient(1, 1)).rejects.toThrow(
        'Ingredient is used by 3 recipe(s) and cannot be deleted',
      );
    });

    it('soft-deletes when not in use', async () => {
      const existsChain = selectChain([
        { id: 1, householdId: 1, deletedAt: null },
      ]);
      const usageChain = selectChain([{ total: 0 }]);

      vi.mocked(db.select)
        .mockReturnValueOnce(existsChain)
        .mockReturnValueOnce(usageChain);
      vi.mocked(db.update).mockReturnValue(updateChain() as any);

      const { deleteIngredient } = await import('../ingredients.service.js');
      await expect(deleteIngredient(1, 1)).resolves.toBeUndefined();
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('updateIngredient', () => {
    it('rejects rename to existing name', async () => {
      // First: exists check
      const existsChain = selectChain([
        { id: 1, householdId: 1, name: 'Old', deletedAt: null },
      ]);
      // Second: uniqueness check
      const dupeChain = selectChain([{ id: 2 }]);

      vi.mocked(db.select)
        .mockReturnValueOnce(existsChain)
        .mockReturnValueOnce(dupeChain);

      const { updateIngredient } = await import('../ingredients.service.js');
      await expect(updateIngredient(1, 1, { name: 'Taken' })).rejects.toThrow(
        'An ingredient with this name already exists',
      );
    });
  });
});
