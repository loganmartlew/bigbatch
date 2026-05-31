import { eq, and, count, sql, max } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { shoppingCategories, ingredients } from '../../db/schema.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../core/errors.js';
import type { UpdateCategoryInput } from '@bigbatch/shared';

export async function listCategories(householdId: number) {
  return db
    .select()
    .from(shoppingCategories)
    .where(eq(shoppingCategories.householdId, householdId))
    .orderBy(shoppingCategories.sortOrder);
}

export async function createCategory(householdId: number, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new ValidationError('Category name must be 1–100 characters');
  }

  // Get next sort order
  const [maxRow] = await db
    .select({ maxOrder: max(shoppingCategories.sortOrder) })
    .from(shoppingCategories)
    .where(eq(shoppingCategories.householdId, householdId));

  const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

  try {
    const [category] = await db
      .insert(shoppingCategories)
      .values({
        householdId,
        name: trimmed,
        sortOrder: nextOrder,
        isDefault: false,
      })
      .returning();

    return category!;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('UNIQUE constraint failed')
    ) {
      throw new ConflictError('A category with this name already exists');
    }
    throw err;
  }
}

export async function updateCategory(
  householdId: number,
  categoryId: number,
  data: UpdateCategoryInput,
) {
  const [existing] = await db
    .select()
    .from(shoppingCategories)
    .where(
      and(
        eq(shoppingCategories.id, categoryId),
        eq(shoppingCategories.householdId, householdId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Category not found');
  }

  if (existing.isDefault && data.name != null) {
    throw new ForbiddenError('Cannot rename default categories');
  }

  const updateValues: Record<string, unknown> = {};
  if (data.name != null) updateValues.name = data.name.trim();
  if (data.sortOrder != null) updateValues.sortOrder = data.sortOrder;

  if (Object.keys(updateValues).length === 0) {
    return existing;
  }

  try {
    await db
      .update(shoppingCategories)
      .set(updateValues)
      .where(eq(shoppingCategories.id, categoryId));
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('UNIQUE constraint failed')
    ) {
      throw new ConflictError('A category with this name already exists');
    }
    throw err;
  }

  const [updated] = await db
    .select()
    .from(shoppingCategories)
    .where(eq(shoppingCategories.id, categoryId))
    .limit(1);

  return updated!;
}

export async function deleteCategory(householdId: number, categoryId: number) {
  const [existing] = await db
    .select()
    .from(shoppingCategories)
    .where(
      and(
        eq(shoppingCategories.id, categoryId),
        eq(shoppingCategories.householdId, householdId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Category not found');
  }

  if (existing.isDefault) {
    throw new ForbiddenError('Cannot delete default categories');
  }

  // Check if any active ingredients use this category
  const [usage] = await db
    .select({ total: count() })
    .from(ingredients)
    .where(
      and(
        eq(ingredients.categoryId, categoryId),
        sql`${ingredients.deletedAt} IS NULL`,
      ),
    );

  if (usage && usage.total > 0) {
    throw new ConflictError(
      `Category has ${usage.total} ingredient(s) assigned; reassign them first`,
    );
  }

  await db
    .delete(shoppingCategories)
    .where(eq(shoppingCategories.id, categoryId));
}

export async function reorderCategories(
  householdId: number,
  orderedIds: number[],
) {
  // Validate all IDs belong to the household
  const existing = await db
    .select({ id: shoppingCategories.id })
    .from(shoppingCategories)
    .where(eq(shoppingCategories.householdId, householdId));

  const existingIds = new Set(existing.map(c => c.id));
  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new ValidationError(
        `Category ${id} does not belong to this household`,
      );
    }
  }

  // Batch update sort orders
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(shoppingCategories)
      .set({ sortOrder: i + 1 })
      .where(eq(shoppingCategories.id, orderedIds[i]!));
  }
}
