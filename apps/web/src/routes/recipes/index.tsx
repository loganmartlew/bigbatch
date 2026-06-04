import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Title,
  TextInput,
  Button,
  Group,
  Stack,
  Card,
  Text,
  Badge,
  SimpleGrid,
  MultiSelect,
  Loader,
  Center,
} from '@mantine/core';
import { IconSearch, IconPlus, IconClock } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useRecipes, useTags } from '../../features/recipes/api';

export const Route = createFileRoute('/recipes/')({
  component: RecipesPage,
});

function RecipesPage() {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    }),
    [search, selectedTags],
  );

  const { data: recipes, isLoading } = useRecipes(filters);
  const { data: tags } = useTags();

  const tagOptions = useMemo(
    () => (tags ?? []).map(t => ({ value: t.name, label: t.name })),
    [tags],
  );

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={2}>Recipes</Title>
        <Button
          component={Link}
          to='/recipes/new'
          leftSection={<IconPlus size={16} />}
        >
          New Recipe
        </Button>
      </Group>

      <Group>
        <TextInput
          placeholder='Search recipes...'
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        {tagOptions.length > 0 && (
          <MultiSelect
            placeholder='Filter by tags'
            data={tagOptions}
            value={selectedTags}
            onChange={setSelectedTags}
            clearable
            style={{ minWidth: 200 }}
          />
        )}
      </Group>

      {isLoading && (
        <Center py='xl'>
          <Loader />
        </Center>
      )}

      {recipes && recipes.length === 0 && (
        <Text c='dimmed' ta='center' py='xl'>
          No recipes yet. Create your first recipe!
        </Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
        {recipes?.map(recipe => (
          <Link
            key={recipe.id}
            to='/recipes/$recipeId'
            params={{ recipeId: String(recipe.id) }}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Card shadow='sm' padding='lg' radius='md' withBorder>
              <Text fw={600} size='lg' lineClamp={1}>
                {recipe.name}
              </Text>
              {recipe.description && (
                <Text size='sm' c='dimmed' lineClamp={2} mt={4}>
                  {recipe.description}
                </Text>
              )}
              <Group mt='sm' gap='xs'>
                {recipe.prepTime != null && (
                  <Badge
                    variant='light'
                    leftSection={<IconClock size={12} />}
                    size='sm'
                  >
                    Prep {recipe.prepTime}m
                  </Badge>
                )}
                {recipe.cookTime != null && (
                  <Badge
                    variant='light'
                    color='orange'
                    leftSection={<IconClock size={12} />}
                    size='sm'
                  >
                    Cook {recipe.cookTime}m
                  </Badge>
                )}
                <Badge variant='light' color='gray' size='sm'>
                  {recipe.batchSize} servings
                </Badge>
              </Group>
              {recipe.tags.length > 0 && (
                <Group mt='xs' gap={4}>
                  {recipe.tags.map(tag => (
                    <Badge key={tag} variant='dot' size='xs'>
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}
            </Card>
          </Link>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
