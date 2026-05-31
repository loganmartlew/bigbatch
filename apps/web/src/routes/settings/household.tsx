import { Container } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { requireActiveHousehold } from '../../features/auth/utils/route-guards';
import { HouseholdSettingsPanel } from '../../features/household/components/household-settings-panel';

export const Route = createFileRoute('/settings/household')({
  beforeLoad: ({ context, location }) => {
    requireActiveHousehold({ context, location });
  },
  component: HouseholdSettingsPage,
});

function HouseholdSettingsPage() {
  return (
    <Container py='xl' size='lg'>
      <HouseholdSettingsPanel />
    </Container>
  );
}
