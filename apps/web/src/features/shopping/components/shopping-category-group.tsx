import { Fragment } from 'react';
import { Badge, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import type { ShoppingListGroup } from '@bigbatch/shared';
import { ShoppingItemRow } from './shopping-item-row';

interface ShoppingCategoryGroupProps {
  group: ShoppingListGroup;
}

export function ShoppingCategoryGroup({ group }: ShoppingCategoryGroupProps) {
  return (
    <Paper withBorder p='sm' radius='md'>
      <Stack gap='xs'>
        <Group gap='xs'>
          <Text fw={600} size='sm'>
            {group.categoryName ?? 'Uncategorised'}
          </Text>
          <Badge size='xs' variant='outline'>
            {group.items.length}
          </Badge>
        </Group>

        <Divider />

        <Stack gap={0}>
          {group.items.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 ? <Divider /> : null}
              <ShoppingItemRow item={item} />
            </Fragment>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}