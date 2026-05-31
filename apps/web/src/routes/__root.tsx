import {
  Alert,
  AppShell,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';
import {
  createRootRouteWithContext,
  Outlet,
  useNavigate,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { useState } from 'react';
import { HouseholdSelector } from '../components/household-selector';
import { useAuth } from '../lib/auth-context';
import { getErrorMessage } from '../lib/error-message';
import type { RouterAppContext } from '../lib/router-context';

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootLayout,
  errorComponent: RootErrorBoundary,
});

function RootLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await auth.logout();
      await navigate({ to: '/login', search: { redirect: undefined } });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AppShell header={{ height: 84 }} padding='md'>
      <AppShell.Header>
        <Container
          size='xl'
          style={{
            height: '100%',
          }}
        >
          <Group
            justify='space-between'
            style={{
              height: '100%',
            }}
          >
            <Stack gap={2}>
              <Group gap='xs'>
                <Title order={3}>BigBatch</Title>
                <Badge
                  color='orange'
                  leftSection={<IconSparkles size={12} />}
                  variant='light'
                >
                  Web-first
                </Badge>
              </Group>
              <Text c='dimmed' size='sm'>
                A calmer, polished planning surface for bulk cooking.
              </Text>
            </Stack>

            {auth.isLoading ? (
              <Loader color='orange' size='sm' />
            ) : auth.isAuthenticated ? (
              <Group gap='sm' wrap='nowrap'>
                {auth.households.length > 0 ? <HouseholdSelector /> : null}
                {auth.households.length > 0 ? (
                  <Button
                    onClick={() => navigate({ to: '/ingredients' })}
                    variant='default'
                  >
                    Ingredients
                  </Button>
                ) : null}
                {auth.households.length > 0 ? (
                  <Button
                    onClick={() => navigate({ to: '/settings/household' })}
                    variant='default'
                  >
                    Household settings
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate({ to: '/onboarding' })}
                    variant='default'
                  >
                    Set up household
                  </Button>
                )}
                <Button
                  loading={isLoggingOut}
                  onClick={handleLogout}
                  variant='subtle'
                >
                  Log out
                </Button>
              </Group>
            ) : (
              <Group gap='sm'>
                <Button
                  onClick={() =>
                    navigate({
                      to: '/login',
                      search: { redirect: undefined },
                    })
                  }
                  variant='default'
                >
                  Log in
                </Button>
                <Button
                  onClick={() => navigate({ to: '/register' })}
                  rightSection={<IconArrowRight size={16} />}
                >
                  Create account
                </Button>
              </Group>
            )}
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

function RootErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <Container py='xl' size='sm'>
      <Stack gap='md'>
        <Alert color='red' title='Something went wrong' variant='light'>
          {getErrorMessage(error, 'An unexpected error interrupted this page.')}
        </Alert>
        <Button onClick={() => reset()}>Try again</Button>
      </Stack>
    </Container>
  );
}
