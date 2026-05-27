import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '../../db/client.js';
import {
  households,
  userHouseholds,
  householdInvites,
  shoppingCategories,
} from '../../db/schema.js';
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../core/errors.js';
import { env } from '../../lib/env.js';

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const DEFAULT_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Pantry',
  'Frozen',
  'Bakery',
  'Other',
];

function generateInviteCode(): string {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CODE_ALPHABET[bytes[i]! % INVITE_CODE_ALPHABET.length];
  }
  return code;
}

export async function createHousehold(userId: number, name: string) {
  const trimmedName = name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    throw new ValidationError('Household name must be 1–100 characters');
  }

  const [household] = await db
    .insert(households)
    .values({ name: trimmedName, ownerId: userId })
    .returning();

  await db.insert(userHouseholds).values({
    userId,
    householdId: household!.id,
    role: 'owner',
  });

  // Seed default shopping categories
  await db.insert(shoppingCategories).values(
    DEFAULT_CATEGORIES.map((cat, idx) => ({
      householdId: household!.id,
      name: cat,
      sortOrder: idx + 1,
      isDefault: true,
    })),
  );

  return household!;
}

export async function listUserHouseholds(userId: number) {
  const memberships = await db.query.userHouseholds.findMany({
    where: eq(userHouseholds.userId, userId),
    with: { household: true },
  });

  return memberships.map(m => ({
    id: m.household.id,
    name: m.household.name,
    role: m.role,
  }));
}

export async function generateInvite(householdId: number, userId: number) {
  // Verify owner
  const membership = await db.query.userHouseholds.findFirst({
    where: and(
      eq(userHouseholds.userId, userId),
      eq(userHouseholds.householdId, householdId),
    ),
  });

  if (!membership || membership.role !== 'owner') {
    throw new ForbiddenError('Only the household owner can generate invites');
  }

  const token = randomBytes(32).toString('base64url');
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.insert(householdInvites).values({
    householdId,
    token,
    code,
    createdBy: userId,
    expiresAt,
  });

  return {
    link: `${env.FRONTEND_URL}/join?token=${token}`,
    code,
    expiresAt,
  };
}

export async function joinByLink(userId: number, token: string) {
  const invite = await db.query.householdInvites.findFirst({
    where: eq(householdInvites.token, token),
    with: { household: true },
  });

  if (!invite || new Date(invite.expiresAt) <= new Date()) {
    throw new NotFoundError('Invite not found or expired');
  }

  // Check if already a member
  const existing = await db.query.userHouseholds.findFirst({
    where: and(
      eq(userHouseholds.userId, userId),
      eq(userHouseholds.householdId, invite.householdId),
    ),
  });

  if (existing) {
    throw new ConflictError('You are already a member of this household');
  }

  await db.insert(userHouseholds).values({
    userId,
    householdId: invite.householdId,
    role: 'member',
  });

  return invite.household;
}

export async function joinByCode(userId: number, code: string) {
  const normalizedCode = code.trim().toUpperCase();

  const invite = await db.query.householdInvites.findFirst({
    where: eq(householdInvites.code, normalizedCode),
    with: { household: true },
  });

  if (!invite || new Date(invite.expiresAt) <= new Date()) {
    throw new NotFoundError('Invite not found or expired');
  }

  const existing = await db.query.userHouseholds.findFirst({
    where: and(
      eq(userHouseholds.userId, userId),
      eq(userHouseholds.householdId, invite.householdId),
    ),
  });

  if (existing) {
    throw new ConflictError('You are already a member of this household');
  }

  await db.insert(userHouseholds).values({
    userId,
    householdId: invite.householdId,
    role: 'member',
  });

  return invite.household;
}

export async function listMembers(householdId: number) {
  const memberships = await db.query.userHouseholds.findMany({
    where: eq(userHouseholds.householdId, householdId),
    with: { user: true },
    orderBy: (uh, { asc }) => [asc(uh.joinedAt)],
  });

  return memberships.map(m => ({
    userId: m.user.id,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    email: m.user.email,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function removeMember(
  householdId: number,
  ownerId: number,
  targetUserId: number,
) {
  // Verify owner
  const ownerMembership = await db.query.userHouseholds.findFirst({
    where: and(
      eq(userHouseholds.userId, ownerId),
      eq(userHouseholds.householdId, householdId),
    ),
  });

  if (!ownerMembership || ownerMembership.role !== 'owner') {
    throw new ForbiddenError('Only the household owner can remove members');
  }

  if (targetUserId === ownerId) {
    throw new ForbiddenError('Cannot remove yourself from household');
  }

  const targetMembership = await db.query.userHouseholds.findFirst({
    where: and(
      eq(userHouseholds.userId, targetUserId),
      eq(userHouseholds.householdId, householdId),
    ),
  });

  if (!targetMembership) {
    throw new NotFoundError('Member not found');
  }

  await db
    .delete(userHouseholds)
    .where(
      and(
        eq(userHouseholds.userId, targetUserId),
        eq(userHouseholds.householdId, householdId),
      ),
    );
}
