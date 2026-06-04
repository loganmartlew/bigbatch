import { eq, and, isNull, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  recipes,
  recipeInstructions,
  recipeIngredients,
  recipeTags,
  recipeTagAssignments,
  ingredients,
} from '../../db/schema.js';
import { NotFoundError, ValidationError } from '../core/errors.js';
import {
  computeIngredientNutrition,
  computeRecipeNutrition,
} from '@bigbatch/shared';
import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeDetail,
  RecipeSummary,
  RecipeIngredientDetail,
  NutritionInfo,
  TagWithCount,
} from '@bigbatch/shared';

// ─── Helpers ─────────────────────────────────────────────────

async function resolveTagIds(
  householdId: number,
  tagNames: string[],
): Promise<number[]> {
  const normalized = tagNames
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)
    .slice(0, 20);
  if (normalized.length === 0) return [];

  const tagIds: number[] = [];
  for (const name of normalized) {
    const existing = await db
      .select({ id: recipeTags.id })
      .from(recipeTags)
      .where(
        and(eq(recipeTags.householdId, householdId), eq(recipeTags.name, name)),
      )
      .get();
    if (existing) {
      tagIds.push(existing.id);
    } else {
      const inserted = await db
        .insert(recipeTags)
        .values({ householdId, name })
        .returning({ id: recipeTags.id })
        .get();
      tagIds.push(inserted.id);
    }
  }
  return tagIds;
}

async function buildRecipeDetail(
  householdId: number,
  recipeId: number,
): Promise<RecipeDetail> {
  const recipe = await db
    .select()
    .from(recipes)
    .where(
      and(
        eq(recipes.id, recipeId),
        eq(recipes.householdId, householdId),
        isNull(recipes.deletedAt),
      ),
    )
    .get();
  if (!recipe) throw new NotFoundError('Recipe not found');

  const instructionRows = await db
    .select()
    .from(recipeInstructions)
    .where(eq(recipeInstructions.recipeId, recipeId))
    .orderBy(recipeInstructions.stepNumber);

  const ingredientRows = await db
    .select({
      id: recipeIngredients.id,
      ingredientId: recipeIngredients.ingredientId,
      ingredientName: ingredients.name,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      calories: ingredients.calories,
      protein: ingredients.protein,
      carbs: ingredients.carbs,
      fat: ingredients.fat,
    })
    .from(recipeIngredients)
    .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, recipeId));

  const tagRows = await db
    .select({ name: recipeTags.name })
    .from(recipeTagAssignments)
    .innerJoin(recipeTags, eq(recipeTagAssignments.tagId, recipeTags.id))
    .where(eq(recipeTagAssignments.recipeId, recipeId));

  const enrichedIngredients: RecipeIngredientDetail[] = ingredientRows.map(
    row => {
      const nutritionData =
        row.calories != null ||
        row.protein != null ||
        row.carbs != null ||
        row.fat != null
          ? {
              calories: row.calories,
              protein: row.protein,
              carbs: row.carbs,
              fat: row.fat,
            }
          : null;
      const nutrition = computeIngredientNutrition(nutritionData, row.quantity);
      return {
        id: row.id,
        ingredientId: row.ingredientId,
        ingredientName: row.ingredientName ?? 'Unknown',
        quantity: row.quantity,
        unit: row.unit as RecipeIngredientDetail['unit'],
        nutrition: nutritionData ? nutrition : null,
      };
    },
  );

  const nutritionItems = ingredientRows.map(row => ({
    nutrition: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
    },
    quantity: row.quantity,
  }));
  const totalNutrition: NutritionInfo | null = nutritionItems.some(
    i => i.nutrition.calories != null || i.nutrition.protein != null,
  )
    ? computeRecipeNutrition(nutritionItems)
    : null;

  return {
    id: recipe.id,
    householdId: recipe.householdId,
    name: recipe.name,
    description: recipe.description,
    source: recipe.source,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    batchSize: recipe.batchSize,
    createdBy: recipe.createdBy,
    instructions: instructionRows.map(r => ({
      id: r.id,
      recipeId: r.recipeId,
      stepNumber: r.stepNumber,
      text: r.text,
    })),
    ingredients: enrichedIngredients,
    tags: tagRows.map(r => r.name),
    nutrition: totalNutrition,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

// ─── CRUD ────────────────────────────────────────────────────

export async function createRecipe(
  householdId: number,
  userId: number,
  data: CreateRecipeInput,
): Promise<RecipeDetail> {
  // Validate ingredient IDs belong to household
  if (data.ingredients && data.ingredients.length > 0) {
    const ingredientIds = data.ingredients.map(i => i.ingredientId);
    const found = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(
        and(
          inArray(ingredients.id, ingredientIds),
          eq(ingredients.householdId, householdId),
          isNull(ingredients.deletedAt),
        ),
      );
    if (found.length !== ingredientIds.length) {
      throw new ValidationError(
        'One or more ingredients not found in this household',
      );
    }
  }

  const recipe = await db
    .insert(recipes)
    .values({
      householdId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      source: data.source?.trim() || null,
      prepTime: data.prepTime ?? null,
      cookTime: data.cookTime ?? null,
      batchSize: data.batchSize,
      createdBy: userId,
    })
    .returning({ id: recipes.id })
    .get();

  if (data.instructions && data.instructions.length > 0) {
    await db.insert(recipeInstructions).values(
      data.instructions.map((text, idx) => ({
        recipeId: recipe.id,
        stepNumber: idx + 1,
        text: text.trim(),
      })),
    );
  }

  if (data.ingredients && data.ingredients.length > 0) {
    await db.insert(recipeIngredients).values(
      data.ingredients.map(ing => ({
        recipeId: recipe.id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
    );
  }

  if (data.tags && data.tags.length > 0) {
    const tagIds = await resolveTagIds(householdId, data.tags);
    if (tagIds.length > 0) {
      await db
        .insert(recipeTagAssignments)
        .values(tagIds.map(tagId => ({ recipeId: recipe.id, tagId })));
    }
  }

  return buildRecipeDetail(householdId, recipe.id);
}

export async function listRecipes(
  householdId: number,
  filters?: { search?: string; tags?: string },
): Promise<RecipeSummary[]> {
  let query = db
    .select({
      id: recipes.id,
      name: recipes.name,
      description: recipes.description,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      batchSize: recipes.batchSize,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(and(eq(recipes.householdId, householdId), isNull(recipes.deletedAt)))
    .orderBy(recipes.name)
    .$dynamic();

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    query = query.where(
      and(
        eq(recipes.householdId, householdId),
        isNull(recipes.deletedAt),
        sql`LOWER(${recipes.name}) LIKE ${'%' + search + '%'}`,
      ),
    );
  }

  const rows = await query;

  // If tag filter is specified, filter recipes that have ALL specified tags
  let filteredIds: Set<number> | null = null;
  if (filters?.tags) {
    const tagNames = filters.tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
    if (tagNames.length > 0) {
      const recipeIds = rows.map(r => r.id);
      if (recipeIds.length === 0) return [];

      const assignments = await db
        .select({
          recipeId: recipeTagAssignments.recipeId,
          tagName: recipeTags.name,
        })
        .from(recipeTagAssignments)
        .innerJoin(recipeTags, eq(recipeTagAssignments.tagId, recipeTags.id))
        .where(
          and(
            inArray(recipeTagAssignments.recipeId, recipeIds),
            inArray(recipeTags.name, tagNames),
          ),
        );

      // Group by recipe and check all tags present
      const recipeTagMap = new Map<number, Set<string>>();
      for (const a of assignments) {
        if (!recipeTagMap.has(a.recipeId))
          recipeTagMap.set(a.recipeId, new Set());
        recipeTagMap.get(a.recipeId)!.add(a.tagName);
      }
      filteredIds = new Set<number>();
      for (const [recipeId, tags] of recipeTagMap) {
        if (tagNames.every(t => tags.has(t))) filteredIds.add(recipeId);
      }
    }
  }

  const filteredRows =
    filteredIds != null ? rows.filter(r => filteredIds!.has(r.id)) : rows;

  // Batch fetch tags for all recipes
  const recipeIds = filteredRows.map(r => r.id);
  const tagAssignments =
    recipeIds.length > 0
      ? await db
          .select({
            recipeId: recipeTagAssignments.recipeId,
            tagName: recipeTags.name,
          })
          .from(recipeTagAssignments)
          .innerJoin(recipeTags, eq(recipeTagAssignments.tagId, recipeTags.id))
          .where(inArray(recipeTagAssignments.recipeId, recipeIds))
      : [];

  const tagsByRecipe = new Map<number, string[]>();
  for (const a of tagAssignments) {
    if (!tagsByRecipe.has(a.recipeId)) tagsByRecipe.set(a.recipeId, []);
    tagsByRecipe.get(a.recipeId)!.push(a.tagName);
  }

  return filteredRows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    prepTime: r.prepTime,
    cookTime: r.cookTime,
    batchSize: r.batchSize,
    tags: tagsByRecipe.get(r.id) ?? [],
    createdAt: r.createdAt,
  }));
}

export async function getRecipe(
  householdId: number,
  recipeId: number,
): Promise<RecipeDetail> {
  return buildRecipeDetail(householdId, recipeId);
}

export async function updateRecipe(
  householdId: number,
  recipeId: number,
  data: UpdateRecipeInput,
): Promise<RecipeDetail> {
  const existing = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(
      and(
        eq(recipes.id, recipeId),
        eq(recipes.householdId, householdId),
        isNull(recipes.deletedAt),
      ),
    )
    .get();
  if (!existing) throw new NotFoundError('Recipe not found');

  // Update scalar fields
  const updates: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined)
    updates.description = data.description?.trim() || null;
  if (data.source !== undefined) updates.source = data.source?.trim() || null;
  if (data.prepTime !== undefined) updates.prepTime = data.prepTime;
  if (data.cookTime !== undefined) updates.cookTime = data.cookTime;
  if (data.batchSize !== undefined) updates.batchSize = data.batchSize;

  await db.update(recipes).set(updates).where(eq(recipes.id, recipeId));

  // Replace instructions if provided
  if (data.instructions !== undefined) {
    await db
      .delete(recipeInstructions)
      .where(eq(recipeInstructions.recipeId, recipeId));
    if (data.instructions.length > 0) {
      await db.insert(recipeInstructions).values(
        data.instructions.map((text, idx) => ({
          recipeId,
          stepNumber: idx + 1,
          text: text.trim(),
        })),
      );
    }
  }

  // Replace ingredients if provided
  if (data.ingredients !== undefined) {
    if (data.ingredients.length > 0) {
      const ingredientIds = data.ingredients.map(i => i.ingredientId);
      const found = await db
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(
          and(
            inArray(ingredients.id, ingredientIds),
            eq(ingredients.householdId, householdId),
            isNull(ingredients.deletedAt),
          ),
        );
      if (found.length !== ingredientIds.length) {
        throw new ValidationError(
          'One or more ingredients not found in this household',
        );
      }
    }
    await db
      .delete(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));
    if (data.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        data.ingredients.map(ing => ({
          recipeId,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      );
    }
  }

  // Replace tags if provided
  if (data.tags !== undefined) {
    await db
      .delete(recipeTagAssignments)
      .where(eq(recipeTagAssignments.recipeId, recipeId));
    if (data.tags.length > 0) {
      const tagIds = await resolveTagIds(householdId, data.tags);
      if (tagIds.length > 0) {
        await db
          .insert(recipeTagAssignments)
          .values(tagIds.map(tagId => ({ recipeId, tagId })));
      }
    }
  }

  return buildRecipeDetail(householdId, recipeId);
}

export async function deleteRecipe(
  householdId: number,
  recipeId: number,
): Promise<void> {
  const existing = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(
      and(
        eq(recipes.id, recipeId),
        eq(recipes.householdId, householdId),
        isNull(recipes.deletedAt),
      ),
    )
    .get();
  if (!existing) throw new NotFoundError('Recipe not found');

  await db
    .update(recipes)
    .set({ deletedAt: sql`(datetime('now'))` })
    .where(eq(recipes.id, recipeId));
}

export async function duplicateRecipe(
  householdId: number,
  userId: number,
  recipeId: number,
): Promise<RecipeDetail> {
  const source = await buildRecipeDetail(householdId, recipeId);

  const newRecipe = await db
    .insert(recipes)
    .values({
      householdId,
      name: `${source.name} (copy)`,
      description: source.description,
      source: source.source,
      prepTime: source.prepTime,
      cookTime: source.cookTime,
      batchSize: source.batchSize,
      createdBy: userId,
    })
    .returning({ id: recipes.id })
    .get();

  if (source.instructions.length > 0) {
    await db.insert(recipeInstructions).values(
      source.instructions.map(instr => ({
        recipeId: newRecipe.id,
        stepNumber: instr.stepNumber,
        text: instr.text,
      })),
    );
  }

  if (source.ingredients.length > 0) {
    await db.insert(recipeIngredients).values(
      source.ingredients.map(ing => ({
        recipeId: newRecipe.id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
    );
  }

  if (source.tags.length > 0) {
    const tagIds = await resolveTagIds(householdId, source.tags);
    if (tagIds.length > 0) {
      await db
        .insert(recipeTagAssignments)
        .values(tagIds.map(tagId => ({ recipeId: newRecipe.id, tagId })));
    }
  }

  return buildRecipeDetail(householdId, newRecipe.id);
}

export async function listTags(householdId: number): Promise<TagWithCount[]> {
  const rows = await db
    .select({
      id: recipeTags.id,
      name: recipeTags.name,
      recipeCount: sql<number>`COUNT(${recipeTagAssignments.recipeId})`,
    })
    .from(recipeTags)
    .leftJoin(
      recipeTagAssignments,
      eq(recipeTags.id, recipeTagAssignments.tagId),
    )
    .where(eq(recipeTags.householdId, householdId))
    .groupBy(recipeTags.id, recipeTags.name);

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    recipeCount: Number(r.recipeCount),
  }));
}
