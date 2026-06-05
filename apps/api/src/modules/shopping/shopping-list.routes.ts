import type { FastifyInstance } from 'fastify';
import {
  AddRecipeToListSchema,
  AddIngredientToListSchema,
  UpdateItemQuantitySchema,
} from '@bigbatch/shared';
import {
  getShoppingList,
  addRecipeToList,
  addIngredientToList,
  toggleTickedOff,
  toggleHaveThis,
  removeItem,
  updateItemQuantity,
  clearShoppingList,
} from './shopping-list.service.js';

export async function registerShoppingRoutes(server: FastifyInstance) {
  server.get('/shopping-list', async request => {
    const { householdId } = request as unknown as { householdId: number };
    const data = await getShoppingList(householdId);
    return { data };
  });

  server.post(
    '/shopping-list/add-recipe',
    { schema: { body: AddRecipeToListSchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const { recipeId, targetBatchSize } = request.body as {
        recipeId: number;
        targetBatchSize: number;
      };
      const data = await addRecipeToList(
        householdId,
        recipeId,
        targetBatchSize,
      );
      return { data };
    },
  );

  server.post(
    '/shopping-list/add-ingredient',
    { schema: { body: AddIngredientToListSchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const { ingredientId, quantity, unit } = request.body as {
        ingredientId: number;
        quantity: number;
        unit: string;
      };
      const data = await addIngredientToList(
        householdId,
        ingredientId,
        quantity,
        unit,
      );
      return { data };
    },
  );

  server.patch<{ Params: { id: string } }>(
    '/shopping-list/items/:id/toggle',
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      const data = await toggleTickedOff(householdId, id);
      return { data };
    },
  );

  server.patch<{ Params: { id: string } }>(
    '/shopping-list/items/:id/have-this',
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      const data = await toggleHaveThis(householdId, id);
      return { data };
    },
  );

  server.patch<{ Params: { id: string } }>(
    '/shopping-list/items/:id/quantity',
    { schema: { body: UpdateItemQuantitySchema } },
    async request => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      const { quantity } = request.body as { quantity: number };
      const data = await updateItemQuantity(householdId, id, quantity);
      return { data };
    },
  );

  server.delete<{ Params: { id: string } }>(
    '/shopping-list/items/:id',
    async (request, reply) => {
      const { householdId } = request as unknown as { householdId: number };
      const id = Number(request.params.id);
      await removeItem(householdId, id);
      return reply.status(204).send();
    },
  );

  server.delete('/shopping-list', async (request, reply) => {
    const { householdId } = request as unknown as { householdId: number };
    await clearShoppingList(householdId);
    return reply.status(204).send();
  });
}
