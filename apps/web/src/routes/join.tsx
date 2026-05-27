import {
  Alert,
  Anchor,
  Center,
  Container,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import {
  Link,
  createFileRoute,
  useSearch,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { setActiveHouseholdId } from '../lib/household-context';

export const Route = createFileRoute('/join')({
  component: JoinByLinkPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) ?? '',
  }),
});

function JoinByLinkPage() {
  const { token } = useSearch({ from: '/join' });
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      navigate({
        to: '/login',
        search: { redirect: `/join?token=${encodeURIComponent(token)}` },
        replace: true,
      });
      return;
    }

    let cancelled = false;

    const joinHousehold = async () => {
      try {
        const data = await api.post<{
          household: { id: number; name: string };
        }>('/households/join/link', { token });

        if (cancelled) {
          return;
        }

        setActiveHouseholdId(data.household.id);

        await refreshUser();

        if (cancelled) {
          return;
        }

        navigate({ to: '/' });
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        setError(err.message || 'Failed to join household');
        setLoading(false);
      }
    };

    void joinHousehold();

    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated, isLoading, navigate, refreshUser]);

  if (loading) {
    return (
      <Center py='xl'>
        <Stack align='center' gap='sm'>
          <Loader size='lg' />
          <Text c='dimmed' size='sm'>
            Joining household…
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size={420} py='xl'>
      <Paper withBorder shadow='md' p='xl' radius='md'>
        <Stack>
          <Title order={3}>Join Household</Title>
          {error && (
            <Alert
              color='red'
              icon={<IconAlertCircle size={16} />}
              variant='light'
            >
              {error}
            </Alert>
          )}
          <Anchor component={Link} to='/'>
            Go home
          </Anchor>
        </Stack>
      </Paper>
    </Container>
  );
}
