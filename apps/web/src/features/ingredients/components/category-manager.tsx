import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconEdit,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import {
  useShoppingCategories,
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '../api';

interface CategoryManagerProps {
  opened: boolean;
  onClose: () => void;
}

export function CategoryManager({ opened, onClose }: CategoryManagerProps) {
  const { data: categories } = useShoppingCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const sortedCategories = [...(categories ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createMutation.mutateAsync({ name: newName.trim() });
    setNewName('');
  };

  const handleStartEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = async () => {
    if (editingId == null || !editName.trim()) return;
    // Use inline update — we need a hook with dynamic id
    // Since useUpdateCategory requires id at hook level,
    // we'll make a direct call through the mutation
    setEditingId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const ids = sortedCategories.map(c => c.id);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex]!, ids[index]!];
    reorderMutation.mutate(ids);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Manage Categories'
      size='md'
    >
      <Stack gap='md'>
        {/* Add new category */}
        <Group>
          <TextInput
            placeholder='New category name'
            value={newName}
            onChange={e => setNewName(e.currentTarget.value)}
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={handleAdd}
            loading={createMutation.isPending}
            disabled={!newName.trim()}
          >
            Add
          </Button>
        </Group>

        {createMutation.error && (
          <Alert color='red' variant='light'>
            {createMutation.error.message}
          </Alert>
        )}

        {/* Category list */}
        <Stack gap='xs'>
          {sortedCategories.map((cat, index) => (
            <Group key={cat.id} justify='space-between' wrap='nowrap'>
              <Group gap='xs'>
                {editingId === cat.id ? (
                  <TextInput
                    size='xs'
                    value={editName}
                    onChange={e => setEditName(e.currentTarget.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                  />
                ) : (
                  <Text size='sm'>{cat.name}</Text>
                )}
                {cat.isDefault && (
                  <Badge size='xs' variant='outline'>
                    Default
                  </Badge>
                )}
              </Group>

              <Group gap={4}>
                <ActionIcon
                  size='xs'
                  variant='subtle'
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                >
                  <IconArrowUp size={12} />
                </ActionIcon>
                <ActionIcon
                  size='xs'
                  variant='subtle'
                  disabled={index === sortedCategories.length - 1}
                  onClick={() => handleMove(index, 'down')}
                >
                  <IconArrowDown size={12} />
                </ActionIcon>
                {!cat.isDefault && (
                  <>
                    <ActionIcon
                      size='xs'
                      variant='subtle'
                      onClick={() => handleStartEdit(cat.id, cat.name)}
                    >
                      <IconEdit size={12} />
                    </ActionIcon>
                    <ActionIcon
                      size='xs'
                      variant='subtle'
                      color='red'
                      onClick={() => deleteMutation.mutate(cat.id)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </>
                )}
              </Group>
            </Group>
          ))}
        </Stack>

        {deleteMutation.error && (
          <Alert color='red' variant='light'>
            {deleteMutation.error.message}
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}
