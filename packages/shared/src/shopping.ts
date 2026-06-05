import type {
  ItemCandidate,
  ShoppingListItemEnriched,
  ShoppingListGroup,
} from './types/index.js';

/**
 * Consolidates a list of item candidates by (ingredientId, unit), summing quantities.
 * Pure function — no side effects.
 */
export function consolidateItems(items: ItemCandidate[]): ItemCandidate[] {
  const map = new Map<string, ItemCandidate>();
  for (const item of items) {
    const key = `${item.ingredientId}:${item.unit}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

/**
 * Scales recipe ingredient quantities from baseBatchSize to targetBatchSize and
 * returns a list of ItemCandidate ready for consolidation.
 * Pure function — no side effects.
 */
export function addRecipeToList(
  recipeIngredients: { ingredientId: number; quantity: number; unit: string }[],
  baseBatchSize: number,
  targetBatchSize: number,
): ItemCandidate[] {
  const scaleFactor = targetBatchSize / baseBatchSize;
  return recipeIngredients.map(ing => ({
    ingredientId: ing.ingredientId,
    quantity: ing.quantity * scaleFactor,
    unit: ing.unit,
  }));
}

/**
 * Groups enriched shopping list items by category.
 * - Groups are ordered by categorySortOrder ASC; uncategorized (null) is last.
 * - Items within each group are ordered by ingredientName ASC (case-insensitive).
 * Pure function — no side effects.
 */
export function groupByCategory(
  items: ShoppingListItemEnriched[],
): ShoppingListGroup[] {
  const map = new Map<string, ShoppingListGroup>();

  for (const item of items) {
    const key =
      item.categoryId !== null ? String(item.categoryId) : '__uncategorized__';
    let group = map.get(key);
    if (!group) {
      group = {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        sortOrder:
          item.categorySortOrder !== null ? item.categorySortOrder : Infinity,
        items: [],
      };
      map.set(key, group);
    }
    group.items.push(item);
  }

  for (const group of map.values()) {
    group.items.sort((a, b) =>
      a.ingredientName
        .toLowerCase()
        .localeCompare(b.ingredientName.toLowerCase()),
    );
  }

  return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}
