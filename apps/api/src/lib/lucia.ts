import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db/client.js';
import { sessions, users } from '../db/schema.js';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
    },
  },
  getUserAttributes: attributes => ({
    email: attributes.email,
    firstName: attributes.first_name,
    lastName: attributes.last_name,
  }),
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      first_name: string;
      last_name: string;
    };
  }
}
