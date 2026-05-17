import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { lucia } from '../../lib/lucia.js';
import { AuthenticationError } from './errors.js';

const PUBLIC_ROUTES = new Set(['POST /auth/register', 'POST /auth/login']);

export async function authGuard(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const routeKey = `${request.method} ${request.routeOptions.url ?? request.url}`;

  if (PUBLIC_ROUTES.has(routeKey)) {
    return;
  }

  const sessionId = request.cookies?.['session'] ?? null;

  if (!sessionId) {
    throw new AuthenticationError();
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session) {
    throw new AuthenticationError();
  }

  request.user = {
    id: user.id as number,
    email: user.email as string,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
  };
  request.sessionId = session.id;
}

export function registerAuthGuard(server: FastifyInstance): void {
  server.addHook('onRequest', authGuard);
}

// Fastify type augmentation
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };
    sessionId: string;
  }
}
