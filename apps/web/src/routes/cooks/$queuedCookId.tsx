import { createFileRoute } from '@tanstack/react-router';
import { QueuedCookModePage } from '../../features/cook-events/components/queued-cook-mode-page';

export const Route = createFileRoute('/cooks/$queuedCookId')({
  component: QueuedCookModeRoute,
});

function QueuedCookModeRoute() {
  const { queuedCookId } = Route.useParams();

  return <QueuedCookModePage queuedCookId={Number(queuedCookId)} />;
}
