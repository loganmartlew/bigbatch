import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { setActiveHouseholdId } from '../lib/household-context';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ household: { id: number } }>(
        '/households',
        {
          name,
        },
      );
      setActiveHouseholdId(data.household.id);
      await refreshUser();
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ household: { id: number } }>(
        '/households/join/code',
        { code },
      );
      setActiveHouseholdId(data.household.id);
      await refreshUser();
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message || 'Failed to join household');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'choose') {
    return (
      <div>
        <h2>Welcome to BigBatch!</h2>
        <p>To get started, create a new household or join an existing one.</p>
        <button onClick={() => setMode('create')}>Create a Household</button>
        <button onClick={() => setMode('join')}>Join with Code</button>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div>
        <h2>Create a Household</h2>
        <form onSubmit={handleCreate}>
          <div>
            <label htmlFor='name'>Household Name</label>
            <input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type='submit' disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </button>
          <button type='button' onClick={() => setMode('choose')}>
            Back
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2>Join a Household</h2>
      <form onSubmit={handleJoin}>
        <div>
          <label htmlFor='code'>Invite Code</label>
          <input
            id='code'
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            maxLength={6}
            placeholder='e.g. ABC123'
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type='submit' disabled={loading}>
          {loading ? 'Joining…' : 'Join'}
        </button>
        <button type='button' onClick={() => setMode('choose')}>
          Back
        </button>
      </form>
    </div>
  );
}
