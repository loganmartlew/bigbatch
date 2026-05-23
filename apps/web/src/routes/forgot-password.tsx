import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../lib/api-client';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Ignore — always show success to prevent enumeration
    }
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div>
        <h2>Check Your Email</h2>
        <p>
          If an account with that email exists, a password reset link has been
          sent.
        </p>
        <a href='/login'>Back to login</a>
      </div>
    );
  }

  return (
    <div>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='email'>Email</label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <button type='submit' disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <p>
        <a href='/login'>Back to login</a>
      </p>
    </div>
  );
}
