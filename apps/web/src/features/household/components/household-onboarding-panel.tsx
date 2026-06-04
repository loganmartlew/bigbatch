import { CreateHouseholdSchema, JoinByCodeSchema } from '@bigbatch/shared';
import {
  Alert,
  Button,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../lib/auth-context';
import { getErrorMessage } from '../../../lib/error-message';
import { useHousehold } from '../../../lib/household-context';
import { typeboxResolver } from '../../../lib/typebox-resolver';
import {
  useCreateHouseholdMutation,
  useJoinHouseholdByCodeMutation,
} from '../hooks/use-household-api';
import { AuthShell } from '../../auth/components/auth-shell';

type OnboardingMode = 'create' | 'join';

export function HouseholdOnboardingPanel() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { switchHousehold } = useHousehold();
  const [mode, setMode] = useState<OnboardingMode>('create');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const createHousehold = useCreateHouseholdMutation();
  const joinHousehold = useJoinHouseholdByCodeMutation();
  const createForm = useForm<{ name: string }>({
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
    resolver: typeboxResolver<{ name: string }>(CreateHouseholdSchema),
  });
  const joinForm = useForm<{ code: string }>({
    defaultValues: {
      code: '',
    },
    mode: 'onChange',
    resolver: typeboxResolver<{ code: string }>(JoinByCodeSchema),
  });

  useEffect(() => {
    setSubmissionError(null);
  }, [mode]);

  if (auth.isLoading) {
    return (
      <AuthShell
        badge='Preparing your account'
        description='Loading your memberships before we send you to the right next step.'
        title='Just a second'
      >
        <Text c='dimmed'>Syncing your account state…</Text>
      </AuthShell>
    );
  }

  const handleCreate = createForm.handleSubmit(async values => {
    setSubmissionError(null);

    try {
      const result = await createHousehold.mutateAsync(values);
      switchHousehold(result.household.id);
      await auth.refreshUser();
      await navigate({ to: '/' });
    } catch (error) {
      setSubmissionError(getErrorMessage(error, 'Failed to create household.'));
    }
  });

  const handleJoin = joinForm.handleSubmit(async values => {
    setSubmissionError(null);

    try {
      const result = await joinHousehold.mutateAsync(values);
      switchHousehold(result.household.id);
      await auth.refreshUser();
      await navigate({ to: '/' });
    } catch (error) {
      setSubmissionError(getErrorMessage(error, 'Failed to join household.'));
    }
  });

  const isSubmitting =
    createForm.formState.isSubmitting || joinForm.formState.isSubmitting;

  return (
    <AuthShell
      badge='Household setup'
      description='Create a new household or join an existing one so invites, members, and future cooking plans stay shared.'
      title='Set up your first household'
    >
      <Stack gap='lg'>
        <SegmentedControl
          data={[
            { label: 'Create household', value: 'create' },
            { label: 'Join with code', value: 'join' },
          ]}
          onChange={value => setMode(value as OnboardingMode)}
          value={mode}
        />

        {submissionError ? (
          <Alert color='red' title='Unable to continue' variant='light'>
            {submissionError}
          </Alert>
        ) : null}

        {mode === 'create' ? (
          <form onSubmit={handleCreate}>
            <Stack gap='md'>
              <Text c='dimmed' size='sm'>
                Start the shared kitchen space your household will use for
                invites and planning.
              </Text>
              <TextInput
                {...createForm.register('name')}
                error={createForm.formState.errors.name?.message}
                label='Household name'
                placeholder='Weekend prep crew'
              />
              <Button
                disabled={!createForm.formState.isValid || isSubmitting}
                loading={isSubmitting}
                type='submit'
              >
                Create household
              </Button>
            </Stack>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <Stack gap='md'>
              <Text c='dimmed' size='sm'>
                Enter the six-character invite code shared by your household
                owner.
              </Text>
              <TextInput
                {...joinForm.register('code')}
                error={joinForm.formState.errors.code?.message}
                label='Invite code'
                placeholder='ABC123'
              />
              <Button
                disabled={!joinForm.formState.isValid || isSubmitting}
                loading={isSubmitting}
                type='submit'
              >
                Join household
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </AuthShell>
  );
}
