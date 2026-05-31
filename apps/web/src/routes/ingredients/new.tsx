import {
  Button,
  Container,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title,
  Divider,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import type { CreateIngredientInput } from '@bigbatch/shared';
import { UNITS } from '@bigbatch/shared';
import {
  useCreateIngredient,
  useShoppingCategories,
} from '../../features/ingredients/api';
import { OpenFoodFactsSearch } from '../../features/ingredients/components/off-search';

export const Route = createFileRoute('/ingredients/new')({
  component: NewIngredientPage,
});

function NewIngredientPage() {
  const navigate = useNavigate();
  const createMutation = useCreateIngredient();
  const { data: categories } = useShoppingCategories();

  const form = useForm<CreateIngredientInput>({
    defaultValues: {
      name: '',
      defaultUnit: 'g',
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      categoryId: undefined,
    },
  });

  const onSubmit = form.handleSubmit(async data => {
    await createMutation.mutateAsync(data);
    navigate({ to: '/ingredients' });
  });

  const handleOFFSelect = (result: {
    name: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }) => {
    form.setValue('name', result.name);
    if (result.calories != null) form.setValue('calories', result.calories);
    if (result.protein != null) form.setValue('protein', result.protein);
    if (result.carbs != null) form.setValue('carbs', result.carbs);
    if (result.fat != null) form.setValue('fat', result.fat);
  };

  const categoryOptions = (categories ?? []).map(c => ({
    value: String(c.id),
    label: c.name,
  }));

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
              value={form.watch('defaultUnit')}
              onChange={val => val && form.setValue('defaultUnit', val as any)}
            />

            <Divider label='Nutrition (per 100g)' labelPosition='left' />

            <Group grow>
              <NumberInput
                label='Calories'
                min={0}
                value={form.watch('calories') ?? ''}
                onChange={val =>
                  form.setValue(
                    'calories',
                    val === '' ? undefined : Number(val),
                  )
                }
              />
              <NumberInput
                label='Protein (g)'
                min={0}
                decimalScale={1}
                value={form.watch('protein') ?? ''}
                onChange={val =>
                  form.setValue('protein', val === '' ? undefined : Number(val))
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
                  form.setValue('carbs', val === '' ? undefined : Number(val))
                }
              />
              <NumberInput
                label='Fat (g)'
                min={0}
                decimalScale={1}
                value={form.watch('fat') ?? ''}
                onChange={val =>
                  form.setValue('fat', val === '' ? undefined : Number(val))
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
                form.setValue('categoryId', val ? Number(val) : undefined)
              }
            />

            <Divider
              label='Or import from OpenFoodFacts'
              labelPosition='left'
            />

            <OpenFoodFactsSearch onSelect={handleOFFSelect} />

            <Group justify='flex-end' mt='md'>
              <Button
                variant='default'
                onClick={() => navigate({ to: '/ingredients' })}
              >
                Cancel
              </Button>
              <Button type='submit' loading={createMutation.isPending}>
                Save Ingredient
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
