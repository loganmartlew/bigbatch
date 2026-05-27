import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconAlertCircle, IconHome, IconUserPlus } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { setActiveHouseholdId } from '../lib/household-context';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ household: { id: number } }>(
        '/households',
        { name },
      );
      setActiveHouseholdId(data.household.id);
      await refreshUser();
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ household: { id: number } }>(
        '/households/join/code',
        { code },
      );
      setActiveHouseholdId(data.household.id);
      await refreshUser();
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message || 'Failed to join household');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'choose') {
    return (
      <Container size={480} py='xl'>
        <Title ta='center' order={2}>
          Welcome to BigBatch!
        </Title>
        <Text c='dimmed' size='sm' ta='center' mt='xs'>
          To get started, create a new household or join an existing one.
        </Text>

        <Group grow align='stretch' mt='xl'>
          <UnstyledButton
            onClick={() => setMode('create')}
            style={{ display: 'block', flex: 1 }}
          >
            <Paper withBorder p='lg' radius='md' h='100%'>
              <Stack align='center' gap='xs'>
                <IconHome size={32} stroke={1.5} />
                <Text fw={500}>Create a Household</Text>
                <Text c='dimmed' size='xs' ta='center'>
                  Start fresh with your own kitchen
                </Text>
              </Stack>
            </Paper>
          </UnstyledButton>
          <UnstyledButton
            onClick={() => setMode('join')}
            style={{ display: 'block', flex: 1 }}
          >
            <Paper withBorder p='lg' radius='md' h='100%'>
              <Stack align='center' gap='xs'>
                <IconUserPlus size={32} stroke={1.5} />
                <Text fw={500}>Join with Code</Text>
                <Text c='dimmed' size='xs' ta='center'>
                  Enter an invite code from someone
                </Text>
              </Stack>
            </Paper>
          </UnstyledButton>
        </Group>
      </Container>
    );
  }

  if (mode === 'create') {
    return (
      <Container size={420} py='xl'>
        <Title ta='center' order={2}>
          Create a Household
        </Title>

        <Paper withBorder shadow='md' p='xl' mt='lg' radius='md'>
          <form onSubmit={handleCreate}>
            <Stack>
              {error && (
                <Alert
                  color='red'
                  icon={<IconAlertCircle size={16} />}
                  variant='light'
                >
                  {error}
                </Alert>
              )}
              <TextInput
                label='Household name'
                placeholder='e.g. The Smith Kitchen'
                required
                maxLength={100}
                value={name}
                onChange={e => setName(e.currentTarget.value)}
              />
              <Button type='submit' loading={loading} fullWidth>
                Create
              </Button>
              <Button
                variant='subtle'
                onClick={() => setMode('choose')}
                fullWidth
              >
                Back
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} py='xl'>
      <Title ta='center' order={2}>
        Join a Household
      </Title>

      <Paper withBorder shadow='md' p='xl' mt='lg' radius='md'>
        <form onSubmit={handleJoin}>
          <Stack>
            {error && (
              <Alert
                color='red'
                icon={<IconAlertCircle size={16} />}
                variant='light'
              >
                {error}
              </Alert>
            )}
            <TextInput
              label='Invite code'
              placeholder='e.g. ABC123'
              required
              maxLength={6}
              value={code}
              onChange={e => setCode(e.currentTarget.value)}
            />
            <Button type='submit' loading={loading} fullWidth>
              Join
            </Button>
            <Button
              variant='subtle'
              onClick={() => setMode('choose')}
              fullWidth
            >
              Back
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
