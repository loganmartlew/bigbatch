import { ResetPasswordSchema, type ResetPasswordInput } from '@bigbatch/shared';
import { Alert, Button, Stack, Text, PasswordInput } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../../../lib/error-message';
import { typeboxResolver } from '../../../lib/typebox-resolver';
import { useResetPasswordMutation } from '../hooks/use-auth-mutations';
import { AuthShell } from './auth-shell';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const resetPassword = useResetPasswordMutation();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ResetPasswordInput>({
    defaultValues: {
      newPassword: '',
      token,
    },
    mode: 'onChange',
    resolver: typeboxResolver<ResetPasswordInput>(ResetPasswordSchema),
  });

  const handleSubmit = form.handleSubmit(async values => {
    setSubmissionError(null);

    try {
      await resetPassword.mutateAsync(values);
      setSubmitted(true);
    } catch (error) {
      setSubmissionError(
        getErrorMessage(error, 'Unable to reset your password.'),
      );
    }
  });

  if (submitted) {
    return (
      <AuthShell
        badge='Password updated'
        description='Your account is ready for a fresh login with the new password.'
        footer={
          <Link search={{ redirect: undefined }} to='/login'>
            Go to login
          </Link>
        }
        title='Password reset complete'
      >
        <Alert color='green' title='Success' variant='light'>
          Your password has been reset successfully.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge='Secure your account'
      description='Choose a new password before returning to your cooking plans.'
      footer={
        <Link search={{ redirect: undefined }} to='/login'>
          Back to login
        </Link>
      }
      title='Reset your password'
    >
      <form onSubmit={handleSubmit}>
        <Stack gap='md'>
          {submissionError ? (
            <Alert color='red' title='Unable to reset password' variant='light'>
              {submissionError}
            </Alert>
          ) : null}

          <PasswordInput
            {...form.register('newPassword')}
            autoComplete='new-password'
            error={form.formState.errors.newPassword?.message}
            label='New password'
            placeholder='Use at least 8 characters'
          />

          <Button
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            loading={form.formState.isSubmitting}
            type='submit'
          >
            Reset password
          </Button>

          <Text c='dimmed' size='sm'>
            The reset link remains valid until it expires or gets used.
          </Text>
        </Stack>
      </form>
    </AuthShell>
  );
}
