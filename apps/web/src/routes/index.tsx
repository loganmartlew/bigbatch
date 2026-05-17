import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <h2>Welcome to BigBatch</h2>
      <p>Your bulk cooking companion.</p>
    </div>
  );
}
