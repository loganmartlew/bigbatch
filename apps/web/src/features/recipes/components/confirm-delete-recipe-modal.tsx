import { Button, Group, Modal, Stack, Text } from '@mantine/core';

type ConfirmDeleteRecipeModalProps = {
  opened: boolean;
  recipeName?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmDeleteRecipeModal({
  opened,
  recipeName,
  onClose,
  onConfirm,
  loading = false,
}: ConfirmDeleteRecipeModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title='Delete recipe?' centered>
      <Stack gap='md'>
        <Text size='sm'>
          {recipeName
            ? `Delete ${recipeName}? This will remove the recipe from your household.`
            : 'This will remove the recipe from your household.'}{' '}
          Existing cook history is kept, but the recipe itself will no longer
          appear in lists.
        </Text>
        <Group justify='flex-end'>
          <Button variant='default' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color='red' onClick={onConfirm} loading={loading}>
            Delete Recipe
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
