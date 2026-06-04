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

export const CreateIngredientSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 200 }),
  defaultUnit: UnitEnum,
  calories: Type.Optional(Type.Number({ minimum: 0 })),
  protein: Type.Optional(Type.Number({ minimum: 0 })),
  carbs: Type.Optional(Type.Number({ minimum: 0 })),
  fat: Type.Optional(Type.Number({ minimum: 0 })),
  categoryId: Type.Optional(Type.Integer()),
});
export type CreateIngredientInput = Static<typeof CreateIngredientSchema>;

export const UpdateIngredientSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  defaultUnit: Type.Optional(UnitEnum),
  calories: Type.Optional(
    Type.Union([Type.Number({ minimum: 0 }), Type.Null()]),
  ),
  protein: Type.Optional(
    Type.Union([Type.Number({ minimum: 0 }), Type.Null()]),
  ),
  carbs: Type.Optional(Type.Union([Type.Number({ minimum: 0 }), Type.Null()])),
  fat: Type.Optional(Type.Union([Type.Number({ minimum: 0 }), Type.Null()])),
  categoryId: Type.Optional(Type.Union([Type.Integer(), Type.Null()])),
});
export type UpdateIngredientInput = Static<typeof UpdateIngredientSchema>;

export const IngredientSchema = Type.Object({
  id: Type.Integer(),
  householdId: Type.Integer(),
  name: Type.String(),
  defaultUnit: UnitEnum,
  calories: Type.Union([Type.Number(), Type.Null()]),
  protein: Type.Union([Type.Number(), Type.Null()]),
  carbs: Type.Union([Type.Number(), Type.Null()]),
  fat: Type.Union([Type.Number(), Type.Null()]),
  categoryId: Type.Union([Type.Integer(), Type.Null()]),
  categoryName: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});
export type IngredientResponse = Static<typeof IngredientSchema>;

export const OFFSearchResultSchema = Type.Object({
  name: Type.String(),
  calories: Type.Union([Type.Number(), Type.Null()]),
  protein: Type.Union([Type.Number(), Type.Null()]),
  carbs: Type.Union([Type.Number(), Type.Null()]),
  fat: Type.Union([Type.Number(), Type.Null()]),
});
export type OFFSearchResult = Static<typeof OFFSearchResultSchema>;
