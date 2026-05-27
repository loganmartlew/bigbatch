import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconApi,
  IconArrowRight,
  IconChefHat,
  IconCircleCheck,
  IconDeviceDesktop,
  IconPalette,
  IconShieldCheck,
  IconStack3,
} from '@tabler/icons-react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

type FeatureCard = {
  title: string;
  description: string;
  detail: string;
  icon: ReactNode;
};

const foundationCards: FeatureCard[] = [
  {
    title: 'Web experience first',
    description:
      'The active delivery scope is now the browser client, backed by the shared API and domain packages.',
    detail: 'Focus the build on the product loop people use today.',
    icon: <IconDeviceDesktop size={18} />,
  },
  {
    title: 'Mantine design system',
    description:
      'Layouts, typography, cards, and actions now sit on a single UI foundation instead of ad-hoc markup.',
    detail: 'Ship a more polished feel without slowing down feature work.',
    icon: <IconPalette size={18} />,
  },
  {
    title: 'Native apps later',
    description:
      'Future iOS and Android work remains on the roadmap, but it is intentionally separated from the current workspace.',
    detail: 'Keep the API client-agnostic and defer platform-specific effort.',
    icon: <IconApi size={18} />,
  },
];

const deliveryTracks: FeatureCard[] = [
  {
    title: 'Shared contracts',
    description:
      'Types, schemas, scaling logic, and shopping calculations stay in reusable shared packages.',
    detail: 'This keeps business rules consistent across the active codebase.',
    icon: <IconStack3 size={18} />,
  },
  {
    title: 'API hardening',
    description:
      'Security and validation remain first-class: schema validation, auth guards, rate limits, and structured errors.',
    detail: 'The Mantine shift does not relax the enabled AI-DLC extension rules.',
    icon: <IconShieldCheck size={18} />,
  },
  {
    title: 'Kitchen-centered UX',
    description:
      'The UI is being shaped around quick scanning, obvious next steps, and low-friction actions for real cooking sessions.',
    detail: 'Polish matters because this app will be opened while people are busy.',
    icon: <IconChefHat size={18} />,
  },
];

const roadmap = [
  'Unit 0: finish the revised web-first foundation',
  'Unit 1: auth and household flows',
  'Unit 2: ingredients and OpenFoodFacts search',
  'Unit 3: recipes, scaling, and cook mode',
  'Unit 4: shopping list generation and consolidation',
  'Unit 5: cook events and history',
];

function OverviewCard({ description, detail, icon, title }: FeatureCard) {
  return (
    <Card padding="lg" radius="lg" shadow="sm" withBorder>
      <Stack gap="md">
        <ThemeIcon color="orange" radius="md" size={42} variant="light">
          {icon}
        </ThemeIcon>
        <Stack gap={6}>
          <Title order={3}>{title}</Title>
          <Text>{description}</Text>
          <Text c="dimmed" size="sm">
            {detail}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

function HomePage() {
  return (
    <Container py="xl" size="xl">
      <Stack gap="xl">
        <Paper
          p="xl"
          radius="xl"
          shadow="xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,244,230,1) 0%, rgba(255,236,214,1) 45%, rgba(255,248,240,1) 100%)',
          }}
        >
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Stack gap="lg">
              <Group gap="sm">
                <Badge color="orange" variant="filled">
                  Current delivery
                </Badge>
                <Badge variant="light">Mantine foundation</Badge>
                <Badge variant="outline">Native deferred</Badge>
              </Group>

              <Stack gap="sm">
                <Title order={1}>
                  BigBatch now has a web-first foundation with a cleaner, more
                  intentional UI direction.
                </Title>
                <Text c="dimmed" size="lg">
                  The active plan focuses on a polished web experience, a stable
                  API, and shared domain logic. Future mobile clients stay on
                  the roadmap, but they no longer slow down the current phase.
                </Text>
              </Stack>

              <Group>
                <Button
                  component="a"
                  href="#roadmap"
                  rightSection={<IconArrowRight size={16} />}
                >
                  View roadmap
                </Button>
                <Button component="a" href="#foundation" variant="default">
                  Review foundation
                </Button>
              </Group>

              <List
                icon={
                  <ThemeIcon color="orange" radius="xl" size={22} variant="light">
                    <IconCircleCheck size={14} />
                  </ThemeIcon>
                }
                spacing="sm"
              >
                <List.Item>Active workspace: web, api, shared</List.Item>
                <List.Item>Mantine powers layout, hierarchy, and styling</List.Item>
                <List.Item>API remains ready for future native clients</List.Item>
              </List>
            </Stack>

            <Card id="foundation" padding="lg" radius="xl" shadow="sm" withBorder>
              <Stack gap="lg">
                <Stack gap={4}>
                  <Text c="dimmed" fw={600} size="sm" tt="uppercase">
                    Foundation snapshot
                  </Text>
                  <Title order={2}>What changed in the current plan</Title>
                </Stack>

                <SimpleGrid cols={1} spacing="md">
                  <OverviewCard
                    description="The current construction phase is focused on the browser experience."
                    detail="That keeps the surface area smaller while the product fundamentals take shape."
                    icon={<IconDeviceDesktop size={18} />}
                    title="Web-first delivery"
                  />
                  <OverviewCard
                    description="Mantine replaces the bare scaffold with a cohesive design baseline."
                    detail="Use it to keep pages visually consistent as features arrive."
                    icon={<IconPalette size={18} />}
                    title="Polished UI system"
                  />
                </SimpleGrid>
              </Stack>
            </Card>
          </SimpleGrid>
        </Paper>

        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" fw={600} size="sm" tt="uppercase">
                Active delivery tracks
              </Text>
              <Title order={2}>The revised foundation keeps product work moving</Title>
            </div>
            <Badge color="orange" variant="light">
              Mantine + Fastify + shared domain logic
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 3 }}>
            {foundationCards.map((card) => (
              <OverviewCard key={card.title} {...card} />
            ))}
          </SimpleGrid>
        </Stack>

        <Stack gap="md">
          <div>
            <Text c="dimmed" fw={600} size="sm" tt="uppercase">
              Why this direction
            </Text>
            <Title order={2}>Narrower scope, stronger core experience</Title>
          </div>

          <SimpleGrid cols={{ base: 1, md: 3 }}>
            {deliveryTracks.map((card) => (
              <OverviewCard key={card.title} {...card} />
            ))}
          </SimpleGrid>
        </Stack>

        <Paper id="roadmap" p="xl" radius="xl" shadow="sm" withBorder>
          <Stack gap="lg">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" fw={600} size="sm" tt="uppercase">
                  Roadmap
                </Text>
                <Title order={2}>The next units stay focused on usable flow</Title>
              </div>
              <Badge variant="light">Web-first AI-DLC sequence</Badge>
            </Group>

            <List
              icon={
                <ThemeIcon color="orange" radius="xl" size={22} variant="light">
                  <IconCircleCheck size={14} />
                </ThemeIcon>
              }
              spacing="md"
            >
              {roadmap.map((item) => (
                <List.Item key={item}>
                  <Text>{item}</Text>
                </List.Item>
              ))}
            </List>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
