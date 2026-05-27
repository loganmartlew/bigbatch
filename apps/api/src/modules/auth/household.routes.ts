import type { FastifyInstance } from 'fastify';
import {
  CreateHouseholdSchema,
  JoinByLinkSchema,
  JoinByCodeSchema,
} from '@bigbatch/shared';
import {
  createHousehold,
  listUserHouseholds,
  generateInvite,
  joinByLink,
  joinByCode,
  listMembers,
  removeMember,
} from './household.service.js';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { userHouseholds } from '../../db/schema.js';
import { ForbiddenError } from '../core/errors.js';

export async function registerHouseholdRoutes(server: FastifyInstance) {
  server.get('/households', async (request, reply) => {
    const result = await listUserHouseholds(request.user!.id);
    return reply.send({ data: { households: result } });
  });

  server.post(
    '/households',
    {
      schema: { body: CreateHouseholdSchema },
    },
    async (request, reply) => {
      const { name } = request.body as { name: string };
      const household = await createHousehold(request.user!.id, name);
      return reply.status(201).send({ data: { household } });
    },
  );

  server.post(
    '/households/join/link',
    {
      schema: { body: JoinByLinkSchema },
    },
    async (request, reply) => {
      const { token } = request.body as { token: string };
      const household = await joinByLink(request.user!.id, token);
      return reply.send({
        data: { household: { id: household.id, name: household.name } },
      });
    },
  );

  server.post(
    '/households/join/code',
    {
      schema: { body: JoinByCodeSchema },
    },
    async (request, reply) => {
      const { code } = request.body as { code: string };
      const household = await joinByCode(request.user!.id, code);
      return reply.send({
        data: { household: { id: household.id, name: household.name } },
      });
    },
  );

  server.post('/households/:id/invites', async (request, reply) => {
    const { id } = request.params as { id: string };
    const householdId = parseInt(id, 10);

    const invite = await generateInvite(householdId, request.user!.id);
    return reply.status(201).send({ data: invite });
  });

  server.get('/households/:id/members', async (request, reply) => {
    const { id } = request.params as { id: string };
    const householdId = parseInt(id, 10);

    // Verify caller is a member
    const membership = await db.query.userHouseholds.findFirst({
      where: and(
        eq(userHouseholds.userId, request.user!.id),
        eq(userHouseholds.householdId, householdId),
      ),
    });

    if (!membership) {
      throw new ForbiddenError('Not a member of this household');
    }

    const members = await listMembers(householdId);
    return reply.send({ data: { members } });
  });

  server.delete('/households/:id/members/:userId', async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };
    const householdId = parseInt(id, 10);
    const targetUserId = parseInt(userId, 10);

    await removeMember(householdId, request.user!.id, targetUserId);
    return reply.status(204).send();
  });
}
