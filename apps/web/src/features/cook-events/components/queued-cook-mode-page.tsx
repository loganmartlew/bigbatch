import type { CookEventDetail } from '@bigbatch/shared';
import {
  Alert,
  Button,
  Card,
  Center,
  Checkbox,
  Collapse,
  Group,
  Loader,
  Progress,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconCheck, IconList, IconX } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CookEventEditorModal } from './cook-event-editor-modal';
import { useFinishQueuedCook, useQueuedCookMode } from '../api';

export function QueuedCookModePage({ queuedCookId }: { queuedCookId: number }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQueuedCookMode(queuedCookId);
  const finishQueuedCookMutation = useFinishQueuedCook();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showIngredients, setShowIngredients] = useState(true);
  const [finishedCookEvent, setFinishedCookEvent] =
    useState<CookEventDetail | null>(null);

  useEffect(() => {
    setCompletedSteps(new Set());
    setShowIngredients(true);
    setFinishedCookEvent(null);
  }, [queuedCookId]);

  if (isLoading) {
    return (
      <Center py='xl'>
        <Loader />
      </Center>
    );
  }

  if (!data || data.instructions.length === 0) {
    return (
      <Stack align='center' py='xl'>
        <Text>No instructions are available for this queued cook.</Text>
        <Button onClick={() => navigate({ to: '/cooks' })}>
          Back to cooks
        </Button>
      </Stack>
    );
  }

  const totalSteps = data.instructions.length;
  const progress = (completedSteps.size / totalSteps) * 100;

  const toggleStep = (stepId: number) => {
    setCompletedSteps(current => {
      const next = new Set(current);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  return (
    <Stack gap='lg'>
      {finishQueuedCookMutation.error instanceof Error ? (
        <Alert color='red' title='Could not finish cook'>
          {finishQueuedCookMutation.error.message}
        </Alert>
      ) : null}

      <Group justify='space-between' align='flex-start'>
        <div>
          <Title order={2}>{data.recipeName}</Title>
          <Text c='dimmed'>
            Queued cook mode for batch size {data.selectedBatchSize}
          </Text>
        </div>
        <Group>
          <Button
            variant='light'
            leftSection={<IconList size={16} />}
            onClick={() => setShowIngredients(current => !current)}
          >
            {showIngredients ? 'Hide ingredients' : 'Show ingredients'}
          </Button>
          <Button
            color='red'
            variant='subtle'
            leftSection={<IconX size={16} />}
            onClick={() => navigate({ to: '/cooks' })}
          >
            Exit
          </Button>
        </Group>
      </Group>

      <Stack gap={6}>
        <Progress color='orange' size='sm' value={progress} />
        <Text c='dimmed' size='sm' ta='center'>
          {completedSteps.size} / {totalSteps} steps completed
        </Text>
      </Stack>

      <Collapse in={showIngredients}>
        <Card withBorder padding='md'>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ingredient</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.ingredients.map(item => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.ingredientName}</Table.Td>
                  <Table.Td>
                    {item.requiredQuantity} {item.unit}
                  </Table.Td>
                  <Table.Td>{item.isSatisfied ? 'Ready' : 'Missing'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Collapse>

      <Stack gap='sm'>
        <Title order={3}>Steps</Title>
        <Stack gap='sm'>
          {data.instructions.map((step, index) => (
            <Card key={step.id} withBorder padding='md' radius='lg'>
              <Checkbox
                checked={completedSteps.has(step.id)}
                onChange={() => toggleStep(step.id)}
                size='md'
                label={
                  <Stack gap={4}>
                    <Text fw={600}>Step {step.stepNumber ?? index + 1}</Text>
                    <Text>{step.text}</Text>
                  </Stack>
                }
              />
            </Card>
          ))}
        </Stack>
      </Stack>

      <Group justify='end'>
        <Button
          color='teal'
          leftSection={<IconCheck size={16} />}
          loading={finishQueuedCookMutation.isPending}
          onClick={() =>
            finishQueuedCookMutation.mutate(queuedCookId, {
              onSuccess: result => {
                setFinishedCookEvent(result.cookEvent);
              },
            })
          }
        >
          Finish cook
        </Button>
      </Group>

      <CookEventEditorModal
        opened={finishedCookEvent != null}
        cookEvent={finishedCookEvent}
        title='Update cook event details'
        closeLabel='Return to cooks'
        submitLabel='Save and return'
        onClose={() => {
          setFinishedCookEvent(null);
          navigate({ to: '/cooks' });
        }}
        onSaved={() => {
          setFinishedCookEvent(null);
          navigate({ to: '/cooks' });
        }}
      />
    </Stack>
  );
}
