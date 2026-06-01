import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Title,
  Text,
  Stack,
  Group,
  Button,
  Card,
  Checkbox,
  Collapse,
  Table,
  Progress,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconX,
  IconList,
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useRecipe } from '../../features/recipes/api';

export const Route = createFileRoute('/recipes/$recipeId/cook')({
  component: CookModePage,
});

function CookModePage() {
  const { recipeId } = Route.useParams();
  const navigate = useNavigate();
  const id = Number(recipeId);
  const { data: recipe, isLoading } = useRecipe(id);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showIngredients, setShowIngredients] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // Request wake lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        }
      } catch {
        // Wake lock not available or denied
      }
    }
    requestWakeLock();
    return () => {
      lock?.release();
      setWakeLock(null);
    };
  }, []);

  // Re-acquire wake lock on visibility change
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const totalSteps = recipe?.instructions.length ?? 0;

  const toggleStep = useCallback((idx: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const goNext = () => setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 0));

  const exitCookMode = () => {
    wakeLock?.release();
    navigate({ to: '/recipes/$recipeId', params: { recipeId } });
  };

  if (isLoading) {
    return (
      <Center py='xl'>
        <Loader />
      </Center>
    );
  }

  if (!recipe || recipe.instructions.length === 0) {
    return (
      <Stack align='center' py='xl'>
        <Text>No instructions available for cook mode.</Text>
        <Button onClick={exitCookMode}>Back to Recipe</Button>
      </Stack>
    );
  }

  const progress = (completedSteps.size / totalSteps) * 100;
  const step = recipe.instructions[currentStep];

  return (
    <Stack style={{ minHeight: '100vh', padding: 'var(--mantine-spacing-md)' }}>
      {/* Header */}
      <Group justify='space-between'>
        <Title order={3} lineClamp={1}>
          {recipe.name}
        </Title>
        <Group>
          <Button
            variant='subtle'
            leftSection={<IconList size={16} />}
            onClick={() => setShowIngredients(o => !o)}
          >
            Ingredients
          </Button>
          <Button
            variant='subtle'
            color='red'
            leftSection={<IconX size={16} />}
            onClick={exitCookMode}
          >
            Exit
          </Button>
        </Group>
      </Group>

      <Progress value={progress} size='sm' />
      <Text size='xs' c='dimmed' ta='center'>
        {completedSteps.size} / {totalSteps} steps completed
      </Text>

      {/* Ingredients sidebar */}
      <Collapse in={showIngredients}>
        <Card withBorder padding='sm' mb='md'>
          <Table>
            <Table.Tbody>
              {recipe.ingredients.map(ing => (
                <Table.Tr key={ing.id}>
                  <Table.Td>{ing.ingredientName}</Table.Td>
                  <Table.Td>
                    {ing.quantity} {ing.unit}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Collapse>

      {/* Current step */}
      <Card withBorder padding='xl' style={{ flex: 1 }}>
        <Stack align='center' justify='center' style={{ minHeight: 200 }}>
          <Text size='sm' c='dimmed'>
            Step {currentStep + 1} of {totalSteps}
          </Text>
          <Text size='xl' ta='center' fw={500}>
            {step?.text}
          </Text>
          <Checkbox
            label='Done'
            checked={completedSteps.has(currentStep)}
            onChange={() => toggleStep(currentStep)}
            size='lg'
            mt='md'
          />
        </Stack>
      </Card>

      {/* Navigation */}
      <Group justify='space-between'>
        <Button
          variant='light'
          leftSection={<IconArrowLeft size={16} />}
          onClick={goPrev}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          variant='light'
          rightSection={<IconArrowRight size={16} />}
          onClick={goNext}
          disabled={currentStep === totalSteps - 1}
        >
          Next
        </Button>
      </Group>
    </Stack>
  );
}
