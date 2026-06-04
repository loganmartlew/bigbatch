import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Categories service tests — example-based
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

function selectChain(result: unknown[] = []) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: any) => resolve(result);
  return chain;
}

describe('Categories Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('createCategory', () => {
    it('rejects empty name', async () => {
      const { createCategory } = await import('../categories.service.js');
      await expect(createCategory(1, '')).rejects.toThrow(
        'Category name must be 1–100 characters',
      );
    });

    it('rejects name over 100 chars', async () => {
      const { createCategory } = await import('../categories.service.js');
      await expect(createCategory(1, 'a'.repeat(101))).rejects.toThrow(
        'Category name must be 1–100 characters',
      );
    });
  });

  describe('updateCategory', () => {
    it('rejects renaming default categories', async () => {
      const chain = selectChain([
        {
          id: 1,
          householdId: 1,
          name: 'Produce',
          isDefault: true,
          sortOrder: 1,
        },
      ]);
      vi.mocked(db.select).mockReturnValue(chain);

      const { updateCategory } = await import('../categories.service.js');
      await expect(updateCategory(1, 1, { name: 'Veggies' })).rejects.toThrow(
        'Cannot rename default categories',
      );
    });
  });

  describe('deleteCategory', () => {
    it('rejects deleting default categories', async () => {
      const chain = selectChain([
        {
          id: 1,
          householdId: 1,
          name: 'Produce',
          isDefault: true,
          sortOrder: 1,
        },
      ]);
      vi.mocked(db.select).mockReturnValue(chain);

      const { deleteCategory } = await import('../categories.service.js');
      await expect(deleteCategory(1, 1)).rejects.toThrow(
        'Cannot delete default categories',
      );
    });

    it('rejects deleting category with assigned ingredients', async () => {
      const existsChain = selectChain([
        {
          id: 10,
          householdId: 1,
          name: 'Custom',
          isDefault: false,
          sortOrder: 8,
        },
      ]);
      const usageChain = selectChain([{ total: 5 }]);

      vi.mocked(db.select)
        .mockReturnValueOnce(existsChain)
        .mockReturnValueOnce(usageChain);

      const { deleteCategory } = await import('../categories.service.js');
      await expect(deleteCategory(1, 10)).rejects.toThrow(
        'Category has 5 ingredient(s) assigned; reassign them first',
      );
    });
  });
});
