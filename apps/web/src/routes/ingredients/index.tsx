import { useState, useMemo } from 'react';
import {
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  ScrollArea,
  Loader,
  Alert,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconSearch, IconShoppingCart } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useIngredients } from '../../features/ingredients/api';
import { AddIngredientModal } from '../../features/shopping/components/add-ingredient-modal';

export const Route = createFileRoute('/ingredients/')({
  component: IngredientsPage,
});

function IngredientsPage() {
  const navigate = useNavigate();
  const { data: ingredients, isLoading, error } = useIngredients();
  const [search, setSearch] = useState('');
  const [addToListIngredientId, setAddToListIngredientId] = useState<
    number | null
  >(null);

  const filtered = useMemo(() => {
    if (!ingredients) return [];
    if (!search.trim()) return ingredients;
    const lower = search.toLowerCase();
    return ingredients.filter(i => i.name.toLowerCase().includes(lower));
  }, [ingredients, search]);

  if (isLoading) {
    return (
      <Container size='sm' py='xl'>
        <Group justify='center'>
          <Loader />
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='sm' py='xl'>
        <Alert color='red' title='Error'>
          Failed to load ingredients.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='sm' py='xl'>
      <Stack gap='md'>
        <Group justify='space-between'>
          <Title order={2}>Ingredient Library</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate({ to: '/ingredients/new' })}
          >
            New Ingredient
          </Button>
        </Group>

        <TextInput
          placeholder='Search ingredients...'
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
        />

        <ScrollArea h='calc(100vh - 260px)'>
          <Stack gap='xs'>
            {filtered.length === 0 && (
              <Text c='dimmed' ta='center' py='xl'>
                {ingredients?.length === 0
                  ? 'No ingredients yet. Create your first one!'
                  : 'No ingredients match your search.'}
              </Text>
            )}
            {filtered.map(ingredient => (
              <Paper
                key={ingredient.id}
                p='sm'
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  navigate({
                    to: '/ingredients/$ingredientId/edit',
                    params: { ingredientId: String(ingredient.id) },
                  })
                }
              >
                <Group justify='space-between' wrap='nowrap'>
                  <Stack gap={2}>
                    <Group gap='xs'>
                      <Text fw={500}>{ingredient.name}</Text>
                      {ingredient.categoryName && (
                        <Badge size='xs' variant='light'>
                          {ingredient.categoryName}
                        </Badge>
                      )}
                    </Group>
                    <Group gap='xs'>
                      <Text size='xs' c='dimmed'>
                        per 100
                        {ingredient.defaultUnit === 'ml' ||
                        ingredient.defaultUnit === 'l'
                          ? 'ml'
                          : 'g'}
                      </Text>
                      <NutritionSummary
                        calories={ingredient.calories}
                        protein={ingredient.protein}
                        carbs={ingredient.carbs}
                        fat={ingredient.fat}
                      />
                    </Group>
                  </Stack>
                  <ActionIcon
                    variant='subtle'
                    color='blue'
                    aria-label={`Add ${ingredient.name} to shopping list`}
                    onClick={e => {
                      e.stopPropagation();
                      setAddToListIngredientId(ingredient.id);
                    }}
                  >
                    <IconShoppingCart size={16} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>

      <AddIngredientModal
        opened={addToListIngredientId != null}
        onClose={() => setAddToListIngredientId(null)}
        presetIngredientId={addToListIngredientId ?? undefined}
      />
    </Container>
  );
}

function NutritionSummary({
  calories,
  protein,
  carbs,
  fat,
}: {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}) {
  const parts: string[] = [];
  if (calories != null) parts.push(`${Math.round(calories)} kcal`);
  if (protein != null) parts.push(`${Math.round(protein)}g P`);
  if (carbs != null) parts.push(`${Math.round(carbs)}g C`);
  if (fat != null) parts.push(`${Math.round(fat)}g F`);

  if (parts.length === 0) {
    return (
      <Text size='xs' c='dimmed'>
        No nutrition data
      </Text>
    );
  }

  return (
    <Text size='xs' c='dimmed'>
      {parts.join(' · ')}
    </Text>
  );
}
