import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { getErrorMessage } from '../../../lib/error-message';
import { useHousehold } from '../../../lib/household-context';
import {
  type HouseholdInvite,
  useGenerateInviteMutation,
  useHouseholdMembersQuery,
  useRemoveMemberMutation,
} from '../hooks/use-household-api';

export function HouseholdSettingsPanel() {
  const { activeHouseholdId } = useHousehold();
  const auth = useAuth();
  const [invite, setInvite] = useState<HouseholdInvite | null>(null);
  const membersQuery = useHouseholdMembersQuery(
    auth.isLoading ? null : activeHouseholdId,
  );
  const generateInvite = useGenerateInviteMutation(activeHouseholdId);
  const removeMember = useRemoveMemberMutation(activeHouseholdId);

  useEffect(() => {
    setInvite(null);
  }, [activeHouseholdId]);

  if (activeHouseholdId === null) {
    return (
      <Alert color='orange' title='No household selected' variant='light'>
        Pick or create a household before opening household settings.
      </Alert>
    );
  }

  if (auth.isLoading) {
    return (
      <Group justify='center' py='xl'>
        <Loader color='orange' />
      </Group>
    );
  }

  const handleGenerateInvite = async () => {
    try {
      const nextInvite = await generateInvite.mutateAsync();
      setInvite(nextInvite);
    } catch {
      // Handled by mutation state below.
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMember.mutateAsync(userId);
    } catch {
      // Handled by mutation state below.
    }
  };

  const activeMembership = membersQuery.data?.members.find(
    member => member.userId === auth.user?.id,
  );
  const canManageMembers = activeMembership?.role === 'owner';

  return (
    <Stack gap='lg'>
      {membersQuery.error || generateInvite.error || removeMember.error ? (
        <Alert color='red' title='Something went wrong' variant='light'>
          {getErrorMessage(
            membersQuery.error ?? generateInvite.error ?? removeMember.error,
            'Household settings could not be loaded.',
          )}
        </Alert>
      ) : null}

      <Group justify='space-between'>
        <div>
          <Text c='dimmed' fw={600} size='sm' tt='uppercase'>
            Household admin
          </Text>
          <Title order={2}>Members and invites</Title>
        </div>

        <Button
          disabled={!canManageMembers}
          loading={generateInvite.isPending}
          onClick={handleGenerateInvite}
        >
          Generate invite
        </Button>
      </Group>

      {invite ? (
        <Card radius='lg' shadow='sm' withBorder>
          <Stack gap='xs'>
            <Text fw={600}>Latest invite</Text>
            <Text size='sm'>Code: {invite.code}</Text>
            <Text size='sm'>Link: {invite.link}</Text>
            <Text c='dimmed' size='sm'>
              Expires {new Date(invite.expiresAt).toLocaleString()}
            </Text>
          </Stack>
        </Card>
      ) : null}

      {membersQuery.isLoading ? (
        <Group justify='center' py='xl'>
          <Loader color='orange' />
        </Group>
      ) : (
        <Stack gap='md'>
          {membersQuery.data?.members.map(member => (
            <Card key={member.userId} radius='lg' shadow='sm' withBorder>
              <Group justify='space-between'>
                <Stack gap={4}>
                  <Text fw={600}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text c='dimmed' size='sm'>
                    {member.email}
                  </Text>
                </Stack>

                <Group gap='sm'>
                  <Badge color={member.role === 'owner' ? 'orange' : 'gray'}>
                    {member.role}
                  </Badge>
                  {canManageMembers && auth.user?.id !== member.userId ? (
                    <Button
                      color='red'
                      loading={removeMember.isPending}
                      onClick={() => handleRemoveMember(member.userId)}
                      size='xs'
                      variant='light'
                    >
                      Remove
                    </Button>
                  ) : null}
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
