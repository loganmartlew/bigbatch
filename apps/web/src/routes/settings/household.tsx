import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { getActiveHouseholdId } from '../../lib/household-context';

interface Member {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface Invite {
  link: string;
  code: string;
  expiresAt: string;
}

export const Route = createFileRoute('/settings/household')({
  component: HouseholdSettingsPage,
});

function HouseholdSettingsPage() {
  const householdId = getActiveHouseholdId();
  const [members, setMembers] = useState<Member[]>([]);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!householdId) return;
    api
      .get<{ members: Member[] }>(`/households/${householdId}/members`)
      .then(data => {
        setMembers(data.members);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message);
        setLoading(false);
      });
  }, [householdId]);

  async function handleGenerateInvite() {
    if (!householdId) return;
    try {
      const data = await api.post<Invite>(`/households/${householdId}/invites`);
      setInvite(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!householdId) return;
    try {
      await api.delete(`/households/${householdId}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!householdId) {
    return <p>No household selected.</p>;
  }

  if (loading) {
    return <p>Loading…</p>;
  }

  const currentUserIsOwner = members.some(
    m => m.role === 'owner',
    // Note: we'd compare with current user ID in a real check;
    // for now the API enforces ownership on remove/invite endpoints.
  );

  return (
    <div>
      <h2>Household Settings</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Members</h3>
      <ul>
        {members.map(m => (
          <li key={m.userId}>
            {m.firstName} {m.lastName} ({m.email}) — {m.role}
            {m.role !== 'owner' && (
              <button onClick={() => handleRemoveMember(m.userId)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3>Invite</h3>
      <button onClick={handleGenerateInvite}>Generate Invite</button>
      {invite && (
        <div>
          <p>
            <strong>Code:</strong> {invite.code}
          </p>
          <p>
            <strong>Link:</strong> {invite.link}
          </p>
          <p>Expires: {new Date(invite.expiresAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
