import {
  AppShell,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Title,
} from '@mantine/core';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';
import {
  Link,
  createRootRoute,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { HouseholdSelector } from '../components/household-selector';

export const Route = createRootRoute({
  component: RootLayout,
});

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/join',
];

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some(route =>
    route === '/'
      ? pathname === route
      : pathname === route || pathname.startsWith(`${route}/`),
  );
}

function RootLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isPublicRoute = isPublicPath(location.pathname);
  const showPublicAuthActions = !isAuthenticated && location.pathname === '/';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      navigate({
        to: '/login',
        search: { redirect },
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, isPublicRoute, navigate]);

  if (isLoading && !isPublicRoute) {
    return (
      <Center h='100vh'>
        <Loader size='lg' />
      </Center>
    );
  }

  return (
    <AppShell header={{ height: 64 }} padding='md'>
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
            <Group gap='xs'>
              <Title order={3}>BigBatch</Title>
              <Badge
                color='orange'
                leftSection={<IconSparkles size={12} />}
                variant='light'
                visibleFrom='sm'
              >
                Web-first
              </Badge>
            </Group>

            <Group gap='sm'>
              {isAuthenticated && <HouseholdSelector />}
              {showPublicAuthActions && (
                <>
                  <Button
                    component={Link}
                    to='/login'
                    variant='default'
                    size='sm'
                  >
                    Log in
                  </Button>
                  <Button
                    component={Link}
                    to='/register'
                    size='sm'
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Sign up
                  </Button>
                </>
              )}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
