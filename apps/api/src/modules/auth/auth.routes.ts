import type { FastifyInstance } from 'fastify';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@bigbatch/shared';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  requestPasswordReset,
  executePasswordReset,
} from './auth.service.js';
import { lucia } from '../../lib/lucia.js';
import { AuthenticationError } from '../core/errors.js';

function setSessionCookie(
  reply: import('fastify').FastifyReply,
  sessionId: string,
) {
  const sessionCookie = lucia.createSessionCookie(sessionId);
  reply.setCookie(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}

function clearSessionCookie(reply: import('fastify').FastifyReply) {
  const blankSessionCookie = lucia.createBlankSessionCookie();
  reply.setCookie(
    blankSessionCookie.name,
    blankSessionCookie.value,
    blankSessionCookie.attributes,
  );
}

export async function registerAuthRoutes(server: FastifyInstance) {
  server.post(
    '/auth/register',
    {
      schema: {
        body: RegisterSchema,
      },
    },
    async (request, reply) => {
      const { email, password, firstName, lastName } = request.body as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
      };

      const result = await registerUser(email, password, firstName, lastName);
      setSessionCookie(reply, result.session.id);

      return reply.status(201).send({
        data: {
          user: result.user,
          households: [],
        },
      });
    },
  );

  server.post(
    '/auth/login',
    {
      schema: {
        body: LoginSchema,
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      const result = await loginUser(email, password);
      setSessionCookie(reply, result.session.id);

      return reply.send({
        data: {
          user: result.user,
          households: result.households,
        },
      });
    },
  );

  server.post('/auth/logout', async (request, reply) => {
    const sessionId = request.sessionId;
    if (!sessionId) {
      throw new AuthenticationError();
    }

    await logoutUser(sessionId);
    clearSessionCookie(reply);
    return reply.status(204).send();
  });

  server.get('/auth/me', async (request, reply) => {
    const user = request.user;
    if (!user) {
      throw new AuthenticationError();
    }

    const result = await getCurrentUser(user.id);
    return reply.send({ data: result });
  });

  server.post(
    '/auth/forgot-password',
    {
      schema: {
        body: ForgotPasswordSchema,
      },
    },
    async (request, reply) => {
      const { email } = request.body as { email: string };
      await requestPasswordReset(email, request.log);

      return reply.send({
        data: {
          message:
            'If an account with that email exists, a reset link has been sent',
        },
      });
    },
  );

  server.post(
    '/auth/reset-password',
    {
      schema: {
        body: ResetPasswordSchema,
      },
    },
    async (request, reply) => {
      const { token, newPassword } = request.body as {
        token: string;
        newPassword: string;
      };

      await executePasswordReset(token, newPassword);

      return reply.send({
        data: { message: 'Password reset successful' },
      });
    },
  );
}
