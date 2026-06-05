import type {
  CancelQueuedCookInput,
  CancelQueuedCookResult,
  CookEventDetail,
  CookModePayload,
  CooksDashboardResponse,
  CreateQueuedCookInput,
  FinishQueuedCookResult,
  QueuedCookDetail,
  UpdateCookEventInput,
  UpdateQueuedCookBatchSizeInput,
} from '@bigbatch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useHousehold } from '../../lib/household-context';
import { recipeKeys } from '../recipes/api';
import { shoppingKeys } from '../shopping/api';

export const cooksKeys = {
  dashboard: (householdId: number | null) => ['cooks', householdId] as const,
  cookMode: (householdId: number | null, queuedCookId: number) =>
    ['cooks', householdId, 'cook-mode', queuedCookId] as const,
  recipeHistory: (householdId: number | null, recipeId: number) =>
    ['cooks', householdId, 'recipe-history', recipeId] as const,
};

export function useCooksDashboard() {
  const { activeHouseholdId } = useHousehold();

  return useQuery({
    queryKey: cooksKeys.dashboard(activeHouseholdId),
    queryFn: () =>
      api.get<CooksDashboardResponse>('/cooks', {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useRecipeCookHistory(recipeId: number) {
  const { activeHouseholdId } = useHousehold();

  return useQuery({
    queryKey: cooksKeys.recipeHistory(activeHouseholdId, recipeId),
    queryFn: () =>
      api.get<CookEventDetail[]>(`/recipes/${recipeId}/cook-events`, {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useQueueRecipeCook() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      ...input
    }: CreateQueuedCookInput & { recipeId: number }) =>
      api.post<QueuedCookDetail>(`/recipes/${recipeId}/queued-cooks`, input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: queuedCook => {
      queryClient.invalidateQueries({
        queryKey: cooksKeys.dashboard(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: shoppingKeys.list(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(activeHouseholdId, queuedCook.recipeId),
      });
    },
  });
}

export function useUpdateQueuedCookBatchSize() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      queuedCookId,
      input,
    }: {
      queuedCookId: number;
      input: UpdateQueuedCookBatchSizeInput;
    }) =>
      api.patch<QueuedCookDetail>(`/cooks/${queuedCookId}/batch-size`, input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: queuedCook => {
      queryClient.invalidateQueries({
        queryKey: cooksKeys.dashboard(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: cooksKeys.cookMode(activeHouseholdId, queuedCook.id),
      });
      queryClient.invalidateQueries({
        queryKey: shoppingKeys.list(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(activeHouseholdId, queuedCook.recipeId),
      });
    },
  });
}

export function useCancelQueuedCook() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      queuedCookId,
      input,
    }: {
      queuedCookId: number;
      input: CancelQueuedCookInput;
    }) =>
      api.delete<CancelQueuedCookResult>(`/cooks/${queuedCookId}`, input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cooksKeys.dashboard(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: shoppingKeys.list(activeHouseholdId),
      });
    },
  });
}

export function useQueuedCookMode(queuedCookId: number) {
  const { activeHouseholdId } = useHousehold();

  return useQuery({
    queryKey: cooksKeys.cookMode(activeHouseholdId, queuedCookId),
    queryFn: () =>
      api.get<CookModePayload>(`/cooks/${queuedCookId}/cook-mode`, {
        householdId: activeHouseholdId,
      }),
    enabled: activeHouseholdId != null,
  });
}

export function useFinishQueuedCook() {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queuedCookId: number) =>
      api.post<FinishQueuedCookResult>(
        `/cooks/${queuedCookId}/finish`,
        undefined,
        {
          householdId: activeHouseholdId,
        },
      ),
    onSuccess: result => {
      queryClient.invalidateQueries({
        queryKey: cooksKeys.dashboard(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: cooksKeys.recipeHistory(
          activeHouseholdId,
          result.cookEvent.recipeId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: shoppingKeys.list(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(
          activeHouseholdId,
          result.cookEvent.recipeId,
        ),
      });
    },
  });
}

export function useUpdateCookEvent(cookEventId: number) {
  const { activeHouseholdId } = useHousehold();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCookEventInput) =>
      api.patch<CookEventDetail>(`/cook-events/${cookEventId}`, input, {
        householdId: activeHouseholdId,
      }),
    onSuccess: result => {
      queryClient.invalidateQueries({
        queryKey: cooksKeys.dashboard(activeHouseholdId),
      });
      queryClient.invalidateQueries({
        queryKey: cooksKeys.recipeHistory(activeHouseholdId, result.recipeId),
      });
    },
  });
}
