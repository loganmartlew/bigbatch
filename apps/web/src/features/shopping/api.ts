import type {
  IngredientResponse,
  ShoppingCategoryResponse,
  ShoppingListResponse,
  ShoppingListItemEnriched,
} from '@bigbatch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useHousehold } from '../../lib/household-context';
import { categoryKeys, ingredientKeys } from '../ingredients/api';
import {
  addShoppingListItem,
  removeShoppingListItem,
  updateShoppingListItem,
} from './model';

// ─── Query Keys ──────────────────────────────────────────────

export const shoppingKeys = {
  list: (hhId: number | null) => ['shopping-list', hhId] as const,
};

interface ShoppingMutationContext {
  previous?: ShoppingListResponse;
}

interface AddIngredientMutationContext extends ShoppingMutationContext {
  appliedOptimisticUpdate: boolean;
}

function getOptimisticIngredient(
  queryClient: ReturnType<typeof useQueryClient>,
  householdId: number,
  ingredientId: number,
) {
  const ingredients = queryClient.getQueryData<IngredientResponse[]>(
    ingredientKeys.all(householdId),
  );
  const cachedIngredient = ingredients?.find(item => item.id === ingredientId);

  if (cachedIngredient) {
    return cachedIngredient;
  }

  return queryClient.getQueryData<IngredientResponse>(
    ingredientKeys.detail(householdId, ingredientId),
  );
}

function getOptimisticCategorySortOrder(
  queryClient: ReturnType<typeof useQueryClient>,
  householdId: number,
  categoryId: number | null,
) {
  if (categoryId == null) {
    return null;
  }

  const categories = queryClient.getQueryData<ShoppingCategoryResponse[]>(
    categoryKeys.all(householdId),
  );

  return (
    categories?.find(category => category.id === categoryId)?.sortOrder ?? null
  );
}

// ─── Hooks ───────────────────────────────────────────────────

export function useShoppingList() {
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: shoppingKeys.list(activeHouseholdId),
    queryFn: () =>
      api.get<ShoppingListResponse>('/shopping-list', {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useAddRecipeToList() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: ({
      recipeId,
      targetBatchSize,
    }: {
      recipeId: number;
      targetBatchSize: number;
    }) =>
      api.post<ShoppingListResponse>(
        '/shopping-list/add-recipe',
        { recipeId, targetBatchSize },
        { householdId: activeHouseholdId },
      ),
    onSuccess: response => {
      queryClient.setQueryData(queryKey, response);
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useAddIngredientToList() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: ({
      ingredientId,
      quantity,
      unit,
    }: {
      ingredientId: number;
      quantity: number;
      unit: string;
    }) =>
      api.post<ShoppingListResponse>(
        '/shopping-list/add-ingredient',
        { ingredientId, quantity, unit },
        { householdId: activeHouseholdId },
      ),
    onMutate: async ({ ingredientId, quantity, unit }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListResponse>(queryKey);

      if (activeHouseholdId == null) {
        return {
          previous,
          appliedOptimisticUpdate: false,
        } satisfies AddIngredientMutationContext;
      }

      const ingredient = getOptimisticIngredient(
        queryClient,
        activeHouseholdId,
        ingredientId,
      );

      if (!ingredient) {
        return {
          previous,
          appliedOptimisticUpdate: false,
        } satisfies AddIngredientMutationContext;
      }

      queryClient.setQueryData<ShoppingListResponse>(queryKey, current =>
        addShoppingListItem(current, {
          tempId: -Date.now(),
          householdId: activeHouseholdId,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          ingredientDefaultUnit: ingredient.defaultUnit,
          categoryId: ingredient.categoryId ?? null,
          categoryName: ingredient.categoryName ?? null,
          categorySortOrder: getOptimisticCategorySortOrder(
            queryClient,
            activeHouseholdId,
            ingredient.categoryId ?? null,
          ),
          quantity,
          unit,
          createdAt: new Date().toISOString(),
        }),
      );

      return {
        previous,
        appliedOptimisticUpdate: true,
      } satisfies AddIngredientMutationContext;
    },
    onError: (_error, _variables, context) => {
      if (!context?.appliedOptimisticUpdate) {
        return;
      }

      if (context.previous) {
        queryClient.setQueryData(queryKey, context.previous);
        return;
      }

      queryClient.removeQueries({ queryKey, exact: true });
    },
    onSuccess: response => {
      queryClient.setQueryData(queryKey, response);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useToggleTickedOff() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: (itemId: number) =>
      api.patch<ShoppingListItemEnriched>(
        `/shopping-list/items/${itemId}/toggle`,
        undefined,
        { householdId: activeHouseholdId },
      ),
    onMutate: async itemId => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListResponse>(queryKey);

      queryClient.setQueryData<ShoppingListResponse | undefined>(
        queryKey,
        current =>
          updateShoppingListItem(current, itemId, item => ({
            ...item,
            tickedOff: !item.tickedOff,
          })),
      );

      return { previous } satisfies ShoppingMutationContext;
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useToggleHaveThis() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: (itemId: number) =>
      api.patch<ShoppingListItemEnriched>(
        `/shopping-list/items/${itemId}/have-this`,
        undefined,
        { householdId: activeHouseholdId },
      ),
    onMutate: async itemId => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListResponse>(queryKey);

      queryClient.setQueryData<ShoppingListResponse | undefined>(
        queryKey,
        current =>
          updateShoppingListItem(current, itemId, item => ({
            ...item,
            haveThis: !item.haveThis,
          })),
      );

      return { previous } satisfies ShoppingMutationContext;
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useRestoreShoppingItem() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: async (item: ShoppingListItemEnriched) => {
      const requests: Array<Promise<unknown>> = [];

      if (item.tickedOff) {
        requests.push(
          api.patch<ShoppingListItemEnriched>(
            `/shopping-list/items/${item.id}/toggle`,
            undefined,
            { householdId: activeHouseholdId },
          ),
        );
      }

      if (item.haveThis) {
        requests.push(
          api.patch<ShoppingListItemEnriched>(
            `/shopping-list/items/${item.id}/have-this`,
            undefined,
            { householdId: activeHouseholdId },
          ),
        );
      }

      await Promise.all(requests);
      return item.id;
    },
    onMutate: async item => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListResponse>(queryKey);

      queryClient.setQueryData<ShoppingListResponse | undefined>(
        queryKey,
        current =>
          updateShoppingListItem(current, item.id, currentItem => ({
            ...currentItem,
            tickedOff: false,
            haveThis: false,
          })),
      );

      return { previous } satisfies ShoppingMutationContext;
    },
    onError: (_error, _item, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateItemQuantity() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      api.patch<ShoppingListItemEnriched>(
        `/shopping-list/items/${itemId}/quantity`,
        { quantity },
        { householdId: activeHouseholdId },
      ),
    onSuccess: item => {
      queryClient.setQueryData<ShoppingListResponse | undefined>(
        queryKey,
        current => updateShoppingListItem(current, item.id, () => item),
      );
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useRemoveItem() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: (itemId: number) =>
      api.delete<void>(`/shopping-list/items/${itemId}`, {
        householdId: activeHouseholdId,
      }),
    onMutate: async itemId => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListResponse>(queryKey);

      queryClient.setQueryData<ShoppingListResponse | undefined>(
        queryKey,
        current => removeShoppingListItem(current, itemId),
      );

      return { previous } satisfies ShoppingMutationContext;
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useClearShoppingList() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.list(activeHouseholdId);

  return useMutation({
    mutationFn: () =>
      api.delete<void>('/shopping-list', { householdId: activeHouseholdId }),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, { groups: [], totalItems: 0 });
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
