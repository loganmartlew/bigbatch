import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  shoppingListItems,
  ingredients,
  shoppingCategories,
  recipes,
  recipeIngredients,
} from '../../db/schema.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../core/errors.js';
import {
  addRecipeToList as buildCandidates,
  groupByCategory,
} from '@bigbatch/shared';
import type {
  ShoppingListItemEnriched,
  ShoppingListResponse,
  ItemCandidate,
} from '@bigbatch/shared';

// ─── Helpers ─────────────────────────────────────────────────

async function fetchEnrichedItems(
  householdId: number,
): Promise<ShoppingListItemEnriched[]> {
  const rows = await db
    .select({
      id: shoppingListItems.id,
      householdId: shoppingListItems.householdId,
      ingredientId: shoppingListItems.ingredientId,
      ingredientName: ingredients.name,
      ingredientDefaultUnit: ingredients.defaultUnit,
      categoryId: ingredients.categoryId,
      categoryName: shoppingCategories.name,
      categorySortOrder: shoppingCategories.sortOrder,
      quantity: shoppingListItems.quantity,
      unit: shoppingListItems.unit,
      tickedOff: shoppingListItems.tickedOff,
      haveThis: shoppingListItems.haveThis,
      createdAt: shoppingListItems.createdAt,
    })
    .from(shoppingListItems)
    .innerJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
    .leftJoin(
      shoppingCategories,
      eq(ingredients.categoryId, shoppingCategories.id),
    )
    .where(eq(shoppingListItems.householdId, householdId))
    .orderBy(shoppingListItems.createdAt);

  return rows.map(row => ({
    id: row.id,
    householdId: row.householdId,
    ingredientId: row.ingredientId,
    ingredientName: row.ingredientName,
    ingredientDefaultUnit: row.ingredientDefaultUnit,
    categoryId: row.categoryId ?? null,
    categoryName: row.categoryName ?? null,
    categorySortOrder: row.categorySortOrder ?? null,
    quantity: row.quantity,
    unit: row.unit,
    tickedOff: row.tickedOff,
    haveThis: row.haveThis,
    createdAt: row.createdAt,
  }));
}

async function fetchEnrichedItem(
  householdId: number,
  itemId: number,
): Promise<ShoppingListItemEnriched> {
  const rows = await db
    .select({
      id: shoppingListItems.id,
      householdId: shoppingListItems.householdId,
      ingredientId: shoppingListItems.ingredientId,
      ingredientName: ingredients.name,
      ingredientDefaultUnit: ingredients.defaultUnit,
      categoryId: ingredients.categoryId,
      categoryName: shoppingCategories.name,
      categorySortOrder: shoppingCategories.sortOrder,
      quantity: shoppingListItems.quantity,
      unit: shoppingListItems.unit,
      tickedOff: shoppingListItems.tickedOff,
      haveThis: shoppingListItems.haveThis,
      createdAt: shoppingListItems.createdAt,
    })
    .from(shoppingListItems)
    .innerJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
    .leftJoin(
      shoppingCategories,
      eq(ingredients.categoryId, shoppingCategories.id),
    )
    .where(
      and(
        eq(shoppingListItems.id, itemId),
        eq(shoppingListItems.householdId, householdId),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    throw new NotFoundError('Shopping list item not found');
  }

  const row = rows[0]!;
  return {
    id: row.id,
    householdId: row.householdId,
    ingredientId: row.ingredientId,
    ingredientName: row.ingredientName,
    ingredientDefaultUnit: row.ingredientDefaultUnit,
    categoryId: row.categoryId ?? null,
    categoryName: row.categoryName ?? null,
    categorySortOrder: row.categorySortOrder ?? null,
    quantity: row.quantity,
    unit: row.unit,
    tickedOff: row.tickedOff,
    haveThis: row.haveThis,
    createdAt: row.createdAt,
  };
}

async function upsertCandidates(
  householdId: number,
  candidates: ItemCandidate[],
): Promise<void> {
  for (const candidate of candidates) {
    await db
      .insert(shoppingListItems)
      .values({
        householdId,
        ingredientId: candidate.ingredientId,
        quantity: candidate.quantity,
        unit: candidate.unit,
        tickedOff: false,
        haveThis: false,
      })
      .onConflictDoUpdate({
        target: [
          shoppingListItems.householdId,
          shoppingListItems.ingredientId,
          shoppingListItems.unit,
        ],
        set: {
          quantity: sql`${shoppingListItems.quantity} + excluded.quantity`,
        },
      });
  }
}

// ─── Service operations ───────────────────────────────────────

export async function getShoppingList(
  householdId: number,
): Promise<ShoppingListResponse> {
  const items = await fetchEnrichedItems(householdId);
  const groups = groupByCategory(items);
  return { groups, totalItems: items.length };
}

export async function addRecipeToList(
  householdId: number,
  recipeId: number,
  targetBatchSize: number,
): Promise<ShoppingListResponse> {
  const recipeRows = await db
    .select({
      id: recipes.id,
      batchSize: recipes.batchSize,
    })
    .from(recipes)
    .where(
      and(
        eq(recipes.id, recipeId),
        eq(recipes.householdId, householdId),
        sql`${recipes.deletedAt} IS NULL`,
      ),
    )
    .limit(1);

  if (recipeRows.length === 0) {
    throw new NotFoundError('Recipe not found');
  }

  const recipe = recipeRows[0]!;

  const ingredientRows = await db
    .select({
      ingredientId: recipeIngredients.ingredientId,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
    })
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipeId));

  if (ingredientRows.length === 0) {
    throw new ConflictError(
      'Recipe has no ingredients and cannot be added to the shopping list',
    );
  }

  const candidates = buildCandidates(
    ingredientRows,
    recipe.batchSize,
    targetBatchSize,
  );
  await upsertCandidates(householdId, candidates);

  return getShoppingList(householdId);
}

export async function addIngredientToList(
  householdId: number,
  ingredientId: number,
  quantity: number,
  unit: string,
): Promise<ShoppingListResponse> {
  const ingredientRows = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(
      and(
        eq(ingredients.id, ingredientId),
        eq(ingredients.householdId, householdId),
        sql`${ingredients.deletedAt} IS NULL`,
      ),
    )
    .limit(1);

  if (ingredientRows.length === 0) {
    throw new NotFoundError('Ingredient not found');
  }

  await upsertCandidates(householdId, [{ ingredientId, quantity, unit }]);

  return getShoppingList(householdId);
}

export async function toggleTickedOff(
  householdId: number,
  itemId: number,
): Promise<ShoppingListItemEnriched> {
  const item = await fetchEnrichedItem(householdId, itemId);

  await db
    .update(shoppingListItems)
    .set({ tickedOff: !item.tickedOff })
    .where(eq(shoppingListItems.id, itemId));

  return fetchEnrichedItem(householdId, itemId);
}

export async function toggleHaveThis(
  householdId: number,
  itemId: number,
): Promise<ShoppingListItemEnriched> {
  const item = await fetchEnrichedItem(householdId, itemId);

  await db
    .update(shoppingListItems)
    .set({ haveThis: !item.haveThis })
    .where(eq(shoppingListItems.id, itemId));

  return fetchEnrichedItem(householdId, itemId);
}

export async function removeItem(
  householdId: number,
  itemId: number,
): Promise<void> {
  // Verify ownership before delete
  await fetchEnrichedItem(householdId, itemId);

  await db.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
}

export async function updateItemQuantity(
  householdId: number,
  itemId: number,
  quantity: number,
): Promise<ShoppingListItemEnriched> {
  if (quantity <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }

  // Verify ownership before update
  await fetchEnrichedItem(householdId, itemId);

  await db
    .update(shoppingListItems)
    .set({ quantity })
    .where(eq(shoppingListItems.id, itemId));

  return fetchEnrichedItem(householdId, itemId);
}

export async function clearShoppingList(householdId: number): Promise<void> {
  await db
    .delete(shoppingListItems)
    .where(eq(shoppingListItems.householdId, householdId));
}
