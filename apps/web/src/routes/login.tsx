import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '../features/auth/components/login-form';
import { redirectAuthenticatedUser } from '../features/auth/utils/route-guards';

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    redirectAuthenticatedUser(context);
  },
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();

  return <LoginForm redirectTo={redirect} />;
}
