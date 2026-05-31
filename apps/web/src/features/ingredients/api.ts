import type {
  CreateIngredientInput,
  UpdateIngredientInput,
  IngredientResponse,
  OFFSearchResult,
  CreateCategoryInput,
  UpdateCategoryInput,
  ShoppingCategoryResponse,
} from '@bigbatch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useHousehold } from '../../lib/household-context';

// ─── Query Keys ──────────────────────────────────────────────

export const ingredientKeys = {
  all: (hhId: number | null) => ['ingredients', hhId] as const,
  detail: (hhId: number | null, id: number) =>
    ['ingredients', hhId, id] as const,
  offSearch: (query: string) => ['off-search', query] as const,
};

export const categoryKeys = {
  all: (hhId: number | null) => ['categories', hhId] as const,
};

// ─── Ingredient Hooks ────────────────────────────────────────

export function useIngredients() {
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: ingredientKeys.all(activeHouseholdId),
    queryFn: () =>
      api.get<IngredientResponse[]>('/ingredients', {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useIngredient(id: number) {
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: ingredientKeys.detail(activeHouseholdId, id),
    queryFn: () =>
      api.get<IngredientResponse>(`/ingredients/${id}`, {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useCreateIngredient() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIngredientInput) =>
      api.post<IngredientResponse>('/ingredients', input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ingredientKeys.all(activeHouseholdId),
      });
    },
  });
}

export function useUpdateIngredient(id: number) {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateIngredientInput) =>
      api.patch<IngredientResponse>(`/ingredients/${id}`, input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ingredientKeys.all(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: ingredientKeys.detail(activeHouseholdId, id),
      });
    },
  });
}

export function useDeleteIngredient() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/ingredients/${id}`, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ingredientKeys.all(activeHouseholdId),
      });
    },
  });
}

// ─── OpenFoodFacts Hooks ─────────────────────────────────────

export function useOFFSearch(query: string) {
  return useQuery({
    queryKey: ingredientKeys.offSearch(query),
    queryFn: async () => {
      const result = await api.get<OFFSearchResult[]>(
        `/ingredients/search/openfoodfacts?q=${encodeURIComponent(query)}`,
      );
      return result;
    },
    enabled: query.length >= 3,
  });
}

// ─── Shopping Category Hooks ─────────────────────────────────

export function useShoppingCategories() {
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: categoryKeys.all(activeHouseholdId),
    queryFn: () =>
      api.get<ShoppingCategoryResponse[]>('/shopping-categories', {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useCreateCategory() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      api.post<ShoppingCategoryResponse>('/shopping-categories', input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all(activeHouseholdId),
      });
    },
  });
}

export function useUpdateCategory(id: number) {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCategoryInput) =>
      api.patch<ShoppingCategoryResponse>(`/shopping-categories/${id}`, input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all(activeHouseholdId),
      });
    },
  });
}

export function useDeleteCategory() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/shopping-categories/${id}`, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all(activeHouseholdId),
      });
    },
  });
}

export function useReorderCategories() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      api.put(
        '/shopping-categories/reorder',
        { orderedIds },
        {
          householdId: activeHouseholdId,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all(activeHouseholdId),
      });
    },
  });
}
