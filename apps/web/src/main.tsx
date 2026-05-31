import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import '@mantine/core/styles.css';
import { AuthProvider } from './lib/auth-context';
import { HouseholdProvider } from './lib/household-context';
import { createAppQueryClient } from './lib/query-client';
import type { RouterAppContext } from './lib/router-context';
import { routeTree } from './routeTree.gen';
import { theme } from './theme';
import { useAuth } from './lib/auth-context';
import { useHousehold } from './lib/household-context';

const queryClient = createAppQueryClient();

const router = createRouter({
  routeTree,
  context: {
    auth: {
      households: [],
      isAuthenticated: false,
      isLoading: true,
    },
    household: {
      activeHouseholdId: null,
    },
  } satisfies RouterAppContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppRouter() {
  const auth = useAuth();
  const household = useHousehold();

  useEffect(() => {
    void router.invalidate();
  }, [
    auth.households,
    auth.isAuthenticated,
    auth.isLoading,
    household.activeHouseholdId,
  ]);

  return (
    <RouterProvider
      context={{
        auth: {
          households: auth.households,
          isAuthenticated: auth.isAuthenticated,
          isLoading: auth.isLoading,
        },
        household: {
          activeHouseholdId: household.activeHouseholdId,
        },
      }}
      router={router}
    />
  );
}

function AppWithHouseholdProvider() {
  const auth = useAuth();

  return (
    <HouseholdProvider households={auth.households} isLoading={auth.isLoading}>
      <AppRouter />
    </HouseholdProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme='light'>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppWithHouseholdProvider />
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
