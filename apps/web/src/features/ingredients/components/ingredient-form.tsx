import type {
  CreateIngredientInput,
  IngredientResponse,
} from '@bigbatch/shared';
import { UNITS } from '@bigbatch/shared';
import {
  Alert,
  Button,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import {
  useCreateIngredient,
  useShoppingCategories,
} from '../../ingredients/api';
import { OpenFoodFactsSearch } from './off-search';

type IngredientFormProps = {
  onCancel?: () => void;
  onSuccess?: (ingredient: IngredientResponse) => void;
  cancelLabel?: string;
  submitLabel?: string;
};

export function IngredientForm({
  onCancel,
  onSuccess,
  cancelLabel = 'Cancel',
  submitLabel = 'Save Ingredient',
}: IngredientFormProps) {
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
    const ingredient = await createMutation.mutateAsync(data);
    onSuccess?.(ingredient);
  });

  const handleOFFSelect = (result: {
    name: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }) => {
    form.setValue('name', result.name, { shouldDirty: true });
    if (result.calories != null) {
      form.setValue('calories', result.calories, { shouldDirty: true });
    }
    if (result.protein != null) {
      form.setValue('protein', result.protein, { shouldDirty: true });
    }
    if (result.carbs != null) {
      form.setValue('carbs', result.carbs, { shouldDirty: true });
    }
    if (result.fat != null) {
      form.setValue('fat', result.fat, { shouldDirty: true });
    }
  };

  const categoryOptions = (categories ?? []).map(category => ({
    value: String(category.id),
    label: category.name,
  }));

  const errorMessage =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : createMutation.isError
        ? 'Failed to save ingredient.'
        : null;

  return (
    <form onSubmit={onSubmit}>
      <Stack gap='md'>
        {errorMessage ? (
          <Alert color='red' title='Could not save ingredient'>
            {errorMessage}
          </Alert>
        ) : null}

        <TextInput
          label='Name'
          required
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />

        <Select
          label='Default Unit'
          data={UNITS.map(unit => ({ value: unit, label: unit }))}
          value={form.watch('defaultUnit')}
          onChange={value =>
            value && form.setValue('defaultUnit', value as any)
          }
        />

        <Divider label='Nutrition (per 100g)' labelPosition='left' />

        <Group grow>
          <NumberInput
            label='Calories'
            min={0}
            value={form.watch('calories') ?? ''}
            onChange={value =>
              form.setValue(
                'calories',
                value === '' ? undefined : Number(value),
                { shouldDirty: true },
              )
            }
          />
          <NumberInput
            label='Protein (g)'
            min={0}
            decimalScale={1}
            value={form.watch('protein') ?? ''}
            onChange={value =>
              form.setValue(
                'protein',
                value === '' ? undefined : Number(value),
                { shouldDirty: true },
              )
            }
          />
        </Group>

        <Group grow>
          <NumberInput
            label='Carbs (g)'
            min={0}
            decimalScale={1}
            value={form.watch('carbs') ?? ''}
            onChange={value =>
              form.setValue('carbs', value === '' ? undefined : Number(value), {
                shouldDirty: true,
              })
            }
          />
          <NumberInput
            label='Fat (g)'
            min={0}
            decimalScale={1}
            value={form.watch('fat') ?? ''}
            onChange={value =>
              form.setValue('fat', value === '' ? undefined : Number(value), {
                shouldDirty: true,
              })
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
          onChange={value =>
            form.setValue('categoryId', value ? Number(value) : undefined, {
              shouldDirty: true,
            })
          }
        />

        <Divider label='Or import from OpenFoodFacts' labelPosition='left' />

        <OpenFoodFactsSearch onSelect={handleOFFSelect} />

        <Group justify='flex-end' mt='md'>
          {onCancel ? (
            <Button variant='default' onClick={onCancel} type='button'>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type='submit' loading={createMutation.isPending}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
