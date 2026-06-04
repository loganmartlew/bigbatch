import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from '@bigbatch/shared';
import { Alert, Button, Stack, Text, TextInput } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../../../lib/error-message';
import { typeboxResolver } from '../../../lib/typebox-resolver';
import { useForgotPasswordMutation } from '../hooks/use-auth-mutations';
import { AuthShell } from './auth-shell';

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
    resolver: typeboxResolver<ForgotPasswordInput>(ForgotPasswordSchema),
  });

  const handleSubmit = form.handleSubmit(async values => {
    setSubmissionError(null);

    try {
      await forgotPassword.mutateAsync(values);
      setSubmitted(true);
    } catch (error) {
      setSubmissionError(
        getErrorMessage(error, 'Unable to start password reset.'),
      );
    }
  });

  if (submitted) {
    return (
      <AuthShell
        badge='Email sent'
        description='If the email matches an account, the reset link is already on its way.'
        footer={
          <Link search={{ redirect: undefined }} to='/login'>
            Back to login
          </Link>
        }
        title='Check your email'
      >
        <Alert color='green' title='Reset link requested' variant='light'>
          If an account with that email exists, a password reset link has been
          sent.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge='Password help'
      description='Enter the email address you use for BigBatch and we will send a reset link if the account exists.'
      footer={
        <Link search={{ redirect: undefined }} to='/login'>
          Back to login
        </Link>
      }
      title='Forgot your password?'
    >
      <form onSubmit={handleSubmit}>
        <Stack gap='md'>
          {submissionError ? (
            <Alert
              color='red'
              title='Unable to send reset link'
              variant='light'
            >
              {submissionError}
            </Alert>
          ) : null}

          <TextInput
            {...form.register('email')}
            autoComplete='email'
            error={form.formState.errors.email?.message}
            label='Email'
            placeholder='you@example.com'
            type='email'
          />

          <Button
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            loading={form.formState.isSubmitting}
            type='submit'
          >
            Send reset link
          </Button>

          <Text c='dimmed' size='sm'>
            For security, BigBatch always shows the same success state whether
            or not the email exists.
          </Text>
        </Stack>
      </form>
    </AuthShell>
  );
}
