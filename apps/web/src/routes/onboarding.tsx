import { createFileRoute } from '@tanstack/react-router';
import { requireHouseholdSetup } from '../features/auth/utils/route-guards';
import { HouseholdOnboardingPanel } from '../features/household/components/household-onboarding-panel';

export const Route = createFileRoute('/onboarding')({
  beforeLoad: ({ context, location }) => {
    requireHouseholdSetup({ context, location });
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  return <HouseholdOnboardingPanel />;
}
