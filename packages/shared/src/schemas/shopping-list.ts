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

// ─── Request schemas ──────────────────────────────────────────

export const AddRecipeToListSchema = Type.Object({
  recipeId: Type.Integer({ minimum: 1 }),
  targetBatchSize: Type.Integer({ minimum: 1 }),
});
export type AddRecipeToListInput = Static<typeof AddRecipeToListSchema>;

export const AddIngredientToListSchema = Type.Object({
  ingredientId: Type.Integer({ minimum: 1 }),
  quantity: Type.Number({ exclusiveMinimum: 0 }),
  unit: UnitEnum,
});

export const UpdateItemQuantitySchema = Type.Object({
  quantity: Type.Number({ exclusiveMinimum: 0 }),
});
export type UpdateItemQuantityInput = Static<typeof UpdateItemQuantitySchema>;

// ─── Response schemas ─────────────────────────────────────────

export const ShoppingListItemEnrichedSchema = Type.Object({
  id: Type.Integer(),
  householdId: Type.Integer(),
  ingredientId: Type.Integer(),
  ingredientName: Type.String(),
  ingredientDefaultUnit: Type.String(),
  categoryId: Type.Union([Type.Integer(), Type.Null()]),
  categoryName: Type.Union([Type.String(), Type.Null()]),
  categorySortOrder: Type.Union([Type.Integer(), Type.Null()]),
  quantity: Type.Number(),
  unit: Type.String(),
  tickedOff: Type.Boolean(),
  haveThis: Type.Boolean(),
  createdAt: Type.String(),
});
export type ShoppingListItemEnrichedResponse = Static<
  typeof ShoppingListItemEnrichedSchema
>;

export const ShoppingListGroupSchema = Type.Object({
  categoryId: Type.Union([Type.Integer(), Type.Null()]),
  categoryName: Type.Union([Type.String(), Type.Null()]),
  sortOrder: Type.Number(),
  items: Type.Array(ShoppingListItemEnrichedSchema),
});

export const ShoppingListResponseSchema = Type.Object({
  groups: Type.Array(ShoppingListGroupSchema),
  totalItems: Type.Integer(),
});
export type ShoppingListResponseBody = Static<
  typeof ShoppingListResponseSchema
>;
