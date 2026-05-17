import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerTitle: 'BigBatch' }} />
    </QueryClientProvider>
  );
}
