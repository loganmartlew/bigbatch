import { Type, type Static } from '@sinclair/typebox';

const UnitEnum = Type.Union([
  Type.Literal('g'),
  Type.Literal('kg'),
  Type.Literal('ml'),
  Type.Literal('l'),
  Type.Literal('tbsp'),
  Type.Literal('tsp'),
  Type.Literal('cup'),
  Type.Literal('item'),
]);

export const QueuedCookStateSchema = Type.Union([
  Type.Literal('gatheringIngredients'),
  Type.Literal('readyToCook'),
]);
export type QueuedCookStateValue = Static<typeof QueuedCookStateSchema>;

export const CreateQueuedCookSchema = Type.Object({
  targetBatchSize: Type.Integer({ minimum: 1 }),
});
export type CreateQueuedCookInput = Static<typeof CreateQueuedCookSchema>;

export const UpdateQueuedCookBatchSizeSchema = Type.Object({
  targetBatchSize: Type.Integer({ minimum: 1 }),
});
export type UpdateQueuedCookBatchSizeInput = Static<
  typeof UpdateQueuedCookBatchSizeSchema
>;

export const CancelQueuedCookSchema = Type.Object({
  removeShoppingItems: Type.Boolean(),
});
export type CancelQueuedCookInput = Static<typeof CancelQueuedCookSchema>;

export const UpdateCookEventSchema = Type.Object({
  date: Type.Optional(Type.String({ minLength: 1, maxLength: 40 })),
  notes: Type.Optional(
    Type.Union([Type.String({ maxLength: 2000 }), Type.Null()]),
  ),
});
export type UpdateCookEventInput = Static<typeof UpdateCookEventSchema>;

export const QueuedCookIngredientDetailSchema = Type.Object({
  id: Type.Integer(),
  ingredientId: Type.Integer(),
  ingredientName: Type.String(),
  unit: UnitEnum,
  requiredQuantity: Type.Number(),
  isSatisfied: Type.Boolean(),
});

export const QueuedCookSummarySchema = Type.Object({
  id: Type.Integer(),
  recipeId: Type.Integer(),
  recipeName: Type.String(),
  selectedBatchSize: Type.Integer(),
  state: QueuedCookStateSchema,
  requiredIngredientsCount: Type.Integer(),
  satisfiedIngredientsCount: Type.Integer(),
  createdBy: Type.Integer(),
  createdByName: Type.String(),
  createdAt: Type.String(),
});

export const QueuedCookDetailSchema = Type.Composite([
  QueuedCookSummarySchema,
  Type.Object({
    ingredients: Type.Array(QueuedCookIngredientDetailSchema),
  }),
]);

export const CookEventDetailSchema = Type.Object({
  id: Type.Integer(),
  recipeId: Type.Integer(),
  userId: Type.Integer(),
  recipeName: Type.String(),
  userDisplayName: Type.String(),
  date: Type.String(),
  batchSize: Type.Integer(),
  notes: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  deletedAt: Type.Union([Type.String(), Type.Null()]),
});

export const CooksDashboardResponseSchema = Type.Object({
  queue: Type.Array(QueuedCookSummarySchema),
  history: Type.Array(CookEventDetailSchema),
});

export const ShoppingCleanupSummarySchema = Type.Object({
  removedItemIds: Type.Array(Type.Integer()),
  retainedSharedItemIds: Type.Array(Type.Integer()),
});

export const CancelQueuedCookResultSchema = Type.Object({
  removedFromQueue: Type.Literal(true),
  shoppingCleanup: ShoppingCleanupSummarySchema,
});

export const FinishQueuedCookResultSchema = Type.Object({
  cookEvent: CookEventDetailSchema,
  shoppingCleanup: ShoppingCleanupSummarySchema,
});

export const CookModeStepSchema = Type.Object({
  id: Type.Integer(),
  stepNumber: Type.Integer(),
  text: Type.String(),
});

export const CookModePayloadSchema = Type.Object({
  queuedCookId: Type.Integer(),
  recipeId: Type.Integer(),
  recipeName: Type.String(),
  selectedBatchSize: Type.Integer(),
  ingredients: Type.Array(QueuedCookIngredientDetailSchema),
  instructions: Type.Array(CookModeStepSchema),
});
