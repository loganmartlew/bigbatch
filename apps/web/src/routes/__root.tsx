import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { HouseholdSelector } from '../components/household-selector';

export const Route = createRootRoute({
  component: RootLayout,
});

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/join',
];

function RootLayout() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const path = window.location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(r => path.startsWith(r));

  if (isLoading) {
    return <p>Loading…</p>;
  }

  if (!isAuthenticated && !isPublicRoute) {
    navigate({ to: '/login' });
    return null;
  }

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1>BigBatch</h1>
        {isAuthenticated && (
          <>
            <HouseholdSelector />
            <span>{user?.firstName}</span>
            <button onClick={() => logout()}>Log out</button>
          </>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
