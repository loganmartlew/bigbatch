import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  consolidateItems,
  addRecipeToList,
  groupByCategory,
} from './shopping.js';
import type { ItemCandidate, ShoppingListItemEnriched } from './types/index.js';

const UNITS = ['g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'item'] as const;

const itemCandidateArb = fc.record({
  ingredientId: fc.integer({ min: 1, max: 50 }),
  quantity: fc.float({
    min: Math.fround(0.01),
    max: Math.fround(1000),
    noNaN: true,
  }),
  unit: fc.constantFrom(...UNITS),
});

// ─── consolidateItems ─────────────────────────────────────────

describe('PBT-SH-01: consolidateItems — idempotency', () => {
  it('consolidating twice equals consolidating once', () => {
    fc.assert(
      fc.property(
        fc.array(itemCandidateArb, { minLength: 0, maxLength: 20 }),
        items => {
          const once = consolidateItems(items);
          const twice = consolidateItems(once);

          // Same keys
          const keysOnce = new Set(
            once.map(i => `${i.ingredientId}:${i.unit}`),
          );
          const keysTwice = new Set(
            twice.map(i => `${i.ingredientId}:${i.unit}`),
          );
          expect(keysOnce).toEqual(keysTwice);

          // Same quantities per key
          for (const item of twice) {
            const key = `${item.ingredientId}:${item.unit}`;
            const match = once.find(i => `${i.ingredientId}:${i.unit}` === key);
            expect(match).toBeDefined();
            expect(item.quantity).toBeCloseTo(match!.quantity, 5);
          }
        },
      ),
    );
  });
});

describe('PBT-SH-02: consolidateItems — quantity preservation', () => {
  it('output quantity per key equals sum of all input quantities for that key', () => {
    fc.assert(
      fc.property(
        fc.array(itemCandidateArb, { minLength: 1, maxLength: 20 }),
        items => {
          const result = consolidateItems(items);

          // For each unique key, sum input quantities and compare to output
          const inputSums = new Map<string, number>();
          for (const item of items) {
            const key = `${item.ingredientId}:${item.unit}`;
            inputSums.set(key, (inputSums.get(key) ?? 0) + item.quantity);
          }

          for (const item of result) {
            const key = `${item.ingredientId}:${item.unit}`;
            const expectedSum = inputSums.get(key) ?? 0;
            expect(item.quantity).toBeCloseTo(expectedSum, 5);
          }

          // No extra keys in output
          expect(result.length).toBe(inputSums.size);
        },
      ),
    );
  });
});

// ─── addRecipeToList ──────────────────────────────────────────

describe('addRecipeToList — scaling', () => {
  it('scales quantities by targetBatchSize / baseBatchSize', () => {
    const ingredients: ItemCandidate[] = [
      { ingredientId: 1, quantity: 100, unit: 'g' },
      { ingredientId: 2, quantity: 2, unit: 'tbsp' },
    ];
    const result = addRecipeToList(ingredients, 4, 8);
    expect(result[0]!.quantity).toBeCloseTo(200, 5);
    expect(result[1]!.quantity).toBeCloseTo(4, 5);
  });

  it('returns same quantities when target equals base', () => {
    fc.assert(
      fc.property(
        fc.array(itemCandidateArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 100 }),
        (ingredients, batchSize) => {
          const result = addRecipeToList(ingredients, batchSize, batchSize);
          for (let i = 0; i < ingredients.length; i++) {
            expect(result[i]!.quantity).toBeCloseTo(
              ingredients[i]!.quantity,
              5,
            );
          }
        },
      ),
    );
  });

  it('preserves ingredientId and unit after scaling', () => {
    const ingredients: ItemCandidate[] = [
      { ingredientId: 5, quantity: 50, unit: 'ml' },
    ];
    const result = addRecipeToList(ingredients, 2, 6);
    expect(result[0]!.ingredientId).toBe(5);
    expect(result[0]!.unit).toBe('ml');
    expect(result[0]!.quantity).toBeCloseTo(150, 5);
  });
});

// ─── groupByCategory ─────────────────────────────────────────

const enrichedItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  householdId: fc.constant(1),
  ingredientId: fc.integer({ min: 1, max: 50 }),
  ingredientName: fc.string({ minLength: 1, maxLength: 30 }),
  ingredientDefaultUnit: fc.constantFrom(...UNITS),
  categoryId: fc.oneof(fc.integer({ min: 1, max: 5 }), fc.constant(null)),
  categoryName: fc.constant(null as string | null),
  categorySortOrder: fc.constant(null as number | null),
  quantity: fc.float({
    min: Math.fround(0.01),
    max: Math.fround(1000),
    noNaN: true,
  }),
  unit: fc.constantFrom(...UNITS),
  tickedOff: fc.boolean(),
  haveThis: fc.boolean(),
  createdAt: fc.constant('2026-01-01T00:00:00Z'),
}) as fc.Arbitrary<ShoppingListItemEnriched>;

describe('groupByCategory — coverage invariant', () => {
  it('every input item appears in exactly one group', () => {
    fc.assert(
      fc.property(
        fc.array(enrichedItemArb, { minLength: 0, maxLength: 30 }),
        items => {
          const groups = groupByCategory(items);
          const allOutputItems = groups.flatMap(g => g.items);
          expect(allOutputItems.length).toBe(items.length);

          // Each input id appears exactly once
          const inputIds = items.map(i => i.id).sort();
          const outputIds = allOutputItems.map(i => i.id).sort();
          expect(outputIds).toEqual(inputIds);
        },
      ),
    );
  });

  it('uncategorized group (null categoryId) always appears last', () => {
    const items: ShoppingListItemEnriched[] = [
      {
        id: 1,
        householdId: 1,
        ingredientId: 1,
        ingredientName: 'Flour',
        ingredientDefaultUnit: 'g',
        categoryId: null,
        categoryName: null,
        categorySortOrder: null,
        quantity: 100,
        unit: 'g',
        tickedOff: false,
        haveThis: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        householdId: 1,
        ingredientId: 2,
        ingredientName: 'Milk',
        ingredientDefaultUnit: 'ml',
        categoryId: 1,
        categoryName: 'Dairy',
        categorySortOrder: 2,
        quantity: 500,
        unit: 'ml',
        tickedOff: false,
        haveThis: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    const groups = groupByCategory(items);
    const lastGroup = groups[groups.length - 1]!;
    expect(lastGroup.categoryId).toBeNull();
  });

  it('items within each group are sorted by ingredientName ASC (case-insensitive)', () => {
    const items: ShoppingListItemEnriched[] = [
      {
        id: 1,
        householdId: 1,
        ingredientId: 1,
        ingredientName: 'Zucchini',
        ingredientDefaultUnit: 'g',
        categoryId: 1,
        categoryName: 'Produce',
        categorySortOrder: 1,
        quantity: 200,
        unit: 'g',
        tickedOff: false,
        haveThis: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        householdId: 1,
        ingredientId: 2,
        ingredientName: 'apple',
        ingredientDefaultUnit: 'item',
        categoryId: 1,
        categoryName: 'Produce',
        categorySortOrder: 1,
        quantity: 3,
        unit: 'item',
        tickedOff: false,
        haveThis: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    const groups = groupByCategory(items);
    expect(groups[0]!.items[0]!.ingredientName).toBe('apple');
    expect(groups[0]!.items[1]!.ingredientName).toBe('Zucchini');
  });
});
