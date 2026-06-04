import {
  Alert,
  Button,
  Container,
  Divider,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import type { UpdateIngredientInput } from '@bigbatch/shared';
import { UNITS } from '@bigbatch/shared';
import {
  useIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useShoppingCategories,
} from '../../features/ingredients/api';

export const Route = createFileRoute('/ingredients/$ingredientId/edit')({
  component: EditIngredientPage,
});

function EditIngredientPage() {
  const { ingredientId } = Route.useParams();
  const id = Number(ingredientId);
  const navigate = useNavigate();
  const { data: ingredient, isLoading, error } = useIngredient(id);
  const updateMutation = useUpdateIngredient(id);
  const deleteMutation = useDeleteIngredient();
  const { data: categories } = useShoppingCategories();

  const form = useForm<UpdateIngredientInput>({
    defaultValues: {},
  });

  useEffect(() => {
    if (ingredient) {
      form.reset({
        name: ingredient.name,
        defaultUnit: ingredient.defaultUnit as any,
        calories: ingredient.calories,
        protein: ingredient.protein,
        carbs: ingredient.carbs,
        fat: ingredient.fat,
        categoryId: ingredient.categoryId,
      });
    }
  }, [ingredient, form]);

  if (isLoading) {
    return (
      <Container size='sm' py='xl'>
        <Group justify='center'>
          <Loader />
        </Group>
      </Container>
    );
  }

  if (error || !ingredient) {
    return (
      <Container size='sm' py='xl'>
        <Alert color='red' title='Error'>
          Ingredient not found.
        </Alert>
      </Container>
    );
  }

  const onSubmit = form.handleSubmit(async data => {
    await updateMutation.mutateAsync(data);
    navigate({ to: '/ingredients' });
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    navigate({ to: '/ingredients' });
  };

  const categoryOptions = (categories ?? []).map(c => ({
    value: String(c.id),
    label: c.name,
  }));

  const deleteDisabled = deleteMutation.error?.message?.includes('used by');

  return (
    <Container size='sm' py='xl'>
      <Stack gap='md'>
        <Group justify='space-between'>
          <Group>
            <Button
              variant='subtle'
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate({ to: '/ingredients' })}
            >
              Back
            </Button>
            <Title order={2}>Edit Ingredient</Title>
          </Group>
          <Tooltip
            label='Ingredient is used by recipes and cannot be deleted'
            disabled={!deleteDisabled}
          >
            <Button
              color='red'
              variant='light'
              leftSection={<IconTrash size={16} />}
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Tooltip>
        </Group>

        {deleteMutation.error && (
          <Alert color='red' title='Cannot delete'>
            {deleteMutation.error.message}
          </Alert>
        )}

        <form onSubmit={onSubmit}>
          <Stack gap='md'>
            <TextInput
              label='Name'
              required
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />

            <Select
              label='Default Unit'
              data={UNITS.map(u => ({ value: u, label: u }))}
              value={form.watch('defaultUnit') ?? null}
              onChange={val => val && form.setValue('defaultUnit', val as any)}
            />

            <Divider label='Nutrition (per 100g)' labelPosition='left' />

            <Group grow>
              <NumberInput
                label='Calories'
                min={0}
                value={form.watch('calories') ?? ''}
                onChange={val =>
                  form.setValue('calories', val === '' ? null : Number(val))
                }
              />
              <NumberInput
                label='Protein (g)'
                min={0}
                decimalScale={1}
                value={form.watch('protein') ?? ''}
                onChange={val =>
                  form.setValue('protein', val === '' ? null : Number(val))
                }
              />
            </Group>

            <Group grow>
              <NumberInput
                label='Carbs (g)'
                min={0}
                decimalScale={1}
                value={form.watch('carbs') ?? ''}
                onChange={val =>
                  form.setValue('carbs', val === '' ? null : Number(val))
                }
              />
              <NumberInput
                label='Fat (g)'
                min={0}
                decimalScale={1}
                value={form.watch('fat') ?? ''}
                onChange={val =>
                  form.setValue('fat', val === '' ? null : Number(val))
                }
              />
            </Group>

            <Select
              label='Shopping Category'
              placeholder='None'
              clearable
              data={categoryOptions}
              value={
                form.watch('categoryId') != null
                  ? String(form.watch('categoryId'))
                  : null
              }
              onChange={val =>
                form.setValue('categoryId', val ? Number(val) : null)
              }
            />

            <Group justify='flex-end' mt='md'>
              <Button
                variant='default'
                onClick={() => navigate({ to: '/ingredients' })}
              >
                Cancel
              </Button>
              <Button type='submit' loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
