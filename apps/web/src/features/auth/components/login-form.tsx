import { LoginSchema, type LoginInput } from '@bigbatch/shared';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../lib/auth-context';
import { getErrorMessage } from '../../../lib/error-message';
import { typeboxResolver } from '../../../lib/typebox-resolver';
import { AuthShell } from './auth-shell';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
    resolver: typeboxResolver<LoginInput>(LoginSchema),
  });

  const handleSubmit = form.handleSubmit(async values => {
    setSubmissionError(null);

    try {
      const session = await auth.login(values.email, values.password);

      if (redirectTo) {
        router.history.push(redirectTo);
        return;
      }

      await navigate({
        to: session.households.length > 0 ? '/' : '/onboarding',
      });
    } catch (error) {
      setSubmissionError(getErrorMessage(error, 'Login failed.'));
    }
  });

  if (auth.isLoading) {
    return (
      <AuthShell
        badge='Session'
        description='Checking whether you already have an active session.'
        title='Loading your account'
      >
        <Center py='xl'>
          <Loader color='orange' />
        </Center>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge='Welcome back'
      description='Sign in to continue managing households, invites, and upcoming cooking plans.'
      footer={
        <>
          Don&apos;t have an account yet?{' '}
          <Anchor component={Link} to='/register'>
            Create one
          </Anchor>
        </>
      }
      title='Log in to BigBatch'
    >
      <form onSubmit={handleSubmit}>
        <Stack gap='md'>
          {submissionError ? (
            <Alert color='red' title='Unable to sign in' variant='light'>
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

          <PasswordInput
            {...form.register('password')}
            autoComplete='current-password'
            error={form.formState.errors.password?.message}
            label='Password'
            placeholder='Enter your password'
          />

          <Button
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            loading={form.formState.isSubmitting}
            type='submit'
          >
            Log in
          </Button>

          <Text c='dimmed' size='sm'>
            <Anchor component={Link} to='/forgot-password' size='sm'>
              Forgot your password?
            </Anchor>
          </Text>
        </Stack>
      </form>
    </AuthShell>
  );
}
