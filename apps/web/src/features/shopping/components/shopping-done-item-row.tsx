import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import type { ShoppingListItemEnriched } from '@bigbatch/shared';
import { useRestoreShoppingItem } from '../api';

interface ShoppingDoneItemRowProps {
  item: ShoppingListItemEnriched;
}

export function ShoppingDoneItemRow({ item }: ShoppingDoneItemRowProps) {
  const restoreItem = useRestoreShoppingItem();

  return (
    <Group justify='space-between' py='xs' wrap='nowrap'>
      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Group gap='xs' wrap='wrap'>
          <Text
            size='sm'
            c='dimmed'
            style={{
              textDecoration: 'line-through',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.ingredientName}
          </Text>
          {item.tickedOff ? (
            <Badge size='xs' variant='light'>
              Checked off
            </Badge>
          ) : null}
          {item.haveThis ? (
            <Badge size='xs' color='teal' variant='light'>
              Have it
            </Badge>
          ) : null}
        </Group>

        <Text size='xs' c='dimmed'>
          {item.quantity} {item.unit}
          {item.categoryName ? ` · ${item.categoryName}` : ''}
        </Text>
      </Stack>

      <Button
        size='xs'
        variant='light'
        onClick={() => restoreItem.mutate(item)}
        loading={restoreItem.isPending}
      >
        Restore
      </Button>
    </Group>
  );
}
