import {
  RegisterSchema,
  getPasswordStrengthDetails,
  type RegisterInput,
} from '@bigbatch/shared';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Grid,
  Loader,
  PasswordInput,
  Progress,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { useAuth } from '../../../lib/auth-context';
import { getErrorMessage } from '../../../lib/error-message';
import { typeboxResolver } from '../../../lib/typebox-resolver';
import { AuthShell } from './auth-shell';

const PASSWORD_STRENGTH_COLORS = ['red', 'red', 'yellow', 'lime', 'teal'];

export function RegisterForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const baseResolver = typeboxResolver<RegisterInput>(RegisterSchema);
  const registerResolver: Resolver<RegisterInput> = async (
    values,
    context,
    options,
  ) => {
    const result = await baseResolver(values, context, options);
    const passwordStrength = getPasswordStrengthDetails(values.password);

    if (result.errors.password || !passwordStrength.validationMessage) {
      return result;
    }

    return {
      values: {},
      errors: {
        ...result.errors,
        password: {
          type: 'password-strength',
          message: passwordStrength.validationMessage,
        },
      },
    };
  };
  const form = useForm<RegisterInput>({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
    },
    mode: 'onChange',
    resolver: registerResolver,
  });
  const password = form.watch('password');
  const passwordStrength = getPasswordStrengthDetails(password);
  const passwordStrengthColor =
    PASSWORD_STRENGTH_COLORS[passwordStrength.score];
  const passwordStrengthValue =
    password.length === 0 ? 0 : ((passwordStrength.score + 1) / 5) * 100;
  const passwordStatusMessage =
    password.length === 0
      ? 'Use at least 8 characters and avoid common passwords.'
      : password.length < 8
        ? 'Add more characters to reach the 8-character minimum.'
        : passwordStrength.isStrongEnough
          ? 'Strong enough to create your account.'
          : (passwordStrength.validationMessage ??
            'Use a less common password.');

  const handleSubmit = form.handleSubmit(async values => {
    setSubmissionError(null);

    try {
      const session = await auth.register(
        values.email,
        values.password,
        values.firstName,
        values.lastName,
      );

      await navigate({
        to: session.households.length > 0 ? '/' : '/onboarding',
      });
    } catch (error) {
      setSubmissionError(getErrorMessage(error, 'Registration failed.'));
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
      badge='New account'
      description='Create your account first, then set up or join the household you cook with.'
      footer={
        <>
          Already have an account?{' '}
          <Anchor component={Link} to='/login'>
            Log in instead
          </Anchor>
        </>
      }
      title='Create your account'
    >
      <form onSubmit={handleSubmit}>
        <Stack gap='md'>
          {submissionError ? (
            <Alert color='red' title='Unable to create account' variant='light'>
              {submissionError}
            </Alert>
          ) : null}

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                {...form.register('firstName')}
                autoComplete='given-name'
                error={form.formState.errors.firstName?.message}
                label='First name'
                placeholder='John'
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                {...form.register('lastName')}
                autoComplete='family-name'
                error={form.formState.errors.lastName?.message}
                label='Last name'
                placeholder='Cook'
              />
            </Grid.Col>
          </Grid>

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
            autoComplete='new-password'
            error={form.formState.errors.password?.message}
            label='Password'
            placeholder='Use at least 8 characters'
          />

          <Stack gap={4}>
            <Progress
              aria-label='Password strength'
              color={passwordStrengthColor}
              radius='xl'
              size='sm'
              value={passwordStrengthValue}
            />
            <Text c={passwordStrengthColor} fw={600} size='sm'>
              Password strength: {passwordStrength.label}
            </Text>
            <Text aria-live='polite' c='dimmed' size='sm'>
              {passwordStatusMessage}
            </Text>
          </Stack>

          <Button
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            loading={form.formState.isSubmitting}
            type='submit'
          >
            Create account
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
