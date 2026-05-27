import {
  Anchor,
  Button,
  Container,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconMailCheck } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../lib/api-client';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Ignore — always show success to prevent enumeration
    }
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <Container size={420} py='xl'>
        <Paper withBorder shadow='md' p='xl' radius='md' ta='center'>
          <IconMailCheck size={48} stroke={1.5} />
          <Title order={3} mt='md'>
            Check your email
          </Title>
          <Text c='dimmed' size='sm' mt='xs'>
            If an account with that email exists, a password reset link has been
            sent.
          </Text>
          <Anchor
            component={Link}
            to='/login'
            size='sm'
            mt='md'
            display='inline-block'
          >
            Back to login
          </Anchor>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} py='xl'>
      <Title ta='center' order={2}>
        Forgot your password?
      </Title>
      <Text c='dimmed' size='sm' ta='center' mt='xs'>
        Enter your email and we&apos;ll send a reset link.
      </Text>

      <Paper withBorder shadow='md' p='xl' mt='lg' radius='md'>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label='Email'
              placeholder='you@example.com'
              type='email'
              required
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
            />
            <Button type='submit' loading={loading} fullWidth>
              Send reset link
            </Button>
            <Anchor component={Link} to='/login' size='sm' ta='center'>
              Back to login
            </Anchor>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
