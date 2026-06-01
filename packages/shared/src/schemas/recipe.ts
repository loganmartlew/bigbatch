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

const RecipeIngredientInput = Type.Object({
  ingredientId: Type.Integer(),
  quantity: Type.Number({ exclusiveMinimum: 0 }),
  unit: UnitEnum,
});

export const CreateRecipeSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 2000 })),
  source: Type.Optional(Type.String({ maxLength: 500 })),
  prepTime: Type.Optional(Type.Integer({ minimum: 0 })),
  cookTime: Type.Optional(Type.Integer({ minimum: 0 })),
  batchSize: Type.Integer({ minimum: 1 }),
  instructions: Type.Optional(
    Type.Array(Type.String({ minLength: 1, maxLength: 2000 })),
  ),
  ingredients: Type.Optional(Type.Array(RecipeIngredientInput)),
  tags: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 50 }))),
});
export type CreateRecipeInput = Static<typeof CreateRecipeSchema>;

export const UpdateRecipeSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  description: Type.Optional(
    Type.Union([Type.String({ maxLength: 2000 }), Type.Null()]),
  ),
  source: Type.Optional(
    Type.Union([Type.String({ maxLength: 500 }), Type.Null()]),
  ),
  prepTime: Type.Optional(
    Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  ),
  cookTime: Type.Optional(
    Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  ),
  batchSize: Type.Optional(Type.Integer({ minimum: 1 })),
  instructions: Type.Optional(
    Type.Array(Type.String({ minLength: 1, maxLength: 2000 })),
  ),
  ingredients: Type.Optional(Type.Array(RecipeIngredientInput)),
  tags: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 50 }))),
});
export type UpdateRecipeInput = Static<typeof UpdateRecipeSchema>;

export const RecipeFiltersSchema = Type.Object({
  search: Type.Optional(Type.String()),
  tags: Type.Optional(Type.String()),
});
export type RecipeFilters = Static<typeof RecipeFiltersSchema>;
