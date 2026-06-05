import { createFileRoute } from '@tanstack/react-router';
import { CooksDashboardPage } from '../../features/cook-events/components/cooks-dashboard-page';

export const Route = createFileRoute('/cooks/')({
  component: CooksDashboardPage,
});
