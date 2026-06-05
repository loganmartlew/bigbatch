import { Button, Group, Modal, Stack, Text } from '@mantine/core';

interface ClearShoppingListModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function ClearShoppingListModal({
  opened,
  onClose,
  onConfirm,
  isPending,
}: ClearShoppingListModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title='Clear Shopping List'>
      <Stack gap='sm'>
        <Text>
          Are you sure you want to remove all items from your shopping list?
        </Text>
        <Group justify='flex-end'>
          <Button variant='default' onClick={onClose}>
            Cancel
          </Button>
          <Button color='red' loading={isPending} onClick={onConfirm}>
            Clear List
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
