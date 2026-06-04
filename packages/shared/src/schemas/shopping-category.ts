import { Type, type Static } from '@sinclair/typebox';

export const CreateCategorySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
});
export type CreateCategoryInput = Static<typeof CreateCategorySchema>;

export const UpdateCategorySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  sortOrder: Type.Optional(Type.Integer()),
});
export type UpdateCategoryInput = Static<typeof UpdateCategorySchema>;

export const ReorderCategoriesSchema = Type.Object({
  orderedIds: Type.Array(Type.Integer(), { minItems: 1 }),
});
export type ReorderCategoriesInput = Static<typeof ReorderCategoriesSchema>;

export const ShoppingCategorySchema = Type.Object({
  id: Type.Integer(),
  householdId: Type.Integer(),
  name: Type.String(),
  sortOrder: Type.Integer(),
  isDefault: Type.Boolean(),
  createdAt: Type.String(),
});
export type ShoppingCategoryResponse = Static<typeof ShoppingCategorySchema>;
