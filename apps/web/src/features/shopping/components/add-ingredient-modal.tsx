import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { UNITS, type Unit } from '@bigbatch/shared';
import { useIngredients } from '../../ingredients/api';
import { useAddIngredientToList } from '../api';

interface AddIngredientModalProps {
  opened: boolean;
  onClose: () => void;
  presetIngredientId?: number;
}

const DEFAULT_UNIT: Unit = 'g';

export function AddIngredientModal({
  opened,
  onClose,
  presetIngredientId,
}: AddIngredientModalProps) {
  const { data: ingredients } = useIngredients();
  const addIngredient = useAddIngredientToList();

  const presetIngredient = ingredients?.find(
    item => item.id === presetIngredientId,
  );

  const [ingredientId, setIngredientId] = useState<string>(
    presetIngredientId ? String(presetIngredientId) : '',
  );
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState<Unit>(
    presetIngredient?.defaultUnit ?? DEFAULT_UNIT,
  );
  const [errors, setErrors] = useState<{
    ingredientId?: string;
    quantity?: string;
    unit?: string;
  }>({});

  useEffect(() => {
    if (presetIngredientId) {
      setIngredientId(String(presetIngredientId));
    }
  }, [presetIngredientId]);

  useEffect(() => {
    if (presetIngredient) {
      setUnit(presetIngredient.defaultUnit);
    }
  }, [presetIngredient]);

  const ingredientOptions =
    ingredients?.map(item => ({
      value: String(item.id),
      label: item.name,
    })) ?? [];

  const validate = () => {
    const nextErrors: {
      ingredientId?: string;
      quantity?: string;
      unit?: string;
    } = {};

    if (!ingredientId) {
      nextErrors.ingredientId = 'Select an ingredient';
    }

    const numericQuantity = Number(quantity);
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      nextErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!unit) {
      nextErrors.unit = 'Select a unit';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleClose = () => {
    if (!presetIngredientId) {
      setIngredientId('');
    }
    setQuantity(1);
    setUnit(presetIngredient?.defaultUnit ?? DEFAULT_UNIT);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    addIngredient.mutate({
      ingredientId: Number(ingredientId),
      quantity: Number(quantity),
      unit,
    });

    handleClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title='Add Ingredient to List'>
      <form onSubmit={handleSubmit}>
        <Stack gap='sm'>
          {presetIngredientId ? (
            <Text fw={500}>{presetIngredient?.name ?? 'Loading…'}</Text>
          ) : (
            <Select
              label='Ingredient'
              placeholder='Search ingredients…'
              data={ingredientOptions}
              searchable
              required
              value={ingredientId}
              onChange={value => setIngredientId(value ?? '')}
              error={errors.ingredientId}
            />
          )}

          <NumberInput
            label='Quantity'
            min={0.01}
            step={1}
            required
            value={quantity}
            onChange={setQuantity}
            error={errors.quantity}
          />

          <Select
            label='Unit'
            data={UNITS.map(value => ({ value, label: value }))}
            required
            value={unit}
            onChange={value => setUnit((value as Unit | null) ?? DEFAULT_UNIT)}
            error={errors.unit}
          />

          {addIngredient.error && (
            <Text c='red' size='sm'>
              {(addIngredient.error as Error).message}
            </Text>
          )}

          <Group justify='flex-end' mt='sm'>
            <Button variant='default' onClick={handleClose}>
              Cancel
            </Button>
            <Button type='submit' loading={addIngredient.isPending}>
              Add to List
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
