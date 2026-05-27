import {
  Alert,
  Button,
  Container,
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

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/login' });
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
      await login(email, password);

      if (safeRedirect) {
        navigate({ href: safeRedirect, replace: true });
        return;
      }

      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size={420} py='xl'>
      <Title ta='center' order={2}>
        Welcome back
      </Title>
      <Text c='dimmed' size='sm' ta='center' mt='xs'>
        Don&apos;t have an account?{' '}
        <Link to='/register' search={{ redirect: safeRedirect }}>
          Register
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
              placeholder='Your password'
              required
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
            />
            <Link to='/forgot-password'>Forgot password?</Link>
            <Button type='submit' loading={loading} fullWidth>
              Log in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
