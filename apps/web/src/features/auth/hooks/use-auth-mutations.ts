import type { ForgotPasswordInput, ResetPasswordInput } from '@bigbatch/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

interface PasswordActionResponse {
  message: string;
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      api.post<PasswordActionResponse>('/auth/forgot-password', input),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      api.post<PasswordActionResponse>('/auth/reset-password', input),
  });
}
