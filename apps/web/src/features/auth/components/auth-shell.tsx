import type { ReactNode } from 'react';
import { Badge, Container, Paper, Stack, Text, Title } from '@mantine/core';

interface AuthShellProps {
  badge?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  badge,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <Container py={{ base: 'xl', md: 64 }} size='sm'>
      <Paper
        p={{ base: 'lg', md: 'xl' }}
        radius='xl'
        shadow='md'
        style={{
          background:
            'linear-gradient(180deg, rgba(255,250,243,0.98) 0%, rgba(255,255,255,0.98) 100%)',
        }}
        withBorder
      >
        <Stack gap='lg'>
          <Stack gap='sm'>
            {badge ? (
              <Badge color='orange' variant='light' w='fit-content'>
                {badge}
              </Badge>
            ) : null}
            <Stack gap={6}>
              <Title order={1}>{title}</Title>
              <Text c='dimmed'>{description}</Text>
            </Stack>
          </Stack>

          {children}

          {footer ? (
            <Text c='dimmed' size='sm'>
              {footer}
            </Text>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  );
}
