import { Alert, Center, Loader } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { AuthShell } from '../features/auth/components/auth-shell';
import { ResetPasswordForm } from '../features/auth/components/reset-password-form';
import { redirectAuthenticatedUser } from '../features/auth/utils/route-guards';
import { useAuth } from '../lib/auth-context';

export const Route = createFileRoute('/reset-password')({
  beforeLoad: ({ context }) => {
    redirectAuthenticatedUser(context);
  },
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const auth = useAuth();
  const { token } = Route.useSearch();

  if (auth.isLoading) {
    return (
      <AuthShell
        badge='Session'
        description='Checking whether you already have an active session.'
        title='Loading your account'
      >
        <Center py='xl'>
          <Loader color='orange' />
        </Center>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <AuthShell
        badge='Invalid link'
        description='This reset link is missing the token BigBatch needs to verify the request.'
        title='Reset link unavailable'
      >
        <Alert color='red' title='No reset token found' variant='light'>
          Request a new password reset link and try again.
        </Alert>
      </AuthShell>
    );
  }

  return <ResetPasswordForm token={token} />;
}
