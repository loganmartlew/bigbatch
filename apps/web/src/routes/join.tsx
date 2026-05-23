import {
  createFileRoute,
  useSearch,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { setActiveHouseholdId } from '../lib/household-context';

export const Route = createFileRoute('/join')({
  component: JoinByLinkPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) ?? '',
  }),
});

function JoinByLinkPage() {
  const { token } = useSearch({ from: '/join' });
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
      return;
    }

    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    api
      .post<{ household: { id: number; name: string } }>(
        '/households/join/link',
        {
          token,
        },
      )
      .then(data => {
        setActiveHouseholdId(data.household.id);
        refreshUser();
        navigate({ to: '/' });
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to join household');
        setLoading(false);
      });
  }, [token, isAuthenticated, navigate, refreshUser]);

  if (loading) {
    return <p>Joining household…</p>;
  }

  return (
    <div>
      <h2>Join Household</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <a href='/'>Go home</a>
    </div>
  );
}
