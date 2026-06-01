import type {
  CreateRecipeInput,
  IngredientResponse,
  UpdateRecipeInput,
} from '@bigbatch/shared';
import { UNITS } from '@bigbatch/shared';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Alert,
  Button,
  Card,
  Group,
  NumberInput,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useIngredients } from '../../ingredients/api';
import { CreateIngredientModal } from '../../ingredients/components/create-ingredient-modal';
import { useTags } from '../api';
import { IngredientPicker } from './ingredient-picker';
import { SortableStep } from './sortable-step';

export interface RecipeFormValues {
  name: string;
  description: string;
  source: string;
  prepTime: number | null;
  cookTime: number | null;
  batchSize: number;
  instructions: { text: string }[];
  ingredients: { ingredientId: string; quantity: number; unit: string }[];
  tags: string[];
}

type RecipeFormProps = {
  title: string;
  submitLabel: string;
  initialValues?: RecipeFormValues;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  deleteAction?: {
    label?: string;
    onClick: () => void;
  };
  onCancel: () => void;
  onSubmit: (values: RecipeFormValues) => void;
};

export const emptyRecipeFormValues: RecipeFormValues = {
  name: '',
  description: '',
  source: '',
  prepTime: null,
  cookTime: null,
  batchSize: 4,
  instructions: [{ text: '' }],
  ingredients: [],
  tags: [],
};

export function buildCreateRecipeInput(
  values: RecipeFormValues,
): CreateRecipeInput {
  return {
    name: values.name,
    batchSize: values.batchSize,
    description: values.description || undefined,
    source: values.source || undefined,
    prepTime: values.prepTime ?? undefined,
    cookTime: values.cookTime ?? undefined,
    instructions: values.instructions
      .map(step => step.text.trim())
      .filter(Boolean),
    ingredients: values.ingredients
      .filter(ingredient => ingredient.ingredientId && ingredient.quantity > 0)
      .map(ingredient => ({
        ingredientId: Number(ingredient.ingredientId),
        quantity: ingredient.quantity,
        unit: ingredient.unit as CreateRecipeInput['ingredients'] extends
          | (infer IngredientInput)[]
          | undefined
          ? IngredientInput extends { unit: infer Unit }
            ? Unit
            : never
          : never,
      })),
    tags: values.tags.length > 0 ? values.tags : undefined,
  };
}

export function buildUpdateRecipeInput(
  values: RecipeFormValues,
): UpdateRecipeInput {
  return {
    name: values.name,
    description: values.description || null,
    source: values.source || null,
    prepTime: values.prepTime,
    cookTime: values.cookTime,
    batchSize: values.batchSize,
    instructions: values.instructions
      .map(step => step.text.trim())
      .filter(Boolean),
    ingredients: values.ingredients
      .filter(ingredient => ingredient.ingredientId && ingredient.quantity > 0)
      .map(ingredient => ({
        ingredientId: Number(ingredient.ingredientId),
        quantity: ingredient.quantity,
        unit: ingredient.unit as UpdateRecipeInput['ingredients'] extends
          | (infer IngredientInput)[]
          | undefined
          ? IngredientInput extends { unit: infer Unit }
            ? Unit
            : never
          : never,
      })),
    tags: values.tags,
  };
}

export function recipeDetailToFormValues(recipe: {
  name: string;
  description: string | null;
  source: string | null;
  prepTime: number | null;
  cookTime: number | null;
  batchSize: number;
  instructions: { text: string }[];
  ingredients: { ingredientId: number; quantity: number; unit: string }[];
  tags: string[];
}): RecipeFormValues {
  return {
    name: recipe.name,
    description: recipe.description ?? '',
    source: recipe.source ?? '',
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    batchSize: recipe.batchSize,
    instructions:
      recipe.instructions.length > 0
        ? recipe.instructions.map(instruction => ({ text: instruction.text }))
        : [{ text: '' }],
    ingredients: recipe.ingredients.map(ingredient => ({
      ingredientId: String(ingredient.ingredientId),
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    })),
    tags: recipe.tags,
  };
}

export function RecipeForm({
  title,
  submitLabel,
  initialValues = emptyRecipeFormValues,
  errorMessage,
  isSubmitting = false,
  deleteAction,
  onCancel,
  onSubmit,
}: RecipeFormProps) {
  const { data: householdIngredients } = useIngredients();
  const { data: existingTags } = useTags();
  const [createModalIndex, setCreateModalIndex] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const {
    fields: stepFields,
    append: appendStep,
    move: moveStep,
    remove: removeStep,
  } = useFieldArray({ control, name: 'instructions' });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: 'ingredients' });

  const ingredientOptions = useMemo(
    () =>
      (householdIngredients ?? []).map(ingredient => ({
        value: String(ingredient.id),
        label: ingredient.name,
      })),
    [householdIngredients],
  );

  const tagSuggestions = useMemo(
    () => (existingTags ?? []).map(tag => tag.name),
    [existingTags],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = stepFields.findIndex(field => field.id === active.id);
    const newIndex = stepFields.findIndex(field => field.id === over.id);

    if (oldIndex >= 0 && newIndex >= 0) {
      moveStep(oldIndex, newIndex);
    }
  };

  const handleIngredientCreated = (ingredient: IngredientResponse) => {
    if (createModalIndex == null) {
      return;
    }

    setValue(
      `ingredients.${createModalIndex}.ingredientId`,
      String(ingredient.id),
      {
        shouldDirty: true,
      },
    );
    setCreateModalIndex(null);
  };

  return (
    <Stack>
      <Group justify='space-between'>
        <Text component='h1' fw={700} size='1.75rem'>
          {title}
        </Text>
        {deleteAction ? (
          <Button color='red' variant='subtle' onClick={deleteAction.onClick}>
            {deleteAction.label ?? 'Delete'}
          </Button>
        ) : null}
      </Group>

      {errorMessage ? (
        <Alert color='red' title='Could not save recipe'>
          {errorMessage}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label='Name'
            required
            {...register('name', {
              required: 'Name is required',
              maxLength: 200,
            })}
            error={errors.name?.message}
          />

          <Textarea
            label='Description'
            autosize
            minRows={2}
            maxRows={5}
            {...register('description')}
          />

          <TextInput
            label='Source'
            placeholder='Cookbook, URL, or person'
            {...register('source')}
          />

          <Group grow>
            <Controller
              control={control}
              name='prepTime'
              render={({ field }) => (
                <NumberInput
                  label='Prep time (min)'
                  min={0}
                  value={field.value ?? ''}
                  onChange={value =>
                    field.onChange(typeof value === 'number' ? value : null)
                  }
                />
              )}
            />
            <Controller
              control={control}
              name='cookTime'
              render={({ field }) => (
                <NumberInput
                  label='Cook time (min)'
                  min={0}
                  value={field.value ?? ''}
                  onChange={value =>
                    field.onChange(typeof value === 'number' ? value : null)
                  }
                />
              )}
            />
            <Controller
              control={control}
              name='batchSize'
              render={({ field }) => (
                <NumberInput
                  label='Servings'
                  required
                  min={1}
                  value={field.value}
                  onChange={value =>
                    field.onChange(typeof value === 'number' ? value : 4)
                  }
                />
              )}
            />
          </Group>

          <Controller
            control={control}
            name='tags'
            render={({ field }) => (
              <TagsInput
                label='Tags'
                placeholder='Add tags'
                data={tagSuggestions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Card withBorder padding='md'>
            <Group justify='space-between' mb='sm'>
              <Text fw={600}>Ingredients</Text>
              <Button
                variant='light'
                size='xs'
                leftSection={<IconPlus size={14} />}
                onClick={() =>
                  appendIngredient({
                    ingredientId: '',
                    quantity: 100,
                    unit: 'g',
                  })
                }
                type='button'
              >
                Add
              </Button>
            </Group>
            <Stack gap='xs'>
              {ingredientFields.map((field, index) => (
                <Group key={field.id} gap='xs' align='flex-start' wrap='nowrap'>
                  <div style={{ flex: 2 }}>
                    <Controller
                      control={control}
                      name={`ingredients.${index}.ingredientId`}
                      render={({ field: ingredientField }) => (
                        <IngredientPicker
                          value={ingredientField.value}
                          options={ingredientOptions}
                          onChange={ingredientField.onChange}
                          onCreate={() => setCreateModalIndex(index)}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name={`ingredients.${index}.quantity`}
                    render={({ field: quantityField }) => (
                      <NumberInput
                        placeholder='Qty'
                        min={0.01}
                        value={quantityField.value}
                        onChange={value =>
                          quantityField.onChange(
                            typeof value === 'number' ? value : 0,
                          )
                        }
                        style={{ flex: 1 }}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`ingredients.${index}.unit`}
                    render={({ field: unitField }) => (
                      <Select
                        data={UNITS.map(unit => ({ value: unit, label: unit }))}
                        value={unitField.value}
                        onChange={value => unitField.onChange(value ?? 'g')}
                        style={{ width: 88 }}
                      />
                    )}
                  />
                  <ActionDeleteIngredient
                    onClick={() => removeIngredient(index)}
                  />
                </Group>
              ))}
            </Stack>
          </Card>

          <Card withBorder padding='md'>
            <Group justify='space-between' mb='sm'>
              <Text fw={600}>Instructions</Text>
              <Button
                variant='light'
                size='xs'
                leftSection={<IconPlus size={14} />}
                onClick={() => appendStep({ text: '' })}
                type='button'
              >
                Add Step
              </Button>
            </Group>
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={stepFields.map(field => field.id)}
                strategy={verticalListSortingStrategy}
              >
                <Stack gap='xs'>
                  {stepFields.map((field, index) => (
                    <SortableStep
                      id={field.id}
                      index={index}
                      key={field.id}
                      onRemove={() => removeStep(index)}
                      removeDisabled={stepFields.length <= 1}
                    >
                      <Textarea
                        placeholder={`Step ${index + 1}`}
                        autosize
                        minRows={1}
                        {...register(`instructions.${index}.text`)}
                      />
                    </SortableStep>
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          </Card>

          <Group justify='flex-end'>
            <Button variant='subtle' onClick={onCancel} type='button'>
              Cancel
            </Button>
            <Button type='submit' loading={isSubmitting}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>

      <CreateIngredientModal
        opened={createModalIndex != null}
        onClose={() => setCreateModalIndex(null)}
        onCreated={handleIngredientCreated}
      />
    </Stack>
  );
}

function ActionDeleteIngredient({ onClick }: { onClick: () => void }) {
  return (
    <Button
      color='red'
      variant='subtle'
      onClick={onClick}
      type='button'
      px='xs'
      aria-label='Remove ingredient row'
    >
      <IconTrash size={14} />
    </Button>
  );
}
