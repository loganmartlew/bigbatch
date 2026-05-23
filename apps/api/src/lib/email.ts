import { Resend } from 'resend';
import { env } from './env.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  logger?: { info: (msg: string) => void },
): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  if (env.NODE_ENV === 'development') {
    logger?.info(`Password reset URL: ${resetUrl}`);
  }

  await resend.emails.send({
    from: 'BigBatch <noreply@bigbatch.app>',
    to,
    subject: 'Reset your BigBatch password',
    text: `You requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
  });
}
