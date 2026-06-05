import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type {
  CancelQueuedCookResult,
  CookEventDetail,
  CookModePayload,
  CooksDashboardResponse,
  FinishQueuedCookResult,
  QueuedCookDetail,
  QueuedCookIngredientDetail,
  QueuedCookSummary,
} from '@bigbatch/shared';
import { db } from '../../db/client.js';
import {
  cookEvents,
  ingredients,
  queuedCookIngredients,
  queuedCooks,
  recipeIngredients,
  recipeInstructions,
  recipes,
  shoppingListItems,
  users,
} from '../../db/schema.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../core/errors.js';
import {
  buildShoppingLookup,
  deriveQueuedCookProgress,
  quantitiesMatch,
  rescaleRequiredQuantity,
} from './cook-events.logic.js';

type QueuedCookBaseRow = {
  id: number;
  householdId: number;
  recipeId: number;
  recipeName: string;
  createdBy: number;
  createdByName: string;
  recipeBatchSizeSnapshot: number;
  selectedBatchSize: number;
  createdAt: string;
};

type QueuedCookIngredientRow = {
  id: number;
  queuedCookId: number;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  baseQuantity: number;
  requiredQuantity: number;
};

type ShoppingCleanupSummary = CancelQueuedCookResult['shoppingCleanup'];
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function validateCalendarDate(date: string): void {
  if (Number.isNaN(Date.parse(date))) {
    throw new ValidationError('Date must be a valid calendar date');
  }
}

async function fetchActiveRecipe(householdId: number, recipeId: number) {
  const recipe = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      batchSize: recipes.batchSize,
    })
    .from(recipes)
    .where(
      and(
        eq(recipes.id, recipeId),
        eq(recipes.householdId, householdId),
        isNull(recipes.deletedAt),
      ),
    )
    .get();

  if (!recipe) {
    throw new NotFoundError('Recipe not found');
  }

  return recipe;
}

async function fetchQueuedCookBaseRows(
  householdId: number,
  queuedCookIds?: number[],
): Promise<QueuedCookBaseRow[]> {
  let query = db
    .select({
      id: queuedCooks.id,
      householdId: queuedCooks.householdId,
      recipeId: queuedCooks.recipeId,
      recipeName: recipes.name,
      createdBy: queuedCooks.createdBy,
      createdByFirstName: users.firstName,
      createdByLastName: users.lastName,
      recipeBatchSizeSnapshot: queuedCooks.recipeBatchSizeSnapshot,
      selectedBatchSize: queuedCooks.selectedBatchSize,
      createdAt: queuedCooks.createdAt,
    })
    .from(queuedCooks)
    .innerJoin(recipes, eq(queuedCooks.recipeId, recipes.id))
    .innerJoin(users, eq(queuedCooks.createdBy, users.id))
    .where(eq(queuedCooks.householdId, householdId))
    .orderBy(desc(queuedCooks.createdAt))
    .$dynamic();

  if (queuedCookIds && queuedCookIds.length > 0) {
    query = query.where(
      and(
        eq(queuedCooks.householdId, householdId),
        inArray(queuedCooks.id, queuedCookIds),
      ),
    );
  }

  const rows = await query;

  return rows.map(row => ({
    id: row.id,
    householdId: row.householdId,
    recipeId: row.recipeId,
    recipeName: row.recipeName,
    createdBy: row.createdBy,
    createdByName: formatUserName(
      row.createdByFirstName,
      row.createdByLastName,
    ),
    recipeBatchSizeSnapshot: row.recipeBatchSizeSnapshot,
    selectedBatchSize: row.selectedBatchSize,
    createdAt: row.createdAt,
  }));
}

async function fetchQueuedCookIngredientRows(
  queuedCookIds: number[],
): Promise<QueuedCookIngredientRow[]> {
  if (queuedCookIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: queuedCookIngredients.id,
      queuedCookId: queuedCookIngredients.queuedCookId,
      ingredientId: queuedCookIngredients.ingredientId,
      ingredientName: ingredients.name,
      unit: queuedCookIngredients.unit,
      baseQuantity: queuedCookIngredients.baseQuantity,
      requiredQuantity: queuedCookIngredients.requiredQuantity,
    })
    .from(queuedCookIngredients)
    .innerJoin(
      ingredients,
      eq(queuedCookIngredients.ingredientId, ingredients.id),
    )
    .where(inArray(queuedCookIngredients.queuedCookId, queuedCookIds));
}

async function fetchRelevantShoppingRows(
  householdId: number,
  requirements: Array<{ ingredientId: number }>,
) {
  const ingredientIds = [
    ...new Set(requirements.map(item => item.ingredientId)),
  ];

  if (ingredientIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: shoppingListItems.id,
      ingredientId: shoppingListItems.ingredientId,
      quantity: shoppingListItems.quantity,
      unit: shoppingListItems.unit,
      tickedOff: shoppingListItems.tickedOff,
      haveThis: shoppingListItems.haveThis,
    })
    .from(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.householdId, householdId),
        inArray(shoppingListItems.ingredientId, ingredientIds),
      ),
    );
}

async function buildQueuedCookDetails(
  householdId: number,
  queuedCookIds?: number[],
): Promise<QueuedCookDetail[]> {
  const baseRows = await fetchQueuedCookBaseRows(householdId, queuedCookIds);

  if (baseRows.length === 0) {
    return [];
  }

  const ingredientRows = await fetchQueuedCookIngredientRows(
    baseRows.map(row => row.id),
  );
  const shoppingRows = await fetchRelevantShoppingRows(
    householdId,
    ingredientRows,
  );
  const shoppingLookup = buildShoppingLookup(shoppingRows);
  const ingredientsByQueuedCookId = new Map<
    number,
    QueuedCookIngredientRow[]
  >();

  for (const ingredientRow of ingredientRows) {
    const current =
      ingredientsByQueuedCookId.get(ingredientRow.queuedCookId) ?? [];
    current.push(ingredientRow);
    ingredientsByQueuedCookId.set(ingredientRow.queuedCookId, current);
  }

  return baseRows.map(row => {
    const queuedIngredients = ingredientsByQueuedCookId.get(row.id) ?? [];
    const progress = deriveQueuedCookProgress(
      queuedIngredients.map(ingredient => ({
        id: ingredient.id,
        ingredientId: ingredient.ingredientId,
        requiredQuantity: ingredient.requiredQuantity,
        unit: ingredient.unit,
      })),
      shoppingLookup,
    );

    const ingredients: QueuedCookIngredientDetail[] = queuedIngredients.map(
      ingredient => ({
        id: ingredient.id,
        ingredientId: ingredient.ingredientId,
        ingredientName: ingredient.ingredientName,
        unit: ingredient.unit,
        requiredQuantity: ingredient.requiredQuantity,
        isSatisfied:
          progress.satisfactionByRequirementId.get(ingredient.id) ?? false,
      }),
    );

    return {
      id: row.id,
      recipeId: row.recipeId,
      recipeName: row.recipeName,
      selectedBatchSize: row.selectedBatchSize,
      state: progress.state,
      requiredIngredientsCount: progress.requiredIngredientsCount,
      satisfiedIngredientsCount: progress.satisfiedIngredientsCount,
      createdBy: row.createdBy,
      createdByName: row.createdByName,
      createdAt: row.createdAt,
      ingredients,
    } satisfies QueuedCookDetail;
  });
}

async function getQueuedCookDetailOrThrow(
  householdId: number,
  queuedCookId: number,
): Promise<QueuedCookDetail> {
  const [queuedCook] = await buildQueuedCookDetails(householdId, [
    queuedCookId,
  ]);

  if (!queuedCook) {
    throw new NotFoundError('Queued cook not found');
  }

  return queuedCook;
}

async function getCookEventDetail(
  householdId: number,
  cookEventId: number,
): Promise<CookEventDetail> {
  const row = await db
    .select({
      id: cookEvents.id,
      recipeId: cookEvents.recipeId,
      userId: cookEvents.userId,
      recipeName: recipes.name,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      date: cookEvents.date,
      batchSize: cookEvents.batchSize,
      notes: cookEvents.notes,
      createdAt: cookEvents.createdAt,
      updatedAt: cookEvents.updatedAt,
      deletedAt: cookEvents.deletedAt,
    })
    .from(cookEvents)
    .innerJoin(recipes, eq(cookEvents.recipeId, recipes.id))
    .innerJoin(users, eq(cookEvents.userId, users.id))
    .where(
      and(eq(cookEvents.id, cookEventId), eq(recipes.householdId, householdId)),
    )
    .get();

  if (!row) {
    throw new NotFoundError('Cook event not found');
  }

  return {
    id: row.id,
    recipeId: row.recipeId,
    userId: row.userId,
    recipeName: row.recipeName,
    userDisplayName: formatUserName(row.userFirstName, row.userLastName),
    date: row.date,
    batchSize: row.batchSize,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

async function loadShoppingRow(
  householdId: number,
  ingredientId: number,
  unit: string,
  tx: DbExecutor = db,
) {
  return tx
    .select({
      id: shoppingListItems.id,
      quantity: shoppingListItems.quantity,
      ingredientId: shoppingListItems.ingredientId,
      unit: shoppingListItems.unit,
      tickedOff: shoppingListItems.tickedOff,
      haveThis: shoppingListItems.haveThis,
    })
    .from(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.householdId, householdId),
        eq(shoppingListItems.ingredientId, ingredientId),
        eq(shoppingListItems.unit, unit),
      ),
    )
    .get();
}

async function upsertShoppingQuantity(
  householdId: number,
  ingredientId: number,
  unit: string,
  quantity: number,
  tx: DbExecutor = db,
) {
  if (quantity <= 0) {
    return;
  }

  await tx
    .insert(shoppingListItems)
    .values({
      householdId,
      ingredientId,
      quantity,
      unit,
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

async function buildCleanupSummary(
  householdId: number,
  queuedCookId: number,
  removeShoppingItems: boolean,
  tx: DbExecutor = db,
): Promise<ShoppingCleanupSummary> {
  const summary: ShoppingCleanupSummary = {
    removedItemIds: [],
    retainedSharedItemIds: [],
  };

  if (!removeShoppingItems) {
    return summary;
  }

  const requirements = await tx
    .select({
      ingredientId: queuedCookIngredients.ingredientId,
      requiredQuantity: queuedCookIngredients.requiredQuantity,
      unit: queuedCookIngredients.unit,
    })
    .from(queuedCookIngredients)
    .where(eq(queuedCookIngredients.queuedCookId, queuedCookId));

  for (const requirement of requirements) {
    const shoppingRow = await loadShoppingRow(
      householdId,
      requirement.ingredientId,
      requirement.unit,
      tx,
    );

    if (!shoppingRow) {
      continue;
    }

    if (quantitiesMatch(shoppingRow.quantity, requirement.requiredQuantity)) {
      await tx
        .delete(shoppingListItems)
        .where(eq(shoppingListItems.id, shoppingRow.id));
      summary.removedItemIds.push(shoppingRow.id);
      continue;
    }

    if (shoppingRow.quantity > requirement.requiredQuantity) {
      summary.retainedSharedItemIds.push(shoppingRow.id);
    }
  }

  return summary;
}

export async function createQueuedCook(
  householdId: number,
  userId: number,
  recipeId: number,
  targetBatchSize: number,
): Promise<QueuedCookDetail> {
  if (targetBatchSize < 1) {
    throw new ValidationError('Target batch size must be at least 1');
  }

  const recipe = await fetchActiveRecipe(householdId, recipeId);
  const ingredientRows = await db
    .select({
      ingredientId: recipeIngredients.ingredientId,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
    })
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipeId));

  if (ingredientRows.length === 0) {
    throw new ConflictError('Recipe has no ingredients and cannot be queued');
  }

  const queuedCookId = await db.transaction(async tx => {
    const queuedCook = await tx
      .insert(queuedCooks)
      .values({
        householdId,
        recipeId,
        createdBy: userId,
        recipeBatchSizeSnapshot: recipe.batchSize,
        selectedBatchSize: targetBatchSize,
      })
      .returning({ id: queuedCooks.id })
      .get();

    await tx.insert(queuedCookIngredients).values(
      ingredientRows.map(ingredient => ({
        queuedCookId: queuedCook.id,
        ingredientId: ingredient.ingredientId,
        unit: ingredient.unit,
        baseQuantity: ingredient.quantity,
        requiredQuantity: rescaleRequiredQuantity(
          ingredient.quantity,
          recipe.batchSize,
          targetBatchSize,
        ),
      })),
    );

    for (const ingredient of ingredientRows) {
      await upsertShoppingQuantity(
        householdId,
        ingredient.ingredientId,
        ingredient.unit,
        rescaleRequiredQuantity(
          ingredient.quantity,
          recipe.batchSize,
          targetBatchSize,
        ),
        tx,
      );
    }

    return queuedCook.id;
  });

  return getQueuedCookDetailOrThrow(householdId, queuedCookId);
}

export async function listCooksDashboard(
  householdId: number,
): Promise<CooksDashboardResponse> {
  const queueDetails = await buildQueuedCookDetails(householdId);
  const historyRows = await db
    .select({
      id: cookEvents.id,
      recipeId: cookEvents.recipeId,
      userId: cookEvents.userId,
      recipeName: recipes.name,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      date: cookEvents.date,
      batchSize: cookEvents.batchSize,
      notes: cookEvents.notes,
      createdAt: cookEvents.createdAt,
      updatedAt: cookEvents.updatedAt,
      deletedAt: cookEvents.deletedAt,
    })
    .from(cookEvents)
    .innerJoin(recipes, eq(cookEvents.recipeId, recipes.id))
    .innerJoin(users, eq(cookEvents.userId, users.id))
    .where(
      and(eq(recipes.householdId, householdId), isNull(cookEvents.deletedAt)),
    )
    .orderBy(desc(cookEvents.date), desc(cookEvents.createdAt));

  return {
    queue: queueDetails.map(
      detail =>
        ({
          id: detail.id,
          recipeId: detail.recipeId,
          recipeName: detail.recipeName,
          selectedBatchSize: detail.selectedBatchSize,
          state: detail.state,
          requiredIngredientsCount: detail.requiredIngredientsCount,
          satisfiedIngredientsCount: detail.satisfiedIngredientsCount,
          createdBy: detail.createdBy,
          createdByName: detail.createdByName,
          createdAt: detail.createdAt,
        }) satisfies QueuedCookSummary,
    ),
    history: historyRows.map(
      row =>
        ({
          id: row.id,
          recipeId: row.recipeId,
          userId: row.userId,
          recipeName: row.recipeName,
          userDisplayName: formatUserName(row.userFirstName, row.userLastName),
          date: row.date,
          batchSize: row.batchSize,
          notes: row.notes,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          deletedAt: row.deletedAt,
        }) satisfies CookEventDetail,
    ),
  };
}

export async function updateQueuedCookBatchSize(
  householdId: number,
  queuedCookId: number,
  targetBatchSize: number,
): Promise<QueuedCookDetail> {
  if (targetBatchSize < 1) {
    throw new ValidationError('Target batch size must be at least 1');
  }

  const queuedCook = await getQueuedCookDetailOrThrow(
    householdId,
    queuedCookId,
  );

  if (queuedCook.state !== 'gatheringIngredients') {
    throw new ConflictError(
      'Batch size can only be edited while gathering ingredients',
    );
  }

  const queuedCookRow = await db
    .select({ recipeBatchSizeSnapshot: queuedCooks.recipeBatchSizeSnapshot })
    .from(queuedCooks)
    .where(
      and(
        eq(queuedCooks.id, queuedCookId),
        eq(queuedCooks.householdId, householdId),
      ),
    )
    .get();

  if (!queuedCookRow) {
    throw new NotFoundError('Queued cook not found');
  }

  await db.transaction(async tx => {
    const currentIngredients = await tx
      .select({
        id: queuedCookIngredients.id,
        ingredientId: queuedCookIngredients.ingredientId,
        unit: queuedCookIngredients.unit,
        baseQuantity: queuedCookIngredients.baseQuantity,
        requiredQuantity: queuedCookIngredients.requiredQuantity,
      })
      .from(queuedCookIngredients)
      .where(eq(queuedCookIngredients.queuedCookId, queuedCookId));

    for (const ingredient of currentIngredients) {
      const nextRequiredQuantity = rescaleRequiredQuantity(
        ingredient.baseQuantity,
        queuedCookRow.recipeBatchSizeSnapshot,
        targetBatchSize,
      );
      const delta = nextRequiredQuantity - ingredient.requiredQuantity;

      if (delta > 0) {
        await upsertShoppingQuantity(
          householdId,
          ingredient.ingredientId,
          ingredient.unit,
          delta,
          tx,
        );
      } else if (delta < 0) {
        const shoppingRow = await loadShoppingRow(
          householdId,
          ingredient.ingredientId,
          ingredient.unit,
          tx,
        );

        if (shoppingRow) {
          const nextQuantity = Math.max(0, shoppingRow.quantity + delta);

          if (nextQuantity <= 0) {
            await tx
              .delete(shoppingListItems)
              .where(eq(shoppingListItems.id, shoppingRow.id));
          } else {
            await tx
              .update(shoppingListItems)
              .set({ quantity: nextQuantity })
              .where(eq(shoppingListItems.id, shoppingRow.id));
          }
        }
      }

      await tx
        .update(queuedCookIngredients)
        .set({ requiredQuantity: nextRequiredQuantity })
        .where(eq(queuedCookIngredients.id, ingredient.id));
    }

    await tx
      .update(queuedCooks)
      .set({
        selectedBatchSize: targetBatchSize,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(queuedCooks.id, queuedCookId));
  });

  return getQueuedCookDetailOrThrow(householdId, queuedCookId);
}

export async function cancelQueuedCook(
  householdId: number,
  queuedCookId: number,
  removeShoppingItems: boolean,
): Promise<CancelQueuedCookResult> {
  await getQueuedCookDetailOrThrow(householdId, queuedCookId);

  const shoppingCleanup = await db.transaction(async tx => {
    const cleanup = await buildCleanupSummary(
      householdId,
      queuedCookId,
      removeShoppingItems,
      tx,
    );

    await tx.delete(queuedCooks).where(eq(queuedCooks.id, queuedCookId));
    return cleanup;
  });

  return {
    removedFromQueue: true,
    shoppingCleanup,
  };
}

export async function getQueuedCookCookMode(
  householdId: number,
  queuedCookId: number,
): Promise<CookModePayload> {
  const queuedCook = await getQueuedCookDetailOrThrow(
    householdId,
    queuedCookId,
  );

  if (queuedCook.state !== 'readyToCook') {
    throw new ConflictError('Queued cook is not ready to cook');
  }

  const instructions = await db
    .select({
      id: recipeInstructions.id,
      stepNumber: recipeInstructions.stepNumber,
      text: recipeInstructions.text,
    })
    .from(recipeInstructions)
    .where(eq(recipeInstructions.recipeId, queuedCook.recipeId))
    .orderBy(recipeInstructions.stepNumber);

  return {
    queuedCookId: queuedCook.id,
    recipeId: queuedCook.recipeId,
    recipeName: queuedCook.recipeName,
    selectedBatchSize: queuedCook.selectedBatchSize,
    ingredients: queuedCook.ingredients,
    instructions,
  };
}

export async function finishQueuedCook(
  householdId: number,
  queuedCookId: number,
  userId: number,
): Promise<FinishQueuedCookResult> {
  const queuedCook = await getQueuedCookDetailOrThrow(
    householdId,
    queuedCookId,
  );

  if (queuedCook.state !== 'readyToCook') {
    throw new ConflictError('Queued cook is not ready to cook');
  }

  const result = await db.transaction(async tx => {
    const insertedCookEvent = await tx
      .insert(cookEvents)
      .values({
        recipeId: queuedCook.recipeId,
        userId,
        date: new Date().toISOString().slice(0, 10),
        batchSize: queuedCook.selectedBatchSize,
        notes: null,
      })
      .returning({ id: cookEvents.id })
      .get();

    const shoppingCleanup = await buildCleanupSummary(
      householdId,
      queuedCookId,
      true,
      tx,
    );

    await tx.delete(queuedCooks).where(eq(queuedCooks.id, queuedCookId));

    return {
      cookEventId: insertedCookEvent.id,
      shoppingCleanup,
    };
  });

  return {
    cookEvent: await getCookEventDetail(householdId, result.cookEventId),
    shoppingCleanup: result.shoppingCleanup,
  };
}

export async function getRecipeCookHistory(
  householdId: number,
  recipeId: number,
): Promise<CookEventDetail[]> {
  await fetchActiveRecipe(householdId, recipeId);

  const rows = await db
    .select({
      id: cookEvents.id,
      recipeId: cookEvents.recipeId,
      userId: cookEvents.userId,
      recipeName: recipes.name,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      date: cookEvents.date,
      batchSize: cookEvents.batchSize,
      notes: cookEvents.notes,
      createdAt: cookEvents.createdAt,
      updatedAt: cookEvents.updatedAt,
      deletedAt: cookEvents.deletedAt,
    })
    .from(cookEvents)
    .innerJoin(recipes, eq(cookEvents.recipeId, recipes.id))
    .innerJoin(users, eq(cookEvents.userId, users.id))
    .where(
      and(
        eq(recipes.householdId, householdId),
        eq(cookEvents.recipeId, recipeId),
        isNull(cookEvents.deletedAt),
      ),
    )
    .orderBy(desc(cookEvents.date), desc(cookEvents.createdAt));

  return rows.map(row => ({
    id: row.id,
    recipeId: row.recipeId,
    userId: row.userId,
    recipeName: row.recipeName,
    userDisplayName: formatUserName(row.userFirstName, row.userLastName),
    date: row.date,
    batchSize: row.batchSize,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }));
}

export async function updateCookEvent(
  householdId: number,
  cookEventId: number,
  input: { date?: string; notes?: string | null },
): Promise<CookEventDetail> {
  await getCookEventDetail(householdId, cookEventId);

  if (input.date != null) {
    validateCalendarDate(input.date);
  }

  const updates: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };

  if (input.date != null) {
    updates.date = input.date;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'notes')) {
    updates.notes = input.notes?.trim() ? input.notes.trim() : null;
  }

  await db
    .update(cookEvents)
    .set(updates)
    .where(eq(cookEvents.id, cookEventId));

  return getCookEventDetail(householdId, cookEventId);
}
