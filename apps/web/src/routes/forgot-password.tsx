import { Center, Loader } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordForm } from '../features/auth/components/forgot-password-form';
import { AuthShell } from '../features/auth/components/auth-shell';
import { redirectAuthenticatedUser } from '../features/auth/utils/route-guards';
import { useAuth } from '../lib/auth-context';

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: ({ context }) => {
    redirectAuthenticatedUser(context);
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const auth = useAuth();

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

  return <ForgotPasswordForm />;
}
