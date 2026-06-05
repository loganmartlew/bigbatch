import type { CookEventDetail } from '@bigbatch/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  NumberInput,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconChefHat,
  IconEdit,
  IconHistory,
  IconShoppingCart,
  IconX,
} from '@tabler/icons-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { CookEventEditorModal } from './cook-event-editor-modal';
import {
  useCancelQueuedCook,
  useCooksDashboard,
  useUpdateQueuedCookBatchSize,
} from '../api';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function CooksDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useCooksDashboard();
  const updateBatchSizeMutation = useUpdateQueuedCookBatchSize();
  const cancelQueuedCookMutation = useCancelQueuedCook();
  const [draftBatchSizes, setDraftBatchSizes] = useState<
    Record<number, number>
  >({});
  const [editingCookEvent, setEditingCookEvent] =
    useState<CookEventDetail | null>(null);

  if (isLoading) {
    return (
      <Center py='xl'>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap='lg'>
      {updateBatchSizeMutation.error instanceof Error ? (
        <Alert color='red' title='Could not update queued cook'>
          {updateBatchSizeMutation.error.message}
        </Alert>
      ) : null}

      {cancelQueuedCookMutation.error instanceof Error ? (
        <Alert color='red' title='Could not cancel queued cook'>
          {cancelQueuedCookMutation.error.message}
        </Alert>
      ) : null}

      <Group justify='space-between' align='flex-end'>
        <div>
          <Title order={2}>Cooks</Title>
          <Text c='dimmed'>
            Track queued meals, ingredient readiness, and recent cook history.
          </Text>
        </div>
        <Badge color='orange' variant='light'>
          {data?.queue.length ?? 0} queued
        </Badge>
      </Group>

      <Stack gap='md'>
        <Group gap='xs'>
          <IconShoppingCart size={18} />
          <Title order={3}>Queued cooks</Title>
        </Group>

        {data && data.queue.length > 0 ? (
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing='md'>
            {data.queue.map(item => {
              const draftBatchSize =
                draftBatchSizes[item.id] ?? item.selectedBatchSize;
              const progress = item.requiredIngredientsCount
                ? (item.satisfiedIngredientsCount /
                    item.requiredIngredientsCount) *
                  100
                : 0;

              return (
                <Card key={item.id} withBorder padding='lg' radius='lg'>
                  <Stack gap='md'>
                    <Group justify='space-between' align='flex-start'>
                      <div>
                        <Group gap='xs'>
                          <Title order={4}>{item.recipeName}</Title>
                          <Badge
                            color={
                              item.state === 'readyToCook' ? 'teal' : 'yellow'
                            }
                            variant='light'
                          >
                            {item.state === 'readyToCook'
                              ? 'Ready to cook'
                              : 'Gathering ingredients'}
                          </Badge>
                        </Group>
                        <Text c='dimmed' size='sm'>
                          Queued by {item.createdByName} on{' '}
                          {formatDateTime(item.createdAt)}
                        </Text>
                      </div>
                      <Link
                        to='/recipes/$recipeId'
                        params={{ recipeId: String(item.recipeId) }}
                      >
                        <Button variant='subtle' size='compact-sm'>
                          Open recipe
                        </Button>
                      </Link>
                    </Group>

                    <Stack gap={6}>
                      <Group justify='space-between'>
                        <Text size='sm' fw={500}>
                          Ingredients ready
                        </Text>
                        <Text size='sm' c='dimmed'>
                          {item.satisfiedIngredientsCount} /{' '}
                          {item.requiredIngredientsCount}
                        </Text>
                      </Group>
                      <Progress
                        color={item.state === 'readyToCook' ? 'teal' : 'orange'}
                        value={progress}
                      />
                    </Stack>

                    <Group align='flex-end'>
                      <NumberInput
                        label='Batch size'
                        min={1}
                        value={draftBatchSize}
                        onChange={value => {
                          if (typeof value === 'number') {
                            setDraftBatchSizes(current => ({
                              ...current,
                              [item.id]: value,
                            }));
                          }
                        }}
                        disabled={item.state !== 'gatheringIngredients'}
                        style={{ width: 140 }}
                      />
                      <Button
                        variant='light'
                        loading={updateBatchSizeMutation.isPending}
                        disabled={
                          item.state !== 'gatheringIngredients' ||
                          draftBatchSize === item.selectedBatchSize
                        }
                        onClick={() =>
                          updateBatchSizeMutation.mutate({
                            queuedCookId: item.id,
                            input: { targetBatchSize: draftBatchSize },
                          })
                        }
                      >
                        Update batch size
                      </Button>
                    </Group>

                    <Group justify='space-between'>
                      <Button
                        leftSection={<IconChefHat size={16} />}
                        disabled={item.state !== 'readyToCook'}
                        onClick={() =>
                          navigate({
                            to: '/cooks/$queuedCookId',
                            params: { queuedCookId: String(item.id) },
                          })
                        }
                      >
                        Start cooking
                      </Button>
                      <Button
                        color='red'
                        variant='subtle'
                        leftSection={<IconX size={16} />}
                        loading={cancelQueuedCookMutation.isPending}
                        onClick={() =>
                          cancelQueuedCookMutation.mutate({
                            queuedCookId: item.id,
                            input: { removeShoppingItems: true },
                          })
                        }
                      >
                        Cancel and clean up
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        ) : (
          <Card withBorder padding='xl' radius='lg'>
            <Stack gap='sm' align='center'>
              <Text fw={600}>No cooks queued yet.</Text>
              <Text c='dimmed' ta='center'>
                Queue a recipe from its detail page to track shopping readiness
                and cook it later.
              </Text>
              <Link to='/recipes'>
                <Button variant='light'>Browse recipes</Button>
              </Link>
            </Stack>
          </Card>
        )}
      </Stack>

      <Stack gap='md'>
        <Group gap='xs'>
          <IconHistory size={18} />
          <Title order={3}>Recent history</Title>
        </Group>

        {data && data.history.length > 0 ? (
          <Stack gap='sm'>
            {data.history.map(item => (
              <Card key={item.id} withBorder padding='lg' radius='lg'>
                <Group justify='space-between' align='flex-start'>
                  <div>
                    <Group gap='xs'>
                      <Title order={4}>{item.recipeName}</Title>
                      <Badge variant='light'>Batch size {item.batchSize}</Badge>
                    </Group>
                    <Text c='dimmed' size='sm'>
                      Cooked by {item.userDisplayName} on{' '}
                      {formatDate(item.date)}
                    </Text>
                    {item.notes ? (
                      <Text mt='xs' size='sm'>
                        {item.notes}
                      </Text>
                    ) : null}
                  </div>
                  <Group>
                    <Button
                      variant='subtle'
                      size='compact-sm'
                      leftSection={<IconEdit size={14} />}
                      onClick={() => setEditingCookEvent(item)}
                    >
                      Edit details
                    </Button>
                    <Link
                      to='/recipes/$recipeId'
                      params={{ recipeId: String(item.recipeId) }}
                    >
                      <Button variant='subtle' size='compact-sm'>
                        View recipe
                      </Button>
                    </Link>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Card withBorder padding='xl' radius='lg'>
            <Text c='dimmed'>Finished cooks will appear here.</Text>
          </Card>
        )}
      </Stack>

      <CookEventEditorModal
        opened={editingCookEvent != null}
        cookEvent={editingCookEvent}
        onClose={() => setEditingCookEvent(null)}
        onSaved={() => setEditingCookEvent(null)}
      />
    </Stack>
  );
}
