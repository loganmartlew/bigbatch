import { createRootRoute, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div>
      <header>
        <h1>BigBatch</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
