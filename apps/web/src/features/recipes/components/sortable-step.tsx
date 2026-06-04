import type { ReactNode } from 'react';
import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortableStepProps = {
  id: string;
  index: number;
  onRemove: () => void;
  removeDisabled?: boolean;
  children: ReactNode;
};

export function SortableStep({
  id,
  index,
  onRemove,
  removeDisabled = false,
  children,
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
      }}
    >
      <Group gap='xs' align='flex-start' wrap='nowrap'>
        <ActionIcon
          variant='subtle'
          mt={4}
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder step ${index + 1}`}
        >
          <IconGripVertical size={16} />
        </ActionIcon>
        <Text size='sm' w={30} ta='center' pt={8}>
          {index + 1}.
        </Text>
        <Box style={{ flex: 1 }}>{children}</Box>
        <ActionIcon
          color='red'
          variant='subtle'
          mt={4}
          onClick={onRemove}
          disabled={removeDisabled}
          aria-label={`Delete step ${index + 1}`}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Box>
  );
}
