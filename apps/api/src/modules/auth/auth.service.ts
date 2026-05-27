import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import zxcvbn from 'zxcvbn';
import { randomBytes } from 'node:crypto';
import { db } from '../../db/client.js';
import {
  users,
  sessions,
  userHouseholds,
  passwordResetTokens,
} from '../../db/schema.js';
import { lucia } from '../../lib/lucia.js';
import { sendPasswordResetEmail } from '../../lib/email.js';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../core/errors.js';

function toPublicUser(user: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();

  // Validate password strength
  const strength = zxcvbn(password);
  if (strength.score < 2) {
    const feedback =
      strength.feedback.warning ||
      strength.feedback.suggestions.join(' ') ||
      'Password is too weak';
    throw new ValidationError(feedback);
  }

  // Check email uniqueness
  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  // Hash password
  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

  // Insert user
  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      hashedPassword,
    })
    .returning();

  // Create session
  const session = await lucia.createSession(newUser!.id, {});

  return {
    user: toPublicUser(newUser!),
    session,
  };
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const valid = await argon2.verify(user.hashedPassword, password);
  if (!valid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const session = await lucia.createSession(user.id, {});

  // Load household memberships
  const memberships = await db.query.userHouseholds.findMany({
    where: eq(userHouseholds.userId, user.id),
    with: { household: true },
  });

  const householdList = memberships.map(m => ({
    id: m.household.id,
    name: m.household.name,
    role: m.role,
  }));

  return {
    user: toPublicUser(user),
    households: householdList,
    session,
  };
}

export async function logoutUser(sessionId: string) {
  await lucia.invalidateSession(sessionId);
}

export async function getCurrentUser(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const memberships = await db.query.userHouseholds.findMany({
    where: eq(userHouseholds.userId, userId),
    with: { household: true },
  });

  const householdList = memberships.map(m => ({
    id: m.household.id,
    name: m.household.name,
    role: m.role,
  }));

  return {
    user: toPublicUser(user),
    households: householdList,
  };
}

export async function requestPasswordReset(
  email: string,
  logger?: { info: (msg: string) => void },
) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  // Always return silently — no user enumeration
  if (!user) return;

  const tokenBytes = randomBytes(32);
  const token = tokenBytes.toString('base64url');

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  await sendPasswordResetEmail(user.email, token, logger);
}

export async function executePasswordReset(token: string, newPassword: string) {
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    new Date(resetToken.expiresAt) <= new Date()
  ) {
    throw new NotFoundError('Reset link is invalid or expired');
  }

  // Validate password strength
  const strength = zxcvbn(newPassword);
  if (strength.score < 2) {
    const feedback =
      strength.feedback.warning ||
      strength.feedback.suggestions.join(' ') ||
      'Password is too weak';
    throw new ValidationError(feedback);
  }

  const hashedPassword = await argon2.hash(newPassword, {
    type: argon2.argon2id,
  });

  await db.batch([
    db
      .update(users)
      .set({ hashedPassword, updatedAt: new Date().toISOString() })
      .where(eq(users.id, resetToken.userId)),
    db
      .update(passwordResetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(passwordResetTokens.id, resetToken.id)),
    db.delete(sessions).where(eq(sessions.userId, resetToken.userId)),
  ]);
}
