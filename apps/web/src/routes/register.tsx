import { createFileRoute } from '@tanstack/react-router';
import { RegisterForm } from '../features/auth/components/register-form';
import { redirectAuthenticatedUser } from '../features/auth/utils/route-guards';

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    redirectAuthenticatedUser(context);
  },
  component: RegisterPage,
});

function RegisterPage() {
  return <RegisterForm />;
}
