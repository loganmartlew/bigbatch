import type { IngredientResponse } from '@bigbatch/shared';
import { Modal } from '@mantine/core';
import { IngredientForm } from './ingredient-form';

type CreateIngredientModalProps = {
  opened: boolean;
  onClose: () => void;
  onCreated: (ingredient: IngredientResponse) => void;
};

export function CreateIngredientModal({
  opened,
  onClose,
  onCreated,
}: CreateIngredientModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Add ingredient to household'
      size='lg'
      centered
    >
      <IngredientForm
        onCancel={onClose}
        onSuccess={ingredient => {
          onCreated(ingredient);
          onClose();
        }}
        cancelLabel='Close'
        submitLabel='Add Ingredient'
      />
    </Modal>
  );
}
