import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconShoppingCart, IconTrash } from '@tabler/icons-react';
import { useClearShoppingList, useShoppingList } from '../api';
import { splitShoppingList } from '../model';
import { AddIngredientModal } from './add-ingredient-modal';
import { ClearShoppingListModal } from './clear-shopping-list-modal';
import { ShoppingCategoryGroup } from './shopping-category-group';
import { ShoppingDoneSection } from './shopping-done-section';

export function ShoppingPage() {
  const { data, isLoading, error } = useShoppingList();
  const clearList = useClearShoppingList();
  const sections = splitShoppingList(data);

  const [addIngredientOpen, addIngredientActions] = useDisclosure(false);
  const [clearConfirmOpen, clearConfirmActions] = useDisclosure(false);

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
          Failed to load shopping list.
        </Alert>
      </Container>
    );
  }

  const totalItems = data?.totalItems ?? 0;
  const hasAnyItems = totalItems > 0;
  const hasActiveItems = sections.activeCount > 0;

  return (
    <Container size='sm' py='xl'>
      <Stack gap='md'>
        <Group justify='space-between'>
          <Group gap='sm'>
            <Title order={2}>Shopping List</Title>
            {hasAnyItems ? <Badge variant='filled'>{totalItems}</Badge> : null}
          </Group>

          <Group gap='sm'>
            <Button
              leftSection={<IconShoppingCart size={16} />}
              variant='default'
              onClick={addIngredientActions.open}
            >
              Add Ingredient
            </Button>
            {hasAnyItems ? (
              <Button
                leftSection={<IconTrash size={16} />}
                color='red'
                variant='light'
                onClick={clearConfirmActions.open}
              >
                Clear List
              </Button>
            ) : null}
          </Group>
        </Group>

        {!hasAnyItems ? (
          <Paper withBorder p='xl' radius='md' ta='center'>
            <Stack align='center' gap='sm'>
              <IconShoppingCart size={40} color='var(--mantine-color-dimmed)' />
              <Text c='dimmed'>Your shopping list is empty.</Text>
              <Text c='dimmed' size='sm'>
                Add ingredients manually or from a recipe.
              </Text>
              <Button onClick={addIngredientActions.open}>
                Add Ingredient
              </Button>
            </Stack>
          </Paper>
        ) : (
          <>
            {hasActiveItems ? (
              <Stack gap='md'>
                {sections.activeGroups.map((group, index) => (
                  <ShoppingCategoryGroup
                    key={group.categoryId ?? `uncategorized-${index}`}
                    group={group}
                  />
                ))}
              </Stack>
            ) : (
              <Paper withBorder p='lg' radius='md'>
                <Stack gap='xs'>
                  <Text fw={600}>All active items are done.</Text>
                  <Text size='sm' c='dimmed'>
                    Restore an item from Done or add something new to keep
                    shopping.
                  </Text>
                </Stack>
              </Paper>
            )}

            <ShoppingDoneSection items={sections.doneItems} />
          </>
        )}
      </Stack>

      <AddIngredientModal
        opened={addIngredientOpen}
        onClose={addIngredientActions.close}
      />

      <ClearShoppingListModal
        opened={clearConfirmOpen}
        onClose={clearConfirmActions.close}
        isPending={clearList.isPending}
        onConfirm={async () => {
          await clearList.mutateAsync();
          clearConfirmActions.close();
        }}
      />
    </Container>
  );
}
