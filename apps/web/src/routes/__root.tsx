import {
  AppShell,
  Badge,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';
import { createRootRoute, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AppShell header={{ height: 84 }} padding="md">
      <AppShell.Header>
        <Container
          size="xl"
          style={{
            height: '100%',
          }}
        >
          <Group
            justify="space-between"
            style={{
              height: '100%',
            }}
          >
            <Stack gap={2}>
              <Group gap="xs">
                <Title order={3}>BigBatch</Title>
                <Badge
                  color="orange"
                  leftSection={<IconSparkles size={12} />}
                  variant="light"
                >
                  Web-first
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                A calmer, polished planning surface for bulk cooking.
              </Text>
            </Stack>

            <Group gap="sm" visibleFrom="sm">
              <Button component="a" href="#foundation" variant="default">
                Foundation
              </Button>
              <Button
                component="a"
                href="#roadmap"
                rightSection={<IconArrowRight size={16} />}
              >
                Roadmap
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
