import { Button, Container, Group, Stack, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { IngredientForm } from '../../features/ingredients/components/ingredient-form';

export const Route = createFileRoute('/ingredients/new')({
  component: NewIngredientPage,
});

function NewIngredientPage() {
  const navigate = useNavigate();

  return (
    <Container size='sm' py='xl'>
      <Stack gap='md'>
        <Group>
          <Button
            variant='subtle'
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate({ to: '/ingredients' })}
          >
            Back
          </Button>
          <Title order={2}>New Ingredient</Title>
        </Group>

        <IngredientForm
          onCancel={() => navigate({ to: '/ingredients' })}
          onSuccess={() => navigate({ to: '/ingredients' })}
        />
      </Stack>
    </Container>
  );
}
