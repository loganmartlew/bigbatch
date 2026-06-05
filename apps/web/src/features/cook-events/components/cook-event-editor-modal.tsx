import { useEffect, useState, type FormEvent } from 'react';
import type { CookEventDetail } from '@bigbatch/shared';
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useUpdateCookEvent } from '../api';

interface CookEventEditorModalProps {
  opened: boolean;
  cookEvent: Pick<
    CookEventDetail,
    'id' | 'recipeName' | 'batchSize' | 'date' | 'notes'
  > | null;
  onClose: () => void;
  onSaved?: (cookEvent: CookEventDetail) => void;
  title?: string;
  submitLabel?: string;
  closeLabel?: string;
}

export function CookEventEditorModal({
  opened,
  cookEvent,
  onClose,
  onSaved,
  title = 'Edit cook event',
  submitLabel = 'Save changes',
  closeLabel = 'Cancel',
}: CookEventEditorModalProps) {
  const updateCookEventMutation = useUpdateCookEvent(cookEvent?.id ?? 0);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setDate(cookEvent?.date ?? '');
    setNotes(cookEvent?.notes ?? '');
    setDateError(null);
  }, [cookEvent]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cookEvent) {
      return;
    }

    if (!date.trim()) {
      setDateError('Choose a cook date');
      return;
    }

    setDateError(null);
    updateCookEventMutation.mutate(
      {
        date,
        notes: notes.trim() ? notes.trim() : null,
      },
      {
        onSuccess: result => {
          if (onSaved) {
            onSaved(result);
            return;
          }

          onClose();
        },
      },
    );
  };

  return (
    <Modal
      opened={opened && cookEvent != null}
      onClose={onClose}
      title={title}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap='sm'>
          {cookEvent ? (
            <Text c='dimmed' size='sm'>
              {cookEvent.recipeName} · batch size {cookEvent.batchSize}
            </Text>
          ) : null}

          <TextInput
            label='Cook date'
            type='date'
            required
            value={date}
            onChange={event => setDate(event.currentTarget.value)}
            error={dateError}
          />

          <Textarea
            label='Notes'
            minRows={3}
            autosize
            maxLength={2000}
            value={notes}
            onChange={event => setNotes(event.currentTarget.value)}
          />

          {updateCookEventMutation.error instanceof Error ? (
            <Text c='red' size='sm'>
              {updateCookEventMutation.error.message}
            </Text>
          ) : null}

          <Group justify='flex-end' mt='sm'>
            <Button
              variant='default'
              onClick={onClose}
              disabled={updateCookEventMutation.isPending}
            >
              {closeLabel}
            </Button>
            <Button type='submit' loading={updateCookEventMutation.isPending}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
