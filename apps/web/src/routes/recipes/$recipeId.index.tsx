import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Alert,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Card,
  NumberInput,
  List,
  Table,
  Divider,
  Loader,
  Center,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconEdit,
  IconCopy,
  IconTrash,
  IconChefHat,
  IconClock,
  IconDots,
} from '@tabler/icons-react';
import { useState } from 'react';
import {
  useRecipe,
  useDuplicateRecipe,
  useDeleteRecipe,
} from '../../features/recipes/api';
import { scaleQuantity, computePerServing } from '@bigbatch/shared';
import type { NutritionInfo } from '@bigbatch/shared';
import { ConfirmDeleteRecipeModal } from '../../features/recipes/components/confirm-delete-recipe-modal';

export const Route = createFileRoute('/recipes/$recipeId/')({
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { recipeId } = Route.useParams();
  const navigate = useNavigate();
  const id = Number(recipeId);
  const { data: recipe, isLoading } = useRecipe(id);
  const duplicateMutation = useDuplicateRecipe();
  const deleteMutation = useDeleteRecipe();
  const [servings, setServings] = useState<number | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);

  if (isLoading) {
    return (
      <Center py='xl'>
        <Loader />
      </Center>
    );
  }

  if (!recipe) {
    return <Text>Recipe not found</Text>;
  }

  const targetServings = servings ?? recipe.batchSize;
  const scaleFactor = targetServings / recipe.batchSize;

  const perServing: NutritionInfo | null = recipe.nutrition
    ? computePerServing(recipe.nutrition, recipe.batchSize)
    : null;

  const handleDuplicate = () => {
    duplicateMutation.mutate(id, {
      onSuccess: data => {
        navigate({
          to: '/recipes/$recipeId',
          params: { recipeId: String(data.id) },
        });
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteOpened(false);
        navigate({ to: '/recipes' });
      },
    });
  };

  return (
    <Stack>
      {duplicateMutation.error instanceof Error ? (
        <Alert color='red' title='Could not duplicate recipe'>
          {duplicateMutation.error.message}
        </Alert>
      ) : null}

      {deleteMutation.error instanceof Error ? (
        <Alert color='red' title='Could not delete recipe'>
          {deleteMutation.error.message}
        </Alert>
      ) : null}

      <Group justify='space-between' align='flex-start'>
        <div>
          <Title order={2}>{recipe.name}</Title>
          {recipe.description && (
            <Text c='dimmed' mt={4}>
              {recipe.description}
            </Text>
          )}
          {recipe.source && (
            <Text size='sm' c='dimmed' fs='italic' mt={2}>
              Source: {recipe.source}
            </Text>
          )}
        </div>
        <Group>
          <Link to='/recipes/$recipeId/cook' params={{ recipeId }}>
            <Button leftSection={<IconChefHat size={16} />} variant='filled'>
              Cook
            </Button>
          </Link>
          <Link to='/recipes/$recipeId/edit' params={{ recipeId }}>
            <Button leftSection={<IconEdit size={16} />} variant='light'>
              Edit
            </Button>
          </Link>
          <Menu position='bottom-end'>
            <Menu.Target>
              <ActionIcon variant='subtle'>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={handleDuplicate}
                disabled={duplicateMutation.isPending}
              >
                Duplicate
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color='red'
                onClick={() => setDeleteOpened(true)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Group gap='md'>
        {recipe.prepTime != null && (
          <Badge variant='light' leftSection={<IconClock size={12} />}>
            Prep {recipe.prepTime}m
          </Badge>
        )}
        {recipe.cookTime != null && (
          <Badge
            variant='light'
            color='orange'
            leftSection={<IconClock size={12} />}
          >
            Cook {recipe.cookTime}m
          </Badge>
        )}
        {recipe.tags.map(tag => (
          <Badge key={tag} variant='dot'>
            {tag}
          </Badge>
        ))}
      </Group>

      <Divider />

      <Group>
        <Text fw={500}>Servings:</Text>
        <NumberInput
          value={targetServings}
          onChange={v =>
            setServings(typeof v === 'number' ? v : recipe.batchSize)
          }
          min={1}
          max={999}
          style={{ width: 80 }}
        />
        {servings != null && servings !== recipe.batchSize && (
          <Button variant='subtle' size='xs' onClick={() => setServings(null)}>
            Reset
          </Button>
        )}
      </Group>

      {recipe.ingredients.length > 0 && (
        <Card withBorder padding='md'>
          <Title order={4} mb='sm'>
            Ingredients
          </Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ingredient</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Unit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recipe.ingredients.map(ing => (
                <Table.Tr key={ing.id}>
                  <Table.Td>{ing.ingredientName}</Table.Td>
                  <Table.Td>
                    {scaleFactor !== 1
                      ? scaleQuantity(
                          ing.quantity,
                          recipe.batchSize,
                          targetServings,
                        ).toFixed(1)
                      : ing.quantity}
                  </Table.Td>
                  <Table.Td>{ing.unit}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {recipe.instructions.length > 0 && (
        <Card withBorder padding='md'>
          <Title order={4} mb='sm'>
            Instructions
          </Title>
          <List type='ordered' spacing='sm'>
            {recipe.instructions.map(step => (
              <List.Item key={step.id}>{step.text}</List.Item>
            ))}
          </List>
        </Card>
      )}

      {recipe.nutrition && perServing && (
        <Card withBorder padding='md'>
          <Title order={4} mb='sm'>
            Nutrition
          </Title>
          <Group grow>
            <NutritionColumn
              label='Total'
              nutrition={recipe.nutrition}
              scale={scaleFactor}
            />
            <NutritionColumn
              label='Per serving'
              nutrition={perServing}
              scale={1}
            />
          </Group>
        </Card>
      )}

      <ConfirmDeleteRecipeModal
        opened={deleteOpened}
        recipeName={recipe.name}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteOpened(false)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}

function NutritionColumn({
  label,
  nutrition,
  scale,
}: {
  label: string;
  nutrition: NutritionInfo;
  scale: number;
}) {
  return (
    <Stack gap={4} align='center'>
      <Text fw={600} size='sm'>
        {label}
      </Text>
      <Text size='sm'>{Math.round(nutrition.calories * scale)} kcal</Text>
      <Text size='xs' c='dimmed'>
        P: {(nutrition.protein * scale).toFixed(1)}g | C:{' '}
        {(nutrition.carbs * scale).toFixed(1)}g | F:{' '}
        {(nutrition.fat * scale).toFixed(1)}g
      </Text>
    </Stack>
  );
}
