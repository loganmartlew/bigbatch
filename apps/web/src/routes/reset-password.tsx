import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../lib/api-client';

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h2>Invalid Reset Link</h2>
        <p>No reset token found. Please request a new password reset.</p>
        <Link to='/forgot-password'>Request reset</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <h2>Password Reset</h2>
        <p>Your password has been reset successfully.</p>
        <Link to='/login' search={{ redirect: undefined }}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='newPassword'>New Password</label>
          <input
            id='newPassword'
            type='password'
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type='submit' disabled={loading}>
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
