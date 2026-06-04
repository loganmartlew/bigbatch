import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { userHouseholds } from '../../db/schema.js';
import { ForbiddenError, ValidationError } from './errors.js';

const AUTH_ONLY_ROUTES = new Set([
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/logout',
  'POST /auth/forgot-password',
  'POST /auth/reset-password',
  'GET /auth/me',
  'GET /households',
  'POST /households',
  'POST /households/join/link',
  'POST /households/join/code',
  'POST /households/:id/invites',
  'GET /households/:id/members',
  'DELETE /households/:id/members/:userId',
  'GET /ingredients/search/openfoodfacts',
]);

export async function householdResolver(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const routeKey = `${request.method} ${request.routeOptions.url ?? request.url}`;

  if (AUTH_ONLY_ROUTES.has(routeKey)) {
    return;
  }

  // User must be authenticated at this point (auth-guard ran first)
  if (!request.user) {
    return;
  }

  const headerValue = request.headers['x-household-id'];

  if (!headerValue || typeof headerValue !== 'string') {
    throw new ValidationError('X-Household-Id header is required');
  }

  const householdId = parseInt(headerValue, 10);

  if (Number.isNaN(householdId) || householdId <= 0) {
    throw new ValidationError('X-Household-Id must be a positive integer');
  }

  const membership = await db.query.userHouseholds.findFirst({
    where: and(
      eq(userHouseholds.userId, request.user.id),
      eq(userHouseholds.householdId, householdId),
    ),
  });

  if (!membership) {
    throw new ForbiddenError('Not a member of this household');
  }

  request.householdId = householdId;
  request.userRole = membership.role;
}

// Fastify type augmentation
declare module 'fastify' {
  interface FastifyRequest {
    householdId: number;
    userRole: 'owner' | 'member';
  }
}
