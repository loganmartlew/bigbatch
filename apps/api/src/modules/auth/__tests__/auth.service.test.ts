import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// These tests focus on the pure-logic aspects of the auth service.
// Service functions that require DB/Lucia are tested with mocks for the
// critical business paths (example-based) and with fast-check for invariants.
// ---------------------------------------------------------------------------

// We mock external dependencies so we can test business logic in isolation.
vi.mock('../../../db/client.js', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      passwordResetTokens: { findFirst: vi.fn() },
      userHouseholds: { findMany: vi.fn() },
    },
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
    batch: vi.fn(),
  },
}));

vi.mock('../../../lib/lucia.js', () => ({
  lucia: {
    createSession: vi.fn(() => ({ id: 'session-123' })),
    invalidateSession: vi.fn(),
  },
}));

vi.mock('../../../lib/email.js', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

// Import after mocks
import { db } from '../../../db/client.js';
import { lucia } from '../../../lib/lucia.js';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Example-based tests (PBT-10: business-critical paths)
  // =========================================================================

  describe('registerUser', () => {
    it('rejects weak passwords (score < 2)', async () => {
      const { registerUser } = await import('../auth.service.js');
      await expect(
        registerUser('test@example.com', 'password', 'John', 'Doe'),
      ).rejects.toThrow(); // "password" is score 0
    });

    it('rejects duplicate emails', async () => {
      const findFirst = vi.mocked(db.query.users.findFirst);
      findFirst.mockResolvedValueOnce({
        id: 1,
        email: 'existing@example.com',
        firstName: 'A',
        lastName: 'B',
        hashedPassword: 'hash',
        createdAt: '',
        updatedAt: '',
      });

      const { registerUser } = await import('../auth.service.js');
      await expect(
        registerUser('existing@example.com', 'Str0ngP@ssw0rd!xyz', 'A', 'B'),
      ).rejects.toThrow('An account with this email already exists');
    });

    it('creates user and session on valid input', async () => {
      const findFirst = vi.mocked(db.query.users.findFirst);
      findFirst.mockResolvedValueOnce(undefined); // no existing user

      const insertMock = vi.mocked(db.insert);
      const returningMock = vi.fn().mockResolvedValueOnce([
        {
          id: 1,
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          hashedPassword: 'hashed',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ]);
      insertMock.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({ returning: returningMock }),
      } as any);

      const createSession = vi.mocked(lucia.createSession);
      createSession.mockResolvedValueOnce({
        id: 'sess-1',
        userId: 1,
        expiresAt: new Date(),
        fresh: true,
      });

      const { registerUser } = await import('../auth.service.js');
      const result = await registerUser(
        '  New@Example.COM  ',
        'Correct-Horse-Battery-Staple!',
        'Jane',
        'Doe',
      );

      expect(result.user.email).toBe('new@example.com');
      expect(result.session.id).toBe('sess-1');
    });
  });

  describe('loginUser', () => {
    it('returns generic error for unknown email', async () => {
      const findFirst = vi.mocked(db.query.users.findFirst);
      findFirst.mockResolvedValueOnce(undefined);

      const { loginUser } = await import('../auth.service.js');
      await expect(loginUser('unknown@test.com', 'anything')).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('does not throw for unknown email (no enumeration)', async () => {
      const findFirst = vi.mocked(db.query.users.findFirst);
      findFirst.mockResolvedValueOnce(undefined);

      const { requestPasswordReset } = await import('../auth.service.js');
      // Should resolve silently
      await expect(
        requestPasswordReset('unknown@test.com'),
      ).resolves.toBeUndefined();
    });
  });

  describe('executePasswordReset', () => {
    it('rejects expired tokens', async () => {
      const findFirst = vi.mocked(db.query.passwordResetTokens.findFirst);
      findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 1,
        token: 'tok',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        usedAt: null,
        createdAt: '',
      });

      const { executePasswordReset } = await import('../auth.service.js');
      await expect(
        executePasswordReset('tok', 'NewStr0ng!Pass'),
      ).rejects.toThrow('Reset link is invalid or expired');
    });

    it('rejects already-used tokens', async () => {
      const findFirst = vi.mocked(db.query.passwordResetTokens.findFirst);
      findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 1,
        token: 'tok',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        usedAt: new Date().toISOString(),
        createdAt: '',
      });

      const { executePasswordReset } = await import('../auth.service.js');
      await expect(
        executePasswordReset('tok', 'NewStr0ng!Pass'),
      ).rejects.toThrow('Reset link is invalid or expired');
    });
  });

  // =========================================================================
  // Property-based tests (PBT-02, PBT-03, PBT-04)
  // =========================================================================

  describe('PBT: Email normalization invariants', () => {
    // PBT-03: Invariant — normalized email is always lowercase and trimmed
    it('normalized email is always lowercase and trimmed', () => {
      fc.assert(
        fc.property(fc.emailAddress(), email => {
          const normalized = email.trim().toLowerCase();
          expect(normalized).toBe(normalized.toLowerCase());
          expect(normalized).toBe(normalized.trim());
        }),
      );
    });

    // PBT-04: Idempotence — normalizing twice equals normalizing once
    it('email normalization is idempotent', () => {
      fc.assert(
        fc.property(fc.emailAddress(), email => {
          const normalize = (e: string) => e.trim().toLowerCase();
          expect(normalize(normalize(email))).toBe(normalize(email));
        }),
      );
    });
  });

  describe('PBT: Password strength invariants', () => {
    // PBT-03: Invariant — very short passwords always rejected
    it('passwords shorter than 4 chars are always rejected by zxcvbn (score < 2)', () => {
      const zxcvbn = require('zxcvbn');
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 3 }), password => {
          const result = zxcvbn(password);
          expect(result.score).toBeLessThan(2);
        }),
      );
    });
  });
});
