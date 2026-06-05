import { describe, expect, it } from 'vitest';
import type { ShoppingListResponse } from '@bigbatch/shared';
import {
  addShoppingListItem,
  findShoppingListItem,
  removeShoppingListItem,
  splitShoppingList,
  updateShoppingListItem,
} from './model';

const shoppingList: ShoppingListResponse = {
  totalItems: 4,
  groups: [
    {
      categoryId: 1,
      categoryName: 'Produce',
      sortOrder: 1,
      items: [
        {
          id: 1,
          householdId: 10,
          ingredientId: 101,
          ingredientName: 'Apples',
          ingredientDefaultUnit: 'item',
          categoryId: 1,
          categoryName: 'Produce',
          categorySortOrder: 1,
          quantity: 4,
          unit: 'item',
          tickedOff: false,
          haveThis: false,
          createdAt: '2026-06-04T00:00:00Z',
        },
        {
          id: 2,
          householdId: 10,
          ingredientId: 102,
          ingredientName: 'Carrots',
          ingredientDefaultUnit: 'g',
          categoryId: 1,
          categoryName: 'Produce',
          categorySortOrder: 1,
          quantity: 500,
          unit: 'g',
          tickedOff: true,
          haveThis: false,
          createdAt: '2026-06-04T00:00:00Z',
        },
      ],
    },
    {
      categoryId: 2,
      categoryName: 'Dairy',
      sortOrder: 2,
      items: [
        {
          id: 3,
          householdId: 10,
          ingredientId: 103,
          ingredientName: 'Milk',
          ingredientDefaultUnit: 'ml',
          categoryId: 2,
          categoryName: 'Dairy',
          categorySortOrder: 2,
          quantity: 1000,
          unit: 'ml',
          tickedOff: false,
          haveThis: true,
          createdAt: '2026-06-04T00:00:00Z',
        },
        {
          id: 4,
          householdId: 10,
          ingredientId: 104,
          ingredientName: 'Yogurt',
          ingredientDefaultUnit: 'g',
          categoryId: 2,
          categoryName: 'Dairy',
          categorySortOrder: 2,
          quantity: 200,
          unit: 'g',
          tickedOff: false,
          haveThis: false,
          createdAt: '2026-06-04T00:00:00Z',
        },
      ],
    },
  ],
};

describe('splitShoppingList', () => {
  it('separates active groups from done items', () => {
    const sections = splitShoppingList(shoppingList);

    expect(sections.activeCount).toBe(2);
    expect(sections.doneCount).toBe(2);
    expect(sections.activeGroups).toHaveLength(2);
    expect(sections.activeGroups[0]?.items.map(item => item.id)).toEqual([1]);
    expect(sections.activeGroups[1]?.items.map(item => item.id)).toEqual([4]);
    expect(sections.doneItems.map(item => item.id)).toEqual([2, 3]);
  });

  it('returns empty sections for missing data', () => {
    expect(splitShoppingList(undefined)).toEqual({
      activeGroups: [],
      doneItems: [],
      activeCount: 0,
      doneCount: 0,
    });
  });
});

describe('findShoppingListItem', () => {
  it('locates items regardless of group', () => {
    expect(findShoppingListItem(shoppingList, 3)?.ingredientName).toBe('Milk');
    expect(findShoppingListItem(shoppingList, 999)).toBeUndefined();
  });
});

describe('updateShoppingListItem', () => {
  it('updates a specific item in place', () => {
    const updated = updateShoppingListItem(shoppingList, 1, item => ({
      ...item,
      haveThis: true,
    }));

    expect(findShoppingListItem(updated, 1)?.haveThis).toBe(true);
    expect(findShoppingListItem(updated, 4)?.haveThis).toBe(false);
  });
});

describe('removeShoppingListItem', () => {
  it('removes items and prunes empty groups', () => {
    const removedOne = removeShoppingListItem(shoppingList, 4);
    expect(removedOne?.totalItems).toBe(3);
    expect(removedOne?.groups).toHaveLength(2);
    expect(removedOne?.groups[1]?.items.map(item => item.id)).toEqual([3]);
    expect(findShoppingListItem(removedOne, 4)).toBeUndefined();
  });
});

describe('addShoppingListItem', () => {
  it('adds a new optimistic item into an existing category group', () => {
    const added = addShoppingListItem(shoppingList, {
      tempId: -1,
      householdId: 10,
      ingredientId: 105,
      ingredientName: 'Bananas',
      ingredientDefaultUnit: 'item',
      categoryId: 1,
      categoryName: 'Produce',
      categorySortOrder: 1,
      quantity: 6,
      unit: 'item',
      createdAt: '2026-06-05T00:00:00Z',
    });

    expect(added.totalItems).toBe(5);
    expect(added.groups[0]?.items.map(item => item.ingredientName)).toEqual([
      'Apples',
      'Bananas',
      'Carrots',
    ]);
  });

  it('merges quantity for the same ingredient and unit instead of duplicating rows', () => {
    const added = addShoppingListItem(shoppingList, {
      tempId: -2,
      householdId: 10,
      ingredientId: 101,
      ingredientName: 'Apples',
      ingredientDefaultUnit: 'item',
      categoryId: 1,
      categoryName: 'Produce',
      categorySortOrder: 1,
      quantity: 2,
      unit: 'item',
      createdAt: '2026-06-05T00:00:00Z',
    });

    expect(added.totalItems).toBe(4);
    expect(findShoppingListItem(added, 1)?.quantity).toBe(6);
    expect(added.groups[0]?.items).toHaveLength(2);
  });
});
