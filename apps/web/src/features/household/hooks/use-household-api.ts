import type {
  CreateHouseholdInput,
  JoinByCodeInput,
  JoinByLinkInput,
} from '@bigbatch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export interface HouseholdJoinResponse {
  household: {
    id: number;
    name: string;
  };
}

export interface HouseholdCreateResponse {
  household: {
    id: number;
  };
}

export interface HouseholdMember {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface HouseholdInvite {
  link: string;
  code: string;
  expiresAt: string;
}

const householdQueryKeys = {
  members: (householdId: number | null) =>
    ['household', householdId, 'members'] as const,
};

export function useCreateHouseholdMutation() {
  return useMutation({
    mutationFn: (input: CreateHouseholdInput) =>
      api.post<HouseholdCreateResponse>('/households', input),
  });
}

export function useJoinHouseholdByCodeMutation() {
  return useMutation({
    mutationFn: (input: JoinByCodeInput) =>
      api.post<HouseholdJoinResponse>('/households/join/code', input),
  });
}

export function useJoinHouseholdByLinkMutation() {
  return useMutation({
    mutationFn: (input: JoinByLinkInput) =>
      api.post<HouseholdJoinResponse>('/households/join/link', input),
  });
}

export function useHouseholdMembersQuery(householdId: number | null) {
  return useQuery({
    enabled: householdId !== null,
    queryFn: () =>
      api.get<{ members: HouseholdMember[] }>(
        `/households/${householdId}/members`,
        { householdId },
      ),
    queryKey: householdQueryKeys.members(householdId),
  });
}

export function useGenerateInviteMutation(householdId: number | null) {
  return useMutation({
    mutationFn: async () => {
      if (householdId === null) {
        throw new Error('Select a household before generating an invite.');
      }

      return api.post<HouseholdInvite>(
        `/households/${householdId}/invites`,
        undefined,
        {
          householdId,
        },
      );
    },
  });
}

export function useRemoveMemberMutation(householdId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      if (householdId === null) {
        throw new Error('Select a household before removing a member.');
      }

      return api.delete<void>(`/households/${householdId}/members/${userId}`, {
        householdId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: householdQueryKeys.members(householdId),
      });
    },
  });
}
