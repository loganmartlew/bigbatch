import { eq, and, isNull, count, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  ingredients,
  shoppingCategories,
  recipeIngredients,
} from '../../db/schema.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../core/errors.js';
import type {
  CreateIngredientInput,
  UpdateIngredientInput,
} from '@bigbatch/shared';

export async function createIngredient(
  householdId: number,
  data: CreateIngredientInput,
) {
  const name = data.name.trim();
  if (name.length < 1 || name.length > 200) {
    throw new ValidationError('Ingredient name must be 1–200 characters');
  }

  // Check case-insensitive uniqueness
  const existing = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(
      and(
        eq(ingredients.householdId, householdId),
        sql`LOWER(${ingredients.name}) = LOWER(${name})`,
        isNull(ingredients.deletedAt),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('An ingredient with this name already exists');
  }

  // Validate categoryId if provided
  if (data.categoryId != null) {
    const cat = await db
      .select({ id: shoppingCategories.id })
      .from(shoppingCategories)
      .where(
        and(
          eq(shoppingCategories.id, data.categoryId),
          eq(shoppingCategories.householdId, householdId),
        ),
      )
      .limit(1);
    if (cat.length === 0) {
      throw new ValidationError(
        'Shopping category not found in this household',
      );
    }
  }

  const [ingredient] = await db
    .insert(ingredients)
    .values({
      householdId,
      name,
      defaultUnit: data.defaultUnit,
      calories: data.calories ?? null,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null,
      categoryId: data.categoryId ?? null,
    })
    .returning();

  return enrichWithCategory(ingredient!);
}

export async function listIngredients(householdId: number) {
  const rows = await db
    .select({
      id: ingredients.id,
      householdId: ingredients.householdId,
      name: ingredients.name,
      defaultUnit: ingredients.defaultUnit,
      calories: ingredients.calories,
      protein: ingredients.protein,
      carbs: ingredients.carbs,
      fat: ingredients.fat,
      categoryId: ingredients.categoryId,
      categoryName: shoppingCategories.name,
      createdAt: ingredients.createdAt,
      updatedAt: ingredients.updatedAt,
    })
    .from(ingredients)
    .leftJoin(
      shoppingCategories,
      eq(ingredients.categoryId, shoppingCategories.id),
    )
    .where(
      and(
        eq(ingredients.householdId, householdId),
        isNull(ingredients.deletedAt),
      ),
    )
    .orderBy(sql`LOWER(${ingredients.name})`);

  return rows;
}

export async function getIngredient(householdId: number, ingredientId: number) {
  const rows = await db
    .select({
      id: ingredients.id,
      householdId: ingredients.householdId,
      name: ingredients.name,
      defaultUnit: ingredients.defaultUnit,
      calories: ingredients.calories,
      protein: ingredients.protein,
      carbs: ingredients.carbs,
      fat: ingredients.fat,
      categoryId: ingredients.categoryId,
      categoryName: shoppingCategories.name,
      createdAt: ingredients.createdAt,
      updatedAt: ingredients.updatedAt,
    })
    .from(ingredients)
    .leftJoin(
      shoppingCategories,
      eq(ingredients.categoryId, shoppingCategories.id),
    )
    .where(
      and(
        eq(ingredients.id, ingredientId),
        eq(ingredients.householdId, householdId),
        isNull(ingredients.deletedAt),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    throw new NotFoundError('Ingredient not found');
  }

  return rows[0]!;
}

export async function updateIngredient(
  householdId: number,
  ingredientId: number,
  data: UpdateIngredientInput,
) {
  // Verify exists
  const [existing] = await db
    .select()
    .from(ingredients)
    .where(
      and(
        eq(ingredients.id, ingredientId),
        eq(ingredients.householdId, householdId),
        isNull(ingredients.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Ingredient not found');
  }

  // Check name uniqueness on rename
  if (data.name != null) {
    const name = data.name.trim();
    if (name.length < 1 || name.length > 200) {
      throw new ValidationError('Ingredient name must be 1–200 characters');
    }
    const duplicate = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(
        and(
          eq(ingredients.householdId, householdId),
          sql`LOWER(${ingredients.name}) = LOWER(${name})`,
          isNull(ingredients.deletedAt),
          sql`${ingredients.id} != ${ingredientId}`,
        ),
      )
      .limit(1);
    if (duplicate.length > 0) {
      throw new ConflictError('An ingredient with this name already exists');
    }
  }

  // Validate categoryId if changing
  if (data.categoryId !== undefined && data.categoryId !== null) {
    const cat = await db
      .select({ id: shoppingCategories.id })
      .from(shoppingCategories)
      .where(
        and(
          eq(shoppingCategories.id, data.categoryId),
          eq(shoppingCategories.householdId, householdId),
        ),
      )
      .limit(1);
    if (cat.length === 0) {
      throw new ValidationError(
        'Shopping category not found in this household',
      );
    }
  }

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };
  if (data.name != null) updateValues.name = data.name.trim();
  if (data.defaultUnit != null) updateValues.defaultUnit = data.defaultUnit;
  if (data.calories !== undefined) updateValues.calories = data.calories;
  if (data.protein !== undefined) updateValues.protein = data.protein;
  if (data.carbs !== undefined) updateValues.carbs = data.carbs;
  if (data.fat !== undefined) updateValues.fat = data.fat;
  if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;

  await db
    .update(ingredients)
    .set(updateValues)
    .where(eq(ingredients.id, ingredientId));

  return getIngredient(householdId, ingredientId);
}

export async function deleteIngredient(
  householdId: number,
  ingredientId: number,
) {
  const [existing] = await db
    .select()
    .from(ingredients)
    .where(
      and(
        eq(ingredients.id, ingredientId),
        eq(ingredients.householdId, householdId),
        isNull(ingredients.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Ingredient not found');
  }

  // Check if ingredient is in use by any recipe
  const [usage] = await db
    .select({ total: count() })
    .from(recipeIngredients)
    .where(eq(recipeIngredients.ingredientId, ingredientId));

  if (usage && usage.total > 0) {
    throw new ConflictError(
      `Ingredient is used by ${usage.total} recipe(s) and cannot be deleted`,
    );
  }

  await db
    .update(ingredients)
    .set({ deletedAt: sql`(datetime('now'))` })
    .where(eq(ingredients.id, ingredientId));
}

export interface OFFProduct {
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export async function searchOpenFoodFacts(
  query: string,
): Promise<{ results: OFFProduct[]; error?: boolean; message?: string }> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { results: [] };
  }

  const isBarcode = /^\d{8,13}$/.test(trimmed);

  try {
    let url: string;
    if (isBarcode) {
      url = `https://world.openfoodfacts.org/api/v2/product/${trimmed}?fields=product_name,nutriments`;
    } else {
      url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(trimmed)}&json=1&page_size=20&fields=product_name,nutriments`;
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'BigBatch/1.0 (https://github.com/bigbatch)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { results: [], error: true, message: 'OpenFoodFacts unavailable' };
    }

    const json = (await response.json()) as Record<string, unknown>;

    if (isBarcode) {
      if (json.status !== 1 || !json.product) {
        return { results: [] };
      }
      return {
        results: [mapOFFProduct(json.product as Record<string, unknown>)],
      };
    }

    const products = (json.products ?? []) as Record<string, unknown>[];
    return {
      results: products.slice(0, 20).map(mapOFFProduct),
    };
  } catch {
    return { results: [], error: true, message: 'OpenFoodFacts unavailable' };
  }
}

function mapOFFProduct(product: Record<string, unknown>): OFFProduct {
  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>;
  return {
    name: String(product.product_name ?? product.generic_name ?? 'Unknown'),
    calories: toNullableNumber(nutriments['energy-kcal_100g']),
    protein: toNullableNumber(nutriments['proteins_100g']),
    carbs: toNullableNumber(nutriments['carbohydrates_100g']),
    fat: toNullableNumber(nutriments['fat_100g']),
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function enrichWithCategory(ingredient: typeof ingredients.$inferSelect) {
  if (ingredient.categoryId == null) {
    return { ...ingredient, categoryName: null };
  }
  const [cat] = await db
    .select({ name: shoppingCategories.name })
    .from(shoppingCategories)
    .where(eq(shoppingCategories.id, ingredient.categoryId))
    .limit(1);
  return { ...ingredient, categoryName: cat?.name ?? null };
}
