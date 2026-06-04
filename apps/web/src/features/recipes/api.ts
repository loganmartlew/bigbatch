import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeDetail,
  RecipeSummary,
  TagWithCount,
} from '@bigbatch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useHousehold } from '../../lib/household-context';

// ─── Query Keys ──────────────────────────────────────────────

export const recipeKeys = {
  all: (hhId: number | null) => ['recipes', hhId] as const,
  detail: (hhId: number | null, id: number) => ['recipes', hhId, id] as const,
  tags: (hhId: number | null) => ['tags', hhId] as const,
};

// ─── Recipe Hooks ────────────────────────────────────────────

export function useRecipes(filters?: { search?: string; tags?: string }) {
  const { activeHouseholdId } = useHousehold();
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tags) params.set('tags', filters.tags);
  const qs = params.toString();
  const path = qs ? `/recipes?${qs}` : '/recipes';

  return useQuery({
    queryKey: [...recipeKeys.all(activeHouseholdId), filters] as const,
    queryFn: () =>
      api.get<RecipeSummary[]>(path, { householdId: activeHouseholdId }),
    enabled: activeHouseholdId != null,
  });
}

export function useRecipe(id: number) {
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: recipeKeys.detail(activeHouseholdId, id),
    queryFn: () =>
      api.get<RecipeDetail>(`/recipes/${id}`, {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useCreateRecipe() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecipeInput) =>
      api.post<RecipeDetail>('/recipes', data, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.all(activeHouseholdId),
      });
    },
  });
}

export function useUpdateRecipe(id: number) {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRecipeInput) =>
      api.patch<RecipeDetail>(`/recipes/${id}`, data, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.all(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(activeHouseholdId, id),
      });
    },
  });
}

export function useDeleteRecipe() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/recipes/${id}`, { householdId: activeHouseholdId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.all(activeHouseholdId),
      });
    },
  });
}

export function useDuplicateRecipe() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<RecipeDetail>(`/recipes/${id}/duplicate`, undefined, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.all(activeHouseholdId),
      });
    },
  });
}

export function useTags() {
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: recipeKeys.tags(activeHouseholdId),
    queryFn: () =>
      api.get<TagWithCount[]>('/tags', { householdId: activeHouseholdId }),
    enabled: activeHouseholdId != null,
  });
}
