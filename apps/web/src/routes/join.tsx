import { Alert, Button, Center, Loader } from '@mantine/core';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AuthShell } from '../features/auth/components/auth-shell';
import { requireAuthenticatedUser } from '../features/auth/utils/route-guards';
import { useJoinHouseholdByLinkMutation } from '../features/household/hooks/use-household-api';
import { useAuth } from '../lib/auth-context';
import { getErrorMessage } from '../lib/error-message';
import { useHousehold } from '../lib/household-context';

export const Route = createFileRoute('/join')({
  beforeLoad: ({ context, location }) => {
    requireAuthenticatedUser({ context, location });
  },
  component: JoinByLinkPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) ?? '',
  }),
});

function JoinByLinkPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { isLoading, refreshUser } = useAuth();
  const { switchHousehold } = useHousehold();
  const { isPending, mutateAsync } = useJoinHouseholdByLinkMutation();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || isLoading) {
      return;
    }

    let cancelled = false;

    async function joinHousehold() {
      setError(null);

      try {
        const result = await mutateAsync({ token });

        if (cancelled) {
          return;
        }

        switchHousehold(result.household.id);
        await refreshUser();

        if (!cancelled) {
          await navigate({ to: '/' });
        }
      } catch (joinError) {
        if (!cancelled) {
          setError(getErrorMessage(joinError, 'Failed to join household.'));
        }
      }
    }

    void joinHousehold();

    return () => {
      cancelled = true;
    };
  }, [
    attempt,
    isLoading,
    mutateAsync,
    navigate,
    refreshUser,
    switchHousehold,
    token,
  ]);

  if (!token) {
    return (
      <AuthShell
        badge='Invite required'
        description='This join link is missing the invite token BigBatch needs.'
        title='Invalid invite link'
      >
        <Alert color='red' title='Invite link unavailable' variant='light'>
          Ask the household owner for a fresh invite link or invite code.
        </Alert>
      </AuthShell>
    );
  }

  if (isLoading || isPending) {
    return (
      <AuthShell
        badge='Joining household'
        description='Verifying your invite and attaching this account to the selected household.'
        title='Adding you to the household'
      >
        <Center py='xl'>
          <Loader color='orange' />
        </Center>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge='Invite issue'
      description='The invite could not be used right now.'
      title='Unable to join household'
    >
      <Alert color='red' title='Invite failed' variant='light'>
        {error ?? 'Unable to join household.'}
      </Alert>
      <Button onClick={() => setAttempt(currentAttempt => currentAttempt + 1)}>
        Try again
      </Button>
    </AuthShell>
  );
}
