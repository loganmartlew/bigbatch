import { createFileRoute } from '@tanstack/react-router';
import { ShoppingPage } from '../../features/shopping/components/shopping-page';

export const Route = createFileRoute('/shopping/')({
  component: ShoppingPage,
});
