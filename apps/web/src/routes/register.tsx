import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/register' });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const safeRedirect =
    redirect && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, firstName, lastName);

      if (safeRedirect?.startsWith('/join')) {
        navigate({ href: safeRedirect, replace: true });
        return;
      }

      navigate({ to: '/onboarding' });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size={420} py='xl'>
      <Title ta='center' order={2}>
        Create your account
      </Title>
      <Text c='dimmed' size='sm' ta='center' mt='xs'>
        Already have an account?{' '}
        <Link to='/login' search={{ redirect: safeRedirect }}>
          Log in
        </Link>
      </Text>

      <Paper withBorder shadow='md' p='xl' mt='lg' radius='md'>
        <form onSubmit={handleSubmit}>
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
            <Group grow>
              <TextInput
                label='First name'
                placeholder='Jane'
                required
                value={firstName}
                onChange={e => setFirstName(e.currentTarget.value)}
              />
              <TextInput
                label='Last name'
                placeholder='Doe'
                required
                value={lastName}
                onChange={e => setLastName(e.currentTarget.value)}
              />
            </Group>
            <TextInput
              label='Email'
              placeholder='you@example.com'
              type='email'
              required
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label='Password'
              placeholder='At least 8 characters'
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
            />
            <Button type='submit' loading={loading} fullWidth>
              Register
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
