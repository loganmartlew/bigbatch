import { Fragment } from 'react';
import { Badge, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import type { ShoppingListItemEnriched } from '@bigbatch/shared';
import { ShoppingDoneItemRow } from './shopping-done-item-row';

interface ShoppingDoneSectionProps {
  items: ShoppingListItemEnriched[];
}

export function ShoppingDoneSection({ items }: ShoppingDoneSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Paper withBorder p='sm' radius='md'>
      <Stack gap='xs'>
        <Group gap='xs'>
          <Text fw={600} size='sm'>
            Done
          </Text>
          <Badge size='xs' variant='outline'>
            {items.length}
          </Badge>
        </Group>

        <Divider />

        <Stack gap={0}>
          {items.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 ? <Divider /> : null}
              <ShoppingDoneItemRow item={item} />
            </Fragment>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
