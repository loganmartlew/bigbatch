import { ActionIcon, Menu } from '@mantine/core';
import { IconCheck, IconDots, IconTrash } from '@tabler/icons-react';

interface ShoppingItemActionsMenuProps {
  ingredientName: string;
  onHaveThis: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ShoppingItemActionsMenu({
  ingredientName,
  onHaveThis,
  onDelete,
  disabled = false,
}: ShoppingItemActionsMenuProps) {
  return (
    <Menu position='bottom-end' withinPortal>
      <Menu.Target>
        <ActionIcon
          variant='subtle'
          aria-label={`Open actions for ${ingredientName}`}
          disabled={disabled}
        >
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<IconCheck size={14} />} onClick={onHaveThis}>
          Mark as have it
        </Menu.Item>
        <Menu.Item
          leftSection={<IconTrash size={14} />}
          color='red'
          onClick={onDelete}
        >
          Delete item
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}