import type {
  ShoppingListItemEnriched,
  ShoppingListResponse,
} from '@bigbatch/shared';

interface OptimisticShoppingListItemInput {
  tempId: number;
  householdId: number;
  ingredientId: number;
  ingredientName: string;
  ingredientDefaultUnit: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySortOrder: number | null;
  quantity: number;
  unit: string;
  createdAt: string;
}

function sortShoppingGroupItems(items: ShoppingListItemEnriched[]) {
  return [...items].sort((left, right) =>
    left.ingredientName
      .toLowerCase()
      .localeCompare(right.ingredientName.toLowerCase()),
  );
}

function sortShoppingGroups(groups: ShoppingListResponse['groups']) {
  return [...groups].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return (left.categoryName ?? '').localeCompare(right.categoryName ?? '');
  });
}

export interface ShoppingListSections {
  activeGroups: ShoppingListResponse['groups'];
  doneItems: ShoppingListItemEnriched[];
  activeCount: number;
  doneCount: number;
}

export function isDoneShoppingItem(item: ShoppingListItemEnriched) {
  return item.tickedOff || item.haveThis;
}

export function splitShoppingList(
  response: ShoppingListResponse | null | undefined,
): ShoppingListSections {
  if (!response) {
    return {
      activeGroups: [],
      doneItems: [],
      activeCount: 0,
      doneCount: 0,
    };
  }

  const doneItems: ShoppingListItemEnriched[] = [];

  const activeGroups = response.groups
    .map(group => {
      const items = group.items.filter(item => {
        if (isDoneShoppingItem(item)) {
          doneItems.push(item);
          return false;
        }

        return true;
      });

      return {
        ...group,
        items,
      };
    })
    .filter(group => group.items.length > 0);

  return {
    activeGroups,
    doneItems,
    activeCount: response.totalItems - doneItems.length,
    doneCount: doneItems.length,
  };
}

export function findShoppingListItem(
  response: ShoppingListResponse | null | undefined,
  itemId: number,
) {
  if (!response) {
    return undefined;
  }

  for (const group of response.groups) {
    const item = group.items.find(candidate => candidate.id === itemId);
    if (item) {
      return item;
    }
  }

  return undefined;
}

export function updateShoppingListItem(
  response: ShoppingListResponse | undefined,
  itemId: number,
  updater: (item: ShoppingListItemEnriched) => ShoppingListItemEnriched,
) {
  if (!response) {
    return response;
  }

  let didUpdate = false;

  const groups = response.groups.map(group => ({
    ...group,
    items: group.items.map(item => {
      if (item.id !== itemId) {
        return item;
      }

      didUpdate = true;
      return updater(item);
    }),
  }));

  if (!didUpdate) {
    return response;
  }

  return {
    ...response,
    groups,
  };
}

export function removeShoppingListItem(
  response: ShoppingListResponse | undefined,
  itemId: number,
) {
  if (!response) {
    return response;
  }

  let removed = false;

  const groups = response.groups
    .map(group => {
      const items = group.items.filter(item => {
        if (item.id !== itemId) {
          return true;
        }

        removed = true;
        return false;
      });

      return {
        ...group,
        items,
      };
    })
    .filter(group => group.items.length > 0);

  if (!removed) {
    return response;
  }

  return {
    ...response,
    groups,
    totalItems: Math.max(0, response.totalItems - 1),
  };
}

export function addShoppingListItem(
  response: ShoppingListResponse | undefined,
  optimisticItem: OptimisticShoppingListItemInput,
) {
  const nextItem: ShoppingListItemEnriched = {
    id: optimisticItem.tempId,
    householdId: optimisticItem.householdId,
    ingredientId: optimisticItem.ingredientId,
    ingredientName: optimisticItem.ingredientName,
    ingredientDefaultUnit: optimisticItem.ingredientDefaultUnit,
    categoryId: optimisticItem.categoryId,
    categoryName: optimisticItem.categoryName,
    categorySortOrder: optimisticItem.categorySortOrder,
    quantity: optimisticItem.quantity,
    unit: optimisticItem.unit,
    tickedOff: false,
    haveThis: false,
    createdAt: optimisticItem.createdAt,
  };

  if (!response) {
    return {
      totalItems: 1,
      groups: [
        {
          categoryId: nextItem.categoryId,
          categoryName: nextItem.categoryName,
          sortOrder: nextItem.categorySortOrder ?? Infinity,
          items: [nextItem],
        },
      ],
    } satisfies ShoppingListResponse;
  }

  let merged = false;

  const mergedGroups = response.groups.map(group => ({
    ...group,
    items: group.items.map(item => {
      if (
        item.ingredientId !== nextItem.ingredientId ||
        item.unit !== nextItem.unit
      ) {
        return item;
      }

      merged = true;
      return {
        ...item,
        quantity: item.quantity + nextItem.quantity,
      };
    }),
  }));

  if (merged) {
    return {
      ...response,
      groups: mergedGroups,
    };
  }

  const existingGroupIndex = response.groups.findIndex(
    group => group.categoryId === nextItem.categoryId,
  );

  if (existingGroupIndex >= 0) {
    const groups = response.groups.map((group, index) => {
      if (index !== existingGroupIndex) {
        return group;
      }

      return {
        ...group,
        items: sortShoppingGroupItems([...group.items, nextItem]),
      };
    });

    return {
      ...response,
      groups,
      totalItems: response.totalItems + 1,
    };
  }

  return {
    ...response,
    groups: sortShoppingGroups([
      ...response.groups,
      {
        categoryId: nextItem.categoryId,
        categoryName: nextItem.categoryName,
        sortOrder: nextItem.categorySortOrder ?? Infinity,
        items: [nextItem],
      },
    ]),
    totalItems: response.totalItems + 1,
  };
}
