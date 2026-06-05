import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Checkbox,
  Group,
  NumberInput,
  Stack,
  Text,
} from '@mantine/core';
import { IconCheck, IconEdit, IconX } from '@tabler/icons-react';
import type { ShoppingListItemEnriched } from '@bigbatch/shared';
import {
  useRemoveItem,
  useToggleHaveThis,
  useToggleTickedOff,
  useUpdateItemQuantity,
} from '../api';
import { ShoppingItemActionsMenu } from './shopping-item-actions-menu';
import { ShoppingSwipeRow } from './shopping-swipe-row';

interface ShoppingItemRowProps {
  item: ShoppingListItemEnriched;
}

export function ShoppingItemRow({ item }: ShoppingItemRowProps) {
  const toggleTicked = useToggleTickedOff();
  const toggleHaveThis = useToggleHaveThis();
  const removeItem = useRemoveItem();
  const updateQuantity = useUpdateItemQuantity();

  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState<number>(item.quantity);

  const handleQuantitySubmit = async () => {
    if (editQuantity <= 0) {
      return;
    }

    await updateQuantity.mutateAsync({
      itemId: item.id,
      quantity: editQuantity,
    });
    setIsEditing(false);
  };

  const handleQuantityChange = (value: string | number) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    setEditQuantity(Number.isFinite(numericValue) ? numericValue : 0);
  };

  return (
    <ShoppingSwipeRow
      leftActionLabel='Have it'
      onLeftAction={() => toggleHaveThis.mutate(item.id)}
      rightActionLabel='Delete'
      onRightAction={() => removeItem.mutate(item.id)}
      disabled={isEditing || removeItem.isPending || toggleHaveThis.isPending}
    >
      <Box px='xs' py='xs'>
        <Group justify='space-between' wrap='nowrap'>
          <Group gap='sm' wrap='nowrap' style={{ flex: 1, minWidth: 0 }}>
            <Checkbox
              checked={item.tickedOff}
              onChange={() => toggleTicked.mutate(item.id)}
              aria-label={`Mark ${item.ingredientName} as done`}
            />

            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text
                size='sm'
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.ingredientName}
              </Text>

              {isEditing ? (
                <Group gap='xs' wrap='nowrap'>
                  <NumberInput
                    value={editQuantity}
                    onChange={handleQuantityChange}
                    min={0.01}
                    size='xs'
                    style={{ width: 92 }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        void handleQuantitySubmit();
                      }

                      if (event.key === 'Escape') {
                        setIsEditing(false);
                      }
                    }}
                  />
                  <Text size='xs'>{item.unit}</Text>
                  <ActionIcon
                    size='xs'
                    color='green'
                    onClick={handleQuantitySubmit}
                  >
                    <IconCheck size={12} />
                  </ActionIcon>
                  <ActionIcon
                    size='xs'
                    color='gray'
                    onClick={() => setIsEditing(false)}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              ) : (
                <Group gap={4} wrap='nowrap'>
                  <Text size='xs' c='dimmed'>
                    {item.quantity} {item.unit}
                  </Text>
                  <ActionIcon
                    size='xs'
                    variant='subtle'
                    color='gray'
                    onClick={() => {
                      setEditQuantity(item.quantity);
                      setIsEditing(true);
                    }}
                    aria-label={`Edit quantity for ${item.ingredientName}`}
                  >
                    <IconEdit size={12} />
                  </ActionIcon>
                </Group>
              )}
            </Stack>
          </Group>

          <ShoppingItemActionsMenu
            ingredientName={item.ingredientName}
            onHaveThis={() => toggleHaveThis.mutate(item.id)}
            onDelete={() => removeItem.mutate(item.id)}
            disabled={removeItem.isPending || toggleHaveThis.isPending}
          />
        </Group>
      </Box>
    </ShoppingSwipeRow>
  );
}
